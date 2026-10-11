# limpiar_bd.py
from app import create_app
from app.extensions import db

app = create_app()

EMAIL_USUARIO_A_CONSERVAR = "mfrancelispineda@gmail.com"

with app.app_context():
    from sqlalchemy import text

    print("=" * 60)
    print("LIMPIANDO BASE DE DATOS")
    print("=" * 60)
    print(f"Conservando usuario: {EMAIL_USUARIO_A_CONSERVAR}")
    print()

    tablas = [
        "detecciones",
        "ruta_parada",
        "esp32",
        "buses",
        "rutas",
        "paradas",
        "lineas",
        "personas",
    ]

    for tabla in tablas:
        try:
            result = db.session.execute(text(f"DELETE FROM {tabla}"))
            db.session.commit()
            print(f"[OK] {tabla}: {result.rowcount} filas eliminadas")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] {tabla}: {e}")

    try:
        result = db.session.execute(
            text("DELETE FROM usuarios WHERE email != :email"),
            {"email": EMAIL_USUARIO_A_CONSERVAR}
        )
        db.session.commit()
        print(f"[OK] usuarios: {result.rowcount} filas eliminadas")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] usuarios: {e}")

    try:
        result = db.session.execute(text("DELETE FROM pre_registros"))
        db.session.commit()
        print(f"[OK] pre_registros: {result.rowcount} filas eliminadas")
    except Exception as e:
        db.session.rollback()
        print(f"[WARN] pre_registros: {e}")

    print()
    print("=" * 60)
    print("BASE DE DATOS LIMPIA")
    print("=" * 60)