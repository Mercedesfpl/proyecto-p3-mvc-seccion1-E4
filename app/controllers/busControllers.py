# app/controllers/busControllers.py

from flask import request, jsonify
from app.services.busServices import BusServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response


def get_all_buses():
    try:
        data = BusServices.get_all_buses()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener los buses", status_code=500)


def get_bus_by_id(id_vehiculo):
    try:
        data = BusServices.get_bus_by_id(id_vehiculo)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Bus no encontrado", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener el bus", status_code=500)


def create_bus(data):
    try:
        data = request.get_json()
        bus = BusServices.create_bus(data)
        return success_response(message="Bus creado exitosamente", data=bus.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al crear el bus", status_code=500)


def update_bus(id_vehiculo, data):
    try:
        data = request.get_json()
        bus = BusServices.update_bus(id_vehiculo, data)
        return success_response(message="Bus actualizado exitosamente", data=bus.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar el bus", status_code=500)


def delete_bus(id_vehiculo):
    try:
        BusServices.delete_bus(id_vehiculo)
        return success_response(message="Bus eliminado exitosamente")
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Bus no encontrado", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar el bus", status_code=500)


def get_rutas_disponibles():
    try:
        data = BusServices.get_rutas_disponibles()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener rutas", status_code=500)


def get_lineas_disponibles():
    try:
        data = BusServices.get_lineas_disponibles()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener lineas", status_code=500)