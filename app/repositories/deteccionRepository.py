# app/repositories/deteccionRepository.py

from ..models.deteccion import Deteccion
from ..extensions import db


class DeteccionRepository:

    @staticmethod
    def get_all():
        return Deteccion.query.order_by(Deteccion.fecha_hora.desc()).all()

    @staticmethod
    def get_by_id(id_deteccion):
        return Deteccion.query.get(id_deteccion)

    @staticmethod
    def get_by_vehiculo(id_vehiculo):
        return Deteccion.query.filter_by(id_vehiculo=id_vehiculo).order_by(Deteccion.fecha_hora.desc()).all()

    @staticmethod
    def get_by_parada(id_parada):
        return Deteccion.query.filter_by(id_parada=id_parada).order_by(Deteccion.fecha_hora.desc()).all()

    @staticmethod
    def get_last_by_vehiculo(id_vehiculo):
        return Deteccion.query.filter_by(id_vehiculo=id_vehiculo).order_by(Deteccion.fecha_hora.desc()).first()

    @staticmethod
    def get_alertas(tolerancia=5):
        return Deteccion.query.filter(
            Deteccion.estado == 'retraso',
            Deteccion.retraso > tolerancia
        ).order_by(Deteccion.retraso.desc()).all()

    @staticmethod
    def save(deteccion):
        db.session.add(deteccion)
        db.session.commit()
        return deteccion

    @staticmethod
    def delete(deteccion):
        db.session.delete(deteccion)
        db.session.commit()
        return deteccion