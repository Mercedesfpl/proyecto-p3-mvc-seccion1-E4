# connection.py
from typing import Any, List, Optional
from sqlalchemy import text
from ..extensions import db
from ..models.models import Usuario  # Ajusta la ruta según tu proyecto

# ============================================================
# Funciones ORM (recomendadas para la mayoría de casos)
# ============================================================


def obtener_usuario_por_email(email: str) -> Optional[Usuario]:
    """Retorna un objeto Usuario o None."""
    return Usuario.query.filter_by(email=email).first()


def obtener_usuario_por_id(user_id: int) -> Optional[Usuario]:
    """Retorna un usuario por su ID."""
    return Usuario.query.get(user_id)


def listar_usuarios() -> List[Usuario]:
    """Retorna todos los usuarios."""
    return Usuario.query.all()


def guardar_usuario(usuario: Usuario) -> None:
    """Guarda (inserta o actualiza) un usuario en la BD."""
    try:
        db.session.add(usuario)
        db.session.commit()
        return True
    except:
        db.session.rollback()
        return False


def eliminar_usuario(usuario: Usuario) -> None:
    """Elimina un usuario de la BD."""
    db.session.delete(usuario)


def eliminar_usuario_por_email(email: str) -> bool:
    """Elimina un usuario por email. Retorna True si existía."""
    usuario = Usuario.query.filter_by(email=email).first()
    if usuario:
        db.session.delete(usuario)
        return True
    return False


def buscar_una_fila() -> bool:
    """Busca una fila en la tabla usuario devuelve false si no encuentra nada"""
    return Usuario.query.first() is None


def guardar_datos() -> bool:
    """Permite hacer un comit"""
    try:
        db.session.commit()
        return True
    except:
        db.session.rollback()
        return False
