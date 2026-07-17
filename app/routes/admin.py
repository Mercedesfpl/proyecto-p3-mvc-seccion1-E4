# admin.py
from flask import Blueprint, url_for, redirect, render_template, jsonify, request

from flask_jwt_extended import jwt_required, get_jwt
from ..controllers import userControllers, lineaControllers
from app.decorators.role_decorator import role_required

admin_scope = Blueprint("admin", __name__)


# Solo admin puede ver el dashboard global
@admin_scope.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("admin")
def dashboar_show():
    return userControllers.show_dashboard()


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


# Solo admin puede gestionar líneas
@admin_scope.route("/lineas-page", methods=["GET"])
@jwt_required()
@role_required("admin")
def lineas_page():
    return render_template("pages/lineas.html")


# app/routes/admin.py

# ========== CRUD de Líneas ==========


@admin_scope.route("/lineas", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_lineas():

    return lineaControllers.get_lineas()


@admin_scope.route("/lineas/<int:id_linea>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_linea(id_linea):

    return lineaControllers.get_linea_by_id(id_linea)


@admin_scope.route("/lineas", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_linea():

    data = request.get_json()
    return lineaControllers.create_linea(data=data)


@admin_scope.route("/lineas/<int:id_linea>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_linea(id_linea):

    data = request.get_json()
    return lineaControllers.update_linea(id_linea, data)


@admin_scope.route("/lineas/<int:id_linea>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_linea(id_linea):

    return lineaControllers.delete_linea(id_linea)


# ========== OBTENER PERSONAS PARA SELECTS ==========
@admin_scope.route("/personas/select", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_personas_select():

    return lineaControllers.get_personas_disponibles()


@admin_scope.route("/secretarios/select", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_secretarios_select():

    return lineaControllers.get_secretarios_disponibles()


# api personas


# ========== VISTAS (HTML) ==========
@admin_scope.route("/personas-page", methods=["GET"])
@jwt_required()
@role_required("admin")
def personas_page():
    return render_template("pages/personas.html")


# ========== API PERSONAS ==========
@admin_scope.route("/personas", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_personas():
    from app.controllers.personaControllers import get_all_personas

    return get_all_personas()


@admin_scope.route("/personas/<int:id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_persona(id):
    from app.controllers.personaControllers import get_persona_by_id

    return get_persona_by_id(id)


@admin_scope.route("/personas", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_persona():
    from flask import request
    from app.controllers.personaControllers import create_persona

    data = request.get_json()
    return create_persona(data)


@admin_scope.route("/personas/<int:id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_persona(id):
    from flask import request
    from app.controllers.personaControllers import update_persona

    data = request.get_json()
    return update_persona(id, data)


@admin_scope.route("/personas/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_persona(id):
    from app.controllers.personaControllers import delete_persona

    return delete_persona(id)


# ========== CRUD de Paradas ==========


@admin_scope.route("/paradas", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_paradas():
    from app.controllers.paradaControllers import get_all_paradas

    return get_all_paradas()


@admin_scope.route("/paradas/<int:id_parada>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_parada(id_parada):
    from app.controllers.paradaControllers import get_parada_by_id

    return get_parada_by_id(id_parada)


@admin_scope.route("/paradas", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_parada():
    from flask import request
    from app.controllers.paradaControllers import create_parada

    data = request.get_json()
    return create_parada(data)


@admin_scope.route("/paradas/<int:id_parada>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_parada(id_parada):
    from flask import request
    from app.controllers.paradaControllers import update_parada

    data = request.get_json()
    return update_parada(id_parada, data)


@admin_scope.route("/paradas/<int:id_parada>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_parada(id_parada):
    from app.controllers.paradaControllers import delete_parada

    return delete_parada(id_parada)


@admin_scope.route("/paradas-page", methods=["GET"])
@jwt_required()
@role_required("admin")
def paradas_page():
    return render_template("pages/paradas.html")
