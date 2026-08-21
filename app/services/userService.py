# app/services/userService.py
from app.repositories.userRepository import UserRepository
from app.repositories.personaRepository import PersonaRepository
from app.models.models import Usuario, PreRegistro
from app.models.exceptions import (
    UserNotValid,
    UserNotFound,
    UserAlreadyExists,
    ResourceNotValid,
    Unauthorized,
    ResourceNotFound,
)
from app.services.authServices import get_access_token, unset_cookiess, esta_bloqueado
from app.services.emailServices import (
    enviar_correo_recuperacion,
    enviar_correo_verificacion,
)
from app.helpers.makeResponse import success_response
from flask_login import login_user, logout_user
from datetime import datetime, timedelta
from flask import jsonify, request, render_template, make_response


class UserService:
    # Contiene la lógica de negocio para Usuarios

    @staticmethod
    def login(user_data):

        user = UserRepository.get_by_email(user_data.email)

        if not user:
            raise UserNotFound("Usuario no registrado")

        if user.esta_bloqueado():

            tiempo_restante = user.bloqueado_hasta - datetime.now()
            minutos = round(tiempo_restante.total_seconds() / 60)
            raise Unauthorized(
                "Usuario",
                reason=f"Usuario bloqueado temporalmente intenta nuevamente en {minutos} minutos",
            )

        if user.verificar_password(user_data.password):
            # Credenciales correctas
            user.intentos_fallidos = 0
            user.bloqueado_hasta = None
            UserRepository.update(user)
            login_user(user)

            # Generar token
            from flask_jwt_extended import create_access_token

            datos_adicionales = {"rol": user.rol}
            access_token = create_access_token(
                identity=str(user.id), additional_claims=datos_adicionales
            )

            return {"access_token": access_token}
        else:
            user.intentos_fallidos += 1
            UserRepository.update(user)

            if user.intentos_fallidos >= 3:
                user.bloqueado_hasta = datetime.now() + timedelta(minutes=15)
                UserRepository.update(user)
                raise UserNotValid(
                    f"Usuario Bloqueado temporalmente intenta nuevamente en 15 minutos"
                )

            raise UserNotValid(
                f"Credenciales invalidas intentos restantes {3 - user.intentos_fallidos}"
            )

    @staticmethod
    def logout():
        # Cierra sesión de un usuario
        response = success_response(message="Sesión cerrada correctamente")
        unset_cookiess(response)
        logout_user()
        return response

    @staticmethod
    def register(user_data):
        # Registra un nuevo usuario
        # Validaciones
        if not user_data.email or not user_data.password:
            raise UserNotValid("Datos no validos, contraseña y usuario son requeridos")

        if UserRepository.exists_by_email(user_data.email):
            raise UserAlreadyExists("El correo electrónico ya está registrado")

        if not Usuario.formatPass(user_data.password):
            raise ResourceNotValid(
                "password", "No cumple con los parámetros necesarios"
            )

        if not Usuario.formatEmail(user_data.email):
            raise UserNotValid("El email es inválido")

        # Crear usuario
        es_primer_usuario = UserRepository.is_first_user()
        new_user = Usuario(
            nombre=user_data.nombre, email=user_data.email, isAdmin=es_primer_usuario
        )
        new_user.generateHass(user_data.password)

        # UserRepository.save_usuario(new_user)

        user_session = new_user.a_sesion()
        token = get_access_token(userData=user_session)

        return success_response(
            message="Registro exitoso",
            cookies=token,
            data={
                "token": token,
                "nombre": user_session.nombre,
                "email": user_session.email,
            },
        )

    @staticmethod
    def request_password_reset(user_data):
        print("Data---> user service >>>", user_data.email)
        # Genera y envía código de recuperación de contraseña
        user = UserRepository.get_by_email(user_data.email)
        print("Usewr en service", user.email)

        if not user:
            raise UserNotValid(
                "Si el correo existe, se le enviará un código de seguridad"
            )

        code = user.generate_reset_code()
        print("el codigo----->", code)
        UserRepository.update(user)

        if enviar_correo_recuperacion(userData=user_data, code=code):
            user_session = user.a_sesion()
            token = get_access_token(userData=user_session)
            return success_response(
                message="El código se ha enviado correctamente", cookies=token
            )
        else:
            raise UserNotValid("No se ha logrado enviar el correo")

    @staticmethod
    def verify_reset_code(user_data, code):
        # Verifica si el código de recuperación es válido
        user = UserRepository.get_by_id(user_data.id)

        if not user:
            raise ResourceNotValid("Usuario", "Usuario inexistente")

        if esta_bloqueado(user.bloqueado_hasta):
            segundos_restantes = (user.bloqueado_hasta - datetime.now()).total_seconds()
            minutos_restantes = max(1, int(segundos_restantes // 60))
            raise Unauthorized(
                "Usuario",
                reason=f"Usuario Bloqueado temporalmente. Intenta nuevamente en {minutos_restantes} minutos",
            )

        if not user.verify_reset_code(code):
            user.intentos_fallidos += 1

            if user.intentos_fallidos >= 3:
                user.bloqueado_hasta = datetime.now() + timedelta(minutes=15)
                UserRepository.update(user)
                raise UserNotValid(
                    "Usuario Bloqueado temporalmente. Intenta nuevamente en 15 minutos."
                )

            UserRepository.update(user)
            raise Unauthorized("Usuario", "Código incorrecto o expirado")

        # Código correcto
        user.intentos_fallidos = 0
        user.bloqueado_hasta = None
        UserRepository.update(user)

        return success_response(
            message="Código verificado correctamente. Puedes cambiar tu clave"
        )

    @staticmethod
    def reset_password(user_data, code):
        # Restablece la contraseña del usuario
        user = UserRepository.get_by_id(user_data.id)

        if not user:
            raise UserNotValid("El código ha expirado o es inválido")

        if not user.verify_reset_code(code):
            raise UserNotValid("El código ha expirado o es inválido")

        if not Usuario.formatPass(user_data.password):
            raise ResourceNotValid(
                "password", "No cumple con los parámetros necesarios"
            )

        user.generateHass(user_data.password)
        user.clear_reset_code()
        UserRepository.update(user)

        response = success_response(message="Su clave ha sido cambiada con éxito")
        return unset_cookiess(response=response)

    @staticmethod
    def pre_register(user_data):
        # Pre-registro de usuario (envío de código de verificación)
        if not user_data.email or not user_data.password:
            raise ResourceNotValid(
                "Datos no validos, contraseña y usuario son requeridos"
            )

        if UserRepository.exists_by_email(user_data.email):
            raise UserAlreadyExists("El correo electrónico ya está registrado")

        if not Usuario.formatPass(user_data.password):
            raise ResourceNotValid(
                "password", "No cumple con los parámetros necesarios"
            )

        if not Usuario.formatEmail(user_data.email):
            raise UserNotValid("El email es inválido")

        # Crear pre-registro
        pre = PreRegistro(email=user_data.email, nombre=user_data.nombre)
        code = pre.generate_reset_code()
        pre.generateHass(user_data.password)

        UserRepository.save_pre_registro(pre)

        user_session = pre.a_session()

        if enviar_correo_verificacion(userData=user_session, code=code):
            token = get_access_token(userData=user_session)
            return success_response(
                message="El código se ha enviado correctamente",
                cookies=token,
                data={
                    "token": token,
                    "nombre": user_session.nombre,
                    "email": user_session.email,
                    "id": user_session.id,
                },
            )
        else:
            raise UserNotValid("No se ha logrado enviar el correo")

    @staticmethod
    def register2(user_data, code):
        print("Dataaaa--->", user_data)
        # Completa el registro después de verificar el código
        pre_user = UserRepository.get_pre_register_by_id(user_data.id)

        if pre_user.is_expired():
            UserRepository.delete_pre_registro(pre_user)
            raise Unauthorized(
                "Token", reason="El código ha expirado, Inténtalo nuevamente"
            )

        if not pre_user.verify_reset_code(code):
            raise Unauthorized("Código", reason="Código incorrecto, Intente nuevamente")

        # Crear usuario definitivo
        es_primer_usuario = UserRepository.is_first_user()
        new_user = Usuario(
            nombre=pre_user.nombre,
            email=pre_user.email,
            isAdmin=es_primer_usuario,
            password=pre_user.password,
        )

        UserRepository.save_usuario(new_user)

        # Limpiar pre-registro
        UserRepository.delete_pre_registro(pre_user)

        user_session = new_user.a_sesion()
        token = get_access_token(userData=user_session)

        return success_response(
            message="Registro exitoso",
            cookies=token,
            data={
                "nombre": user_session.nombre,
                "token": token,
                "rol": user_session.rol,
            },
        )

    @staticmethod
    def verify_email(user_data, code):
        # Verifica el correo electrónico del usuario
        user = UserRepository.get_by_id(user_data.id)

        if not user:
            raise ResourceNotValid("Usuario", "Usuario inexistente")

        if not user.verify_reset_code(code):
            raise UserNotValid("El código ha expirado o es inválido")

        user.clear_reset_code()
        UserRepository.update(user)

        return success_response(
            message="Se ha verificado correctamente tu correo electrónico"
        )

    @staticmethod
    def get_perfil(user_id):
        usuario = UserRepository.get_by_id(user_id)
        if not usuario:
            raise ResourceNotFound("Usuario no encontrado")

        persona = None
        if usuario.persona_id:
            persona = PersonaRepository.get_by_id(usuario.persona.id)

        return {
            "nombre": usuario.nombre,
            "email": usuario.email,
            "rol": usuario.rol,
        }

    @staticmethod
    def update_perfil(user_id, data):

        usuario = UserRepository.get_by_id(user_id)

        if not usuario:
            raise ResourceNotFound("Usuario no encontrado")

        # validar credenciales
        if "nombre" in data:
            nuevo_nombre = data["nombre"].strip()
            if not nuevo_nombre:
                raise ResourceNotFound("Nombre", "El nombre no puede estar vacio")
            usuario.nombre = nuevo_nombre

        if "email" in data:
            nuevo_email = data["email"].strip()
            if not nuevo_email:
                raise ResourceNotFound("Email", "El email no puede estar vacio")
            # verificar formato
            import re

            if not re.match(
                r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", nuevo_email
            ):
                raise ResourceNotValid("Email", "Formato de email invalido")
            # verificar si no está en uso con otro usuario
            otro_usuario = UserRepository.get_by_email(nuevo_email)
            if otro_usuario and otro_usuario.id != user_id:
                raise ResourceNotValid(
                    "Email", "El correo está registrado por otro usuario"
                )
            usuario.email = nuevo_email

            UserRepository.update(usuario)

            return UserService.get_perfil(user_id)

    @staticmethod
    def cambiar_contrasenia(user_id, contrasenia_actual, nueva_contrasenia):

        usuario = UserRepository.get_by_id(user_id)
        if not usuario:
            raise ResourceNotFound("Usuario no encontrado")

        if not usuario.verificar_password(contrasenia_actual):
            raise ResourceNotValid(
                "nueva_contrasenia", "La contraseña actual no coincide"
            )

        if not Usuario.formatPass(nueva_contrasenia):
            raise ResourceNotValid(
                "nueva_contrasenia",
                "La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y carácter especial",
            )

        usuario.generateHass(nueva_contrasenia)
        UserRepository.update(usuario)
        return True
