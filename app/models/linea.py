# app/models/linea.py
from app.extensions import db
from datetime import datetime

class Linea(db.Model):
    __tablename__ = "lineas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    rif = db.Column(db.String(50), nullable=False)
    suspendido = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relación con Usuario (Secretario de Organización)
    secretario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    secretario = db.relationship("Usuario", foreign_keys=[secretario_id])
    
    #Relación con Persona (Presidente)
    presidente_id = db.Column(db.Integer, db.ForeignKey("personas.id"), nullable=False)
    presidente = db.relationship("Persona", foreign_keys=[presidente_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "rif": self.rif,
            "suspendido": self.suspendido,
            "secretario_id": self.secretario_id,
            "secretario_nombre": self.secretario.nombre if self.secretario else None,
            "presidente_id": self.presidente_id,
            "presidente": self.presidente.to_dict() if self.presidente else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }