# app/controllers/personaControllers.py
from flask import jsonify, request
from app.services.personaServices import PersonaServices
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.helpers.makeResponse import success_response, error_response
from flask import request

def get_all_personas():
    #Obtener todas las personas
    try:
        data = PersonaServices.get_all_personas()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener personas", status_code=500)

def get_persona_by_id(id_persona):
    #Obtener una persona por ID
    try:
        data = PersonaServices.get_persona_by_id(id_persona)
        return success_response(data=data)
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener persona", status_code=500)

def create_persona(data):
    #Crear una nueva persona con su usuario asociado
    try:
        # Validación básica de entrada
        if not data.get('nombre') or not data.get('apellido') or not data.get('cedula'):
            return error_response(message="Nombre, apellido y cédula son obligatorios", status_code=400)
        
        result = PersonaServices.create_persona(data)
        return success_response(message="Persona y usuario creados exitosamente", data=result)
    
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al crear persona", status_code=500)

def update_persona(id_persona, data):
    #Actualizar una persona existente
    try:
        data = request.get_json()
        persona = PersonaServices.update_persona(id_persona, data)
        return success_response(message="Persona actualizada exitosamente", data=persona.to_dict(include_usuario=True))
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar persona", status_code=500)

def delete_persona(id_persona):
    #Eliminar una persona
    try:
        PersonaServices.delete_persona(id_persona)
        return success_response(message="Persona eliminada exitosamente")
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al eliminar persona", status_code=500)

# ========== FUNCIONES PARA SELECTORES ==========

def get_personas_select():
    #Obtener personas con rol 'presidente' para selectores
    try:
        data = PersonaServices.get_personas_select()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener presidentes", status_code=500)

def get_secretarios_select():
    #Obtener usuarios con rol 'secretario' para selectores
    try:
        data = PersonaServices.get_secretarios_select()
        return success_response(data=data)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener secretarios", status_code=500)