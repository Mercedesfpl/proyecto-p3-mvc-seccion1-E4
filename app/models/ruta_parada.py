# app/models/ruta_parada.py

from ..extensions import db


class RutaParada(db.Model):
    __tablename__ = "ruta_parada"
    id_ruta = db.Column(db.Integer, db.ForeignKey("rutas.id"), primary_key=True)
    id_parada = db.Column(db.Integer, db.ForeignKey("paradas.id"), primary_key=True)
    orden_parada = db.Column(db.Integer, nullable=False)

    ruta = db.relationship("Ruta", backref="ruta_paradas")
    parada = db.relationship("Parada")

    def to_dict(self):
        return {
            "id": self.parada.id if self.parada else self.id_parada,
            "nombre": self.parada.nombre if self.parada else None,
            "coordenadas": self.parada.coordenadas if self.parada else None,
            "orden": self.orden_parada,
        }