from app.repositories.paradaRepository import ParadaRepository
from app.factory.parada_factory import ParadaFactory
from app.helpers.coordenadas_helper import limpiar_coordenadas, validar_coordenadas
from app.models.exceptions import ResourceNotFound, ResourceNotValid

class ParadaServices: 

#Contiene lógica de negocios para las paradas

    @staticmethod
    def get_all_paradas():
        #obtiene todas las paradas
        paradas = ParadaRepository.get_all()
        return [p.to_dict() for p in paradas]
    
    @staticmethod
    def get_parada_by_id(id_parada):
        #obtiene una parada por id
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        return parada.to_dict()
    
    @staticmethod
    def validar_coordenadas(coordenadas):
        #Validad y limpia las coordenadas utilizando helper
        coordenadas_limpias = limpiar_coordenadas(coordenadas)
        es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas_limpias)

        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        return coordenadas_limpias
    
    @staticmethod
    def validar_status(status):
        #Validar el status sea valido
        if status and status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Satatus", f"Status invalido: {status}")
        return status
    
    @staticmethod
    def create_parada(data):
        #Crea una fábrica utilizando la fábrica 

        #Validación de negocio
        if not data.get('nombre'):
            raise ResourceNotValid("Parada", "El nombre es obligatorio")
        
        if ParadaRepository.existentePorNombre(data['nombre']):
            raise ResourceNotValid("Parada", "Ya existe una parada con ese nombre")
        
        #Validar coordenadas
        if data.get('coordenadas'):
            ParadaServices.validar_coordenadas(data['coordenadas'])

        parada = ParadaFactory.crear_parada(data)

        return ParadaRepository.save(parada)
    
    @staticmethod
    def update_parada(id_parada, data):
        #Actualiza una parada existente
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")

        #Actualiza campos con validaciones
        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if ParadaRepository.existentePorNombre(nombre, exclude_id=id_parada):
                raise ResourceNotValid("Parada", "Ya existe otra parada con ese nombre")
            parada.nombre = nombre
        
        if 'coordenadas' in data:
            coordenadas_limpias = ParadaServices.validar_coordenadas(data['coordenadas'])
            parada.coordenadas = coordenadas_limpias

        if 'status' in data: 
            parada.status = ParadaServices.validar_status(data['status'])

        return ParadaRepository.save(parada)
    
    @staticmethod
    def delete_parada(id_parada):
        #"Eliminar" (Suspender) una parada 

        parada = ParadaRepository.get_by_id(id_parada)

        if not parada: 
            raise ResourceNotFound("Parada")
        
        #verificar si está siendo usada por una línea 
        if ParadaRepository.esUsada(id_parada):
            raise ResourceNotValid("Parada", "No se puede eliminar la parada ya que está asignada a una ruta")
        
        return ParadaRepository.delete(parada)
