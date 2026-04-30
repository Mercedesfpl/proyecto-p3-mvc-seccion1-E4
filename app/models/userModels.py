# app/models/userModels.py
from typing import NamedTuple, Optional


class UserSession(NamedTuple):
    id: Optional[int] = None
    email: Optional[str] = None
    isAdmin: bool = False
    nombre: Optional[str] = None
    password: Optional[str] = None
