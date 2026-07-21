from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from flask_login import login_user
from ..models.userModels import UserSession
from datetime import datetime, timedelta


def get_access_token(userData: UserSession) -> UserSession:
    datos_adicionales = {"rol": userData.rol}
    access_token = create_access_token(
        identity=str(userData.id), additional_claims=datos_adicionales
    )
    return access_token


def get_refresh_token(id_user):
    refresh_token = create_refresh_token(identity=str(id_user))
    return refresh_token


def unset_cookiess(response):
    unset_jwt_cookies(response)
    response.delete_cookie("session")
    return response


def esta_bloqueado(bloqueado_hasta):
    if bloqueado_hasta and datetime.now() < bloqueado_hasta:
        return True
    else:
        return False
