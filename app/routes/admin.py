from flask import Blueprint, url_for, redirect, render_template, jsonify
from flask_jwt_extended import (
    jwt_required,
)
from ..controllers import userControllers

admin_scope = Blueprint("admin", __name__)


@admin_scope.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboar_show():

    return userControllers.show_dashboar()


@admin_scope.route("/flota", methods=["GET"])
@jwt_required()
def flota_show():

    return userControllers.show_flota()


@admin_scope.route("/reportes", methods=["GET"])
@jwt_required()
def reportes_show():

    return userControllers.show_reportes()


@admin_scope.route("/rutas", methods=["GET"])
@jwt_required()
def rutas_show():

    return userControllers.show_rutas()


@admin_scope.route("/form-muestra", methods=["GET"])
@jwt_required()
def form_muestra():
    return render_template("pages/form-muestra.html")


@admin_scope.route("/test-401")
@jwt_required()  # O simplemente retorna 401 directamente
def test_401():
    return jsonify({"msg": "Simulated 401"}), 401
