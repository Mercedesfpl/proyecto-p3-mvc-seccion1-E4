from flask import jsonify, make_response
from flask_jwt_extended import set_access_cookies


def success_response(data=None, message="OK", status_code=200, cookies=None):
    """
    Retorna una respueta de exito y verifica si tiene cookies para agregar a la respuesta
    """
    response = make_response(
        jsonify({"success": True, "message": message, "data": data}), status_code
    )
    if cookies:
        set_access_cookies(response, cookies)
    return response


def error_response(
    data=None, error="", message="Ha ocurrido un error interno", status_code=500
):
    """Retorna una respuesta de error. Tiene estatus 500 por defecto"""
    response = make_response(
        jsonify({"success": False, "message": message, "error": error, "data": data}),
        status_code,
    )
    return response
