# app/services/parada_factory.py
from ..models.parada import Parada
from ..models.exceptions import ResourceNotValid
from ..helpers.coordenadas_helper import limpiar_coordenadas, validar_coordenadas
from ..repositories import lineaRepository

class ParadaFactory:
    
    @staticmethod
    def _validar_nombre(nombre):
        if not nombre or not nombre.strip():
            raise ResourceNotValid("Parada", "El nombre es requerido")
        
        nombre_limpio = nombre.strip()
        
        # Validar longitud máxima (ajusta según tu modelo)
        if len(nombre_limpio) > 100:
            raise ResourceNotValid("Parada", "El nombre no puede tener más de 100 caracteres")
        
        return nombre_limpio
    
    @staticmethod
    def _validar_coordenadas(coordenadas):
        coordenadas_limpias = limpiar_coordenadas(coordenadas)
        es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas_limpias)
        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        return coordenadas_limpias, lat, lng
    
    @staticmethod
    def _validar_status(status):
        status = status or "activa"
        if status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Parada", f"Status inválido: {status}")
        return status
    
    @staticmethod
    def _validar_linea_id(linea_id):
        # Asumiendo que existe un repositorio de líneas
        
        if linea_id is not None:
            linea = lineaRepository.get_by_id(linea_id)
            if not linea:
                raise ResourceNotValid("Parada", "La línea asociada no existe")
        return linea_id
    
    @staticmethod
    def _validar_orden(orden):
        # Si el campo orden existe, debe ser un número entero positivo
        if orden is not None:
            try:
                orden_int = int(orden)
                if orden_int < 0:
                    raise ValueError
                return orden_int
            except (ValueError, TypeError):
                raise ResourceNotValid("Parada", "El orden debe ser un número entero positivo")
        return orden
    
    @staticmethod
    def crear_parada(data):
        """Valida y crea una instancia de Parada sin guardarla aún."""
        
        nombre = ParadaFactory._validar_nombre(data.get("nombre"))
        coordenadas_limpias = ParadaFactory._validar_coordenadas(data.get("coordenadas", ""))
        status = ParadaFactory._validar_status(data.get("status"))
        #linea_id = ParadaFactory._validar_linea_id(data.get("linea_id"))
        #orden = ParadaFactory._validar_orden(data.get("orden"))
        
        parada = Parada(
            nombre=nombre,
            coordenadas=coordenadas_limpias,
            status=status,
            #linea_id=linea_id,
            #orden=orden
        )
        
        return parada
    
    @staticmethod
    def actualizar_parada(parada_existente, data):
        """Actualiza una instancia de Parada con los datos validados."""
        
        if 'nombre' in data:
            parada_existente.nombre = ParadaFactory._validar_nombre(data['nombre'])
        
        if 'coordenadas' in data:
            parada_existente.coordenadas = ParadaFactory._validar_coordenadas(data['coordenadas'])
        
        if 'status' in data:
            parada_existente.status = ParadaFactory._validar_status(data['status'])
        
        if 'linea_id' in data:
            parada_existente.linea_id = ParadaFactory._validar_linea_id(data['linea_id'])
        
        if 'orden' in data:
            parada_existente.orden = ParadaFactory._validar_orden(data['orden'])
        
        return parada_existente
    
    @staticmethod
    def validar_datos_parada(data):
        """Valida los datos sin crear instancia (útil para validación previa)."""
        
        # Esta función puede usarse en servicios antes de llamar a la fábrica
        ParadaFactory._validar_nombre(data.get("nombre"))
        ParadaFactory._validar_coordenadas(data.get("coordenadas", ""))
        ParadaFactory._validar_status(data.get("status"))
        ParadaFactory._validar_linea_id(data.get("linea_id"))
        ParadaFactory._validar_orden(data.get("orden"))