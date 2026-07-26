from flask import request, jsonify
from app.services.rutaServices import RutaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response

def get_all_rutas():
    try:
        data = RutaServices.get_all_rutas()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener las rutas", status_code=500)

def get_ruta_by_id(id_ruta):
    try:
        data = RutaServices.get_ruta_by_id(id_ruta)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Ruta no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la ruta", status_code=500)

def create_ruta():
    try:
        data = request.get_json()
        print("Datos recibidos en create_ruta:", data)  # Debug
        ruta = RutaServices.create_ruta(data)
        return success_response(message="Ruta creada exitosamente", data=ruta.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        import traceback
        print("ERROR EN create_ruta:", traceback.format_exc())  
        return error_response(error=str(e), message="Error al crear la ruta", status_code=500)

def update_ruta(id_ruta):
    try:
        data = request.get_json()
        ruta = RutaServices.update_ruta(id_ruta, data)
        return success_response(message="Ruta actualizada exitosamente", data=ruta.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar la ruta", status_code=500)

def delete_ruta(id_ruta):
    try:
        RutaServices.delete_ruta(id_ruta)
        return success_response(message="Ruta eliminada exitosamente")
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Ruta no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar la ruta", status_code=500)