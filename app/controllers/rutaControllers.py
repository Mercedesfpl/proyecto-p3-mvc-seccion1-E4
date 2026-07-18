# app/controllers/rutaControllers.py

from flask import jsonify, request
from app.services.rutaServices import RutaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response


def get_all_rutas():
    """Obtener todas las rutas"""
    try:
        data = RutaServices.get_all_rutas()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener rutas", status_code=500)


def get_ruta_by_id(id_ruta):
    """Obtener una ruta por ID"""
    try:
        data = RutaServices.get_ruta_by_id(id_ruta)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Ruta no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener ruta", status_code=500)


def get_rutas_by_linea(id_linea):
    """Obtener rutas de una línea específica"""
    try:
        data = RutaServices.get_rutas_by_linea(id_linea)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Línea no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener rutas", status_code=500)


def create_ruta():
    """Crear una nueva ruta con sus paradas"""
    try:
        data = request.get_json()
        
        # Validación básica
        if not data.get('nombre'):
            return error_response(message="El nombre es obligatorio", status_code=400)
        if not data.get('id_linea'):
            return error_response(message="Debes seleccionar una línea", status_code=400)
        
        result = RutaServices.create_ruta(data)
        return success_response(message="Ruta creada exitosamente", data=result)
    
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al crear ruta", status_code=500)


def update_ruta(id_ruta):
    """Actualizar una ruta existente"""
    try:
        data = request.get_json()
        result = RutaServices.update_ruta(id_ruta, data)
        return success_response(message="Ruta actualizada exitosamente", data=result)
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Ruta no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar ruta", status_code=500)


def delete_ruta(id_ruta):
    """Eliminar una ruta"""
    try:
        RutaServices.delete_ruta(id_ruta)
        return success_response(message="Ruta eliminada exitosamente")
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Ruta no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar ruta", status_code=500)


# ========== FUNCIONES PARA SELECTORES ==========

def get_paradas_disponibles():
    """Obtener paradas para selectores"""
    try:
        data = RutaServices.get_paradas_disponibles()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener paradas", status_code=500)


def get_lineas_disponibles():
    """Obtener líneas para selectores"""
    try:
        data = RutaServices.get_lineas_disponibles()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener líneas", status_code=500)