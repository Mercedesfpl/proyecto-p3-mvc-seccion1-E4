# connection.py
from typing import Any, List, Optional
from sqlalchemy import text
from ..extensions import db
from ..models import (
    Usuario,
    PreRegistro,
    Linea,
    Persona,
)  # Ajusta la ruta según tu proyecto

# ============================================================
# Funciones ORM (recomendadas para la mayoría de casos)
# ============================================================


def obtener_usuario_por_email(email: str) -> Optional[Usuario]:
    """Retorna un objeto Usuario o None."""
    return Usuario.query.filter_by(email=email).first()


def obtener_usuario_por_id(user_id: int, pre_register: bool = False):
    """Retorna un usuario por su ID.para buscar en pre register Colocar el parametro pre_register en True"""
    if pre_register:

        return PreRegistro.query.get(user_id)
    else:
        return Usuario.query.get(user_id)


def listar_usuarios() -> List[Usuario]:
    """Retorna todos los usuarios."""
    return Usuario.query.all()


def agregar_elemento(elemento) -> None:
    """Guarda (inserta o actualiza) un usuario en la BD."""
    try:
        db.session.add(elemento)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error al guardar: {e}")
        return False


def eliminar_usuario(usuario: Usuario) -> None:
    """Elimina un usuario de la BD."""
    db.session.delete(usuario)


def eliminar_pre_registro(pre_user: PreRegistro) -> None:
    """Elimina un usuario de la tabla pre_registro"""
    db.session.delete(pre_user)


def eliminar_pre_usuario_por_email(email: str) -> bool:
    """Elimina un usuario pre registrado por email. Retorna True si existía."""
    usuario = PreRegistro.query.filter_by(email=email).first()
    if usuario:
        db.session.delete(usuario)
        return True
    return False


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


def get_all_lineas() -> List[Linea]:

    lineas = Linea.query.filter_by(suspendido=False).all()
    return lineas


def get_linea_by_id(id_linea: int) -> List[Linea]:

    linea = Linea.query.get(id_linea)
    return linea


def get_personas_all() -> List[Persona]:
    personas = Persona.query.all()
    return personas


def get_persona_by_id(id_persona: int) -> List[Persona]:
    return Persona.query.get(id_persona)


def get_users_by_rol(rol: str) -> List[Usuario]:
    """Obtener lista de usurio segun su rol"""
    return Persona.query.filter_by(rol=rol).all()


def verificar_existencia_linea(nombre: str):

    Linea.query.filter_by(nombre=nombre).first()
