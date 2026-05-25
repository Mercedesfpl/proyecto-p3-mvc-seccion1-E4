from flask import Blueprint, url_for, redirect, render_template
from flask_jwt_extended import (
    jwt_required,
)
from ..controllers import userControllers

admin_scope = Blueprint("admin", __name__)


@admin_scope.route("/dashboard", methods=["GET"])
def dashboar_show():

    return userControllers.show_dashboar()


@admin_scope.route("/flota", methods=["GET"])
def flota_show():

    return userControllers.show_flota()


@admin_scope.route("/reportes", methods=["GET"])
def reportes_show():

    return userControllers.show_reportes()


@admin_scope.route("/rutas", methods=["GET"])
def rutas_show():

    return userControllers.show_rutas()

@admin_scope.route("/form-muestra", methods=["GET"])
def form_muestra():
    return render_template("pages/form-muestra.html")