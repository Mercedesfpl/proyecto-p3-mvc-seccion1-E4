#services/lineafactory
from ..models import Linea, Persona, Usuario
from ..database.connection import (
    verificar_existencia_linea,
    obtener_usuario_por_id,
    get_persona_by_id,
    verificar_existencia_linea,
)
from ..models.exceptions import ResourceNotValid


class LineaFactory:
    @staticmethod
    def crear_linea(data):
        """Valida y crea una instancia de Linea sin guardarla aún."""
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

        # Verificar existencia (esto podría ir en un repositorio)

        existing = verificar_existencia_linea(Linea.nombre)
        if existing:
            raise ResourceNotValid(
                nombre_del_recurso="Lineas",
                rason="Ya existe esa línea en la base de datos",
            )

        # Verificar presidente
        presidente = get_persona_by_id(id_persona=presidente_id)
        if not presidente:
            raise ResourceNotValid(
                nombre_del_recurso="Lineas", rason="Presidente inválido"
            )

        # Verificar secretario (opcional)
        secretario_id = data.get("secretario_id")
        print("Secretario id", secretario_id)
        secretario = None
        if secretario_id:
            secretario = get_persona_by_id(id_persona=secretario_id)
            if not secretario:
                raise ResourceNotValid(
                    rason="El secretario seleccionado no existe",
                    nombre_del_recurso="Linea",
                )

        # Crear instancia de Linea
        nueva_linea = Linea(
            nombre=nombre.strip(),
            rif=rif.strip(),
            presidente_id=presidente_id,
            secretario_id=secretario_id,
        )
        return nueva_linea
