# app/controllers/lineaControllers.py
from app.models.linea import Linea
from app.extensions import db
from app.models.exceptions import ResourceNotValid
from ..helpers.makeResponse import success_response

def get_all_lineas():
    """Obtener todas las líneas (no suspendidas)"""
    lineas = Linea.query.filter_by(suspendido=False).all()
    return success_response(data=[linea.to_dict() for linea in lineas])

def get_linea_by_id(id_linea):
    """Obtener una línea por ID"""
    linea = Linea.query.get(id_linea)
    if not linea or linea.suspendido:
        raise ResourceNotValid("Línea", "No encontrada")
    return success_response(data=linea.to_dict())

def create_linea(linea_data):
    """Crear una nueva línea"""
    # Validar campos obligatorios
    if not linea_data.get('nombre'):
        raise ResourceNotValid("nombre", "El nombre es obligatorio")
    if not linea_data.get('presidente_nombre'):
        raise ResourceNotValid("presidente_nombre", "El nombre del presidente es obligatorio")
    if not linea_data.get('presidente_cedula'):
        raise ResourceNotValid("presidente_cedula", "La cédula es obligatoria")
    if not linea_data.get('telefono'):
        raise ResourceNotValid("telefono", "El teléfono es obligatorio")
    if not linea_data.get('rif'):
        raise ResourceNotValid("rif", "El RIF es obligatorio")
    
    # Verificar que no exista una línea con el mismo nombre
    existing = Linea.query.filter_by(nombre=linea_data['nombre']).first()
    if existing:
        raise ResourceNotValid("nombre", "Ya existe una línea con ese nombre")
    
    nueva_linea = Linea(
        nombre=linea_data['nombre'],
        presidente_nombre=linea_data['presidente_nombre'],
        presidente_cedula=linea_data['presidente_cedula'],
        telefono=linea_data['telefono'],
        rif=linea_data['rif'],
        secretario_id=linea_data.get('secretario_id')
    )
    
    db.session.add(nueva_linea)
    db.session.commit()
    
    return success_response(message="Línea creada exitosamente", data=nueva_linea.to_dict())

def update_linea(id_linea, linea_data):
    """Actualizar una línea existente"""
    linea = Linea.query.get(id_linea)
    if not linea or linea.suspendido:
        raise ResourceNotValid("Línea", "No encontrada")
    
    if 'nombre' in linea_data:
        linea.nombre = linea_data['nombre']
    if 'presidente_nombre' in linea_data:
        linea.presidente_nombre = linea_data['presidente_nombre']
    if 'presidente_cedula' in linea_data:
        linea.presidente_cedula = linea_data['presidente_cedula']
    if 'telefono' in linea_data:
        linea.telefono = linea_data['telefono']
    if 'rif' in linea_data:
        linea.rif = linea_data['rif']
    if 'secretario_id' in linea_data:
        linea.secretario_id = linea_data['secretario_id']
    
    db.session.commit()
    
    return success_response(message="Línea actualizada exitosamente", data=linea.to_dict())

def delete_linea(id_linea):
    """Suspender una línea (no se elimina físicamente)"""
    linea = Linea.query.get(id_linea)
    if not linea:
        raise ResourceNotValid("Línea", "No encontrada")
    
    linea.suspendido = True
    db.session.commit()
    
    return success_response(message="Línea suspendida exitosamente")