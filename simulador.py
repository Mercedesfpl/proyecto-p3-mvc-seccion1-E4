import socketio
import time
from app import create_app
from app.models.parada import Parada
from app.models.ruta_parada import RutaParada

# Creamos el cliente de SocketIO
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Simulador conectado al servidor WebSocket de Gestión")

@sio.event
def disconnect():
    print("❌ Simulador desconectado")

def iniciar_simulacion():
    # ⚠️ Pon aquí la IP y puerto de tu servidor Flask
    sio.connect('http://192.168.1.6:5001') 
    
    # 1. Levantamos el contexto de Flask para consultar la base de datos
    app = create_app()
    with app.app_context():
        # 👇 CAMBIA ESTO POR EL ID DE LA RUTA QUE QUIERES SIMULAR
        id_ruta_a_simular = 2 
        
        print(f"🔍 Buscando paradas de la ruta {id_ruta_a_simular} en la BD...")
        
        # Buscamos las paradas asociadas a esa ruta y las ordenamos
        tramos = RutaParada.query.filter_by(id_ruta=id_ruta_a_simular).order_by(RutaParada.orden_parada).all()
        
        if not tramos:
            print("❌ No se encontraron paradas para esta ruta en la BD.")
            return

        paradas = []
        for tramo in tramos:
            parada = Parada.query.get(tramo.id_parada)
            if parada and parada.coordenadas:
                # Separamos el string "lat,lng" en dos números
                lat, lng = parada.coordenadas.split(",")
                paradas.append({
                    "lat": float(lat.strip()), 
                    "lng": float(lng.strip()),
                    "nombre": parada.nombre
                })

    if not paradas:
        print("❌ Las paradas no tienen coordenadas válidas.")
        return

    print(f"✅ Se encontraron {len(paradas)} paradas. Iniciando recorrido...")
    
    bus_id = 1
    placa = "ABC-123"
    
    # Bucle infinito que recorre las paradas reales
    while True:
        for i, p in enumerate(paradas):
            print(f"📡 Enviando ubicación: {p['nombre']} ({p['lat']}, {p['lng']})")
            
            # Emitimos el evento al backend
            sio.emit('nueva_ubicacion', {
                'bus_id': bus_id,
                'placa': placa,
                'lat': p['lat'],
                'lng': p['lng'],
                'parada_actual': i + 1 # Parada 1, 2, 3...
            })
            
            # Esperamos 5 segundos antes de ir a la siguiente parada
            time.sleep(5) 
            
        print("🔄 Reiniciando recorrido...")
        time.sleep(3)

if __name__ == '__main__':
    iniciar_simulacion()