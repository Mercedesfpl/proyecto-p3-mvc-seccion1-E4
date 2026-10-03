# app/models/bus.py
from ..extensions import db
from datetime import datetime


class Bus(db.Model):
    __tablename__ = "buses"
    id_vehiculo = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(15), unique=True, nullable=False)
    status = db.Column(db.String(20), default="activa")
    ubicacion = db.Column(db.String(150), nullable=True)   # NUEVO (opcional ???)
    created_at = db.Column(db.DateTime, default=datetime.now)

    id_ruta = db.Column(db.Integer, db.ForeignKey("rutas.id"), nullable=True)
    id_linea = db.Column(db.Integer, db.ForeignKey("lineas.id"), nullable=False)
    id_secretario = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)

    ruta = db.relationship("Ruta", foreign_keys=[id_ruta])
    linea = db.relationship("Linea", foreign_keys=[id_linea])
    secretario = db.relationship("Usuario", foreign_keys=[id_secretario])

    def to_dict(self):
        return {
            "id_vehiculo": self.id_vehiculo,
            "placa": self.placa,
            "id_linea": self.id_linea,
            "linea_nombre": self.linea.nombre if self.linea else None,
            "id_ruta": self.id_ruta,
            "ruta_nombre": self.ruta.nombre if self.ruta else None,
            "id_secretario": self.id_secretario,
            "secretario_nombre": self.secretario.nombre if self.secretario else None, 
            "status": self.status
        }