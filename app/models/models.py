from ..extensions import db
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
import re


class Usuario(db.Model, UserMixin):
    __tablename__ = "usuarios"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    # role = db.Column(db.String(20), default='usuario')
    # timestamp = db.Column(db.DateTime, default=datetime.now, index=True)

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
