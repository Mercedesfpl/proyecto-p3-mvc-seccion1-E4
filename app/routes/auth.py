from flask import (
    Blueprint,
    request,
)
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
