# app/services/ruta_factory.py

from ..models.ruta import Ruta
from ..models.ruta_parada import RutaParada
from ..models.exceptions import ResourceNotValid
from ..repositories.lineaRepository import LineaRepository
from ..repositories.paradaRepository import ParadaRepository


class RutaFactory:
    @staticmethod
    def crear_ruta(data):
        """Valida y crea una instancia de Ruta sin guardarla aún."""
        
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Ruta", "El nombre es requerido")
        
        id_linea = data.get("id_linea")
        if not id_linea:
            raise ResourceNotValid("Ruta", "Debes seleccionar una línea")
        
        # Verificar que la línea existe
        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotValid("Ruta", "La línea seleccionada no existe")
        
        # Verificar nombre único
        from ..models.ruta import Ruta
        existing = Ruta.query.filter_by(nombre=nombre).first()
        if existing:
            raise ResourceNotValid("Ruta", "Ya existe una ruta con ese nombre")
        
        status = data.get("status", "activa")
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Ruta", f"Status inválido: {status}")
        
        ruta = Ruta(
            nombre=nombre.strip(),
            status=status,
            id_linea=id_linea
        )
        
        return ruta
    
    @staticmethod
    def crear_relaciones_paradas(ruta, paradas_ids):
        """Crea las relaciones entre una ruta y sus paradas."""
        if not paradas_ids:
            return []
        
        relaciones = []
        for i, id_parada in enumerate(paradas_ids, start=1):
            # Verificar que la parada existe
            parada = ParadaRepository.get_by_id(id_parada)
            if not parada:
                raise ResourceNotValid("Ruta", f"La parada {id_parada} no existe")
            
            # Verificar que la parada esté activa
            if parada.status != "activa":
                raise ResourceNotValid("Ruta", f"La parada '{parada.nombre}' no está activa")
            
            ruta_parada = RutaParada(
                id_ruta=ruta.id,
                id_parada=id_parada,
                orden_parada=i
            )
            relaciones.append(ruta_parada)
        
        return relaciones