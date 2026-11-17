from app.models.deteccion import Deteccion
from app.models.exceptions import ResourceNotValid
from datetime import datetime, timezone

class DeteccionFactory:
    @staticmethod
    def crear_deteccion(data):
        id_vehiculo = data.get("id_vehiculo")
        id_parada = data.get("id_parada")

        if not id_vehiculo or not id_parada:
            raise ResourceNotValid("Deteccion", "El vehículo y la parada son obligatorios")

        #si el cliente manda una fecha se usa, si no, se utiliza la utc actual
        fecha_str = data.get("fecha_actual")
        if fecha_str:
            try:
                fecha_hora = datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))
            except ValueError:
                raise ResourceNotValid("Deteccion", "Formato de fecha invalido")
        else:
            fecha_hora = datetime.now(timezone.utc)

        return Deteccion(
            id_vehiculo = id_vehiculo,
            id_parada = id_parada,
            fecha_hora = fecha_hora
        )