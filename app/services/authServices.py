from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from flask_login import login_user


def get_access_token(id_user):
    access_token = create_access_token(identity=str(id_user))
    return access_token


def get_refresh_token(id_user):
    refresh_token = create_refresh_token(identity=str(id_user))
    return refresh_token


def unset_cookiess(response):
    unset_jwt_cookies(response)
