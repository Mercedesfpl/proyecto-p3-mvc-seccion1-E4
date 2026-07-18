# app/models/ruta.py

from ..extensions import db
from datetime import datetime


class Ruta(db.Model):
    __tablename__ = "rutas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default="activa")
    id_linea = db.Column(db.Integer, db.ForeignKey("lineas.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relación con Línea
    linea = db.relationship("Linea", foreign_keys=[id_linea])

    # Relación con Paradas (a través de ruta_parada)
    paradas = db.relationship(
        "Parada",
        secondary="ruta_parada",
        order_by="RutaParada.orden_parada",
        backref="rutas"
    )

    def to_dict(self, include_paradas=True):
        result = {
            "id": self.id,
            "nombre": self.nombre,
            "status": self.status,
            "id_linea": self.id_linea,
            "linea_nombre": self.linea.nombre if self.linea else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
        if include_paradas and hasattr(self, 'ruta_paradas'):
            result["paradas"] = [
                {
                    "id": rp.parada.id,
                    "nombre": rp.parada.nombre,
                    "orden": rp.orden_parada
                }
                for rp in self.ruta_paradas
            ]
        
        return result