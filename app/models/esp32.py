# app/models/esp32.py

from ..extensions import db
from datetime import datetime

class Esp32(db.Model):
    __tablename__ = "esp32"
    
    id_esp32 = db.Column(db.Integer, primary_key=True)
    mac = db.Column(db.String(17), unique=True, nullable=False)
    status = db.Column(db.String(20), default="activo")
    pass_hash = db.Column(db.String(255), nullable=False)
    version_firmware = db.Column(db.String(20), nullable=True)
    tipo_dispositivo = db.Column(db.String(20), nullable=False)  # 'bus' o 'parada'
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relaciones (solo las FK, sin relationships complejas)
    id_vehiculo = db.Column(db.Integer, db.ForeignKey("buses.id_vehiculo"), nullable=True)
    id_parada = db.Column(db.Integer, db.ForeignKey("paradas.id"), nullable=True)
    
    def to_dict(self):
        return {
            "id_esp32": self.id_esp32,
            "mac": self.mac,
            "status": self.status,
            "version_firmware": self.version_firmware,
            "tipo_dispositivo": self.tipo_dispositivo,
            "id_vehiculo": self.id_vehiculo,
            "id_parada": self.id_parada,
        }