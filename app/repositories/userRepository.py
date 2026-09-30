# app/repositories/userRepository.py
from app.models.models import Usuario, PreRegistro
from ..extensions import db


class UserRepository:
    # Maneja todas las consultas a la base de datos para Usuarios

    @staticmethod
    def get_by_email(email):

        return Usuario.query.filter_by(email=email).first()

    @staticmethod
    def get_by_id(id_usuario):
        if id_usuario is None:
            return None
        return Usuario.query.get(id_usuario)

    @staticmethod
    def get_pre_register_by_id(id_usuario):
        return PreRegistro.query.get(id_usuario)

    @staticmethod
    def exists_by_email(email):
        return Usuario.query.filter_by(email=email).first() is not None

    @staticmethod
    def is_first_user():
        # Verifica si es el primer usuario del sistema
        return Usuario.query.count() == 0

    @staticmethod
    def save_usuario(usuario):
        db.session.add(usuario)
        db.session.commit()
        return usuario

    @staticmethod
    def save_pre_registro(pre_registro):
        db.session.add(pre_registro)
        db.session.commit()
        return pre_registro

    @staticmethod
    def delete_pre_registro(pre_registro):
        db.session.delete(pre_registro)
        db.session.commit()
        return pre_registro

    @staticmethod
    def update(usuario):
        db.session.commit()
        return usuario
