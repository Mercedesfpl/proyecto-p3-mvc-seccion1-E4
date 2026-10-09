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
    id_ruta = db.Column(db.Integer, db.ForeignKey('rutas.id'), nullable=True)

    ruta = db.relationship('Ruta', backref='paradas')  # relacion con ruta

    def to_dict(self):
        # Buscar el ESP32 asignado a esta parada
        from ..models.esp32 import Esp32
        esp32 = Esp32.query.filter_by(id_parada=self.id).first()

        return {
            "id": self.id,
            "nombre": self.nombre,
            "coordenadas": self.coordenadas,
            "status": self.status,
            "id_ruta": self.id_ruta,
            "ruta_nombre": self.ruta.nombre if self.ruta else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            # ESP32 asignado (NUEVO)
            "id_esp32": esp32.id_esp32 if esp32 else None,
            "esp32_mac": esp32.mac if esp32 else None,
            "esp32_version": esp32.version_firmware if esp32 else None,
            "esp32_status": esp32.status if esp32 else None,
        }