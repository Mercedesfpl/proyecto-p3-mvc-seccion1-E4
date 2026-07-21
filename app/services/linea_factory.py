from ..models import Linea
from ..models.exceptions import ResourceNotValid


class LineaFactory:

    @staticmethod
    def crear_linea(data):
        #Valida y crea una instancia de Linea sin guardarla aún
        #No consulta base de datos

        # Validaciones
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Lineas", "El nombre es requerido")
        rif = data.get("rif")
        if not rif:
            raise ResourceNotValid("Lineas", "El rif es requerido")
        presidente_id = data.get("presidente_id")
        if not presidente_id:
            raise ResourceNotValid("Lineas", "Debes seleccionar un presidente")
        
        # Crear instancia de Linea
        return Linea(
            nombre=nombre.strip(),
            rif=rif.strip(),
            presidente_id=presidente_id,
            secretario_id=data.get("secretario_id")
        )
