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
