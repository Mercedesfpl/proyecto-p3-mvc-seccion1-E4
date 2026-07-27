# app/services/linea_factory.py

from ..models import Linea
from ..models.exceptions import ResourceNotValid
import re


class LineaFactory:

    @staticmethod
    def _sanitizar_rif(rif):
        #Elimina espacios y guiones del RIF para estandarizar
        if not rif:
            return rif
        return rif.strip().replace(" ", "").replace("-", "")

    @staticmethod
    def _validar_rif(rif):
        #Valida que el RIF tenga el formato J-12345678-9 (o V/E)
        # Estandarizar: eliminar espacios y guiones
        rif_limpio = LineaFactory._sanitizar_rif(rif)
        
        # Expresión regular: letra (J, V, E), opcional guión, 1-8 dígitos, opcional guión, 1 dígito
        if not re.match(r'^[JVE]\d{1,8}\d{1}$', rif_limpio):
            raise ResourceNotValid("RIF", "Formato de RIF inválido. Debe ser J-12345678-9, V-12345678-9 o E-12345678-9")
        
        # Devolver el RIF en formato estandarizado (sin guiones ni espacios)
        return rif_limpio

    @staticmethod
    def _validar_nombre(nombre):
        #Valida el nombre de la línea
        if not nombre or not nombre.strip():
            raise ResourceNotValid("nombre", "El nombre es requerido")
        
        nombre_limpio = nombre.strip()
        if len(nombre_limpio) > 100:
            raise ResourceNotValid("nombre", "El nombre no puede tener más de 100 caracteres")
        
        return nombre_limpio

    @staticmethod
    def _validar_id(id_field, nombre_campo):
        # Convierte un ID a entero y valida que sea un número positivo.
        if id_field is None:
            return None
        
        try:
            id_int = int(id_field)
            if id_int <= 0:
                raise ValueError
            return id_int
        except (TypeError, ValueError):
            raise ResourceNotValid(nombre_campo, f"{nombre_campo} debe ser un número válido")

    @staticmethod
    def crear_linea(data, color=None):
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Lineas", "El nombre es requerido")
        rif = data.get("rif")
        if not rif:
            raise ResourceNotValid("Lineas", "El rif es requerido")
        presidente_id = data.get("presidente_id")
        if not presidente_id:
            raise ResourceNotValid("Lineas", "Debes seleccionar un presidente")

        return Linea(
            nombre=nombre.strip(),
            rif=rif.strip(),
            presidente_id=presidente_id,
            secretario_id=data.get("secretario_id"),
            color=color or '#74A9D3'
        )