# app/services/parada_factory.py

from ..models.parada import Parada
from ..models.exceptions import ResourceNotValid
from ..helpers.coordenadas_helper import limpiar_coordenadas, validar_coordenadas


class ParadaFactory:
    @staticmethod
    def crear_parada(data):
        """Valida y crea una instancia de Parada sin guardarla aún."""
        
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Parada", "El nombre es requerido")
        
        # Limpiar y validar coordenadas usando el helper
        coordenadas_raw = data.get("coordenadas", "")
        coordenadas_limpias = limpiar_coordenadas(coordenadas_raw)
        
        es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas_limpias)
        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        
        status = data.get("status", "activa")
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Parada", f"Status inválido: {status}")
        
        parada = Parada(
            nombre=nombre.strip(),
            coordenadas=coordenadas_limpias,
            status=status
        )
        
        return parada