# seed_data.py
from app import create_app
from app.extensions import db
from app.models.models import Usuario
from app.models.persona import Persona
from app.models.linea import Linea
from app.models.ruta import Ruta
from app.models.parada import Parada
from app.models.ruta_parada import RutaParada
from app.models.bus import Bus
from app.models.esp32 import Esp32
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    print("=" * 60)
    print("INSERTANDO DATOS DE PRUEBA")
    print("=" * 60)

    # 1. TU USUARIO
    tu_usuario = Usuario.query.filter_by(email="mfrancelispineda@gmail.com").first()

    if not tu_usuario:
        tu_usuario = Usuario(
            nombre="Miguel Francelis",
            email="mfrancelispineda@gmail.com",
            password=generate_password_hash("Admin123!"),
            isAdmin=True,
            rol="admin",
        )
        db.session.add(tu_usuario)
        db.session.commit()
        print(f"[OK] Usuario creado: {tu_usuario.email}")
    else:
        tu_usuario.isAdmin = True
        tu_usuario.rol = "admin"
        db.session.commit()
        print(f"[OK] Usuario existente: {tu_usuario.email} (ID: {tu_usuario.id})")

    # 2. PERSONAS
    presidente1 = Persona(
        nombre="Carlos", apellido="Perez", cedula="V-12345678",
        correo="carlos.presidente@ejemplo.com", telefono="0414-1234567",
        rol="presidente",
    )
    presidente2 = Persona(
        nombre="Maria", apellido="Gonzalez", cedula="V-23456789",
        correo="maria.presidente@ejemplo.com", telefono="0424-2345678",
        rol="presidente",
    )
    secretario_persona = Persona(
        nombre="Pedro", apellido="Ramirez", cedula="V-34567890",
        correo="pedro.secretario@ejemplo.com", telefono="0412-3456789",
        rol="secretario",
    )
    db.session.add_all([presidente1, presidente2, secretario_persona])
    db.session.commit()
    print(f"[OK] Personas: {presidente1.id}, {presidente2.id}, {secretario_persona.id}")

    # 3. USUARIO SECRETARIO
    usuario_secretario = Usuario(
        nombre="Pedro Ramirez",
        email="pedro.secretario@ejemplo.com",
        password=generate_password_hash("Secretario123!"),
        isAdmin=False,
        rol="secretario",
        persona_id=secretario_persona.id,
    )
    db.session.add(usuario_secretario)
    db.session.commit()
    print(f"[OK] Usuario secretario: {usuario_secretario.email}")

    # 4. LINEAS
    linea1 = Linea(
        nombre="Linea 15", rif="J-12345678-9", color="#74A9D3",
        presidente_id=presidente1.id, secretario_id=usuario_secretario.id,
    )
    linea2 = Linea(
        nombre="Linea 12", rif="J-98765432-1", color="#E63946",
        presidente_id=presidente2.id,
    )
    db.session.add_all([linea1, linea2])
    db.session.commit()
    print(f"[OK] Lineas: {linea1.id} ({linea1.nombre}), {linea2.id} ({linea2.nombre})")

    # 5. PARADAS
    paradas_data = [
        {"nombre": "Terminal Los Teques", "coordenadas": "10.350266,-67.04199"},
        {"nombre": "Plaza Bolivar", "coordenadas": "10.347427,-67.042286"},
        {"nombre": "Calle 10", "coordenadas": "10.347319,-67.041455"},
        {"nombre": "Mercado Municipal", "coordenadas": "10.350117,-67.041171"},
        {"nombre": "Hospital Central", "coordenadas": "10.344463,-67.041852"},
        {"nombre": "Estadio Los Teques", "coordenadas": "10.340886,-67.040997"},
        {"nombre": "Universidad Politecnica", "coordenadas": "10.335736,-67.041802"},
        {"nombre": "Centro Comercial", "coordenadas": "10.329005,-67.0422"},
    ]
    paradas = []
    for data in paradas_data:
        p = Parada(nombre=data["nombre"], coordenadas=data["coordenadas"], status="activa")
        db.session.add(p)
        paradas.append(p)
    db.session.commit()
    print(f"[OK] Paradas: {len(paradas)}")

    # 6. RUTAS
    ruta1 = Ruta(nombre="Ruta Norte-Sur", id_linea=linea1.id, status="activa")
    ruta2 = Ruta(nombre="Ruta Este-Oeste", id_linea=linea2.id, status="activa")
    db.session.add_all([ruta1, ruta2])
    db.session.commit()
    print(f"[OK] Rutas: {ruta1.id} ({ruta1.nombre}), {ruta2.id} ({ruta2.nombre})")

    # 7. ASOCIAR PARADAS
    for i, parada in enumerate(paradas[:5], start=1):
        rp = RutaParada(id_ruta=ruta1.id, id_parada=parada.id, orden_parada=i)
        db.session.add(rp)
    for i, parada in enumerate(paradas[3:8], start=1):
        rp = RutaParada(id_ruta=ruta2.id, id_parada=parada.id, orden_parada=i)
        db.session.add(rp)
    db.session.commit()
    print(f"[OK] Paradas asociadas a rutas")

    # 8. BUSES
    buses = [
        Bus(placa="ABC123", id_linea=linea1.id, id_ruta=ruta1.id,
            id_secretario=usuario_secretario.id, status="activa"),
        Bus(placa="DEF456", id_linea=linea1.id, status="activa"),
        Bus(placa="GHI789", id_linea=linea2.id, id_ruta=ruta2.id, status="activa"),
        Bus(placa="JKL012", id_linea=linea2.id, status="inactiva"),
        Bus(placa="MNO345", id_linea=linea1.id, status="activa"),
    ]
    for b in buses:
        db.session.add(b)
    db.session.commit()
    print(f"[OK] Buses: {len(buses)}")

    # 9. ESP32
    esp32s = [
        Esp32(mac="AA:BB:CC:11:22:33", tipo_dispositivo="bus",
              pass_hash=generate_password_hash("esp32pass1"),
              id_vehiculo=buses[0].id_vehiculo, version_firmware="1.0.0", status="activo"),
        Esp32(mac="DD:EE:FF:44:55:66", tipo_dispositivo="bus",
              pass_hash=generate_password_hash("esp32pass2"),
              id_vehiculo=buses[2].id_vehiculo, version_firmware="1.0.0", status="activo"),
        Esp32(mac="11:22:33:44:55:66", tipo_dispositivo="parada",
              pass_hash=generate_password_hash("esp32pass3"),
              id_parada=paradas[0].id, version_firmware="1.0.0", status="activo"),
        Esp32(mac="77:88:99:AA:BB:CC", tipo_dispositivo="parada",
              pass_hash=generate_password_hash("esp32pass4"),
              id_parada=paradas[3].id, version_firmware="1.0.0", status="activo"),
    ]
    for e in esp32s:
        db.session.add(e)
    db.session.commit()
    print(f"[OK] ESP32: {len(esp32s)}")

    print()
    print("=" * 60)
    print("DATOS DE PRUEBA INSERTADOS")
    print("=" * 60)
    print(f"Usuario admin: {tu_usuario.email}")
    print(f"Usuario secretario: {usuario_secretario.email}")
    print(f"Lineas: {linea1.id}, {linea2.id}")
    print(f"Rutas: {ruta1.id}, {ruta2.id}")
    print(f"Paradas: {len(paradas)}")
    print(f"Buses: {len(buses)}")
    print(f"ESP32: {len(esp32s)}")
    print()
    print("Credenciales:")
    print("  Admin:      mfrancelispineda@gmail.com / Admin123!")
    print("  Secretario: pedro.secretario@ejemplo.com / Secretario123!")
    print("=" * 60)