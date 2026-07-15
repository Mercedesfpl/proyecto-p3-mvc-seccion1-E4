from app.models.persona import Persona
from app.models.models import Usuario
from ..extensions import db

class PersonaRepository:
    #Maneja todas las consultas de la bd para Personas

    @staticmethod
    def get_all():
        return Persona.query.all()
    
    @staticmethod
    def get_by_id(id_persona):
        return Persona.query.get(id_persona)
    
    @staticmethod
    def get_by_cedula(cedula):
        return Persona.query.filter_by(cedula=cedula).first()

    @staticmethod
    def get_by_correo(correo):
        return Persona.query.filter_by(correo=correo).first()
    
    @staticmethod
    def get_presidente():
        return Persona.query.filter_by(rol="presidente").all()
    
    @staticmethod
    def existePorCedula(cedula, exclude_id=None):
        query = Persona.query.filter_by(cedula=cedula)
        if exclude_id:
            query = query.filter(Persona.id != exclude_id)
        return query.first() is not None

    @staticmethod
    def existePorCorreo(correo, exclude_id=None):
        if not correo:
            return False
        query = Persona.query.filter_by(correo=correo)
        if exclude_id:
            query = query.filter(Persona.id != exclude_id)
        return query.first() is not None
    
    @staticmethod
    def is_presidente_en_linea(id_persona):
        #Verifica si una persona es presidente de una linea
        from app.models.linea import Linea
        return Linea.query.filter_by(presidente_id=id_persona).first() is not None
    
    @staticmethod
    def get_usuario_by_persona(id_persona):
        #Obtiene un usuario a través de una persona
        return Usuario.query.filter_by(persona_id=id_persona).first() is not None
    
    @staticmethod
    def get_secretarios():
        #Obtiene todos los secretarios
        return Usuario.query.filter_by(rol="secretario").all() is not None
    
    @staticmethod
    def save(persona):
        db.session.add(persona)
        db.session.commit()
        return persona
    
    @staticmethod
    def delete(persona):
        db.session.delete(persona)
        db.session.commit()
        return persona