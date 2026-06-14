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

@admin_scope.route("/lineas-page", methods=["GET"])
@jwt_required()
def lineas_page():
    return render_template("pages/lineas.html")

# ========== CRUD de Líneas ==========

@admin_scope.route("/lineas", methods=["GET"])
def get_lineas():
    """Obtener todas las líneas"""
    from app.controllers.lineaControllers import get_all_lineas
    return get_all_lineas()

@admin_scope.route("/lineas/<int:id_linea>", methods=["GET"])
def get_linea(id_linea):
    """Obtener una línea por ID"""
    from app.controllers.lineaControllers import get_linea_by_id
    return get_linea_by_id(id_linea)

@admin_scope.route("/lineas", methods=["POST"])
def create_linea():
    """Crear una nueva línea"""
    from flask import request
    from app.controllers.lineaControllers import create_linea
    from app.models.userModels import UserSession
    
    data = request.get_json()
    # Convertir los datos a un objeto similar a UserSession
    linea_data = {
        "nombre": data.get("nombre"),
        "presidente_nombre": data.get("presidente_nombre"),
        "presidente_cedula": data.get("presidente_cedula"),
        "telefono": data.get("telefono"),
        "rif": data.get("rif"),
        "secretario_id": data.get("secretario_id")
    }
    return create_linea(linea_data)

@admin_scope.route("/lineas/<int:id_linea>", methods=["PUT"])
def update_linea(id_linea):
    """Actualizar una línea existente"""
    from flask import request
    from app.controllers.lineaControllers import update_linea
    from app.models.userModels import UserSession
    
    data = request.get_json()
    linea_data = {
        "nombre": data.get("nombre"),
        "presidente_nombre": data.get("presidente_nombre"),
        "presidente_cedula": data.get("presidente_cedula"),
        "telefono": data.get("telefono"),
        "rif": data.get("rif"),
        "secretario_id": data.get("secretario_id")
    }
    return update_linea(id_linea, linea_data)

@admin_scope.route("/lineas/<int:id_linea>", methods=["DELETE"])
def delete_linea(id_linea):
    """Suspender una línea"""
    from app.controllers.lineaControllers import delete_linea
    return delete_linea(id_linea)