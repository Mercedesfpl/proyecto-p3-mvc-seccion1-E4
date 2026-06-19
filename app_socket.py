# app_socket.py
from flask import Flask, render_template_string
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

HTML = '''
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
    <h1>Prueba WebSocket</h1>
    <button onclick="enviar()">Enviar ubicación</button>
    <div id="log"></div>
    <script>
        const socket = io();
        socket.on('connect', () => log('✅ Conectado al servidor'));
        socket.on('connect_error', (error) => log('❌ Error de conexión: ' + error));
        socket.on('nueva_ubicacion', (data) => log('📍 Recibido: ' + JSON.stringify(data)));
        function enviar() {
            socket.emit('ubicacion_bus', {bus_id: 'TEST', lat: 10.5, lng: -66.9});
            log('📤 Enviado');
        }
        function log(msg) {
            document.getElementById('log').innerHTML += '<p>' + msg + '</p>';
        }
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML)

@socketio.on('connect')
def handle_connect():
    print('✅ Cliente conectado al servidor')

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Cliente desconectado')

@socketio.on('ubicacion_bus')
def handle_ubicacion(data):
    print(f"📍 Ubicación recibida: {data}")
    emit('nueva_ubicacion', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)