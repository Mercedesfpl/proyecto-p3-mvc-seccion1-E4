# app/controllers/deteccionControllers.py

from flask import request
from app.services.deteccionService import DeteccionServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response


def get_all_detecciones():
    try:
        data = DeteccionServices.get_all_detecciones()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener detecciones", status_code=500)


def get_deteccion_by_id(id_deteccion):
    try:
        data = DeteccionServices.get_deteccion_by_id(id_deteccion)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Deteccion no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la deteccion", status_code=500)


def get_detecciones_by_vehiculo(id_vehiculo):
    try:
        data = DeteccionServices.get_detecciones_by_vehiculo(id_vehiculo)
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener detecciones del vehiculo", status_code=500)


def get_detecciones_by_parada(id_parada):
    try:
        data = DeteccionServices.get_detecciones_by_parada(id_parada)
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener detecciones de la parada", status_code=500)


def get_alertas():
    try:
        tolerancia = request.args.get('tolerancia', 5, type=float)
        data = DeteccionServices.get_alertas(tolerancia)
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener alertas", status_code=500)


def create_deteccion():
    try:
        data = request.get_json()
        deteccion = DeteccionServices.create_deteccion(data)
        return success_response(message="Deteccion creada exitosamente", data=deteccion.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al crear la deteccion", status_code=500)


def delete_deteccion(id_deteccion):
    try:
        DeteccionServices.delete_deteccion(id_deteccion)
        return success_response(message="Deteccion eliminada exitosamente")
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Deteccion no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar la deteccion", status_code=500)

def registrar_paso(data):
    try:
        deteccion = DeteccionServices.registrar_paso(data)
        return success_response(
            message="Paso registrado exitosamente", 
            data=deteccion.to_dict())
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al registrar paso", status_code=500)

def verificar_retraso(data):
    try:
        resultado = DeteccionServices.verificar_retraso(data)
        return success_response(message="Verificación de retraso completado", data=resultado)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al verificar retraso", status_code=500)