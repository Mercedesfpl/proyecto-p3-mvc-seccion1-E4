from app.models.linea import Linea
from ..extensions import db
from app.models.persona import Persona
from app.models.models import Usuario

class LineaRepository:
    #Maneja todas las consultas a la base de datos para Líneas

    @staticmethod
    def get_all():
        return Linea.query.filter_by(suspendido=False).all()
    
    @staticmethod
    def get_by_id(id_linea):
        return Linea.query.get(id_linea)
    
    @staticmethod
    def existentePorNombre(nombre, exclude_id=None):
        query = Linea.query.filter_by(nombre=nombre)
        if exclude_id:
            query = query.filter(Linea.id != exclude_id)
        return query.first() is not None

    @staticmethod
    def existentePorRif(rif, exclude_id=None):
        query = Linea.query.filter_by(rif=rif)
        if exclude_id:
            query = query.filter(Linea.id != exclude_id)
        return query.firts() is not None
    
    @staticmethod
    def get_persona_by_id(id_persona):
        return Persona.query.get(id_persona)
    
    @staticmethod
    def get_usuario_by_id(id_usuario):
        return Usuario.query.get(id_usuario)
    
    @staticmethod
    def save(linea):
        db.session.add(linea)
        db.session.commit()
        return linea
    
    @staticmethod
    def update(linea):
        db.session.commit()
        return linea
    
    @staticmethod
    def delete(linea):
        linea.suspendido = True
        db.session.commit()
        return linea