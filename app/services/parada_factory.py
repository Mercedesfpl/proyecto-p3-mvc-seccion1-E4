# app/services/parada_factory.py

from ..models.parada import Parada
from ..models.exceptions import ResourceNotValid


class ParadaFactory:
    @staticmethod
    def crear_parada(data):
        """Valida y crea una instancia de Parada sin guardarla aún."""
        
        # Validar nombre
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Parada", "El nombre es requerido")
        
        # Validar coordenadas
        coordenadas = data.get("coordenadas")
        if not coordenadas:
            raise ResourceNotValid("Parada", "Las coordenadas son requeridas")
        
        # Validar formato de coordenadas (lat,long)
        try:
            partes = coordenadas.split(",")
            if len(partes) != 2:
                raise ResourceNotValid("Parada", "Formato de coordenadas inválido. Use: latitud,longitud")
            lat = float(partes[0].strip())
            lng = float(partes[1].strip())
            if lat < -90 or lat > 90:
                raise ResourceNotValid("Parada", "Latitud debe estar entre -90 y 90")
            if lng < -180 or lng > 180:
                raise ResourceNotValid("Parada", "Longitud debe estar entre -180 y 180")
        except ValueError:
            raise ResourceNotValid("Parada", "Coordenadas deben ser números válidos")
        
        # Validar status
        status = data.get("status", "activa")
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Parada", f"Status inválido: {status}")
        
        # Crear instancia
        parada = Parada(
            nombre=nombre.strip(),
            coordenadas=coordenadas.strip(),
            status=status
        )
        
        return parada