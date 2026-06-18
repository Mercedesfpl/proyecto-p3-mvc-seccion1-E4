# app/controllers/personaControllers.py

from app.models.persona import Persona
from app.models.models import Usuario
from app.extensions import db
from app.models.exceptions import ResourceNotValid
from ..helpers.makeResponse import success_response
from werkzeug.security import generate_password_hash
from flask import jsonify
import re

# Roles válidos
ROLES_VALIDOS = ['administrador', 'secretario', 'presidente']

def get_all_personas():
    """Obtener todas las personas"""
    try:
        personas = Persona.query.all()
        data = [p.to_dict() for p in personas]
        return success_response(data=data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_persona_by_id(id):
    """Obtener una persona por ID"""
    try:
        persona = Persona.query.get(id)
        if not persona:
            return jsonify({"error": "Persona no encontrada"}), 404
        return success_response(data=persona.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def create_persona(data):
    """Crear una nueva persona"""
    try:
        # Validar campos obligatorios
        if not data.get('nombre') or not data.get('apellido') or not data.get('cedula'):
            return jsonify({"error": "Nombre, apellido y cédula son obligatorios"}), 400
        
        # Validar rol
        rol = data.get('rol', '')
        if rol and rol not in ROLES_VALIDOS:
            return jsonify({"error": f"Rol inválido. Debe ser: {', '.join(ROLES_VALIDOS)}"}), 400
        
        # Validar formato de cédula (solo números)
        if not data['cedula'].isdigit():
            return jsonify({"error": "La cédula solo debe contener números"}), 400
        
        # Verificar cédula única
        if Persona.query.filter_by(cedula=data['cedula']).first():
            return jsonify({"error": "Ya existe una persona con esa cédula"}), 400
        
        # Verificar correo único si se proporciona
        correo = data.get('correo', '').strip()
        if correo:
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
                return jsonify({"error": "Formato de correo inválido"}), 400
            if Persona.query.filter_by(correo=correo).first():
                return jsonify({"error": "Ya existe una persona con ese correo"}), 400
        
        # Crear persona
        persona = Persona(
            nombre=data['nombre'].strip(),
            apellido=data['apellido'].strip(),
            cedula=data['cedula'].strip(),
            correo=correo,
            telefono=data.get('telefono', '').strip(),
            rol=rol
        )
        db.session.add(persona)
        db.session.flush()
        
        # Si es secretario, crear usuario automáticamente
        if rol == 'secretario':
            if not correo:
                return jsonify({"error": "El correo es obligatorio para crear un secretario"}), 400
            if Usuario.query.filter_by(email=correo).first():
                return jsonify({"error": "Ya existe un usuario con ese correo"}), 400
            
            # Crear usuario con contraseña = cédula (hash)
            usuario = Usuario(
                nombre=f"{data['nombre']} {data['apellido']}",
                email=correo,
                password=generate_password_hash(data['cedula']),
                rol='secretario',
                persona_id=persona.id
            )
            db.session.add(usuario)
        
        db.session.commit()
        return success_response(message="Persona creada exitosamente", data=persona.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear persona: {str(e)}"}), 500

def update_persona(id, data):
    """Actualizar una persona existente"""
    try:
        persona = Persona.query.get(id)
        if not persona:
            return jsonify({"error": "Persona no encontrada"}), 404
        
        # Validar rol si se proporciona
        if 'rol' in data and data['rol']:
            if data['rol'] not in ROLES_VALIDOS:
                return jsonify({"error": f"Rol inválido. Debe ser: {', '.join(ROLES_VALIDOS)}"}), 400
        
        # Actualizar campos
        if 'nombre' in data:
            persona.nombre = data['nombre'].strip()
        if 'apellido' in data:
            persona.apellido = data['apellido'].strip()
        if 'cedula' in data:
            if not data['cedula'].isdigit():
                return jsonify({"error": "La cédula solo debe contener números"}), 400
            existing = Persona.query.filter(Persona.cedula == data['cedula'], Persona.id != id).first()
            if existing:
                return jsonify({"error": "Ya existe otra persona con esa cédula"}), 400
            persona.cedula = data['cedula'].strip()
        if 'correo' in data:
            correo = data['correo'].strip()
            if correo:
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
                    return jsonify({"error": "Formato de correo inválido"}), 400
                existing = Persona.query.filter(Persona.correo == correo, Persona.id != id).first()
                if existing:
                    return jsonify({"error": "Ya existe otra persona con ese correo"}), 400
            persona.correo = correo
        if 'telefono' in data:
            persona.telefono = data['telefono'].strip()
        if 'rol' in data:
            persona.rol = data['rol']
        
        db.session.commit()
        return success_response(message="Persona actualizada exitosamente", data=persona.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al actualizar persona: {str(e)}"}), 500

def delete_persona(id):
    """Eliminar una persona"""
    try:
        persona = Persona.query.get(id)
        if not persona:
            return jsonify({"error": "Persona no encontrada"}), 404
        
        # Verificar si es el presidente de alguna línea
        from app.models.linea import Linea
        lineas_como_presidente = Linea.query.filter_by(presidente_id=persona.id).first()
        if lineas_como_presidente:
            return jsonify({"error": "No se puede eliminar porque es presidente de una línea"}), 400
        
        # Verificar si tiene usuario asociado
        usuario = Usuario.query.filter_by(persona_id=persona.id).first()
        if usuario:
            db.session.delete(usuario)
        
        db.session.delete(persona)
        db.session.commit()
        return success_response(message="Persona eliminada exitosamente")
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al eliminar persona: {str(e)}"}), 500