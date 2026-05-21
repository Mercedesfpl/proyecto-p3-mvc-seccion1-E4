from flask import Blueprint, request, url_for, redirect, render_template
from flask_jwt_extended import (
    jwt_required,
)


from ..controllers import userControllers
from ..models.userModels import UserSession

auth_scope = Blueprint("auth", __name__)


@auth_scope.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    usuario = UserSession(email=email, password=password)

    return userControllers.login(usuario)


@auth_scope.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return userControllers.logout()


@auth_scope.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    nombre = data.get("nombre")
    usuario = UserSession(email=email, nombre=nombre, password=password)
    return userControllers.register(usuario)


@auth_scope.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Punto 1: Solicitar código de recuperación."""
    data = request.get_json()
    usuario = UserSession(email=data.get("email"))
    return userControllers.request_password_reset(usuario)


@auth_scope.route("/verify-reset-code", methods=["POST"])
def verify_reset_code():
    """Punto 2: Verificar código de recuperación."""
    data = request.get_json()
    usuario = UserSession(email=data.get("email"))
    code = data.get("code")

    return userControllers.verify_reset_code(usuario, code)


@auth_scope.route("/reset-password", methods=["POST"])
def reset_password():
    """Punto 3: Restablecer contraseña con código válido."""
    data = request.get_json()
    usuario = UserSession(email=data.get("email"), password=data.get("new_password"))
    code = data.get("code")

    return userControllers.reset_password(usuario, code)


@auth_scope.route("/vistas", methods=["GET", "POST"])
def vista():
    return userControllers.show_dashboar()

# ========== NUEVAS RUTAS PARA VER LOS FORMULARIOS ==========
@auth_scope.route("/login-page", methods=["GET"])
def login_page():
    """Muestra el formulario de login"""
    return render_template("auth/login.html")

@auth_scope.route("/registro-page", methods=["GET"])
def registro_page():
    """Muestra el formulario de registro"""
    return render_template("auth/registro.html")

@auth_scope.route("/forgot-password-page", methods=["GET"])
def forgot_password_page():
    return render_template("auth/forgot-password.html")