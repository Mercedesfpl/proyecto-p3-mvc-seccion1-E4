#admin.py
from flask import Blueprint, url_for, redirect, render_template, jsonify
from flask_jwt_extended import jwt_required
from ..controllers import userControllers
from app.decorators.role_decorator import role_required
from ..helpers.makeResponse import success_response

admin_scope = Blueprint("admin", __name__)


# Solo admin puede ver el dashboard global
@admin_scope.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required('admin')
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

# Solo admin puede gestionar líneas
@admin_scope.route("/lineas-page", methods=["GET"])
@jwt_required()
@role_required('admin')
def lineas_page():
    return render_template("pages/lineas.html")

# app/routes/admin.py

# ========== CRUD de Líneas ==========

@admin_scope.route("/lineas", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_lineas():
    from app.controllers.lineaControllers import get_all_lineas
    return get_all_lineas()

@admin_scope.route("/lineas/<int:id_linea>", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_linea(id_linea):
    from app.controllers.lineaControllers import get_linea_by_id
    return get_linea_by_id(id_linea)

@admin_scope.route("/lineas", methods=["POST"])
@jwt_required()
@role_required('admin')
def create_linea():
    from flask import request
    from app.controllers.lineaControllers import create_linea
    data = request.get_json()
    return create_linea(data)

@admin_scope.route("/lineas/<int:id_linea>", methods=["PUT"])
@jwt_required()
@role_required('admin')
def update_linea(id_linea):
    from flask import request
    from app.controllers.lineaControllers import update_linea
    data = request.get_json()
    return update_linea(id_linea, data)

@admin_scope.route("/lineas/<int:id_linea>", methods=["DELETE"])
@jwt_required()
@role_required('admin')
def delete_linea(id_linea):
    from app.controllers.lineaControllers import delete_linea
    return delete_linea(id_linea)

# ========== OBTENER PERSONAS PARA SELECTS ==========
@admin_scope.route("/personas/select", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_personas_select():
    from app.controllers.lineaControllers import get_personas_disponibles
    return get_personas_disponibles()

@admin_scope.route("/secretarios/select", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_secretarios_select():
    from app.controllers.lineaControllers import get_secretarios_disponibles
    return get_secretarios_disponibles()

#api personas

# ========== VISTAS (HTML) ==========
@admin_scope.route("/personas-page", methods=["GET"])
@jwt_required()
@role_required('admin')
def personas_page():
    return render_template("pages/personas.html")

# ========== API PERSONAS ==========
@admin_scope.route("/personas", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_personas():
    from app.controllers.personaControllers import get_all_personas
    return get_all_personas()

@admin_scope.route("/personas/<int:id>", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_persona(id):
    from app.controllers.personaControllers import get_persona_by_id
    return get_persona_by_id(id)

@admin_scope.route("/personas", methods=["POST"])
@jwt_required()
@role_required('admin')
def create_persona():
    from flask import request
    from app.controllers.personaControllers import create_persona
    data = request.get_json()
    return create_persona(data)

@admin_scope.route("/personas/<int:id>", methods=["PUT"])
@jwt_required()
@role_required('admin')
def update_persona(id):
    from flask import request
    from app.controllers.personaControllers import update_persona
    data = request.get_json()
    return update_persona(id, data)

@admin_scope.route("/personas/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required('admin')
def delete_persona(id):
    from app.controllers.personaControllers import delete_persona
    return delete_persona(id)