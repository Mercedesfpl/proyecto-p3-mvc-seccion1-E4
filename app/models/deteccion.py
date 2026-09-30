# app/models/deteccion.py

from ..extensions import db
from datetime import datetime

class Deteccion(db.Model):
    __tablename__ = "detecciones"
    id_deteccion = db.Column(db.Integer, primary_key=True)
    fecha_hora = db.Column(db.DateTime, default=datetime.now)
    id_vehiculo = db.Column(db.Integer, db.ForeignKey("buses.id_vehiculo"), nullable=False)
    id_parada = db.Column(db.Integer, db.ForeignKey("paradas.id"), nullable=False)
    
    # Nuevos campos para tiempos
    tiempo_real = db.Column(db.Float, nullable=True)
    tiempo_estimado = db.Column(db.Float, nullable=True)
    retraso = db.Column(db.Float, nullable=True)
    estado = db.Column(db.String(20), default='normal')
    
    vehiculo = db.relationship("Bus", foreign_keys=[id_vehiculo])
    parada = db.relationship("Parada", foreign_keys=[id_parada])
    
    def to_dict(self):
        return {
            "id_deteccion": self.id_deteccion,
            "fecha_hora": self.fecha_hora.isoformat() if self.fecha_hora else None,
            "id_vehiculo": self.id_vehiculo,
            "placa": self.vehiculo.placa if self.vehiculo else None,
            "id_parada": self.id_parada,
            "parada_nombre": self.parada.nombre if self.parada else None,
            "tiempo_real": self.tiempo_real,
            "tiempo_estimado": self.tiempo_estimado,
            "retraso": self.retraso,
            "estado": self.estado
        }