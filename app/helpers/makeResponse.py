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
