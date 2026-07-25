# app/controllers/paradaControllers.py
from flask import jsonify, request
from app.services.paradaServices import ParadaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response

def get_all_paradas():
    try:
        data = ParadaServices.get_all_paradas()
        return success_response(data=data) 
    except Exception as e: 
        return error_response(error=str(e), message="Error al obtener las paradas", status_code=500)
    
def get_paradas_disponibles():
    """Obtener paradas activas para selectores"""
    try:
        from app.services.paradaServices import ParadaServices
        data = ParadaServices.get_paradas_disponibles()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener paradas", status_code=500)

def get_parada_by_id(id_parada):
    try:
        data = ParadaServices.get_parada_by_id(id_parada)
        return success_response(data=data)
    except ResourceNotFound as e: 
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la parada", status_code=500)
    
def create_parada():
    try:
        data = request.get_json()
        
        # Validación básica de entrada
        if not data or not data.get('nombre'):
            return error_response(message="El nombre es obligatorio", status_code=400)
        
        parada = ParadaServices.create_parada(data)
        return success_response(message="Parada creada con éxito", data=parada.to_dict())
    
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al crear la parada", status_code=500)
    
def update_parada(id_parada):
    try:
        data = request.get_json()
        if not data:
            return error_response(message="Datos no proporcionados", status_code=400)
            
        parada = ParadaServices.update_parada(id_parada, data)
        return success_response(message="Parada actualizada exitosamente", data=parada.to_dict())
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar la parada", status_code=500)
    
def delete_parada(id_parada):
    try:
        ParadaServices.delete_parada(id_parada)
        return success_response(message="Parada eliminada exitosamente")
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar la parada", status_code=500)