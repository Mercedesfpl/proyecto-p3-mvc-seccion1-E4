from flask import jsonify, render_template
from flask_mail import Message
from flask_login import login_user, logout_user

from ..models.userModels import UserSession
from ..models.models import Usuario, PreRegistro
from ..models.exceptions import (
    UserNotValid,
    UserNotFound,
    UserAlreadyExists,
    ResourceNotValid,
    Unauthorized,
)

# from app.extensions import db, mail
from ..database.connection import (
    obtener_usuario_por_email,
    obtener_usuario_por_id,
    buscar_una_fila,
    eliminar_pre_registro,
    guardar_usuario,
    guardar_datos,
    eliminar_pre_usuario_por_email,
)

from datetime import datetime, timedelta
from ..services.authServices import get_access_token, unset_cookiess, esta_bloqueado
from ..services.emailServices import (
    enviar_correo_recuperacion,
    enviar_correo_verificacion,
)
from ..helpers.makeResponse import success_response


def login(user_: UserSession) -> UserSession:

    userFind = obtener_usuario_por_email(user_.email)
    if not userFind:
        raise UserNotFound("Usuario no registrado")
    if userFind.esta_bloqueado():
        tiempo_restante = userFind.bloqueado_hasta - datetime.now()
        minutos = round(tiempo_restante.total_seconds() / 60)
        raise Unauthorized(
            "Usuario",
            rason=f"Usuario bloqueado temporalmente intenta nuevamnete en {minutos}",
        )
    if userFind.verificar_password(user_.password):
        print("laclave esta bien")
        userFind.intentos_fallidos = 0
        userFind.bloqueado_hasta = None
        guardar_datos()
        login_user(userFind)
        user_ = userFind.a_sesion()
        access_token = get_access_token(userData=user_)
        return success_response(cookies=access_token)
    else:
        userFind.intentos_fallidos += 1
        guardar_datos()
        print("Intento fallido nr:", userFind.intentos_fallidos)

    if userFind.intentos_fallidos >= 3:
        print("Se bloqueo el susurio")
        minutos = userFind.bloqueado_hasta = datetime.now() + timedelta(minutes=15)
        guardar_datos()
        raise UserNotValid(
            f"Usuario Bloqueado temporalmente intenta nuevamnete en {minutos}"
        )
    raise UserNotValid(
        f"Credenciales invalidas intentos restantes {3-userFind.intentos_fallidos}"
    )


def logout():
    """Fincion para cerrar sesion"""
    response = success_response(message="Sesion Cerada correctamente")
    unset_cookiess(response)  # Elimina access_token_cookie y refresh_token_cookie
    logout_user()
    return response


def register(userData: UserSession) -> UserSession:
    """Funcion para registrar un nuevo usuario, recive un objeto de userSesion para procesarlo"""

    # Validaciones

    if not userData.email or not userData.password:
        raise UserNotValid("Datos no validos, contraseña y usuario son requeridos")

    existing_user = obtener_usuario_por_email(userData.email)

    if existing_user:
        raise UserAlreadyExists("El correo electrónico ya está registrado")

    if not Usuario.formatPass(userData.password):
        raise ResourceNotValid("password", "No cumple con los parametros necesarios")

    if not Usuario.formatEmail(userData.email):
        raise UserNotValid("El email es invalido")
    # ====================================================

    esPrimerUsuario = buscar_una_fila()

    newUser = Usuario(
        nombre=userData.nombre, email=userData.email, isAdmin=esPrimerUsuario
    )
    newUser.generateHass(userData.password)

    if not guardar_usuario(newUser):
        raise UserNotValid("ha ocurrido un error inesperado")

    user_ = newUser.a_sesion()
    token = get_access_token(userData=user_)

    response = success_response(message="Registro exitoso", cookies=token)

    return response


