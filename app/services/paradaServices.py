# app/services/paradaServices.py

from app.repositories.paradaRepository import ParadaRepository
from app.factory.parada_factory import ParadaFactory
from app.helpers.coordenadas_helper import limpiar_coordenadas, validar_y_redondear_coordenadas  # CAMBIADO
from app.models.exceptions import ResourceNotFound, ResourceNotValid

class ParadaServices: 

    @staticmethod
    def get_all_paradas():
        paradas = ParadaRepository.get_all()
        return [p.to_dict() for p in paradas]

    @staticmethod
    def get_paradas_disponibles():
        """Obtiene todas las paradas activas para selectores"""
        paradas = ParadaRepository.get_all_activas()
        return [p.to_dict() for p in paradas]
    
    @staticmethod
    def get_parada_by_id(id_parada):
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        return parada.to_dict()
    
    @staticmethod
    def validar_coordenadas(coordenadas):
        """Valida y redondea coordenadas a 6 decimales"""
        es_valido, mensaje, lat, lng, coordenadas_redondeadas = validar_y_redondear_coordenadas(
            coordenadas
        )
        
        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        
        return coordenadas_redondeadas
    
    @staticmethod
    def validar_status(status):
        if status and status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Status", f"Status inválido: {status}")
        return status
    
    @staticmethod
    def create_parada(data):
        # Validación de negocio
        if not data.get('nombre'):
            raise ResourceNotValid("Parada", "El nombre es obligatorio")
        
        if ParadaRepository.existentePorNombre(data['nombre']):
            raise ResourceNotValid("Parada", "Ya existe una parada con ese nombre")
        
        # Validar y redondear coordenadas
        if data.get('coordenadas'):
            data['coordenadas'] = ParadaServices.validar_coordenadas(data['coordenadas'])

        parada = ParadaFactory.crear_parada(data)
        return ParadaRepository.save(parada)
    
    @staticmethod
    def update_parada(id_parada, data):
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")

        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if ParadaRepository.existentePorNombre(nombre, exclude_id=id_parada):
                raise ResourceNotValid("Parada", "Ya existe otra parada con ese nombre")
            parada.nombre = nombre
        
        if 'coordenadas' in data:
            coordenadas_redondeadas = ParadaServices.validar_coordenadas(data['coordenadas'])
            parada.coordenadas = coordenadas_redondeadas

        if 'status' in data: 
            parada.status = ParadaServices.validar_status(data['status'])

        return ParadaRepository.save(parada)
    
    @staticmethod
    def delete_parada(id_parada):
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada: 
            raise ResourceNotFound("Parada")
        
        if ParadaRepository.esUsada(id_parada):
            raise ResourceNotValid("Parada", "No se puede eliminar la parada ya que está asignada a una ruta")
        
        return ParadaRepository.delete(parada)