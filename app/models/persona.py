# app/models/persona.py
from app.extensions import db
from datetime import datetime

class Persona(db.Model):
    __tablename__ = "personas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    correo = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    fecha_nac = db.Column(db.Date, nullable=True)
    rol = db.Column(db.String(20), nullable=True)  # 'admin', 'presidente' o 'secretario'
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    usuario = db.relationship("Usuario", back_populates="persona", uselist=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "nombre_completo": f"{self.nombre} {self.apellido}",
            "cedula": self.cedula,
            "correo": self.correo,
            "telefono": self.telefono,
            "rol": self.rol,  # <-- Ya incluye 'admin'
            "fecha_nac": self.fecha_nac.isoformat() if self.fecha_nac else None
        }