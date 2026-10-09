# app/services/paradaServices.py

from app.repositories.paradaRepository import ParadaRepository
from app.repositories.esp32Repository import Esp32Repository
from app.factory.parada_factory import ParadaFactory
from app.helpers.coordenadas_helper import limpiar_coordenadas, validar_coordenadas
from app.models.exceptions import ResourceNotFound, ResourceNotValid


class ParadaServices:

    # Contiene logica de negocios para las paradas

    @staticmethod
    def get_all_paradas():
        # obtiene todas las paradas
        paradas = ParadaRepository.get_all()
        return [p.to_dict() for p in paradas]

    @staticmethod
    def get_parada_by_id(id_parada):
        # obtiene una parada por id
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")
        return parada.to_dict()

    @staticmethod
    def validar_coordenadas(coordenadas):
        print("corrdennadas llegando al metodo validar coordenadas en eñl servicio ", coordenadas)

        # Validad y limpia las coordenadas utilizando helper
        coordenadas_limpias = limpiar_coordenadas(coordenadas)
        es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas_limpias)

        if not es_valido:
            raise ResourceNotValid("Parada", mensaje)
        print("coordenadas saliendo de _validar_coordenadas", coordenadas_limpias)
        return coordenadas_limpias

    @staticmethod
    def validar_status(status):
        # Validar el status sea valido
        if status and status not in ["activa", "inactiva"]:
            raise ResourceNotValid("Satatus", f"Status invalido: {status}")
        return status

    @staticmethod
    def create_parada(data):
        print("datos en el servicio", data)

        # Validacion de negocio
        if not data.get("nombre"):
            raise ResourceNotValid("Parada", "El nombre es obligatorio")

        if ParadaRepository.existentePorNombre(data["nombre"]):
            raise ResourceNotValid("Parada", "Ya existe una parada con ese nombre")

        # Validar coordenadas
        if data.get("coordenadas"):
            ParadaServices.validar_coordenadas(data["coordenadas"])

        # Validar ESP32 si viene (NUEVO)
        id_esp32 = data.get("id_esp32")
        if id_esp32:
            esp32 = Esp32Repository.get_by_id(id_esp32)
            if not esp32:
                raise ResourceNotFound("ESP32")
            if esp32.status != "activo":
                raise ResourceNotValid("ESP32", "El ESP32 no esta activo")
            if esp32.id_vehiculo or esp32.id_parada:
                raise ResourceNotValid("ESP32", "El ESP32 ya esta asignado")

        parada = ParadaFactory.crear_parada(data)
        parada = ParadaRepository.save(parada)

        # Asignar ESP32 si viene (NUEVO)
        if id_esp32:
            esp32 = Esp32Repository.get_by_id(id_esp32)
            esp32.id_parada = parada.id
            esp32.tipo_dispositivo = "parada"
            Esp32Repository.update(esp32)

        return parada

    @staticmethod
    def update_parada(id_parada, data):
        # Actualiza una parada existente
        parada = ParadaRepository.get_by_id(id_parada)
        if not parada:
            raise ResourceNotFound("Parada")

        # Actualiza campos con validaciones
        if "nombre" in data:
            nombre = data["nombre"].strip()
            if ParadaRepository.existentePorNombre(nombre, exclude_id=id_parada):
                raise ResourceNotValid("Parada", "Ya existe otra parada con ese nombre")
            parada.nombre = nombre

        if "coordenadas" in data:
            coordenadas_limpias = ParadaServices.validar_coordenadas(data["coordenadas"])
            parada.coordenadas = coordenadas_limpias

        if "status" in data:
            parada.status = ParadaServices.validar_status(data["status"])

        if "id_ruta" in data:
            parada = ParadaFactory.actualizar_parada(parada, {"id_ruta": data["id_ruta"]})

        # ACTUALIZAR ESP32 (NUEVO)
        if "id_esp32" in data:
            id_esp32_nuevo = data["id_esp32"]
            esp32_actual = Esp32Repository.get_by_parada(id_parada)

            # Caso 1: Asignar ESP32 diferente
            if id_esp32_nuevo and (
                not esp32_actual or esp32_actual.id_esp32 != id_esp32_nuevo
            ):
                if esp32_actual:
                    esp32_actual.id_parada = None
                    esp32_actual.tipo_dispositivo = None
                    Esp32Repository.update(esp32_actual)

                esp32_nuevo = Esp32Repository.get_by_id(id_esp32_nuevo)
                if not esp32_nuevo:
                    raise ResourceNotFound("ESP32")
                if esp32_nuevo.status != "activo":
                    raise ResourceNotValid("ESP32", "El ESP32 no esta activo")
                if esp32_nuevo.id_vehiculo or esp32_nuevo.id_parada:
                    raise ResourceNotValid("ESP32", "El ESP32 ya esta asignado")
                esp32_nuevo.id_parada = id_parada
                esp32_nuevo.tipo_dispositivo = "parada"
                Esp32Repository.update(esp32_nuevo)

            # Caso 2: Quitar ESP32
            elif not id_esp32_nuevo and esp32_actual:
                esp32_actual.id_parada = None
                esp32_actual.tipo_dispositivo = None
                Esp32Repository.update(esp32_actual)

        return ParadaRepository.save(parada)

    @staticmethod
    def delete_parada(id_parada):
        # "Eliminar" (Suspender) una parada
        parada = ParadaRepository.get_by_id(id_parada)

        if not parada:
            raise ResourceNotFound("Parada")

        # verificar si esta siendo usada por una linea
        if ParadaRepository.esUsada(id_parada):
            raise ResourceNotValid(
                "Parada",
                "No se puede eliminar la parada ya que esta asignada a una ruta",
            )

        # Liberar el ESP32 antes de eliminar (NUEVO)
        esp32 = Esp32Repository.get_by_parada(id_parada)
        if esp32:
            esp32.id_parada = None
            esp32.tipo_dispositivo = None
            Esp32Repository.update(esp32)

        return ParadaRepository.delete(parada)