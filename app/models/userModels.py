# app/models/userModels.py
from typing import NamedTuple, Optional
from datetime import datetime


class UserSession(NamedTuple):
    id: Optional[int] = None
    email: Optional[str] = None
    isAdmin: bool = False
    nombre: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = "usuario"
    intentos_fallidos: int = 0
    bloqueado_hasta: Optional[datetime] = None
