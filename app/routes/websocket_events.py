#Eventos de websockets en tiempo real
from flask_socketio import emit
from app.extensions import socketIO

@socketio.on('connect') 
def handle_connection():
    print("f Cliente conectado: {request.sid}.")

@socketio.on('disconnect') 
def handle_disconnect():
    print("f Cliente desconectado: {request.sid}.")

@socketio.on('ubicacion_bus') 
def handle_disconnect(data):
    #esta función recibe la información de un ESP32 o simulación
    busID = data.get("bus_ID") 
    lat = data.get ("lat")
    lng = data.get("lng")

    print ("f Autobús {busID} en ({lat}), ({lng}).")

    #retrasmitir a todos los clientes en tiempo real
    emit('nueva ubicación', {
        'bus_id': busID,
        'latitud': lat,
        'longitud': lng
    }, broadcast=True)