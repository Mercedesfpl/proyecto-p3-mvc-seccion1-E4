# app/models/bus.py
from ..extensions import db
from datetime import datetime


class Bus(db.Model):
    __tablename__ = "buses"
    id_vehiculo = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(15), unique=True, nullable=False)
    status = db.Column(db.String(20), default="activa")
    ubicacion = db.Column(db.String(150), nullable=True)   # NUEVO (opcional)
    created_at = db.Column(db.DateTime, default=datetime.now)

    id_ruta = db.Column(db.Integer, db.ForeignKey("rutas.id"), nullable=True)
    id_linea = db.Column(db.Integer, db.ForeignKey("lineas.id"), nullable=False)

    ruta = db.relationship("Ruta", foreign_keys=[id_ruta])
    linea = db.relationship("Linea", foreign_keys=[id_linea])

    def to_dict(self):
        return {
            "id_vehiculo": self.id_vehiculo,
            "placa": self.placa,
            "status": self.status,
            "ubicacion": self.ubicacion,

            "id_ruta": self.id_ruta,
            "ruta": (
                {"id_ruta": self.ruta.id, "nombre": self.ruta.nombre}
                if self.ruta else None
            ),
            "ruta_nombre": self.ruta.nombre if self.ruta else None,

            "id_linea": self.id_linea,
            "linea": (
                {
                    "id": self.linea.id,
                    "nombre": self.linea.nombre,
                    "color": self.linea.color,
                    "secretario_id": self.linea.secretario_id,
                    "secretario_nombre": (
                        self.linea.secretario.nombre
                        if self.linea.secretario else None
                    ),
                }
                if self.linea else None
            ),
            "linea_nombre": self.linea.nombre if self.linea else None,

            "created_at": self.created_at.isoformat() if self.created_at else None,
        }