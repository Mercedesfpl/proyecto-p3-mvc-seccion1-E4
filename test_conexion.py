import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("✅ Conectado al servidor")
    sio.disconnect()

@sio.event
def connect_error(data):
    print(f"❌ Error: {data}")

if __name__ == '__main__':
    try:
        sio.connect('http://localhost:5000')
        sio.wait()
    except Exception as e:
        print(f"Excepción: {e}")