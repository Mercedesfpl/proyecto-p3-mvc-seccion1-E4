# app/controllers/personaControllers.py

from ..services.persona_factory import PersonaFactory
from ..database.connection import (
    get_all_personas as get_all_personas_db,
    get_persona_by_id as get_persona_by_id_db,
    get_lineas_by_presidente,
    agregar_elemento,
    guardar_datos
)
from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..helpers.makeResponse import success_response, error_response
from ..extensions import db
from ..models.models import Usuario
from ..models.persona import Persona


def get_all_personas():
    """Obtener todas las personas"""
    try:
        personas = get_all_personas_db()
        return success_response(data=[p.to_dict() for p in personas])
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener personas", status_code=500)


def get_persona_by_id(id_persona):
    """Obtener una persona por ID"""
    try:
        persona = get_persona_by_id_db(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")
        return success_response(data=persona.to_dict())
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener persona", status_code=500)


def create_persona(data):
    """Crear una nueva persona con su usuario asociado"""
    try:
        # Crear persona
        persona = PersonaFactory.crear_persona(data)
        
        if not agregar_elemento(persona):
            return error_response(message="Error al guardar la persona", status_code=503)
        
        # Crear usuario asociado (SIEMPRE)
        usuario = PersonaFactory.crear_usuario(persona)
        if not agregar_elemento(usuario):
            db.session.rollback()
            return error_response(message="Error al crear el usuario", status_code=503)
        
        return success_response(
            message="Persona y usuario creados exitosamente",
            data={
                "persona": persona.to_dict(),
                "usuario": {
                    "id": usuario.id,
                    "email": usuario.email,
                    "rol": usuario.rol
                }
            }
        )
    
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(error=str(e), message="Error al crear persona", status_code=500)


def update_persona(id_persona, data):
    """Actualizar una persona existente"""
    try:
        persona = get_persona_by_id_db(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")
        
        # Actualizar campos de persona
        if "nombre" in data:
            persona.nombre = data["nombre"].strip()
        if "apellido" in data:
            persona.apellido = data["apellido"].strip()
        if "cedula" in data:
            if not data["cedula"].isdigit():
                raise ResourceNotValid("Persona", "La cédula solo debe contener números")
            existing = Persona.query.filter(Persona.cedula == data["cedula"], Persona.id != id_persona).first()
            if existing:
                raise ResourceNotValid("Persona", "Ya existe otra persona con esa cédula")
            persona.cedula = data["cedula"].strip()
        if "correo" in data:
            correo = data["correo"].strip()
            if correo:
                import re
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
                    raise ResourceNotValid("Persona", "Formato de correo inválido")
                existing = Persona.query.filter(Persona.correo == correo, Persona.id != id_persona).first()
                if existing:
                    raise ResourceNotValid("Persona", "Ya existe otra persona con ese correo")
            persona.correo = correo
        if "telefono" in data:
            persona.telefono = data["telefono"].strip()
        if "rol" in data:
            if data["rol"] not in ["admin", "presidente", "secretario", "usuario"]:
                raise ResourceNotValid("Persona", f"Rol inválido: {data['rol']}")
            persona.rol = data["rol"]
            
            # Actualizar también el rol del usuario asociado
            usuario = Usuario.query.filter_by(persona_id=persona.id).first()
            if usuario:
                if persona.rol in ["admin", "secretario"]:
                    usuario.rol = persona.rol
                else:
                    usuario.rol = "usuario"
        
        if guardar_datos():
            return success_response(
                message="Persona actualizada exitosamente",
                data=persona.to_dict()
            )
        return error_response(message="Error al actualizar persona", status_code=503)
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar persona", status_code=500)


def delete_persona(id_persona):
    """Eliminar una persona"""
    try:
        persona = get_persona_by_id_db(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")
        
        lineas = get_lineas_by_presidente(id_persona)
        if lineas:
            raise ResourceNotValid("Persona", "No se puede eliminar porque es presidente de una línea")
        
        usuario = Usuario.query.filter_by(persona_id=persona.id).first()
        if usuario:
            db.session.delete(usuario)
        
        db.session.delete(persona)
        if guardar_datos():
            return success_response(message="Persona eliminada exitosamente")
        return error_response(message="Error al eliminar persona", status_code=503)
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Persona no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(error=str(e), message="Error al eliminar persona", status_code=500)


# ========== FUNCIONES PARA SELECTORES ==========

def get_personas_select():
    """Obtener personas con rol 'presidente' para selectores"""
    try:
        presidentes = Persona.query.filter_by(rol="presidente").all()
        resultado = [
            {"id": p.id, "nombre_completo": f"{p.nombre} {p.apellido}", "cedula": p.cedula}
            for p in presidentes
        ]
        return success_response(data=resultado)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener presidentes", status_code=500)


def get_secretarios_select():
    """Obtener usuarios con rol 'secretario' para selectores"""
    try:
        secretarios = Usuario.query.filter_by(rol="secretario").all()
        resultado = [
            {"id": s.id, "nombre": s.nombre, "email": s.email}
            for s in secretarios
        ]
        return success_response(data=resultado)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener secretarios", status_code=500)