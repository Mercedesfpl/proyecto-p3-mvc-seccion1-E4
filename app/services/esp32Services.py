# app/services/esp32Services.py

from ..models.exceptions import ResourceNotFound
from ..repositories.esp32Repository import Esp32Repository
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
        # Hashear contraseña
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
        
        Esp32Repository.update()
        return esp32.to_dict()
    
    @staticmethod
    def delete_esp32(id_esp32):
        esp32 = Esp32Repository.get_by_id(id_esp32)
        if not esp32:
            raise ResourceNotFound("ESP32")
        Esp32Repository.delete(esp32)