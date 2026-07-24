from app.models.ruta import Ruta
from ..extensions import db

class RutaRepository:
    
    @staticmethod
    def get_all():
        return Ruta.query.all()
    
    @staticmethod
    def get_by_id(id_ruta):
        return Ruta.query.get(id_ruta)
    
    @staticmethod
    def get_by_nombre(nombre):
        return Ruta.query.filter_by(nombre=nombre).first()
    
    @staticmethod
    def existentePorNombre(nombre, id_linea, exclude_id=None):
        query = Ruta.query.filter_by(nombre=nombre, id_linea=id_linea)
        if exclude_id:
            query = query.filter(Ruta.id_ruta != exclude_id)
        return query.first() is not None
    
    @staticmethod
    def save(ruta):
        db.session.add(ruta)
        db.session.commit()
        return ruta
    
    @staticmethod
    def delete(ruta):
        db.session.delete(ruta)
        db.session.commit()
        return ruta