from app.models.bus import Bus
from ..extensions import db

class BusRepository:
    
    @staticmethod
    def get_all():
        return Bus.query.all()
    
    @staticmethod
    def get_by_id(id_vehiculo):
        return Bus.query.get(id_vehiculo)
    
    @staticmethod
    def get_by_placa(placa):
        return Bus.query.filter_by(placa=placa).first()
    
    @staticmethod
    def existentePorPlaca(placa, exclude_id=None):
        query = Bus.query.filter_by(placa=placa)
        if exclude_id:
            query = query.filter(Bus.id_vehiculo != exclude_id)
        return query.first() is not None
    
    @staticmethod
    def save(bus):
        db.session.add(bus)
        db.session.commit()
        return bus
    
    @staticmethod
    def delete(bus):
        db.session.delete(bus)
        db.session.commit()
        return bus