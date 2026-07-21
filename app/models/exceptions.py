# app/models/exceptions.py
class UserError(Exception):
    """Clase base para excepciones de usuario"""

    pass


class UserNotFound(UserError):
    """Lanzada cuando el usuario no existe (HTTP 404)"""

    def __init__(self, message="Usuario no encontrado"):
        self.message = message
        super().__init__(self.message)


class UserAlreadyExists(UserError):
    """Lanzada cuando el email ya está registrado (HTTP 409)"""

    def __init__(self, message="El correo electrónico ya está en uso"):
        self.message = message
        super().__init__(self.message)


class UserNotValid(UserError):
    """Lanzada cuando los datos no pasan la validación (HTTP 400/409)"""

    def __init__(self, message="Los datos del usuario no son válidos"):
        self.message = message
        super().__init__(self.message)


# exceptions.py
class ResourceError(Exception):
    """Base para errores de recursos"""

    pass


class ResourceNotFound(ResourceError):
    """Excepción para un recorso que no se encuentra"""

    def __init__(self, nombre_del_recurso, identificador=None):
        msg = f"{nombre_del_recurso} no encontrado" + (
            f": {identificador}" if identificador else ""
        )
        super().__init__(msg)


class ResourceAlreadyExists(ResourceError):
    """Excepción"""

    def __init__(self, nombre_del_recurso, identificador):
        super().__init__(f"{nombre_del_recurso} ya existe: {identificador}")


class ResourceNotValid(ResourceError):
    """Excepción para un recurso invalido"""

    def __init__(self, nombre_del_recurso, rason):
        super().__init__(f"{rason}")


class Unauthorized(ResourceError):
    def __init__(self, nombre_del_recurso, rason):
        super().__init__(f"{rason}")
