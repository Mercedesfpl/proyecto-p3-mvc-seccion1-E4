# app/controllers/lineaControllers.py
from flask import jsonify, request
from app.services.lineaService import LineaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response

def get_lineas():
    #Obtener todas las líneas (no suspendidas)
    try:
        data = LineaServices.get_all_lineas()
        return success_response(data=data)
    except Exception as e: 
        return error_response(error=str(e), message="Error en obtener las líneas", status_code=500)
    
def get_linea_by_id(id_linea):
    #Obtener una línea por id
    try:
        data = LineaServices.get_linea_by_id(id_linea)
        return success_response(data=data)
    except ResourceNotFound as e: 
        return error_response(error=str(e), message="Línea no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener la línea", status_code=500)
    
def get_personas_disponibles():
    #Obtener todas las personas (No suspendidas)
    try:
        data = LineaServices.get_personas_disponibles()
        return success_response(data=data)
    except ResourceNotFound as e:
        return success_response(data=[]) #Array vacio cuando no hay nada jijiji
    except Exception as e:
        return error_response(error=str(e), message="Error en obtener las personas disponibles", status_code=500)
    
def get_secretarios_disponibles():
    #Obtener todos los secretarios (No suspendidas)
    try:
        data = LineaServices.get_secretarios_disponibles()
        return success_response(data=data)
    except ResourceNotFound as e:
        return success_response(data=[]) #Array vacio cuando no hay nada jijiji
    except Exception as e:
        return error_response(error=str(e), message="Error en obtener los secretarios disponibles", status_code=500)
    
def create_linea(data):
    #Crea una línea
    try: 
        linea = LineaServices.create_linea(data)
        return success_response(message="Línea creada existosamente", data=linea.to_dict())
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except ResourceNotFound as e:
        return error_response(error=str(e), message=str(e), status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error en crear una línea", status_code=500)
    
def update_linea(id_linea):
    #Actualizar linea 

        try: 
            data = request.get_json()
            linea = LineaServices.update_linea(id_linea ,data)
            return success_response(message="Línea actualizada exitosamente", data=linea.to_dict())
        except ResourceNotValid as e:
            return error_response(error=str(e), message=str(e), status_code=400)
        except ResourceNotFound as e:
            return error_response(error=str(e), message="Línea no encontrada", status_code=404)
        except Exception as e:
            return error_response(error=str(e), message="Error en actualizar una línea", status_code=500)

def delete_linea(id_linea):
    #"Eliminar" (Suspender) una línea existente

    try: 
        LineaServices.delete_linea(id_linea)
        return success_response(message="Línea eliminada de manera exitosa")
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Línea no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error en eliminar una línea", status_code=500)
    
    