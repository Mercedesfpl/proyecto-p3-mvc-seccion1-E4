# app/models/ruta_parada.py

from ..extensions import db


class RutaParada(db.Model):
    __tablename__ = "ruta_parada"
    id_ruta = db.Column(db.Integer, db.ForeignKey("rutas.id"), primary_key=True)
    id_parada = db.Column(db.Integer, db.ForeignKey("paradas.id"), primary_key=True)
    orden_parada = db.Column(db.Integer, nullable=False)
    
    ruta = db.relationship("Ruta", backref="ruta_paradas")
    parada = db.relationship("Parada")