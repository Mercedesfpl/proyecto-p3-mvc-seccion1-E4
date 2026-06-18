# app/controllers/lineaControllers.py

from app.models.linea import Linea
from app.models.persona import Persona
from app.models.models import Usuario
from app.extensions import db
from app.models.exceptions import ResourceNotValid
from ..helpers.makeResponse import success_response
from flask import jsonify

def get_all_lineas():
    """Obtener todas las líneas (no suspendidas)"""
    try:
        lineas = Linea.query.filter_by(suspendido=False).all()
        return success_response(data=[linea.to_dict() for linea in lineas])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_linea_by_id(id_linea):
    """Obtener una línea por ID"""
    try:
        linea = Linea.query.get(id_linea)
        if not linea or linea.suspendido:
            return jsonify({"error": "Línea no encontrada"}), 404
        return success_response(data=linea.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_personas_disponibles():
    """Obtener todas las personas para los selects"""
    try:
        personas = Persona.query.all()
        return success_response(data=[p.to_dict() for p in personas])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_secretarios_disponibles():
    """Obtener todos los secretarios (usuarios con rol secretario)"""
    try:
        secretarios = Usuario.query.filter_by(rol='secretario').all()
        data = [{
            "id": s.id,
            "nombre": s.nombre,
            "email": s.email
        } for s in secretarios]
        return success_response(data=data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def create_linea(data):
    """Crear una nueva línea"""
    try:
        print("=== DATOS RECIBIDOS EN EL BACKEND ===")
        print(data)
        
        # Validar campos obligatorios
        if not data.get('nombre'):
            return jsonify({"error": "El nombre es obligatorio"}), 400
        if not data.get('rif'):
            return jsonify({"error": "El RIF es obligatorio"}), 400
        if not data.get('presidente_id'):
            return jsonify({"error": "Debes seleccionar un presidente"}), 400
        
        # Verificar que no exista una línea con el mismo nombre
        existing = Linea.query.filter_by(nombre=data['nombre']).first()
        if existing:
            return jsonify({"error": "Ya existe una línea con ese nombre"}), 400
        
        # Verificar que el presidente existe
        presidente = Persona.query.get(data['presidente_id'])
        if not presidente:
            return jsonify({"error": "El presidente seleccionado no existe"}), 400
        
        # Verificar que el secretario existe (si se seleccionó)
        secretario_id = data.get('secretario_id')
        if secretario_id:
            secretario = Usuario.query.get(secretario_id)
            if not secretario:
                return jsonify({"error": "El secretario seleccionado no existe"}), 400
        
        # Crear la línea
        nueva_linea = Linea(
            nombre=data['nombre'].strip(),
            rif=data['rif'].strip(),
            presidente_id=data['presidente_id'],
            secretario_id=secretario_id
        )
        
        db.session.add(nueva_linea)
        db.session.commit()
        
        return success_response(message="Línea creada exitosamente", data=nueva_linea.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear línea: {str(e)}"}), 500

def update_linea(id_linea, data):
    """Actualizar una línea existente"""
    try:
        print("Datos recibidos para actualizar:", data)
        
        linea = Linea.query.get(id_linea)
        if not linea or linea.suspendido:
            return jsonify({"error": "Línea no encontrada"}), 404
        
        # Actualizar campos
        if 'nombre' in data:
            linea.nombre = data['nombre'].strip()
        if 'rif' in data:
            linea.rif = data['rif'].strip()
        if 'presidente_id' in data:
            presidente = Persona.query.get(data['presidente_id'])
            if not presidente:
                return jsonify({"error": "El presidente seleccionado no existe"}), 400
            linea.presidente_id = data['presidente_id']
        if 'secretario_id' in data:
            if data['secretario_id']:
                secretario = Usuario.query.get(data['secretario_id'])
                if not secretario:
                    return jsonify({"error": "El secretario seleccionado no existe"}), 400
            linea.secretario_id = data['secretario_id']
        
        db.session.commit()
        
        return success_response(message="Línea actualizada exitosamente", data=linea.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al actualizar línea: {str(e)}"}), 500

def delete_linea(id_linea):
    """Suspender una línea (no se elimina físicamente)"""
    try:
        linea = Linea.query.get(id_linea)
        if not linea:
            return jsonify({"error": "Línea no encontrada"}), 404
        
        linea.suspendido = True
        db.session.commit()
        
        return success_response(message="Línea suspendida exitosamente")
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al suspender línea: {str(e)}"}), 500