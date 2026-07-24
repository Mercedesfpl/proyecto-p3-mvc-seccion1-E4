from app.repositories.rutaRepository import RutaRepository
from app.repositories.lineaRepository import LineaRepository
from app.factory.ruta_factory import RutaFactory
from app.models.exceptions import ResourceNotFound, ResourceNotValid

class RutaServices:
    
    @staticmethod
    def get_all_rutas():
        rutas = RutaRepository.get_all()
        return [r.to_dict() for r in rutas]
    
    @staticmethod
    def get_ruta_by_id(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        return ruta.to_dict()
    
    @staticmethod
    def create_ruta(data):
        # Validar nombre único dentro de la misma línea
        nombre = data.get('nombre')
        id_linea = data.get('id_linea')
        if not nombre or not id_linea:
            raise ResourceNotValid("Ruta", "Nombre y línea son obligatorios")
        
        if RutaRepository.existentePorNombre(nombre, id_linea):
            raise ResourceNotValid("nombre", "Ya existe una ruta con ese nombre en esta línea")
        
        # Validar que la línea exista
        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotFound("Línea no encontrada")
        
        ruta = RutaFactory.crear_ruta(data)
        return RutaRepository.save(ruta)
    
    @staticmethod
    def update_ruta(id_ruta, data):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        
        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if not nombre:
                raise ResourceNotValid("nombre", "El nombre es requerido")
            # Validar que no exista otra ruta con el mismo nombre en la misma línea
            if RutaRepository.existentePorNombre(nombre, ruta.id_linea, exclude_id=id_ruta):
                raise ResourceNotValid("nombre", "Ya existe otra ruta con ese nombre en esta línea")
            ruta.nombre = nombre
        
        if 'status' in data:
            status = data['status']
            if status not in ["activa", "inactiva"]:
                raise ResourceNotValid("status", "Status inválido")
            ruta.status = status
        
        if 'id_linea' in data:
            linea = LineaRepository.get_by_id(data['id_linea'])
            if not linea:
                raise ResourceNotFound("Línea no encontrada")
            ruta.id_linea = data['id_linea']
        
        return RutaRepository.save(ruta)
    
    @staticmethod
    def delete_ruta(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        # Aquí podrías verificar si la ruta tiene buses asignados (opcional)
        return RutaRepository.delete(ruta)