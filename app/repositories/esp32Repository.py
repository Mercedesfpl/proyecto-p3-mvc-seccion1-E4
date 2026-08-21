# app/repositories/esp32Repository.py

from ..models.esp32 import Esp32
from ..extensions import db

class Esp32Repository:
    
    @staticmethod
    def get_all():
        return Esp32.query.all()
    
    @staticmethod
    def get_by_id(id_esp32):
        return Esp32.query.get(id_esp32)
    
    @staticmethod
    def save(esp32):
        db.session.add(esp32)
        db.session.commit()
        return esp32
    
    @staticmethod
    def update():
        db.session.commit()
    
    @staticmethod
    def delete(esp32):
        db.session.delete(esp32)
        db.session.commit()