# app/factory/bus_factory.py

from ..models.bus import Bus
from ..models.exceptions import ResourceNotValid
import re


class BusFactory:

    @staticmethod
    def _validar_placa(placa):
        if not placa or not placa.strip():
            raise ResourceNotValid("placa", "La placa es requerida")

        placa_limpia = placa.strip().upper()

        if not re.match(r'^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{2}[A-Z]{2}$', placa_limpia):
            raise ResourceNotValid("placa", "Formato de placa invalido (ej: ABC123 o AB12CD)")

        return placa_limpia

    @staticmethod
    def _validar_id(id_field, nombre_campo):
        if id_field is None:
            return None
        try:
            id_int = int(id_field)
            if id_int <= 0:
                raise ValueError
            return id_int
        except (TypeError, ValueError):
            raise ResourceNotValid(nombre_campo, f"{nombre_campo} debe ser un numero valido")

    @staticmethod
    def crear_bus(data):
        placa = BusFactory._validar_placa(data.get("placa"))

        id_linea = BusFactory._validar_id(data.get("id_linea"), "id_linea")
        if id_linea is None:
            raise ResourceNotValid("id_linea", "La linea es obligatoria")

        id_ruta = BusFactory._validar_id(data.get("id_ruta"), "id_ruta")

        status = data.get("status", "activa")
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("status", f"Status invalido: {status}")

        return Bus(
            placa=placa,
            id_linea=id_linea,
            id_ruta=id_ruta,
            status=status
        )