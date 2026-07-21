# app/models/persona.py
from app.extensions import db
from datetime import datetime

class Persona(db.Model):
    __tablename__ = "personas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    correo = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    fecha_nac = db.Column(db.Date, nullable=True)
    rol = db.Column(db.String(20), nullable=True)  # 'admin', 'presidente' o 'secretario'
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    usuario = db.relationship("Usuario", back_populates="persona", uselist=False)
    
    def to_dict(self, include_usuario=False):

        def _iso(dt):
            if dt is None:
                return None
            if isinstance(dt, datetime):
                return dt.isoformat()
            return str(dt)

        data =  {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "nombre_completo": f"{self.nombre} {self.apellido}",
            "cedula": self.cedula,
            "correo": self.correo,
            "telefono": self.telefono,
            "rol": self.rol,  # <-- Ya incluye 'admin'
            "fecha_nac": _iso(getattr(self, "fecha_nac", None)),
            "created_at": _iso(getattr(self, "created_at", None)),
        }

        if include_usuario:
            try:
                usuario = getattr(self, "usuario", None)
                if usuario and hasattr(usuario, "to_dict"):
                    data["usuario"] = usuario.to_dict()
                else:
                    data["usuario"] = None
            except Exception:
                data["usuario"] = None

        return data