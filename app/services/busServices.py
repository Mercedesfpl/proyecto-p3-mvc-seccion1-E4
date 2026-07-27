# app/services/busServices.py

from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..repositories.busRepository import BusRepository
from ..repositories.lineaRepository import LineaRepository
from ..repositories.rutaRepository import RutaRepository
from ..factory.bus_factory import BusFactory

class BusServices:

    @staticmethod
    def get_all_buses():
        buses = BusRepository.get_all()
        return [bus.to_dict() for bus in buses]

    @staticmethod
    def get_bus_by_id(id_vehiculo):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")
        return bus.to_dict()

    @staticmethod
    def create_bus(data):
        placa = data.get("placa", "").strip().upper()
        if BusRepository.existePorPlaca(placa):
            raise ResourceNotValid("Bus", "Ya existe un bus con esa placa")

        linea = LineaRepository.get_by_id(data.get("id_linea"))
        if not linea:
            raise ResourceNotFound("Linea")

        if data.get("id_ruta"):
            ruta = RutaRepository.get_by_id(data["id_ruta"])
            if not ruta:
                raise ResourceNotFound("Ruta")

        bus = BusFactory.crear_bus(data)
        return BusRepository.save(bus)

    @staticmethod
    def update_bus(id_vehiculo, data):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")

        if "placa" in data:
            placa = data["placa"].strip().upper()
            if BusRepository.existePorPlaca(placa, exclude_id=id_vehiculo):
                raise ResourceNotValid("Bus", "Ya existe otro bus con esa placa")
            bus.placa = placa

        if "status" in data:
            if data["status"] not in ["activa", "inactiva"]:
                raise ResourceNotValid("Bus", f"Status invalido: {data['status']}")
            bus.status = data["status"]

        if "id_linea" in data:
            linea = LineaRepository.get_by_id(data["id_linea"])
            if not linea:
                raise ResourceNotFound("Linea")
            bus.id_linea = data["id_linea"]

        if "id_ruta" in data:
            if data["id_ruta"]:
                ruta = RutaRepository.get_by_id(data["id_ruta"])
                if not ruta:
                    raise ResourceNotFound("Ruta")
            bus.id_ruta = data["id_ruta"]

        return BusRepository.update(bus)

    @staticmethod
    def delete_bus(id_vehiculo):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")
        return BusRepository.delete(bus)

    @staticmethod
    def get_rutas_disponibles():
        rutas = RutaRepository.get_all()
        return [{"id": r.id, "nombre": r.nombre} for r in rutas]

    @staticmethod
    def get_lineas_disponibles():
        lineas = LineaRepository.get_all_activas()
        return [{"id": l.id, "nombre": l.nombre} for l in lineas]