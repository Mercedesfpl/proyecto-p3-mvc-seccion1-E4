from app.repositories.busRepository import BusRepository
from app.repositories.lineaRepository import LineaRepository
from app.repositories.userRepository import UserRepository
from app.repositories.rutaRepository import RutaRepository
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
        # Validar placa única
        if data.get('placa') and BusRepository.existentePorPlaca(data['placa']):
            raise ResourceNotValid("placa", "Ya existe un bus con esa placa")
        
        # Validar que la línea exista
        if data.get('id_linea'):
            linea = LineaRepository.get_by_id(data['id_linea'])
            if not linea:
                raise ResourceNotFound("Línea no encontrada")
        
        # Validar que el secretario exista
        if data.get('id_secretario'):
            secretario = UserRepository.get_by_id(data['id_secretario'])
            if not secretario:
                raise ResourceNotFound("Secretario no encontrado")
        
        # Validar que la ruta exista (si se asignó)
        if data.get('id_ruta'):
            ruta = RutaRepository.get_by_id(data['id_ruta'])
            if not ruta:
                raise ResourceNotFound("Ruta no encontrada")
        
        # Crear instancia con Factory
        bus = BusFactory.crear_bus(data)
        return BusRepository.save(bus)
    
    @staticmethod
    def update_bus(id_vehiculo, data):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")
        
        # Actualizar placa (si se envía)
        if 'placa' in data:
            placa = data['placa'].strip().upper()
            if BusRepository.existentePorPlaca(placa, exclude_id=id_vehiculo):
                raise ResourceNotValid("placa", "Ya existe otro bus con esa placa")
            bus.placa = placa
        
        # Actualizar línea
        if 'id_linea' in data:
            linea = LineaRepository.get_by_id(data['id_linea'])
            if not linea:
                raise ResourceNotFound("Línea no encontrada")
            bus.id_linea = data['id_linea']
        
        # Actualizar secretario
        if 'id_secretario' in data:
            secretario = UserRepository.get_by_id(data['id_secretario'])
            if not secretario:
                raise ResourceNotFound("Secretario no encontrado")
            bus.id_secretario = data['id_secretario']
        
        # Actualizar ruta (opcional)
        if 'id_ruta' in data:
            if data['id_ruta']:
                ruta = RutaRepository.get_by_id(data['id_ruta'])
                if not ruta:
                    raise ResourceNotFound("Ruta no encontrada")
                bus.id_ruta = data['id_ruta']
            else:
                bus.id_ruta = None
        
        # Actualizar status
        if 'status' in data:
            status = data['status']
            if status not in ["activa", "inactiva"]:
                raise ResourceNotValid("status", "Status inválido")
            bus.status = status
        
        return BusRepository.save(bus)
    
    @staticmethod
    def delete_bus(id_vehiculo):
        bus = BusRepository.get_by_id(id_vehiculo)
        if not bus:
            raise ResourceNotFound("Bus")
        return BusRepository.delete(bus)