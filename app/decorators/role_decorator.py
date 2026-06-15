# app/decorators/role_decorator.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from ..models.models import Usuario

def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = Usuario.query.get(user_id)
            
            if not user:
                return jsonify({"error": "Usuario no encontrado"}), 404
            
            if user.rol != required_role and user.rol != 'admin':
                return jsonify({"error": "No tienes permisos para acceder"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator