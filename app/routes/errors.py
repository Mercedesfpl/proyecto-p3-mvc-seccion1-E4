# app/routes/errors.py
from flask import jsonify, Blueprint, Response
from ..models.exceptions import (
    UserAlreadyExists,
    UserNotFound,
    UserNotValid,
    ResourceNotFound,
    ResourceAlreadyExists,
    ResourceNotValid,
    Unauthorized,
)

errors_scope = Blueprint("errors", __name__)


def __generate_error_response(error: Exception) -> Response:
    # Capturamos el nombre de la clase y el mensaje
    message = {
        "success": False,
        "ErrorType": type(error).__name__,
        "message": str(error),
    }
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


@errors_scope.app_errorhandler(ResourceNotFound)
def handle_not_found(error):
    return jsonify({"ErrorType": type(error).__name__, "Message": str(error)}), 404


@errors_scope.app_errorhandler(ResourceAlreadyExists)
def handle_conflict(error):
    return jsonify({"ErrorType": type(error).__name__, "Message": str(error)}), 409


@errors_scope.app_errorhandler(ResourceNotValid)
def handle_bad_request(error):
    return jsonify({"ErrorType": type(error).__name__, "Message": str(error)}), 400


@errors_scope.app_errorhandler(Unauthorized)
def handle_unauthorized(error):
    return (
        jsonify(
            {"success": False, "ErrorType": type(error).__name__, "Message": str(error)}
        ),
        401,
    )
