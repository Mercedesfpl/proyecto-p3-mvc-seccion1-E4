# app/services/deteccionServices.py

from ..models.deteccion import Deteccion
from ..models.exceptions import ResourceNotFound
from ..repositories.deteccionRepository import DeteccionRepository
from ..repositories.paradaRepository import ParadaRepository
from ..repositories.busRepository import BusRepository
from ..extensions import db
from datetime import datetime, timedelta


class DeteccionServices:

    @staticmethod
    def get_all_detecciones():
        detecciones = DeteccionRepository.get_all()
        return [d.to_dict() for d in detecciones]

    @staticmethod
    def get_deteccion_by_id(id_deteccion):
        deteccion = DeteccionRepository.get_by_id(id_deteccion)
        if not deteccion:
            raise ResourceNotFound("Deteccion")
        return deteccion.to_dict()

    @staticmethod
    def get_detecciones_by_vehiculo(id_vehiculo):
        detecciones = DeteccionRepository.get_by_vehiculo(id_vehiculo)
        return [d.to_dict() for d in detecciones]

    @staticmethod
    def get_detecciones_by_parada(id_parada):
        detecciones = DeteccionRepository.get_by_parada(id_parada)
        return [d.to_dict() for d in detecciones]

    @staticmethod
    def get_alertas(tolerancia=5):
        detecciones = DeteccionRepository.get_alertas(tolerancia)
        return [d.to_dict() for d in detecciones]

    @staticmethod
    def create_deteccion(data):
        id_vehiculo = data.get('id_vehiculo')
        id_parada = data.get('id_parada')
        fecha_hora = data.get('fecha_hora', datetime.now())

        vehiculo = BusRepository.get_by_id(id_vehiculo)
        if not vehiculo:
            raise ResourceNotFound("Vehiculo")

        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")

        deteccion = Deteccion(
            id_vehiculo=id_vehiculo,
            id_parada=id_parada,
            fecha_hora=fecha_hora
        )

        # Calcular tiempo de viaje si existe deteccion anterior
        deteccion_anterior = DeteccionRepository.get_last_by_vehiculo(id_vehiculo)
        if deteccion_anterior and deteccion_anterior.id_parada != id_parada:
            tiempo_real = (fecha_hora - deteccion_anterior.fecha_hora).total_seconds() / 60
            deteccion.tiempo_real = round(tiempo_real, 2)

            # Obtener tiempo estimado desde la ruta
            tiempo_estimado = DeteccionServices._get_tiempo_estimado(
                id_vehiculo, 
                deteccion_anterior.id_parada, 
                id_parada
            )
            deteccion.tiempo_estimado = tiempo_estimado

            if tiempo_estimado:
                retraso = tiempo_real - tiempo_estimado
                deteccion.retraso = round(retraso, 2)

                tolerancia = data.get('tolerancia', 5)
                if retraso > tolerancia:
                    deteccion.estado = 'retraso'
                elif retraso < 0:
                    deteccion.estado = 'adelantado'
                else:
                    deteccion.estado = 'normal'

        return DeteccionRepository.save(deteccion)

    @staticmethod
    def _get_tiempo_estimado(id_vehiculo, id_parada_origen, id_parada_destino):
        from ..models.ruta_parada import RutaParada
        from ..models.ruta import Ruta
        
        vehiculo = BusRepository.get_by_id(id_vehiculo)
        if not vehiculo or not vehiculo.id_ruta:
            return None
        
        ruta = Ruta.query.get(vehiculo.id_ruta)
        if not ruta:
            return None
        
        # Obtener orden de las paradas en la ruta
        parada_origen = RutaParada.query.filter_by(
            id_ruta=ruta.id, 
            id_parada=id_parada_origen
        ).first()
        
        parada_destino = RutaParada.query.filter_by(
            id_ruta=ruta.id, 
            id_parada=id_parada_destino
        ).first()
        
        if not parada_origen or not parada_destino:
            return None
        
        # Si el orden de destino es menor que el de origen, es un viaje de regreso
        # Asignar tiempo estimado fijo por tramo 
        tramos = abs(parada_destino.orden_parada - parada_origen.orden_parada)
        return tramos * 5  # 5 minutos por tramo

    @staticmethod
    def delete_deteccion(id_deteccion):
        deteccion = DeteccionRepository.get_by_id(id_deteccion)
        if not deteccion:
            raise ResourceNotFound("Deteccion")
        return DeteccionRepository.delete(deteccion)