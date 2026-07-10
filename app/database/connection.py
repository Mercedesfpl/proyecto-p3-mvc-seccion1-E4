# app/database/connection.py

from typing import List, Optional
from sqlalchemy import text
from ..extensions import db
from ..models import Usuario, PreRegistro, Linea, Persona, Parada


# ============================================================
# FUNCIONES PARA USUARIOS
# ============================================================

def obtener_usuario_por_email(email: str) -> Optional[Usuario]:
    """Retorna un objeto Usuario o None."""
    return Usuario.query.filter_by(email=email).first()


def obtener_usuario_por_id(user_id: int, pre_register: bool = False):
    """Retorna un usuario por su ID. Para buscar en pre_registro colocar pre_register=True"""
    if pre_register:
        return PreRegistro.query.get(user_id)
    else:
        return Usuario.query.get(user_id)


def listar_usuarios() -> List[Usuario]:
    """Retorna todos los usuarios."""
    return Usuario.query.all()


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


def get_users_by_rol(rol: str) -> List[Persona]:
    """Obtener personas según su rol"""
    return Persona.query.filter_by(rol=rol).all()


# ============================================================
# FUNCIONES PARA LÍNEAS
# ============================================================

def get_all_lineas() -> List[Linea]:
    """Retorna todas las líneas no suspendidas"""
    return Linea.query.filter_by(suspendido=False).all()


def get_linea_by_id(id_linea: int) -> Optional[Linea]:
    """Retorna una línea por ID"""
    return Linea.query.get(id_linea)


def verificar_existencia_linea(nombre: str) -> Optional[Linea]:
    """Verifica si existe una línea con ese nombre"""
    return Linea.query.filter_by(nombre=nombre).first()


def get_lineas_by_presidente(id_persona: int) -> List[Linea]:
    """Retorna líneas donde una persona es presidente"""
    return Linea.query.filter_by(presidente_id=id_persona, suspendido=False).all()


# ============================================================
# FUNCIONES PARA PERSONAS
# ============================================================

def get_all_personas() -> List[Persona]:
    """Retorna todas las personas"""
    return Persona.query.all()


def get_persona_by_id(id_persona: int) -> Optional[Persona]:
    """Retorna una persona por ID"""
    return Persona.query.get(id_persona)


def get_personas_all() -> List[Persona]:
    """Retorna todas las personas (alias de get_all_personas)"""
    return Persona.query.all()


def get_persona_by_cedula(cedula: str) -> Optional[Persona]:
    """Retorna una persona por cédula"""
    return Persona.query.filter_by(cedula=cedula).first()


def get_persona_by_email(email: str) -> Optional[Persona]:
    """Retorna una persona por correo"""
    return Persona.query.filter_by(correo=email).first()


# ============================================================
# FUNCIONES GENÉRICAS (CRUD)
# ============================================================

def agregar_elemento(elemento) -> bool:
    """Guarda un elemento en la BD"""
    try:
        db.session.add(elemento)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error al guardar: {e}")
        return False


def guardar_datos() -> bool:
    """Guarda los cambios en la BD"""
    try:
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error al guardar: {e}")
        return False
    
# ============================================================
# FUNCIONES PARA PARADAS
# ============================================================

def get_all_paradas() -> List[Parada]:
    """Retorna todas las paradas"""
    return Parada.query.all()


def get_parada_by_id(id_parada: int) -> Optional[Parada]:
    """Retorna una parada por ID"""
    return Parada.query.get(id_parada)


def get_parada_by_nombre(nombre: str) -> Optional[Parada]:
    """Retorna una parada por nombre"""
    return Parada.query.filter_by(nombre=nombre).first()


def get_paradas_activas() -> List[Parada]:
    """Retorna solo paradas activas"""
    return Parada.query.filter_by(status="activa").all()


def get_paradas_by_ids(ids: List[int]) -> List[Parada]:
    """Retorna paradas por lista de IDs"""
    return Parada.query.filter(Parada.id.in_(ids)).all()