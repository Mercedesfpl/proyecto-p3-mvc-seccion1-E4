# app/services/rutaServices.py

from ..models.ruta import Ruta
from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..repositories.rutaRepository import RutaRepository
from ..repositories.lineaRepository import LineaRepository
from ..repositories.paradaRepository import ParadaRepository
from ..services.ruta_factory import RutaFactory
from ..extensions import db


class RutaServices:
    """Lógica de negocio para Rutas"""

    @staticmethod
    def get_all_rutas():
        rutas = RutaRepository.get_all()
        return [ruta.to_dict() for ruta in rutas]

    @staticmethod
    def get_ruta_by_id(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        return ruta.to_dict()

    @staticmethod
    def get_rutas_by_linea(id_linea):
        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotFound("Línea")
        rutas = RutaRepository.get_by_linea(id_linea)
        return [ruta.to_dict() for ruta in rutas]

    @staticmethod
    def create_ruta(data):
        # Crear ruta usando el factory
        ruta = RutaFactory.crear_ruta(data)
        
        # Guardar ruta
        RutaRepository.save(ruta)
        
        # Crear relaciones con paradas si existen
        paradas_ids = data.get("paradas_ids", [])
        if paradas_ids:
            relaciones = RutaFactory.crear_relaciones_paradas(ruta, paradas_ids)
            for relacion in relaciones:
                RutaRepository.save_relacion(relacion)
        
        return ruta.to_dict()

    @staticmethod
    def update_ruta(id_ruta, data):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        
        # Actualizar campos
        if "nombre" in data:
            existing = RutaRepository.get_by_nombre(data["nombre"])
            if existing and existing.id != id_ruta:
                raise ResourceNotValid("Ruta", "Ya existe otra ruta con ese nombre")
            ruta.nombre = data["nombre"].strip()
        
        if "status" in data:
            if data["status"] not in ["activa", "inactiva"]:
                raise ResourceNotValid("Ruta", f"Status inválido: {data['status']}")
            ruta.status = data["status"]
        
        if "id_linea" in data:
            linea = LineaRepository.get_by_id(data["id_linea"])
            if not linea:
                raise ResourceNotValid("Ruta", "La línea seleccionada no existe")
            ruta.id_linea = data["id_linea"]
        
        # Actualizar paradas si se envían
        if "paradas_ids" in data:
            # Eliminar relaciones existentes
            RutaRepository.delete_relaciones_by_ruta(id_ruta)
            
            # Crear nuevas relaciones
            relaciones = RutaFactory.crear_relaciones_paradas(ruta, data["paradas_ids"])
            for relacion in relaciones:
                RutaRepository.save_relacion(relacion)
        
        RutaRepository.save(ruta)
        return ruta.to_dict()

    @staticmethod
    def delete_ruta(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        
        # Verificar si tiene buses asignados
        from ..models.bus import Bus
        buses = Bus.query.filter_by(id_ruta=id_ruta).first()
        if buses:
            raise ResourceNotValid("Ruta", "No se puede eliminar porque tiene buses asignados")
        
        RutaRepository.delete(ruta)
        return True

    @staticmethod
    def get_paradas_disponibles():
        paradas = ParadaRepository.get_all_activas()
        return [{"id": p.id, "nombre": p.nombre, "coordenadas": p.coordenadas} for p in paradas]

    @staticmethod
    def get_lineas_disponibles():
        lineas = LineaRepository.get_all_activas()
        return [{"id": l.id, "nombre": l.nombre} for l in lineas]