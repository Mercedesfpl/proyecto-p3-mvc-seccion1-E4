from ..models import Linea
from ..models.exceptions import ResourceNotValid
import re


class LineaFactory:

    @staticmethod
    def crear_linea(data):
        #Valida y crea una instancia de Linea sin guardarla aún
        #No consulta base de datos

        # Validaciones
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Linea", "El nombre es requerido")
        
        rif = data.get("rif")
        if not rif:
            raise ResourceNotValid("Linea", "El RIF es requerido")
        
        #Validar formato RIF (ej: J-12345678-9)
        if not re.match(r'^[JVE]-?\d{1,8}-?\d{1}$', rif):
            raise ResourceNotValid("Linea", "Formato de RIF inválido. Ej: J-12345678-9")
        
        presidente_id = data.get("presidente_id")
        if not presidente_id:
            raise ResourceNotValid("Linea", "Debes seleccionar un presidente")
        
        # Crear instancia de Linea
        return Linea(
            nombre=nombre.strip(),
            rif=rif.strip(),
            presidente_id=presidente_id,
            secretario_id=data.get("secretario_id")
        )
