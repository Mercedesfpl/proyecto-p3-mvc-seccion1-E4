from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask import jsonify, request, redirect, url_for, flash

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
socketio = SocketIO()
limiter = Limiter(key_func=get_remote_address)
jwt = JWTManager()


# ==============================================================================
# CONFIGURACIÓN MULTIPLATAFORMA PARA RUTA PROTEGIDA (JWT)
# ==============================================================================


# Definimos los callbacks globales apuntando a la extensión
@jwt.unauthorized_loader
def custom_unauthorized_callback(reason):
    print(">>> EXPIRED TOKEN CALLBACK EJECUTADO")
    print(">>> request.is_json:", request.is_json)
    print(">>> request.path:", request.path)
    print(">>> request.headers.get('Accept'):", request.headers.get("Accept"))
    if request.is_json or request.path.startswith("/api/"):
        return (
            jsonify(
                {
                    "status": 401,
                    "error": "Unauthorized",
                    "message": "Se requiere un token JWT válido.",
                    "redirect_url": url_for("user.index"),
                }
            ),
            401,
        )
    flash("Debes iniciar sesión para acceder a este recurso.", "warning")
    return redirect(url_for("user.index"))


@jwt.expired_token_loader
def custom_expired_token_callback(jwt_header, jwt_payload):
    print(">>> EXPIRED TOKEN CALLBACK EJECUTADO")
    print(">>> request.is_json:", request.is_json)
    print(">>> request.path:", request.path)
    print(">>> request.headers.get('Accept'):", request.headers.get("Accept"))

    if request.is_json or request.path.startswith("/api/"):
        return (
            jsonify(
                {
                    "status": 401,
                    "error": "Token Expired",
                    "message": "El token ha expirado. Por favor, inicia sesión de nuevo.",
                }
            ),
            401,
        )

    flash("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.", "warning")
    return redirect(url_for("user.index"))


# ==============================================================================
