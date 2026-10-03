from app import create_app
from app.extensions import db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tablas = inspector.get_table_names()
    print("Tablas en la BD:", tablas)
    if "ruta_parada" in tablas:
        print("✅ La tabla 'ruta_parada' existe.")
        columnas = [c["name"] for c in inspector.get_columns("ruta_parada")]
        print("Columnas:", columnas)
    else:
        print("❌ La tabla 'ruta_parada' NO existe. Hay que crearla.")