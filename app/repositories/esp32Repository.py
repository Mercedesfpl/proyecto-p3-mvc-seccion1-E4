# app/repositories/esp32Repository.py

from ..models.esp32 import Esp32
from ..extensions import db


class Esp32Repository:

    @staticmethod
    def get_all():
        return Esp32.query.order_by(Esp32.id_esp32).all()

    @staticmethod
    def get_by_id(id_esp32):
        return Esp32.query.get(id_esp32)

    @staticmethod
    def get_by_mac(mac):
        return Esp32.query.filter_by(mac=mac).first()

    @staticmethod
    def get_disponibles():
        """ESP32 activos sin asignar a bus ni parada"""
        return (
            Esp32.query.filter(
                Esp32.status == "activo",
                Esp32.id_vehiculo.is_(None),
                Esp32.id_parada.is_(None),
            )
            .order_by(Esp32.id_esp32)
            .all()
        )

    @staticmethod
    def get_disponibles_para_bus(id_bus_actual=None):
        """
        ESP32 disponibles para asignar a un bus.
        Incluye el ESP32 actual del bus (si tiene) para que aparezca en el select.
        """
        from sqlalchemy import or_

        query = Esp32.query.filter(
            Esp32.status == "activo",
            or_(
                # ESP32 libres (sin vehiculo ni parada)
                (Esp32.id_vehiculo.is_(None) & Esp32.id_parada.is_(None)),
                # ESP32 actualmente asignado a este bus
                (Esp32.id_vehiculo == id_bus_actual) if id_bus_actual else False,
            ),
        )

        return query.order_by(Esp32.id_esp32).all()

    @staticmethod
    def get_by_vehiculo(id_vehiculo):
        """ESP32 asignado a un bus"""
        return Esp32.query.filter_by(id_vehiculo=id_vehiculo).first()

    @staticmethod
    def get_by_parada(id_parada):
        """ESP32 asignado a una parada"""
        return Esp32.query.filter_by(id_parada=id_parada).first()

    @staticmethod
    def existe_por_mac(mac, exclude_id=None):
        query = Esp32.query.filter_by(mac=mac)
        if exclude_id:
            query = query.filter(Esp32.id_esp32 != exclude_id)
        return query.first() is not None

    @staticmethod
    def save(esp32):
        db.session.add(esp32)
        db.session.commit()
        return esp32

    @staticmethod
    def update(esp32):
        db.session.commit()
        return esp32

    @staticmethod
    def delete(esp32):
        db.session.delete(esp32)
        db.session.commit()
        return esp32