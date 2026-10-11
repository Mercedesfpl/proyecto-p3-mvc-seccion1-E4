from app import create_app
from flask_socketio import SocketIO

app = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")


@socketio.on("connect")
def handle_connect():
    print("Cliente conectado (Socket.IO)")
    from flask_socketio import emit
    emit("connected", {"data": "Conectado al servidor"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Cliente desconectado (Socket.IO)")


@socketio.on("bus_passed_control")
def handle_bus_passed(data):
    """Cuando un bus pasa por una parada, avisa a todos"""
    print("Bus paso por control:", data)
    from flask_socketio import emit
    emit("bus_passed_control", data, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)