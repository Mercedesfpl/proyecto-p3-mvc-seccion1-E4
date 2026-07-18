from app.models.parada import Parada
from ..extensions import db

class ParadaRepository:
    #Maneja todas las consultas de la base de datos para las paradas

    @staticmethod
    def get_all():
        return Parada.query.all()
    
    @staticmethod
    def get_by_id(id_parada):
        return Parada.query.get(id_parada)
    
    @staticmethod 
    def get_by_nombre(nombre):
        return Parada.query.filter_by(nombre=nombre).first()
    
    @staticmethod
    def existentePorNombre(nombre, exclude_id=None):
        query = Parada.query.filter_by(nombre=nombre)
        if exclude_id: 
            query = query.filter(Parada.id != exclude_id)
        return query.first() is not None 
    
    @staticmethod
    def esUsada(id_parada):
        #Verifica si está siendo usada por alguna ruta
        from app.models.ruta_parada import RutaParada #se tiene que crear
        return RutaParada.query.filter_by(id_parada=id_parada).first() is not None
    
    @staticmethod
    def save(parada):
        db.session.add(parada)
        db.session.commit()
        return parada
    
    @staticmethod
    def delete(parada):
        db.session.delete(parada)
        db.session.commit()
        return parada
    
    @staticmethod
    def get_by_id(id_parada):
        return Parada.query.get(id_parada)
    
    @staticmethod
    def get_all_activas():
        return Parada.query.filter_by(status="activa").all()