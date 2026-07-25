# Rama: feature/Jeremy

## Autor: Jeremy Ramirez

## 📌 Propósito de esta rama

Instalar y configurar las dependencias de **Flask-SocketIO** y **Gevent** (luego reemplazado por Eventlet) para habilitar notificaciones en tiempo real en el sistema.

## 🛠️ Cambios realizados

### 1. Modificación de `requirements.txt` (18/5/2026)

- Se agregó `flask-socketio==5.3.6`
- Se intentó usar `gevent==24.2.1` (presentó problemas de compilación con Python 3.14)
- Se reemplazó por `eventlet==0.35.2` como solución alternativa

### 1.1 Cambio de run.py para adpatarse a websockets

### 1.2 Se añadió from flask_socketio import SocketIO a app/extensions.py

### 1.3 Se añadió socketIO con sus configuraciones correspondientes a app/**init**.py

### 1.5 Cree nuevo archivo llamado app/routes/websocket_events.py para los eventos del socket en tiempo real

### 2. Agregación de función sobre una simulación básica de ESP32 (19/6/2026)

Lo que debes hacer es inicializar run.py (python run.py) y redirigirte a está ruta  
`http://127.0.0.1:5000/admin/prueba` 
`http://localhost/admin/prueba`

de ahí en adelante podrás utilizar el mapa y los botones correspondientes
