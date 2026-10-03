from flask import request, jsonify
from app.services.rutaServices import RutaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response
import traceback


def get_all_rutas():
    try:
        data = RutaServices.get_all_rutas()
        return success_response(data=data)
    except Exception as e:
        return error_response(
            error=str(e), message="Error al obtener las rutas", status_code=500
        )


def get_ruta_by_id(id_ruta):
    try:
        data = RutaServices.get_ruta_by_id(id_ruta)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(
            error=str(e), message="Ruta no encontrada", status_code=404
        )
    except Exception as e:
        return error_response(
            error=str(e), message="Error al obtener la ruta", status_code=500
        )


def create_ruta(data):
    try:
        print("datos de crear tuta>>>>>>>>>>>>>>", data)
        ruta = RutaServices.create_ruta(data)
        return success_response(message="Ruta creada exitosamente", data=data)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        #traceback.print_exc() 
        return error_response(
            error=str(e), message="Error al crear la ruta", status_code=500
        )


def update_ruta(id_ruta, data):
    try:
        ruta = RutaServices.update_ruta(id_ruta, data)
        return success_response(
            message="Ruta actualizada exitosamente", data=ruta
        )
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(
            error=str(e), message="Error al actualizar la ruta", status_code=500
        )


def delete_ruta(id_ruta):
    try:
        RutaServices.delete_ruta(id_ruta)
        return success_response(message="Ruta eliminada exitosamente")
    except ResourceNotFound as e:
        return error_response(
            error=str(e), message="Ruta no encontrada", status_code=404
        )
    except Exception as e:
        return error_response(
            error=str(e), message="Error al eliminar la ruta", status_code=500
        )
