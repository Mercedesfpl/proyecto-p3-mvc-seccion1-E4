#Eventos de websockets en tiempo real
from flask_socketio import emit
from ..extensions import socketio

@socketio.on('connect') 
def handle_connection():
    print(" Cliente conectado.")

@socketio.on('disconnect') 
def handle_disconnect():
    print(" Cliente desconectado.")

@socketio.on('ubicacion_bus') 
def handle_ubicacion_bus(data):
    #esta función recibe la información de un ESP32 o simulación
    busID = data.get("bus_id") or data.get("bus_ID")
    lat = data.get ("lat")
    lng = data.get("lng")

    print (f" Autobús {busID} en ({lat}), ({lng}).")

    #retrasmitir a todos los clientes en tiempo real
    emit('nueva_ubicacion', {
        'bus_id': busID,
        'latitud': lat,
        'longitud': lng
    }, broadcast=True)