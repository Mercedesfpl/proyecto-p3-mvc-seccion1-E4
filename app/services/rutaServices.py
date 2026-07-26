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
        resultado = []
        for r in rutas:
            # Obtener paradas de la ruta con su orden
            from app.models.ruta_parada import RutaParada
            from app.repositories.paradaRepository import ParadaRepository
            
            ruta_paradas = RutaParada.query.filter_by(id_ruta=r.id).order_by(RutaParada.orden_parada).all()
            paradas = []
            for rp in ruta_paradas:
                parada = ParadaRepository.get_by_id(rp.id_parada)
                if parada:
                    paradas.append({
                        "id": parada.id,
                        "nombre": parada.nombre,
                        "coordenadas": parada.coordenadas,
                        "orden": rp.orden_parada
                    })
            
            resultado.append({
                "id": r.id,
                "id_ruta": r.id,
                "nombre": r.nombre,
                "status": r.status,
                "id_linea": r.id_linea,
                "linea_nombre": r.linea.nombre if r.linea else None,
                "paradas": paradas
            })
        return resultado
    
    @staticmethod
    def get_ruta_by_id(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        
        # Obtener paradas de la ruta
        from app.models.ruta_parada import RutaParada
        from app.repositories.paradaRepository import ParadaRepository
        
        ruta_paradas = RutaParada.query.filter_by(id_ruta=ruta.id).order_by(RutaParada.orden_parada).all()
        paradas = []
        for rp in ruta_paradas:
            parada = ParadaRepository.get_by_id(rp.id_parada)
            if parada:
                paradas.append({
                    "id": parada.id,
                    "nombre": parada.nombre,
                    "coordenadas": parada.coordenadas,
                    "orden": rp.orden_parada
                })
        
        return {
            "id_ruta": ruta.id,
            "nombre": ruta.nombre,
            "status": ruta.status,
            "id_linea": ruta.id_linea,
            "linea_nombre": ruta.linea.nombre if ruta.linea else None,
            "paradas": paradas
        }
    
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
        
        # Crear ruta
        ruta = RutaFactory.crear_ruta(data)
        ruta_guardada = RutaRepository.save(ruta)
        
        # Guardar relaciones con paradas
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
        
        return ruta_guardada
    
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
        
        # Actualizar paradas si se envían
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
        
        return RutaRepository.save(ruta)
    
    @staticmethod
    def delete_ruta(id_ruta):
        ruta = RutaRepository.get_by_id(id_ruta)
        if not ruta:
            raise ResourceNotFound("Ruta")
        
        from app.models.ruta_parada import RutaParada
        RutaParada.query.filter_by(id_ruta=id_ruta).delete()
        db.session.commit()
        return RutaRepository.delete(ruta)