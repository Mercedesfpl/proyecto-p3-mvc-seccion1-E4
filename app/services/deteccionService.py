# app/services/deteccionServices.py
from app.factory.deteccion_factory import DeteccionFactory
from ..models.exceptions import ResourceNotFound, ResourceNotValid
from ..repositories.deteccionRepository import DeteccionRepository
from ..repositories.paradaRepository import ParadaRepository
from ..repositories.busRepository import BusRepository
from app.models.exceptions import ResourceNotFound
from datetime import datetime, timezone
from ..models.ruta_parada import RutaParada

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

    @staticmethod
    def registrar_paso(data):
        #validar que el bus y la parada existan
        bus = BusRepository.get_by_id(data.get("id_vehiculo"))
        if not bus:
            raise ResourceNotFound("Bus no encontrado")
        
        parada = ParadaRepository.get_by_id(data.get("id_parada"))
        if not parada:
            raise ResourceNotFound("Parada no encontrado")

        deteccion = DeteccionFactory.crear_deteccion(data)
        return DeteccionRepository.save(deteccion)

    @staticmethod
    def verificar_retraso(data):
        id_ruta = data.get("id_ruta")
        secuencia_actual = data.get("secuencia_actual")
        hora_inicio_str = data.get("hora_inicio")

        if not id_ruta or secuencia_actual is None or not hora_inicio_str:
            raise ResourceNotValid("Retraso", "Faltan datos: id_ruta, secuencia_actual y hora_inicio son obligatorios")

        try:
            secuencia_actual = int(secuencia_actual)
            hora_inicio = datetime.fromisoformat(hora_inicio_str.replace("Z", "+00:00"))
            if hora_inicio.tzinfo is None:
                hora_inicio = hora_inicio.replace(tzinfo=timezone.utc)
        except ValueError:
            raise ResourceNotValid("Retraso", "Formato de hora_inicio inválido. Usa ISO 8601.")

        # 1. Buscar los tiempos estimados
        tramos = RutaParada.query.filter_by(id_ruta=id_ruta).filter(RutaParada.orden_parada < secuencia_actual).all()
        
        if not tramos:
            raise ResourceNotValid("Retraso", f"No hay paradas configuradas para la ruta {id_ruta} hasta la secuencia {secuencia_actual}")

        # 👇 FORZAMOS a float() por si en la BD está guardado como texto
        tiempo_estimado_total = sum(float(tramo.tiempo_estimado_min or 0) for tramo in tramos)

        # 2. Calcular el tiempo real
        hora_actual = datetime.now(timezone.utc)
        tiempo_transcurrido_real = float((hora_actual - hora_inicio).total_seconds() / 60)

        # 3. Calcular la diferencia
        umbral = 5.0 # 5 minutos
        diferencia = tiempo_transcurrido_real - tiempo_estimado_total
        retrasado = diferencia > umbral
        minutos_retraso = max(0.0, round(diferencia, 1))

        return {
            "id_ruta": id_ruta,
            "secuencia_actual": secuencia_actual,
            "retrasado": retrasado,
            "minutos_retraso": minutos_retraso,
            "tiempo_estimado_total": tiempo_estimado_total,
            "tiempo_transcurrido_real": round(tiempo_transcurrido_real, 1)
        }