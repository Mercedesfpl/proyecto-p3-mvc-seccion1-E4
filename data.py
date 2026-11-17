from app import create_app
from app.extensions import db
from app.models.ruta import Ruta
from app.models.parada import Parada
from app.models.ruta_parada import RutaParada

app = create_app()

with app.app_context():
    # 1. Buscar la ruta 1
    ruta = Ruta.query.get(2)
    if not ruta:
        print("❌ No existe la ruta con ID 1")
    else:
        # 2. Buscar al menos 3 paradas en el sistema
        paradas = Parada.query.limit(3).all()
        
        if len(paradas) < 3:
            print("❌ Necesitas al menos 3 paradas registradas en el sistema para probar.")
        else:
            # 3. Limpiar si ya había datos para esta ruta
            RutaParada.query.filter_by(id_ruta=1).delete()
            
            # 4. Crear los tramos (5 min para la parada 1, 10 min para la parada 2, etc.)
            tramo1 = RutaParada(id_ruta=2, id_parada=paradas[0].id, orden_parada=1)
            tramo2 = RutaParada(id_ruta=2, id_parada=paradas[1].id, orden_parada=2)
            tramo3 = RutaParada(id_ruta=2, id_parada=paradas[2].id, orden_parada=3)
            
            db.session.add_all([tramo1, tramo2, tramo3])
            db.session.commit()
            print("✅ Datos insertados: La ruta 1 ahora tiene 3 paradas (tramos de 5, 10 y 15 min).")