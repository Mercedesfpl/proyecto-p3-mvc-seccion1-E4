# app/factory/ruta_factory.py

from ..models.ruta import Ruta
from ..models.exceptions import ResourceNotValid


class RutaFactory:
    
    @staticmethod
    def _validar_nombre(nombre):
        if not nombre or not nombre.strip():
            raise ResourceNotValid("nombre", "El nombre es requerido")
        nombre_limpio = nombre.strip()
        if len(nombre_limpio) > 100:
            raise ResourceNotValid("nombre", "El nombre no puede tener más de 100 caracteres")
        return nombre_limpio
    
    @staticmethod
    def _validar_id(id_field, nombre_campo):
        try:
            id_int = int(id_field)
            if id_int <= 0:
                raise ValueError
            return id_int
        except (TypeError, ValueError):
            raise ResourceNotValid(nombre_campo, f"{nombre_campo} debe ser un número válido")
    
    @staticmethod
    def crear_ruta(data):
        nombre = RutaFactory._validar_nombre(data.get("nombre"))
        id_linea = RutaFactory._validar_id(data.get("id_linea"), "id_linea")
        status = data.get("status", "activa")
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("status", f"Status inválido: {status}")
        
        return Ruta(
            nombre=nombre,
            id_linea=id_linea,
            status=status
        )