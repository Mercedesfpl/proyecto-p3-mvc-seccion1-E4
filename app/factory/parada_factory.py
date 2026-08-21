# app/services/parada_factory.py

from ..models.parada import Parada
from ..models.exceptions import ResourceNotValid
from ..helpers.coordenadas_helper import limpiar_coordenadas, validar_y_redondear_coordenadas  # CAMBIADO

class ParadaFactory:
    
    @staticmethod
    def _validar_nombre(nombre):
        if not nombre or not nombre.strip():
            raise ResourceNotValid("Parada", "El nombre es requerido")
        
        nombre_limpio = nombre.strip()
        
        if len(nombre_limpio) > 100:
            raise ResourceNotValid("Parada", "El nombre no puede tener más de 100 caracteres")
        
        return nombre_limpio
    
    @staticmethod
    def _validar_coordenadas(coordenadas):
        """Valida y redondea coordenadas a 6 decimales"""
        es_valido, mensaje, lat, lng, coordenadas_redondeadas = validar_y_redondear_coordenadas(
            coordenadas
        )
        
        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        
        return coordenadas_redondeadas
    
    @staticmethod
    def _validar_status(status):
        status = status or "activa"
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Parada", f"Status inválido: {status}")
        return status
    
    @staticmethod
    def crear_parada(data):
        nombre = ParadaFactory._validar_nombre(data.get("nombre"))
        coordenadas_limpias = ParadaFactory._validar_coordenadas(data.get("coordenadas", ""))
        status = ParadaFactory._validar_status(data.get("status"))
        
        parada = Parada(
            nombre=nombre,
            coordenadas=coordenadas_limpias,
            status=status
        )
        
        return parada
    
    @staticmethod
    def actualizar_parada(parada_existente, data):
        if 'nombre' in data:
            parada_existente.nombre = ParadaFactory._validar_nombre(data['nombre'])
        
        if 'coordenadas' in data:
            parada_existente.coordenadas = ParadaFactory._validar_coordenadas(data['coordenadas'])
        
        if 'status' in data:
            parada_existente.status = ParadaFactory._validar_status(data['status'])
        
        return parada_existente