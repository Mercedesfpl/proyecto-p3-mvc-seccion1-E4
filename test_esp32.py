import socketio, time, random, math

SERVER_URL = 'http://localhost:5000'

sio = socketio.Client(logger=True, engineio_logger=True)

latActual = 10.5
lngActual = -66.9
paso = 0.002 #220 metros por paso (lat/lng)

@sio.event
def connect():
    print("Conectado")
    sio.emit('identificacion', {'tipo': 'ESP32', 'bus_id': 'SIM-001'})

@sio.event
def connect_error(data):
    print(f"Error en la conexión {data}")

@sio.event
def disconnect():
    print("Simulación ESP32 desconectado")

def generar_ubicacion_con_movimiento():
    global latActual, lngActual, paso

    latActual += paso
    lngActual += paso * 0.8 #un poco más hacia el este

    if latActual > 10.55 or latActual < 10.45:
        paso = -paso
    
    return round(latActual, 6), round(lngActual, 6)

def simularESP32():
    try:
        sio.connect('http://127.0.0.1:5000', transports=['polling'])
    except Exception as e:
        print(f"Error conectado {e}")
        return
    
    try:
        while True:
            lat, lng = generar_ubicacion_con_movimiento()
            data = {
                'bus_ID': 'SIM-001',
                'lat': lat,
                'lng': lng,
                'timestamp': time.time()
            }
            print(f"Enviando {data}")
            sio.emit('ubicacion_bus', data)
            time.sleep(random.uniform(1.5, 3.0))
    except KeyboardInterrupt:
        print("\nSimulación detenida por el usuario")
    finally:
        sio.disconnect()

if __name__ == '__main__':
    simularESP32()