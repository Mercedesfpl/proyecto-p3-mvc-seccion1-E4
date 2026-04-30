# connection.py
from contextlib import contextmanager
from typing import Any, Iterator, List, Optional

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from ..extensions import db


from extensions import db


@contextmanager
def __get_session() -> Iterator:
    """
    Contexto que proporciona una sesión de SQLAlchemy.
    - Si todo sale bien, se hace commit.
    - Si hay excepción, se hace rollback.
    - Siempre se cierra la sesión al final.
    """
    session = db.session
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _fetch_one(query: str, parameters: Optional[List[Any]] = None) -> Any:
    """
    Ejecuta una consulta SQL y retorna una sola fila.
    """
    if parameters is None:
        parameters = []

    with __get_session() as session:
        result = session.execute(text(query), parameters)
        row = result.fetchone()
        return row


def _fetch_all(query: str, parameters: Optional[List[Any]] = None) -> List:
    """
    Ejecuta una consulta SQL y retorna todas las filas.
    """
    if parameters is None:
        parameters = []

    with __get_session() as session:
        result = session.execute(text(query), parameters)
        return result.fetchall()


def _fetch_none(query: str, parameters: Optional[List[Any]] = None) -> None:
    """
    Ejecuta una consulta SQL que no retorna filas (INSERT, UPDATE, DELETE).
    """
    if parameters is None:
        parameters = []

    with __get_session() as session:
        session.execute(text(query), parameters)


def _fetch_lastrow_id(query: str, parameters: Optional[List[Any]] = None) -> int:
    """
    Ejecuta un INSERT que debe tener la cláusula 'RETURNING id' (o el nombre de tu PK).
    Retorna el valor de la columna retornada.
    """
    if parameters is None:
        parameters = []

    with __get_session() as session:
        result = session.execute(text(query), parameters)

        row = result.fetchone()
        if row is None:
            raise ValueError(
                "La consulta no retornó ningún id. Asegúrate de usar 'RETURNING id'."
            )
        return row[0]
