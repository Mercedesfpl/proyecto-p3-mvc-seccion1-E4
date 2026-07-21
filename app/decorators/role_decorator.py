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

            # Admin tiene acceso a todo
            if user.rol == "admin":
                return fn(*args, **kwargs)

            # Secretario y presidente tienen acceso a sus rutas
            if user.rol == required_role:
                return fn(*args, **kwargs)

            # Usuario normal solo acceso a rutas públicas (mapa)
            if user.rol == "usuario" and required_role == "usuario":
                return fn(*args, **kwargs)

            raise Unauthorized(
                "permiso",
                rason="No tienes permisos para realizar esta acción",
            )

        return wrapper

    return decorator