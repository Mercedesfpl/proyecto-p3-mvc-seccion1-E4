# app/services/rutaServices.py

from app.repositories.rutaRepository import RutaRepository
from app.repositories.lineaRepository import LineaRepository
from app.factory.ruta_factory import RutaFactory
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.extensions import db


class RutaServices:

    @staticmethod
    def get_all_rutas():
        rutas = RutaRepository.get_all()
        return [ruta.to_dict() for ruta in rutas]

    @staticmethod
    def get_ruta_by_id(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        return ruta.to_dict()

    @staticmethod
    def create_ruta(data):
        nombre = data.get('nombre')
        id_linea = data.get('id_linea')
        if not nombre or not id_linea:
            raise ResourceNotValid("Ruta", "Nombre y línea son obligatorios")

        if RutaRepository.existentePorNombre(nombre, id_linea):
            raise ResourceNotValid("nombre", "Ya existe una ruta con ese nombre en esta línea")

        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotFound("Línea no encontrada")

        ruta_data = {
            'nombre': nombre,
            'id_linea': id_linea,
            'status': data.get('status', 'activa')
        }
        ruta = RutaFactory.crear_ruta(ruta_data)
        ruta_guardada = RutaRepository.save(ruta)

        paradas_ids = data.get('paradas_ids', [])
        if paradas_ids:
            from app.models.ruta_parada import RutaParada
            from app.repositories.paradaRepository import ParadaRepository

            for i, id_parada in enumerate(paradas_ids, start=1):
                parada = ParadaRepository.get_by_id(id_parada)
                if not parada:
                    raise ResourceNotValid("Parada", f"La parada {id_parada} no existe")

                ruta_parada = RutaParada(
                    id_ruta=ruta_guardada.id,
                    id_parada=id_parada,
                    orden_parada=i
                )
                db.session.add(ruta_parada)
            db.session.commit()

        return ruta_guardada.to_dict()

    @staticmethod
    def update_ruta(id_ruta, data):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")

        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if not nombre:
                raise ResourceNotValid("nombre", "El nombre es requerido")
            if RutaRepository.existentePorNombre(nombre, ruta.id_linea, exclude_id=id_ruta):
                raise ResourceNotValid("nombre", "Ya existe otra ruta con ese nombre en esta línea")
            ruta.nombre = nombre

        if 'status' in data:
            status = data['status']
            if status not in ["activa", "inactiva"]:
                raise ResourceNotValid("status", "Status inválido")
            ruta.status = status

        if 'id_linea' in data:
            linea = LineaRepository.get_by_id(data['id_linea'])
            if not linea:
                raise ResourceNotFound("Línea no encontrada")
            ruta.id_linea = data['id_linea']

        if 'paradas_ids' in data:
            from app.models.ruta_parada import RutaParada
            RutaParada.query.filter_by(id_ruta=id_ruta).delete()

            paradas_ids = data.get('paradas_ids', [])
            from app.repositories.paradaRepository import ParadaRepository

            for i, id_parada in enumerate(paradas_ids, start=1):
                parada = ParadaRepository.get_by_id(id_parada)
                if not parada:
                    raise ResourceNotValid("Parada", f"La parada {id_parada} no existe")

                ruta_parada = RutaParada(
                    id_ruta=ruta.id,
                    id_parada=id_parada,
                    orden_parada=i
                )
                db.session.add(ruta_parada)
            db.session.commit()

        RutaRepository.save(ruta)
        return ruta.to_dict()

    @staticmethod
    def delete_ruta(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")

        from app.models.ruta_parada import RutaParada
        RutaParada.query.filter_by(id_ruta=id_ruta).delete()
        db.session.commit()
        return RutaRepository.delete(ruta)