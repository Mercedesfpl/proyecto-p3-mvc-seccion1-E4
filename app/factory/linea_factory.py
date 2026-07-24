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
    def crear_linea(data):
        """
        Valida y crea una instancia de Linea sin guardarla aún.
        No consulta la base de datos.
        
        Args:
            data (dict): Diccionario con los datos de la línea.
                - nombre (str): Nombre de la línea.
                - rif (str): RIF en formato J-12345678-9.
                - presidente_id (int): ID del presidente.
                - secretario_id (int, opcional): ID del secretario.
                - otros campos...
        
        Returns:
            Linea: Instancia de Linea no guardada.
        
        Raises:
            ResourceNotValid: Si algún campo no cumple con las validaciones.
        """
        
        # 1. Validar nombre
        nombre = LineaFactory._validar_nombre(data.get("nombre"))
        
        # 2. Validar RIF (sanitizar y validar formato)
        rif_raw = data.get("rif")
        if not rif_raw:
            raise ResourceNotValid("RIF", "El RIF es requerido")
        rif = LineaFactory._validar_rif(rif_raw)
        
        # 3. Validar presidente_id (obligatorio)
        presidente_id = LineaFactory._validar_id(data.get("presidente_id"), "presidente_id")
        if presidente_id is None:
            raise ResourceNotValid("presidente_id", "Debes seleccionar un presidente")
        
        # 4. Validar secretario_id (opcional)
        secretario_id = LineaFactory._validar_id(data.get("secretario_id"), "secretario_id")
        
        # 5. (Opcional) Otros campos como status, descripcion, etc.
        # Si existen, agregar validaciones similares.
        
        # Crear instancia de Linea
        return Linea(
            nombre=nombre,
            rif=rif,
            presidente_id=presidente_id,
            secretario_id=secretario_id
        )