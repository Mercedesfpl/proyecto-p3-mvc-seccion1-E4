# app/routes/auth.py
from flask import Blueprint, request, url_for, redirect, render_template
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity


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
    print("El email", usuario.email)
    return userControllers.request_password_reset(usuario)


@auth_scope.route("/verify-reset-code", methods=["POST"])
@jwt_required()
def verify_reset_code():
    """Punto 2: Verificar código de recuperación."""
    data_cliente = request.get_json()
    id_token = get_jwt_identity()
    usuario = UserSession(id=id_token)
    code = data_cliente.get("code")

    return userControllers.verify_reset_code(usuario, code)


@auth_scope.route("/reset-password", methods=["POST"])
@jwt_required()
def reset_password():
    """Punto 3: Restablecer contraseña con código válido."""

    data = request.get_json()
    id_token = get_jwt_identity()
    usuario = UserSession(id=id_token, password=data.get("new_password"))
    code = data.get("code")

    return userControllers.reset_password(usuario, code)


@auth_scope.route("/verify-email", methods=["POST", "GET"])
@jwt_required()
def verify_email():
    if not request.method == "GET":
        data_cliente = request.get_json()
        id_token = get_jwt_identity()
        usuario = UserSession(id=id_token)
        code = data_cliente.get("code")
        return userControllers.verificar_Email(usuario, code)

    if not request.method == "POST":
        id_token = get_jwt_identity()
        usuario = UserSession(id=id_token)
        return userControllers.enviar_codigo_de_verificacion(usuario)


@auth_scope.route("/pre-register", methods=["POST"])
def pre_register():
    data = request.get_json()
    email = data.get("email")
    nombre = data.get("nombre")
    password = data.get("password")
    usuario = UserSession(email=email, nombre=nombre, password=password)
    return userControllers.pre_register(usuario)


@auth_scope.route("/verify-and-register", methods=["POST"])
@jwt_required()
def verify_and_register():
    data_cliente = request.get_json()
    id_token = get_jwt_identity()
    print(id_token)
    usuario = UserSession(id=id_token)
    code = data_cliente.get("code")
    print("------", code)
    return userControllers.register2(usuario, code)


@auth_scope.route("/perfil", methods=["GET"])
@jwt_required()
def get_perfil():
    return userControllers.get_perfil()


@auth_scope.route("/perfil", methods=["PUT"])
@jwt_required()
def update_perfil():
    return userControllers.update_perfil()


@auth_scope.route("/cambiar-contrasena", methods=["POST"])
@jwt_required()
def cambiar_contrasena():
    return userControllers.cambiar_contrasenia()
