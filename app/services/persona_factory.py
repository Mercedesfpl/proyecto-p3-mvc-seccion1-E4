# app/services/persona_factory.py

from ..models.persona import Persona
from ..models.models import Usuario
from ..extensions import db  # <-- Importar db desde extensions
from ..models.exceptions import ResourceNotValid
from werkzeug.security import generate_password_hash
import re


class PersonaFactory:
    @staticmethod
    def crear_persona(data):
        """Valida y crea una instancia de Persona sin guardarla aún."""
        
        nombre = data.get("nombre")
        if not nombre:
            raise ResourceNotValid("Persona", "El nombre es requerido")
        
        apellido = data.get("apellido")
        if not apellido:
            raise ResourceNotValid("Persona", "El apellido es requerido")
        
        cedula = data.get("cedula")
        if not cedula:
            raise ResourceNotValid("Persona", "La cédula es requerida")
        
        if not cedula.isdigit():
            raise ResourceNotValid("Persona", "La cédula solo debe contener números")
        
        # Verificar cédula única (usando el modelo directamente)
        existing = Persona.query.filter_by(cedula=cedula).first()
        if existing:
            raise ResourceNotValid("Persona", "Ya existe una persona con esa cédula")
        
        rol = data.get("rol", "")
        if rol and rol not in ["admin", "presidente", "secretario"]:
            raise ResourceNotValid("Persona", f"Rol inválido: {rol}")
        
        correo = data.get("correo", "").strip()
        if correo:
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
                raise ResourceNotValid("Persona", "Formato de correo inválido")
            
            existing_email = Persona.query.filter_by(correo=correo).first()
            if existing_email:
                raise ResourceNotValid("Persona", "Ya existe una persona con ese correo")
        
        persona = Persona(
            nombre=nombre.strip(),
            apellido=apellido.strip(),
            cedula=cedula.strip(),
            correo=correo,
            telefono=data.get("telefono", "").strip(),
            rol=rol
        )
        
        return persona
    
    @staticmethod
    def crear_usuario(persona):
        """Crea un usuario para un secretario"""
        if persona.rol != "secretario":
            return None
        
        if not persona.correo:
            raise ResourceNotValid("Persona", "El correo es obligatorio para crear un secretario")
        
        existing_user = Usuario.query.filter_by(email=persona.correo).first()
        if existing_user:
            raise ResourceNotValid("Persona", "Ya existe un usuario con ese correo")
        
        usuario = Usuario(
            nombre=f"{persona.nombre} {persona.apellido}",
            email=persona.correo,
            password=generate_password_hash(persona.cedula),
            rol="secretario",
            persona_id=persona.id
        )
        
        return usuario