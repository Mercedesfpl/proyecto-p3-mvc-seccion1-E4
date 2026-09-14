from flask import request
from flask_jwt_extended import get_jwt_identity
from app.services.configuracionServices import ConfiguracionServices
from app.models.exceptions import ResourceNotFound
from app.helpers.makeResponse import success_response, error_response

def update_configuracion():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        config = ConfiguracionServices.update_configuracion(user_id, data)
        return success_response(message="Configuración actualizxada", data=config)
    except ResourceNotFound as e: 
        return error_response(error=str(e), message="Usuario no registrado", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error en actualizar la información", status_code=500)

def get_configuracion():
    try:
        user_id = int(get_jwt_identity())
        config = ConfiguracionServices.get_configuracion(user_id)
        return success_response(data=config)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Usuario no encontrado", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener configuración", status_code=500)