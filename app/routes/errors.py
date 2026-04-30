from flask import jsonify, Blueprint, Response
from ..models.exceptions import UserAlreadyExists, UserNotFound, UserNotValid

errors_scope = Blueprint("errors", __name__)


def __generate_error_response(error: Exception) -> Response:
    # Capturamos el nombre de la clase y el mensaje
    message = {"ErrorType": type(error).__name__, "Message": str(error)}
    return jsonify(message)


# Manejo específico para 404 (Objeto no encontrado)
@errors_scope.app_errorhandler(UserNotFound)
@errors_scope.app_errorhandler(404)
def handle_not_found(error) -> Response:
    response = __generate_error_response(error)
    response.status_code = 404
    return response


# Manejo para conflictos de lógica de negocio (409 Conflict)
@errors_scope.app_errorhandler(UserAlreadyExists)
def handle_conflict(error: Exception) -> Response:
    response = __generate_error_response(error)
    response.status_code = 409
    return response


# Manejo para datos inválidos (400 Bad Request)
@errors_scope.app_errorhandler(UserNotValid)
def handle_bad_request(error: Exception) -> Response:
    response = __generate_error_response(error)
    response.status_code = 400
    return response
