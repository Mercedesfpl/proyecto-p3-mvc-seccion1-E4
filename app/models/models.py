from ..extensions import db
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
import re
import random, secrets
from datetime import datetime, timedelta


class Usuario(db.Model, UserMixin):
    __tablename__ = "usuarios"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    rol = db.Column(db.String(20), default="usuario")
    reset_code = db.Column(db.String(10), nullable=True)  # Código de 6 dígitos
    reset_code_expires = db.Column(db.DateTime, nullable=True)  # Fecha de expiración
    timestamp = db.Column(db.DateTime, default=datetime.now, index=True)

    def verificar_password(self, passwordPlano):
        """El modelo valida su password."""
        return check_password_hash(self.password, passwordPlano)

    def set_name(self, nombre):
        """Da formato al atributo nombre"""
        self.nombre = nombre.strip().capitalize()

    def a_sesion(self):
        """devuelve un objeto del tipo userSession"""
        from .userModels import UserSession

        return UserSession(id=self.id, email=self.email, isAdmin=self.isAdmin)

    def formatPass(passwordPlano):
        """Verifica si el formato cumple con las valdaciones propias del modelo"""

        if len(passwordPlano) < 8 or len(passwordPlano) > 15:
            return False
        if not any(c.isupper() for c in passwordPlano):
            return False

        if not any(c.islower() for c in passwordPlano):
            return False

        if not any(c.isdigit() for c in passwordPlano):
            return False

        if not any(c in "!@#$%&/" for c in passwordPlano):
            return False

        return True

    def formatEmail(userEmail):
        """erifica si el formato cumple con las valdaciones propias del modelo"""
        patron = r"^[a-z0-9_.+-]+@[a-z0-9-]+\.[a-z0-9-.]*[a-z0-9]+$"
        return bool(re.match(patron, userEmail, re.IGNORECASE))

    def generateHass(self, passwordPlano):
        """Genera el hass de la clave"""
        self.password = generate_password_hash(passwordPlano)

    def generate_reset_code(self):
        """Genera un código aleatorio único de 6 dígitos."""
        self.reset_code = f"{random.randint(100000, 999999)}"
        self.reset_code_expires = datetime.now() + timedelta(minutes=10)
        return self.reset_code

    def verify_reset_code(self, code):
        """Verifica si el código proporcionado es válido y no ha expirado."""
        print(
            "el codigo----->",
            code,
            "  El codigo de la bd------>",
            self.reset_code,
            "El codigo expirados----->",
            self.reset_code_expires,
        )
        db_code = str(self.reset_code)
        input_code = str(code)
        if self.reset_code and self.reset_code_expires:
            if (
                secrets.compare_digest(db_code, input_code)
                and datetime.now() < self.reset_code_expires
            ):
                return True
        return False

    def clear_reset_code(self):
        """Limpia el código de recuperación después de usarlo."""
        self.reset_code = None
        self.reset_code_expires = None
