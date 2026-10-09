# app/services/esp32Services.py

from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..repositories.esp32Repository import Esp32Repository
from ..repositories.busRepository import BusRepository
from ..repositories.paradaRepository import ParadaRepository


class Esp32Services:

    @staticmethod
    def create_esp32(data):
        mac = data.get("mac", "").strip().upper()
        if not mac:
            raise ResourceNotValid("ESP32", "La MAC es obligatoria")

        if Esp32Repository.existe_por_mac(mac):
            raise ResourceNotValid("ESP32", "Ya existe un ESP32 con esa MAC")

        password = data.get("password", "")
        if not password or len(password) < 6:
            raise ResourceNotValid("ESP32", "La contrasena debe tener al menos 6 caracteres")

        tipo = data.get("tipo_dispositivo")
        if tipo and tipo not in ["bus", "parada"]:
            raise ResourceNotValid("ESP32", "Tipo debe ser 'bus' o 'parada'")

        from ..models.esp32 import Esp32
        esp32 = Esp32(
            mac=mac,
            status=data.get("status", "activo"),
            pass_hash=hashlib.sha256(password.encode()).hexdigest(),
            version_firmware=data.get("version_firmware"),
            tipo_dispositivo=tipo,
        )
        return Esp32Repository.save(esp32)

    @staticmethod
    def update_esp32(id_esp32, data):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        if "mac" in data:
            mac = data["mac"].strip().upper()
            if Esp32Repository.existe_por_mac(mac, exclude_id=id_esp32):
                raise ResourceNotValid("ESP32", "Ya existe otro ESP32 con esa MAC")
            esp32.mac = mac

        if "password" in data and data["password"]:
            if len(data["password"]) < 6:
                raise ResourceNotValid("ESP32", "La contrasena debe tener al menos 6 caracteres")
            esp32.pass_hash = hashlib.sha256(data["password"].encode()).hexdigest()

        if "version_firmware" in data:
            esp32.version_firmware = data["version_firmware"]

        if "status" in data:
            esp32.status = data["status"]

        if "tipo_dispositivo" in data:
            tipo = data["tipo_dispositivo"]
            if tipo and tipo not in ["bus", "parada"]:
                raise ResourceNotValid("ESP32", "Tipo debe ser 'bus' o 'parada'")
            esp32.tipo_dispositivo = tipo

        return Esp32Repository.update(esp32)

    @staticmethod
    def delete_esp32(id_esp32):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")
        return Esp32Repository.delete(esp32)

    @staticmethod
    def get_all_esp32():
        esp32s = Esp32Repository.get_all()
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def get_esp32_by_id(id_esp32):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")
        return esp32.to_dict()

    @staticmethod
    def get_disponibles():
        """ESP32 disponibles para asignar (activos, libres)"""
        esp32s = Esp32Repository.get_disponibles()
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def get_disponibles_para_bus(id_bus_actual=None):
        """
        ESP32 disponibles para un bus.
        Si se edita un bus, incluye el ESP32 actual de ese bus.
        """
        esp32s = Esp32Repository.get_disponibles_para_bus(id_bus_actual)
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def asignar_a_bus(id_esp32, id_vehiculo):
        """
        Asigna un ESP32 a un bus.
        Si el ESP32 esta asignado a otro bus, lo desasigna primero.
        Si el bus ya tiene un ESP32, lo desasigna primero.
        """
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        if esp32.status != "activo":
            raise ResourceNotValid(
                "ESP32", f"El ESP32 no esta activo (status: {esp32.status})"
            )

        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")

        # Si el bus ya tiene un ESP32, desasignarlo
        esp32_anterior = Esp32Repository.get_by_vehiculo(id_vehiculo)
        if esp32_anterior and esp32_anterior.id_esp32 != id_esp32:
            esp32_anterior.id_vehiculo = None
            esp32_anterior.tipo_dispositivo = None
            Esp32Repository.update(esp32_anterior)

        # Asignar el nuevo ESP32 al bus
        esp32.id_vehiculo = id_vehiculo
        esp32.id_parada = None
        esp32.tipo_dispositivo = "bus"
        return Esp32Repository.update(esp32)

    @staticmethod
    def desasignar_de_bus(id_esp32):
        """Libera un ESP32 de un bus (sin retirarlo)"""
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        esp32.id_vehiculo = None
        esp32.id_parada = None
        esp32.tipo_dispositivo = None
        return Esp32Repository.update(esp32)

    @staticmethod
    def retirar_esp32(id_esp32, motivo="danado"):
        """
        Marca un ESP32 como retirado (danado).
        Lo desasigna del bus/parada pero NO lo elimina de la BD.
        """
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        esp32.status = "retirado"
        esp32.id_vehiculo = None
        esp32.id_parada = None
        return Esp32Repository.update(esp32)