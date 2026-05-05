from flask import jsonify
from flask_mail import Message
from flask_login import login_user, logout_user

from ..models.userModels import UserSession
from ..models.models import Usuario
from ..models.exceptions import UserNotValid, UserNotFound, UserAlreadyExists
from app.extensions import db, mail
from ..database.connection import (
    obtener_usuario_por_email,
    buscar_una_fila,
    guardar_usuario,
    guardar_datos,
)
from datetime import datetime
from ..services.authServices import get_access_token, unset_cookiess
from ..services.emailServices import enviar_correo_recuperacion
from ..helpers.makeResponse import success_response


def login(user_: UserSession) -> UserSession:

    userFind = obtener_usuario_por_email(user_.email)
    if not userFind:
        raise UserNotFound("Usuario no registrado")
    if not userFind.verificar_password(user_.password):
        raise UserNotValid("Credenciales incorrectas")
    login_user(userFind)
    access_token = get_access_token(id_user=user_.id)
    return success_response(cookies=access_token)


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

    if Usuario.formatPass(userData.password):
        raise UserNotValid("La contraseña no cumple con los requsitos")

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

    response = success_response(message="Registro exitoso")

    return response


def request_password_reset(userData: UserSession) -> UserSession:
    """Genera un código de 6 dígitos y lo envía al correo del usuario."""
    user = obtener_usuario_por_email(userData.email)

    if not user:
        raise UserNotValid("Si el correo existe, se le envira un codigo de seguridad")

    # Generamos el código de 6 dígitos y lo guardamos en la base de datos
    code = user.generate_reset_code()
    if not guardar_datos():
        raise UserNotValid("Ha ocurrido un error interno")

    if enviar_correo_recuperacion(userData=userData, code=code):
        return success_response(message="El codigo se ha enviado correctamente")
    else:
        raise UserNotValid(message="No se ha logrado enviar el correo")


def verify_reset_code(userData: UserSession, code):
    """Verifica si el código proporcionado es válido y no ha expirado."""
    print("el code en controller----------->", code)
    user = Usuario.query.filter_by(email=userData.email).first()

    if not user:
        # Por seguridad, no revelamos si el email existe
        raise UserNotValid("Si el correo existe, se le envira un codigo de seguridad")

    if not user.verify_reset_code(code):
        return jsonify({"error": "Código inválido o expirado."}), 400

    # Si el código es válido, puedes devolver un token adicional para la siguiente etapa
    # o simplemente indicar éxito. Por simplicidad, devolvemos éxito.
    return (
        jsonify(
            {
                "mensaje": "Código verificado correctamente. Ahora puedes restablecer tu contraseña."
            }
        ),
        200,
    )


def reset_password(userData: UserSession, code):
    print("el code en controller----------->", code)
    """Restablece la contraseña del usuario si el código es válido."""
    user = Usuario.query.filter_by(email=userData.email).first()

    if not user:
        return jsonify({"error": "Código inválido o expirado."}), 400

    if not user.verify_reset_code(code):
        return jsonify({"error": "Código inválido o expirado."}), 400

    # Validamos el formato de la nueva contraseña usando tu propio código
    print(userData.password)
    if not Usuario.formatPass(userData.password):
        return (
            jsonify(
                {
                    "error": "La contraseña debe tener entre 8 y 15 caracteres, incluir al menos una mayúscula, una minúscula, un número y un carácter especial (!@#$%&/)."
                }
            ),
            400,
        )

    # Generamos el hash y guardamos la nueva contraseña
    user.generateHass(userData.password)  # Usamos el método que ya tienes en tu modelo
    user.clear_reset_code()
    db.session.commit()

    return (
        jsonify(
            {
                "mensaje": "Contraseña restablecida con éxito. Por favor, inicia sesión con tu nueva contraseña."
            }
        ),
        200,
    )
    # No se debe iniciar sesión automáticamente
