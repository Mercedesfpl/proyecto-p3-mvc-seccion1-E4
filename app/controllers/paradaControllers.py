# app/controllers/paradaControllers.py

from ..services.parada_factory import ParadaFactory
from ..helpers.coordenadas_helper import limpiar_coordenadas, validar_coordenadas
from ..database.connection import (
    get_all_paradas as get_all_paradas_db,
    get_parada_by_id as get_parada_by_id_db,
    get_parada_by_nombre,
    agregar_elemento,
    guardar_datos
)
from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..helpers.makeResponse import success_response, error_response
from ..extensions import db
from ..models.parada import Parada


def get_all_paradas():
    """Obtener todas las paradas"""
    try:
        paradas = get_all_paradas_db()
        return success_response(data=[p.to_dict() for p in paradas])
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener paradas", status_code=500)


def get_parada_by_id(id_parada):
    """Obtener una parada por ID"""
    try:
        parada = get_parada_by_id_db(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        return success_response(data=parada.to_dict())
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except Exception as e:
        return error_response(error=str(e), message="Error al obtener parada", status_code=500)


def create_parada(data):
    """Crear una nueva parada"""
    try:
        # Verificar nombre único
        existing = get_parada_by_nombre(data.get("nombre"))
        if existing:
            raise ResourceNotValid("Parada", "Ya existe una parada con ese nombre")
        
        # Delegar creación a la fábrica
        parada = ParadaFactory.crear_parada(data)
        
        if not agregar_elemento(parada):
            return error_response(message="Error al guardar la parada", status_code=503)
        
        return success_response(
            message="Parada creada exitosamente",
            data=parada.to_dict()
        )
    
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(error=str(e), message="Error al crear parada", status_code=500)


def update_parada(id_parada, data):
    """Actualizar una parada existente"""
    try:
        parada = get_parada_by_id_db(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        
        if "nombre" in data:
            existing = get_parada_by_nombre(data["nombre"])
            if existing and existing.id != id_parada:
                raise ResourceNotValid("Parada", "Ya existe otra parada con ese nombre")
            parada.nombre = data["nombre"].strip()
        
        if "coordenadas" in data:
            # Usar el helper para limpiar y validar
            coordenadas_limpias = limpiar_coordenadas(data["coordenadas"])
            es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas_limpias)
            if not es_valido:
                raise ResourceNotValid("Parada", mensaje)
            parada.coordenadas = coordenadas_limpias
        
        if "status" in data:
            if data["status"] not in ["activa", "inactiva"]:
                raise ResourceNotValid("Parada", f"Status inválido: {data['status']}")
            parada.status = data["status"]
        
        if guardar_datos():
            return success_response(
                message="Parada actualizada exitosamente",
                data=parada.to_dict()
            )
        return error_response(message="Error al actualizar parada", status_code=503)
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        return error_response(error=str(e), message="Error al actualizar parada", status_code=500)


def delete_parada(id_parada):
    """Eliminar una parada"""
    try:
        parada = get_parada_by_id_db(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        
        # Verificar si está siendo usada en alguna ruta
        from ..models.ruta_parada import RutaParada
        en_uso = RutaParada.query.filter_by(id_parada=id_parada).first()
        if en_uso:
            raise ResourceNotValid("Parada", "No se puede eliminar porque está asignada a una ruta")
        
        db.session.delete(parada)
        if guardar_datos():
            return success_response(message="Parada eliminada exitosamente")
        return error_response(message="Error al eliminar parada", status_code=503)
    
    except ResourceNotFound as e:
        return error_response(error=str(e), message="Parada no encontrada", status_code=404)
    except ResourceNotValid as e:
        return error_response(error=str(e), message=str(e), status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(error=str(e), message="Error al eliminar parada", status_code=500)