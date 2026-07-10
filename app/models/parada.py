# app/models/parada.py

from ..extensions import db
from datetime import datetime


class Parada(db.Model):
    __tablename__ = "paradas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    coordenadas = db.Column(db.String(100), nullable=False)  # "latitud,longitud"
    status = db.Column(db.String(20), default="activa")  # 'activa', 'inactiva'
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "coordenadas": self.coordenadas,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }