# app/controllers/userControllers.py
from flask import jsonify, request, render_template, make_response
from app.services.userService import UserService
from app.repositories.userRepository import UserRepository
from app.models.userModels import UserSession
from app.models.exceptions import (
    UserNotValid,
    UserNotFound,
    UserAlreadyExists,
    ResourceNotValid,
    Unauthorized
)
from app.helpers.makeResponse import success_response, error_response
import traceback

# ========== FUNCIONES DE AUTENTICACIÓN ==========

def login(usuario):
    #Inicia sesión de un usuario
    try:
        result = UserService.login(usuario)
        user = UserRepository.get_by_email(usuario.email)
        
        redirect_url = "/admin/dashboard" if user.rol == "admin" else "/admin/dashboard"
        
        # Construir el cuerpo de la respuesta
        response_body = {
            "success": True,
            "message": "Login exitoso",
            "data": {
                "redirect": redirect_url,
                "rol": user.rol
            }
        }
        
        # Crear respuesta HTTP
        response = make_response(jsonify(response_body), 200)
        
        # Si el resultado contiene cookies (por ejemplo, access_token), las añadimos
        if isinstance(result, dict) and 'cookies' in result:
            # Suponiendo que result['cookies'] es un dict con las cookies
            for key, value in result['cookies'].items():
                response.set_cookie(key, value, httponly=True, secure=False, samesite='Lax')
        
        return response
        
    except UserNotFound as e:
        return error_response(error=str(e), message="Usuario no encontrado", status_code=404)
    except Unauthorized as e:
        return error_response(error=str(e), message=str(e), status_code=401)
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al iniciar sesión", status_code=500)

def logout():
    #Cierra sesión de un usuario
    try:
        result = UserService.logout()
        return result
    except Exception as e:
        return error_response(error=str(e), message="Error al cerrar sesión", status_code=500)

def register(usuario):
    #Registra un nuevo usuario
    try:
        result = UserService.register(usuario)
        return result
    except UserAlreadyExists as e:
        return error_response(error=str(e), message="El correo ya está registrado", status_code=409)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al registrar usuario", status_code=500)

# ========== RECUPERACIÓN DE CONTRASEÑA ==========

def request_password_reset():
    #Solicita recuperación de contraseña.
    try:
        data = request.get_json()
        user_data = UserSession(email=data.get('email'))
        result = UserService.request_password_reset(user_data)
        return result
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al solicitar recuperación", status_code=500)

def verify_reset_code():
    #Verifica el código de recuperación
    try:
        data = request.get_json()
        user_data = UserSession(id=data.get('user_id'))
        code = data.get('code')
        result = UserService.verify_reset_code(user_data, code)
        return result
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Unauthorized as e:
        return error_response(error=str(e), message=str(e), status_code=401)
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al verificar código", status_code=500)

def reset_password():
    #Restablece la contraseña
    try:
        data = request.get_json()
        user_data = UserSession(
            id=data.get('user_id'),
            password=data.get('new_password')
        )
        code = data.get('code')
        result = UserService.reset_password(user_data, code)
        return result
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al restablecer contraseña", status_code=500)

# ========== VERIFICACIÓN DE CORREO ==========

def verify_email():
    #Verifica el correo electrónico del usuario
    try:
        data = request.get_json()
        user_data = UserSession(id=data.get('user_id'))
        code = data.get('code')
        result = UserService.verify_email(user_data, code)
        return result
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al verificar correo", status_code=500)

# ========== PRE-REGISTRO ==========

def pre_register(usuario):
    #Pre-registro de usuario (envío de código de verificación).
    try:
        result = UserService.pre_register(usuario)
        return result
    except UserAlreadyExists as e:
        return error_response(error=str(e), message="El correo ya está registrado", status_code=409)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except UserNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        print("Error en pre_register", traceback.format_exc())
        return error_response(error=str(e), message="Error en pre-registro", status_code=500)

def register2(userData, code):
    #Completa el registro después de verificar el código
    try:
        result = UserService.register2(userData, code)
        return result
    except Unauthorized as e:
        return error_response(error=str(e), message=str(e), status_code=401)
    except Exception as e:
        return error_response(error=str(e), message="Error al completar registro", status_code=500)

# ========== VISTAS (RENDER DE PLANTILLAS) ==========

def show_dashboard():
    #Muestra el dashboard
    return render_template("pages/dashboard.html")

def show_rutas():
    #Muestra la página de rutas
    return render_template("pages/rutas.html")

def show_flota():
    #Muestra la página de flota
    return render_template("pages/flota.html")

def show_reportes():
    #Muestra la página de reportes
    return render_template("pages/reportes.html")

def index():
    #Muestra el formulario de login
    return render_template("auth/login.html")

def show_form_register():
    #Muestra el formulario de registro
    return render_template("auth/registro.html")

def show_form_forgot_pass():
    #Muestra el formulario de recuperación de clave
    return render_template("auth/forgot-password.html")