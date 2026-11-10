from datetime import datetime
from sqlalchemy import func, and_
from ..extensions import db
from ..models import Deteccion, RutaParada, Parada, Bus

# se debe de tener 60 minutos esta asi para ñas pruebas
# se debe acomodar segun la esstructura repository factory etc
MAX_MINUTOS_DESDE_ULTIMA_DETECCION = 300  # > 1h se descarta


def calcular_etas(id_ruta: int, id_parada_usuario: int):
    # 1. Validar que la parada pertenece a la ruta
    rp_usuario = RutaParada.query.filter_by(
        id_ruta=id_ruta, id_parada=id_parada_usuario
    ).first()
    if not rp_usuario:
        return {"error": "La parada no pertenece a la ruta indicada"}

    orden_usuario = rp_usuario.orden_parada

    # 2. Buses activos en esa ruta
    ids_buses = [
        b.id_vehiculo
        for b in Bus.query.filter_by(id_ruta=id_ruta, status="activa").all()
    ]
    if not ids_buses:
        return _respuesta(id_ruta, id_parada_usuario, rp_usuario, [])

    # 3. Última detección por bus
    subq = (
        db.session.query(
            Deteccion.id_vehiculo.label("id_vehiculo"),
            func.max(Deteccion.fecha_hora).label("ultima"),
        )
        .filter(Deteccion.id_vehiculo.in_(ids_buses))
        .group_by(Deteccion.id_vehiculo)
        .subquery()
    )
    ultimas_detecciones = (
        db.session.query(Deteccion)
        .join(
            subq,
            and_(
                Deteccion.id_vehiculo == subq.c.id_vehiculo,
                Deteccion.fecha_hora == subq.c.ultima,
            ),
        )
        .all()
    )

    # 4. Pre-cargar ruta_paradas
    ruta_paradas = {
        rp.id_parada: rp for rp in RutaParada.query.filter_by(id_ruta=id_ruta).all()
    }
    paradas_ordenadas = sorted(ruta_paradas.values(), key=lambda rp: rp.orden_parada)
    ahora = datetime.now()
    proximos = []

    for det in ultimas_detecciones:
        print("detecciones", det.fecha_hora, "-----", det.id_deteccion)
        # Filtro de frescura (> 1h se descarta)
        minutos_desde = (ahora - det.fecha_hora).total_seconds() / 60
        print(minutos_desde)
        if minutos_desde > MAX_MINUTOS_DESDE_ULTIMA_DETECCION:
            print("Minutos desde es mayor q uew max_minutos")
            continue

        rp_bus = ruta_paradas.get(det.id_parada)
        print("rpdbus---->", rp_bus)
        if not rp_bus:
            print("Entraste al primer if")
            continue

        orden_bus = rp_bus.orden_parada
        print(orden_bus)

        if orden_bus > orden_usuario:
            continue

        # ETA = suma de tiempos entre paradas desde orden_bus+1 hasta orden_usuario
        eta_min = sum(
            rp.tiempo_estimado_min
            for rp in paradas_ordenadas
            if orden_bus < rp.orden_parada <= orden_usuario
        )
        print(eta_min, "<---etsa")

        proximos.append(
            {
                "id_vehiculo": det.id_vehiculo,
                "placa": det.vehiculo.placa if det.vehiculo else None,
                "eta_min": eta_min,
                "ultima_parada": det.id_parada,
                "ultima_parada_nombre": det.parada.nombre if det.parada else None,
                "ultima_deteccion": det.fecha_hora.isoformat(),
                "minutos_desde_ultima_deteccion": round(minutos_desde, 1),
            }
        )

    proximos.sort(key=lambda x: x["eta_min"])
    return _respuesta(id_ruta, id_parada_usuario, rp_usuario, proximos)


def _respuesta(id_ruta, id_parada, rp_usuario, proximos):
    print("Entraste a respuesta----")
    parada = Parada.query.get(id_parada)
    return {
        "id_ruta": id_ruta,
        "id_parada": id_parada,
        "parada_nombre": parada.nombre if parada else None,
        "orden_parada": rp_usuario.orden_parada,
        "proximos_buses": proximos,
    }
