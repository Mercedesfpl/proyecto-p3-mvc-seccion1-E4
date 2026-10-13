# app/services/busServices.py

from app.repositories.busRepository import BusRepository
from app.repositories.lineaRepository import LineaRepository
from app.repositories.userRepository import UserRepository
from app.repositories.rutaRepository import RutaRepository
from app.repositories.esp32Repository import Esp32Repository
from app.factory.bus_factory import BusFactory
from app.models.exceptions import ResourceNotFound, ResourceNotValid


class BusServices:

    @staticmethod
    def get_all_buses():
        buses = BusRepository.get_all()
        return [b.to_dict() for b in buses]

    @staticmethod
    def get_bus_by_id(id_vehiculo):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")
        return bus.to_dict()

    @staticmethod
    def create_bus(data):
        print("datos de buses>>>>>>>>>>>>", data)

        # Validar placa unica
        if data.get("placa") and BusRepository.existentePorPlaca(data["placa"]):
            raise ResourceNotValid("placa", "Ya existe un bus con esa placa")

        # Validar que la linea exista
        linea = None
        if data.get("id_linea"):
            linea = LineaRepository.get_by_id(data["id_linea"])
            if not linea:
                raise ResourceNotFound("Linea no encontrada")

        # DEDUCIR EL SECRETARIO DE LA LINEA
        # Si la linea tiene secretario, se asigna automaticamente
        if linea and linea.secretario_id:
            data["id_secretario"] = linea.secretario_id
        else:
            data["id_secretario"] = None

        # Validar que la ruta exista (si se asigno)
        if data.get("id_ruta"):
            ruta = RutaRepository.get_by_id(data["id_ruta"])
            if not ruta:
                raise ResourceNotFound("Ruta no encontrada")

        # Validar ESP32 si viene
        id_esp32 = data.get("id_esp32")
        if id_esp32:
            esp32 = Esp32Repository.get_by_id(id_esp32)
            if not esp32:
                raise ResourceNotFound("ESP32")
            if esp32.status != "activo":
                raise ResourceNotValid("ESP32", "El ESP32 no esta activo")
            if esp32.id_vehiculo or esp32.id_parada:
                raise ResourceNotValid("ESP32", "El ESP32 ya esta asignado")

        # Crear instancia con Factory
        bus = BusFactory.crear_bus(data)
        bus = BusRepository.save(bus)

        # Asignar ESP32 si viene
        if id_esp32:
            esp32 = Esp32Repository.get_by_id(id_esp32)
            esp32.id_vehiculo = bus.id_vehiculo
            esp32.tipo_dispositivo = "bus"
            Esp32Repository.update(esp32)

        return bus

    @staticmethod
    def update_bus(id_vehiculo, data):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")

        # Actualizar placa
        if "placa" in data:
            placa = data["placa"].strip().upper()
            if BusRepository.existentePorPlaca(placa, exclude_id=id_vehiculo):
                raise ResourceNotValid("placa", "Ya existe otro bus con esa placa")
            bus.placa = placa

        # Actualizar linea (y deducir secretario)
        if "id_linea" in data:
            linea = LineaRepository.get_by_id(data["id_linea"])
            if not linea:
                raise ResourceNotFound("Linea no encontrada")
            bus.id_linea = data["id_linea"]
            # DEDUCIR EL SECRETARIO DE LA NUEVA LINEA
            if linea.secretario_id:
                bus.id_secretario = linea.secretario_id
            else:
                bus.id_secretario = None

        # Actualizar ruta
        if "id_ruta" in data:
            if data["id_ruta"]:
                ruta = RutaRepository.get_by_id(data["id_ruta"])
                if not ruta:
                    raise ResourceNotFound("Ruta no encontrada")
                bus.id_ruta = data["id_ruta"]
            else:
                bus.id_ruta = None

        # Actualizar status
        if "status" in data:
            status = data["status"]
            if status not in ["activa", "inactiva"]:
                raise ResourceNotValid("status", "Status invalido")
            bus.status = status

        # ACTUALIZAR ESP32
        if "id_esp32" in data:
            id_esp32_nuevo = data["id_esp32"]
            esp32_actual = Esp32Repository.get_by_vehiculo(id_vehiculo)

            # Caso 1: Asignar ESP32 diferente
            if id_esp32_nuevo and (
                not esp32_actual or esp32_actual.id_esp32 != id_esp32_nuevo
            ):
                if esp32_actual:
                    esp32_actual.id_vehiculo = None
                    esp32_actual.tipo_dispositivo = None
                    Esp32Repository.update(esp32_actual)

                esp32_nuevo = Esp32Repository.get_by_id(id_esp32_nuevo)
                if not esp32_nuevo:
                    raise ResourceNotFound("ESP32")
                if esp32_nuevo.status != "activo":
                    raise ResourceNotValid("ESP32", "El ESP32 no esta activo")
                if esp32_nuevo.id_vehiculo or esp32_nuevo.id_parada:
                    raise ResourceNotValid("ESP32", "El ESP32 ya esta asignado")
                esp32_nuevo.id_vehiculo = id_vehiculo
                esp32_nuevo.tipo_dispositivo = "bus"
                Esp32Repository.update(esp32_nuevo)

            # Caso 2: Quitar ESP32
            elif not id_esp32_nuevo and esp32_actual:
                esp32_actual.id_vehiculo = None
                esp32_actual.tipo_dispositivo = None
                Esp32Repository.update(esp32_actual)

        return BusRepository.save(bus)

    @staticmethod
    def delete_bus(id_vehiculo):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")

        # Liberar el ESP32 antes de eliminar
        esp32 = Esp32Repository.get_by_vehiculo(id_vehiculo)
        if esp32:
            esp32.id_vehiculo = None
            esp32.tipo_dispositivo = None
            Esp32Repository.update(esp32)

        return BusRepository.delete(bus)