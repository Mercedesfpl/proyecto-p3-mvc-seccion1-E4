# app/services/esp32Services.py

from ..models.exceptions import ResourceNotFound
from ..repositories.esp32Repository import Esp32Repository
from ..models.esp32 import Esp32
import hashlib


class Esp32Services:

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
    def create_esp32(data):
        # Hashear contrasena
        if 'password' in data:
            data['pass_hash'] = hashlib.sha256(data['password'].encode()).hexdigest()
            del data['password']

        esp32 = Esp32(**data)
        return Esp32Repository.save(esp32)

    @staticmethod
    def update_esp32(id_esp32, data):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        # Actualizar campos
        for key, value in data.items():
            if key == 'password':
                setattr(esp32, 'pass_hash', hashlib.sha256(value.encode()).hexdigest())
            elif hasattr(esp32, key):
                setattr(esp32, key, value)

        Esp32Repository.update(esp32)
        return esp32.to_dict()

    @staticmethod
    def delete_esp32(id_esp32):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")
        Esp32Repository.delete(esp32)

    # ========================================================
    # METODOS PARA ASIGNACION
    # ========================================================

    @staticmethod
    def get_disponibles():
        """ESP32 disponibles para asignar (activos, libres)"""
        esp32s = Esp32Repository.get_disponibles()
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def get_disponibles_para_bus(id_bus_actual=None):
        """ESP32 disponibles para un bus"""
        esp32s = Esp32Repository.get_disponibles_para_bus(id_bus_actual)
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def get_disponibles_para_parada(id_parada_actual=None):
        """ESP32 disponibles para una parada"""
        esp32s = Esp32Repository.get_disponibles_para_parada(id_parada_actual)
        return [e.to_dict() for e in esp32s]

    @staticmethod
    def asignar_a_bus(id_esp32, id_vehiculo):
        """Asigna un ESP32 a un bus"""
        from ..repositories.busRepository import BusRepository

        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        if esp32.status != "activo":
            raise ResourceNotFound(f"ESP32 no activo (status: {esp32.status})")

        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")

        # Si el bus ya tiene un ESP32, desasignarlo
        esp32_anterior = Esp32Repository.get_by_vehiculo(id_vehiculo)
        if esp32_anterior and esp32_anterior.id_esp32 != id_esp32:
            esp32_anterior.id_vehiculo = None
            esp32_anterior.tipo_dispositivo = None
            Esp32Repository.update(esp32_anterior)

        # Asignar
        esp32.id_vehiculo = id_vehiculo
        esp32.id_parada = None
        esp32.tipo_dispositivo = "bus"
        return Esp32Repository.update(esp32)

    @staticmethod
    def desasignar_de_bus(id_esp32):
        """Libera un ESP32 de un bus"""
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        esp32.id_vehiculo = None
        esp32.id_parada = None
        esp32.tipo_dispositivo = None
        return Esp32Repository.update(esp32)

    @staticmethod
    def retirar_esp32(id_esp32, motivo="danado"):
        """Marca un ESP32 como retirado"""
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")

        esp32.status = "retirado"
        esp32.id_vehiculo = None
        esp32.id_parada = None
        return Esp32Repository.update(esp32)