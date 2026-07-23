# app/controllers/paradaControllers.py
from flask import jsonify, request
from app.services.paradaServices import ParadaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response

def get_all_paradas():
    #obtener todas las paradas

    try:
        data = ParadaServices.get_all_paradas()
        return success_response(data=data) 
    except Exception as e: 
        return error_response(error=str(e), message="Error en obtener las líneas", status_code=500)
    
def get_parada_by_id(id_parada):
    #obtener una parada por id

    try:
        data = ParadaServices.get_parada_by_id(id_parada)
        return success_response(data=data)
    except ResourceNotFound as e: 
        return error_response(error=str(e), message="Línea no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la línea", status_code=500)
    
def create_parada(data):
    #Crear una parada

    try:

        #validación básica de entrada
        if not data.get('nombre'):
            return error_response(error=str(e), message="El nombre es obligatorio", status_code=400)
        
        parada = ParadaServices.create_parada(data)

        return success_response(message="Parada creada con exito", data=parada.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la línea", status_code=500)
    
def update_parada(id_parada, data):
    #Actualizar una parada

    try:
        data = request.get_json()
        parada = ParadaServices.update_parada(id_parada, data)
        return success_response(message="Parada actualizada exitosamente", data=parada.to_dict())
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar una parada", status_code=500)
    
def delete_parada(id_parada):
    #Eliminar (Suspender) una parada
    try:
        ParadaServices.delete_parada(id_parada)
        return success_response(message="Parada eliminada exitosamente")
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar una parada", status_code=500)