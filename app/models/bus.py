# app/models/bus.py

from ..extensions import db
from datetime import datetime


class Bus(db.Model):
    __tablename__ = "buses"
    id_vehiculo = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(15), unique=True, nullable=False)
    status = db.Column(db.String(20), default="activa")
    created_at = db.Column(db.DateTime, default=datetime.now)

    id_ruta = db.Column(db.Integer, db.ForeignKey("rutas.id"), nullable=True)
    id_linea = db.Column(db.Integer, db.ForeignKey("lineas.id"), nullable=False)
    id_secretario = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)

    ruta = db.relationship("Ruta", foreign_keys=[id_ruta])
    linea = db.relationship("Linea", foreign_keys=[id_linea])
    secretario = db.relationship("Usuario", foreign_keys=[id_secretario])

    def to_dict(self):
        # Buscar el ESP32 asignado a este bus
        from ..models.esp32 import Esp32
        esp32 = Esp32.query.filter_by(id_vehiculo=self.id_vehiculo).first()

        return {
            "id_vehiculo": self.id_vehiculo,
            "placa": self.placa,
            "status": self.status,
            "id_ruta": self.id_ruta,
            "ruta_nombre": self.ruta.nombre if self.ruta else None,
            "id_linea": self.id_linea,
            "linea_nombre": self.linea.nombre if self.linea else None,
            "id_secretario": self.id_secretario,
            "secretario_nombre": self.secretario.nombre if self.secretario else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            # ESP32 asignado (info completa)
            "id_esp32": esp32.id_esp32 if esp32 else None,
            "esp32_mac": esp32.mac if esp32 else None,
            "esp32_version": esp32.version_firmware if esp32 else None,
            "esp32_status": esp32.status if esp32 else None,
        }