def request_password_reset(userData: UserSession) -> UserSession:
    """Genera un código de 6 dígitos y lo envía al correo del usuario."""
    user = obtener_usuario_por_email(userData.email)

    if not user:
        raise UserNotValid("Si el correo existe, se le envira un codigo de seguridad")

    # Genarar y guaradar el codigo
    code = user.generate_reset_code()
    user_ = user.a_sesion()
    token = get_access_token(userData=user_)
    if not guardar_datos():
        raise UserNotValid("Ha ocurrido un error interno")

    if enviar_correo_recuperacion(userData=userData, code=code):
        return success_response(
            message="El codigo se ha enviado correctamente", cookies=token
        )
    else:
        raise UserNotValid(message="No se ha logrado enviar el correo")


def verify_reset_code(userData: UserSession, code):
    """Verifica si el código proporcionado es válido y no ha expirado."""
    user = obtener_usuario_por_id(userData.id)
    # Validaciones para saver si el usuario existe y si se encuentra bloqueado
    if not user:
        raise ResourceNotValid(
            nombre_del_recurso="Usuario", rason="Usuario inexistente"
        )

    if esta_bloqueado(user.bloqueado_hasta):
        # Calculo de los minutos restantes.
        segundos_restantes = (user.bloqueado_hasta - datetime.now()).total_seconds()
        minutos_restantes = max(1, int(segundos_restantes // 60))

        raise Unauthorized(
            nombre_del_recurso="Usuario",
            rason=f"Usuario Bloqueado temporalmente. Intenta nuevamente en {minutos_restantes} minutos",
        )

    # Validación del código enviado
    if not user.verify_reset_code(code):

        user.intentos_fallidos += 1

        if user.intentos_fallidos >= 3:

            user.bloqueado_hasta = datetime.now() + timedelta(minutes=15)
            guardar_datos()  # Guarda el usuario bloqueado

            raise UserNotValid(
                message="Usuario Bloqueado temporalmente. Intenta nuevamente en 15 minutos."
            )

        guardar_datos()
        raise Unauthorized("Usuario", "Codigo incorrecto o expirado")

    # Si todo esta correcto simplemente reseteamos los valores y enviamos una respuesta de exito
    print("Código correcto. Limpiando intentos.", flush=True)
    user.intentos_fallidos = 0
    user.bloqueado_hasta = None
    guardar_datos()

    return success_response(
        message="Cambio de clave exitoso. Ya puedes ingresar con tu nueva clave"
    )


def reset_password(userData: UserSession, code):
    """Restablece la contraseña del usuario si el código es válido."""
    user = obtener_usuario_por_id(userData.id)

    if not user:
        raise UserNotValid(message="El codigo ha expirado o es invalido")

    if not user.verify_reset_code(code):
        raise UserNotValid(message="El codigo ha expirado o es invalido")

    # Validacion del formato de la nueva contraseña

    if not Usuario.formatPass(userData.password):
        raise ResourceNotValid("password", "No cumple con los parametros necesarios")

    # Generamos el hash y guardamos la nueva contraseña
    user.generateHass(userData.password)  # Usamos el método que ya tienes en tu modelo
    user.clear_reset_code()

    if not guardar_datos():
        raise UserNotValid(message="Ha ocurrido algo inesperado")
    response = success_response(message="Su clave ha sido cambiada con exito")

    return unset_cookiess(response=response)


# def enviar_codigo_de_verificacion(user_data: UserSession):
#     """Envia un codigo de verificacion"""
#     usuario = obtener_usuario_por_id(user_data.id)

#     code = usuario.generate_reset_code()
#     if not guardar_datos():
#         raise UserNotValid("Ha ocurrido un error interno")

#     user_data = usuario.a_sesion()

#     if enviar_correo_atenticacion(userData=user_data, code=code):
#         return success_response(message="El codigo se ha enviado correctamente")
#     else:
#         raise UserNotValid(message="No se ha logrado enviar el correo")#


def verificar_Email(user_data: UserSession, code):
    """Permite verificar el correo electronico"""
    user = obtener_usuario_por_id(user_data.id)

    if not user:
        raise ResourceNotValid(
            nombre_del_recurso="Usuario", rason="Usuario inexistente"
        )

    if not user.verify_reset_code(code):
        raise UserNotValid(message="El codigo ha expirado o es invalido")
    user.clear_reset_code()
    if not guardar_datos():
        raise UserNotValid("Ha ocurrido un error interno")
    response = success_response(
        message="Se ha verficado correctamente tu correo electronico"
    )
    return response


def pre_register(user_data: UserSession):
    if not user_data.email or not user_data.password:
        raise ResourceNotValid(
            rason="Datos no validos, contraseña y usuario son requeridos"
        )

    existing_user = obtener_usuario_por_email(user_data.email)

    if existing_user:
        raise UserAlreadyExists("El correo electrónico ya está registrado")

    if not Usuario.formatPass(user_data.password):
        raise ResourceNotValid("password", "No cumple con los parametros necesarios")

    if not Usuario.formatEmail(user_data.email):
        raise UserNotValid("El email es invalido")

    pre = PreRegistro(
        email=user_data.email,
        nombre=user_data.nombre,
    )
 #   if not eliminar_pre_usuario_por_email(pre.email):
  #      raise ResourceNotValid(
   #         nombre_del_recurso="Usuario", rason="HA ocurrido un error inesperado"
    #    )
    if not guardar_datos():
        raise UserNotValid(message="HA ocurrido un error unesperado")
    code = pre.generate_reset_code()
    pre.generateHass(user_data.password)
    if not guardar_usuario(pre):
        raise UserNotValid(message="HA ocurrido un error inesperado")
    user_data = pre.a_session()
    if enviar_correo_verificacion(userData=user_data, code=code):
        token = get_access_token(userData=user_data)
        return success_response(
            message="El codigo se ha enviado correctamente", cookies=token
        )
    else:
        raise UserNotValid(message="No se ha logrado enviar el correo")


def register2(userData: UserSession, code) -> UserSession:
    """Funcion para registrar un nuevo usuario, recive un objeto de userSesion para procesarlo"""

    # Validaciones
    pre_register_user = obtener_usuario_por_id(userData.id, pre_register=True)

    if pre_register_user.is_expired():
        eliminar_pre_registro(pre_user=pre_register_user)
        if guardar_datos():
            raise Unauthorized(
                nombre_del_recurso="Token",
                rason="El codigo ha expirado, Intentalo nuevamente",
            )
    if not pre_register_user.verify_reset_code(code=code):

        raise Unauthorized(
            nombre_del_recurso="Codigo", rason="Codigo incorrecto, Intente nuevamente"
        )

    esPrimerUsuario = buscar_una_fila()

    newUser = Usuario(
        nombre=pre_register_user.nombre,
        email=pre_register_user.email,
        isAdmin=esPrimerUsuario,
        password=pre_register_user.password,
    )
    if not guardar_usuario(newUser):
        raise UserNotValid("ha ocurrido un error inesperado")

    user_ = newUser.a_sesion()
    token = get_access_token(userData=user_)
    eliminar_pre_registro(pre_user=pre_register_user)
    guardar_datos()

    response = success_response(message="Registro exitoso", cookies=token)

    return response


def show_dashboar():
    return render_template("pages/dashboard.html")


def show_rutas():
    return render_template("pages/rutas.html")


def show_flota():
    return render_template("pages/flota.html")


def show_reportes():
    return render_template("pages/reportes.html")


def index():
    """Muetra el formulario de login"""
    return render_template("auth/login.html")


def show_form_register():
    """Muetra el formulario de registro"""
    return render_template("auth/registro.html")


def show_form_forgot_pass():
    """Muestra el fromulario de recuperacion de clave"""
    return render_template("auth/forgot-password.html")
