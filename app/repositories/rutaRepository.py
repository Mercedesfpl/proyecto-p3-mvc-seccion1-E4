# app/repositories/rutaRepository.py

from ..models.ruta import Ruta
from ..models.ruta_parada import RutaParada
from ..extensions import db


class RutaRepository:
    """Maneja todas las consultas de la BD para Rutas"""

    @staticmethod
    def get_all():
        return Ruta.query.all()
    
    @staticmethod
    def get_by_id(id_ruta):
        return Ruta.query.get(id_ruta)
    
    @staticmethod
    def get_by_linea(id_linea):
        return Ruta.query.filter_by(id_linea=id_linea).all()
    
    @staticmethod
    def get_by_nombre(nombre):
        return Ruta.query.filter_by(nombre=nombre).first()
    
    @staticmethod
    def get_paradas_by_ruta(id_ruta):
        return RutaParada.query.filter_by(id_ruta=id_ruta).order_by(RutaParada.orden_parada).all()
    
    @staticmethod
    def save(ruta):
        db.session.add(ruta)
        db.session.commit()
        return ruta
    
    @staticmethod
    def save_relacion(ruta_parada):
        db.session.add(ruta_parada)
        db.session.commit()
        return ruta_parada
    
    @staticmethod
    def delete_relaciones_by_ruta(id_ruta):
        RutaParada.query.filter_by(id_ruta=id_ruta).delete()
        db.session.commit()
    
    @staticmethod
    def delete(ruta):
        # Eliminar relaciones primero
        RutaParada.query.filter_by(id_ruta=ruta.id).delete()
        db.session.delete(ruta)
        db.session.commit()
        return ruta