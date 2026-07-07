# app/decorators/role_decorator.py
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from ..models.exceptions import Unauthorized, ResourceNotFound
from ..database.connection import obtener_usuario_por_id


def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = obtener_usuario_por_id(user_id=user_id)

            if not user:
                raise ResourceNotFound(nombre_del_recurso="Usuario")

            if user.rol != required_role and user.rol != "admin":
                raise Unauthorized(
                    "administrador",
                    rason="Actuamnete usted no tiene permisos para realizar esta accion",
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator
