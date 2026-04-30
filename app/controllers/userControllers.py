from flask import redirect, url_for, jsonify
from ..models.userModels import UserSession
from ..models.models import Usuario
from ..models.exceptions import UserNotValid, UserNotFound, UserAlreadyExists
from flask_login import login_user, logout_user
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from ..extensions import db


def login(user_: UserSession) -> UserSession:

    userFind = Usuario.query.filter_by(email=user_.email).first()
    if not userFind:
        raise UserNotFound("Usuario no registrado")

    if not userFind.verificar_password(user_.password):
        raise UserNotValid("Credenciales incorrectas")

    login_user(userFind)
    access_token = create_access_token(identity=str(userFind.id))
    refresh_token = create_refresh_token(identity=str(userFind.id))

    response = jsonify({"mensaje": "Login exitoso"})
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)

    return response, 200


def logout():
    """Fincion para cerrar sesion"""
    response = jsonify({"mensaje": "Sesión cerrada exitosamente"})
    unset_jwt_cookies(response)  # Elimina access_token_cookie y refresh_token_cookie
    logout_user()
    return response, 200


def register(userData: UserSession) -> UserSession:
    """Funcion para registrar un nuevo usuario, recive un objeto de userSesion para procesarlo"""

    # Validaciones

    if not userData.email or not userData.password:
        raise UserNotValid("Datos no validos, contraseña y usuario son requeridos")

    existing_user = Usuario.query.filter_by(email=userData.email).first()

    if existing_user:
        raise UserAlreadyExists("El correo electrónico ya está registrado")

    if Usuario.formatPass(userData.password):
        raise UserNotValid("La contraseña no cumple con los requsitos")

    if not Usuario.formatEmail(userData.email):
        raise UserNotValid("El email es invalido")
    # =====================================

    esPrimerUsuario = Usuario.query.first() is None

    newUser = Usuario(
        nombre=userData.nombre, email=userData.email, isAdmin=esPrimerUsuario
    )
    newUser.generateHass(userData.password)

    db.session.add(newUser)
    db.session.commit()

    response = jsonify({"mensaje": "Registro exitoso"})

    return response, 200
