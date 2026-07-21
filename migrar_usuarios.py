# migrar_usuarios.py
from app import app
from app.extensions import db
from app.models.models import Usuario
from app.models.persona import Persona

with app.app_context():
    usuarios = Usuario.query.all()
    contador = 0
    
    for user in usuarios:
        # Verificar si ya existe una persona con ese email
        existe = Persona.query.filter_by(correo=user.email).first()
        if not existe:
            nombre_partes = user.nombre.split() if user.nombre else [""]
            persona = Persona(
                nombre=nombre_partes[0] if nombre_partes else "",
                apellido=" ".join(nombre_partes[1:]) if len(nombre_partes) > 1 else "",
                cedula=f"PENDIENTE_{user.id}",
                correo=user.email,
                telefono=None,
                fecha_nac=None
            )
            db.session.add(persona)
            db.session.flush()  # Para obtener el id de persona
            user.persona_id = persona.id
            contador += 1
    
    db.session.commit()
    print(f"✅ Migración completada: {contador} usuarios migrados a personas")