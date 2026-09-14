from app.repositories.userRepository import UserRepository
from app.models.exceptions import ResourceNotFound

class ConfiguracionServices:
    @staticmethod
    def update_configuracion(user_id, data):
        usuario = UserRepository.get_by_id(user_id)
        if not usuario:
            raise ResourceNotFound("Usuario no encontrado")
        if 'tema' in data:
            usuario.tema = data['tema']
            UserRepository.update(usuario)
            return {
                "tema": usuario.tema,
            }
    @staticmethod
    def get_configuracion(user_id):
        usuario = UserRepository.get_by_id(user_id)
        if not usuario:
            raise ResourceNotFound("Usuario no encontrado")
        return {
            "tema": usuario.tema or 'claro',
            "notificaciones": getattr(usuario, 'notificaciones', 'activadas')
        }