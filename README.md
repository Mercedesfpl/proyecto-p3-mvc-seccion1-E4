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

####################################

## Modificacion hecha el 23/09/2026

## Johny Torres

## Version incompleta (se necesita mejorar )

#######FRONT##########

## Se modificaron los fetch de el front (falta verificar todos los de recuperacion de clave) agregado los token de seguridad en las peticiones acces_toke el refresh_token y el csrfToken en los headers de verificacion.

## Seagrego un afuncion llamado get cookies para obtener el token generado en el back

### NOTA: Si por aguna razon las peticiones les generan codigo 401 No autorizado, deben de incluir los token ir a app\frontend\static\js\rutas.js y seguir los pasos

## Se cambiaron algunas claves en las generacion de las tablas para que coincida con el contenido de la respuesta del back.

############BACK##########

## Se modifico el busService, lineaService, paradaService y user Service se le modificaron los metodos (falta eliminar los reques que se hacen dentro del service o del controller eje data = request.get_json() en teria la variable data se captura en las rotes y luego se para como variable ej return delete_parada(id_parada) en este caso es el id) algunos metodos com o los de actualizar y borrar se deben de cambiar,

## Se debe creara la relacion de paradas y rutas

## Se debe de modificar el metodo para obtener la lista de buses ya que no existe ningun inner joy y las renderizacion de las tablas en el front no muetra los detalles. espesificamente esta app\repositories\paradaRepository.py

## Problemas del back end solucionados
