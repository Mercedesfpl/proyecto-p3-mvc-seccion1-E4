# app/controllers/lineaControllers.py
from ..services.linea_factory import LineaFactory
from ..models.exceptions import ResourceNotValid, ResourceNotFound
from ..helpers.makeResponse import success_response, error_response
from flask import jsonify

from ..database.connection import (
    get_all_lineas,
    get_linea_by_id,
    get_personas_all,
    obtener_usuario_por_id,
    agregar_elemento,
    get_persona_by_id,
    guardar_datos,
    get_users_by_rol,
)


def get_lineas():
    """Obtener todas las líneas (no suspendidas)"""
    lineas = get_all_lineas()
    resultado = [
        {
            "id": l.id,
            "nombre": l.linea_nombre,
            "presidente": l.presidente_nombre,
            "secretario_nombre": l.secretario_nombre,
            "rif": l.rif,
        }
        for l in lineas
    ]
    return success_response(data=resultado)


def get_linea_by_id(id_linea):
    """Obtener una línea por ID"""
    lineas = get_linea_by_id(id_linea=id_linea)
    resultado = [{"id": l.id, "nombre": l.nombre} for l in lineas]
    return success_response(resultado)


def get_personas_disponibles():
    """Obtener todas las personas para los selects"""
    try:
        usuarios = get_personas_all()

        if not usuarios:
            # Opción A: Retornar lista vacía con código 200
            raise ResourceNotFound(nombre_del_recurso="Personas")
            # Opción B: Retornar un mensaje informativo
            # return jsonify({"message": "No hay usuarios registrados"}), 404

        # Transformar la lista de objetos a un formato JSON serializable
        resultado = [
            {"id": u.id, "nombre": u.nombre, "cedula": u.cedula, "rol": u.rol}
            for u in usuarios
        ]
        return success_response(resultado)

    except Exception as e:
        # Valida si hubo un error de conexión o de base de datos
        return error_response(
            error=str(e), message="Ha ocurrido un fallo inesperado", status_code=500
        )


def create_linea(data):

    # Delegar creación a la fábrica
    nueva_linea = LineaFactory.crear_linea(data)
    # Guardar
    if agregar_elemento(
        nueva_linea
    ):  # asumo que esta función guarda y retorna True/False
        return success_response(
            message="Línea creada exitosamente", data=nueva_linea.to_dict()
        )
    else:
        return error_response(message="error al guardar el recurso", status_code=503)


def update_linea(id_linea, data):
    """Actualizar una línea existente"""
    try:
        print("Datos recibidos para actualizar:", data)

        linea = get_linea_by_id(id_linea)
        if not linea or linea.suspendido:
            raise ResourceNotFound(nombre_del_recurso="Linea")

        # Actualizar campos
        if "nombre" in data:
            linea.nombre = data["nombre"].strip()
        if "rif" in data:
            linea.rif = data["rif"].strip()
        if "presidente_id" in data:
            presidente = get_persona_by_id(data["presidente_id"])
            if not presidente:
                raise ResourceNotFound("Presidente")
            linea.presidente_id = data["presidente_id"]
        if "secretario_id" in data:
            if data["secretario_id"]:
                secretario = obtener_usuario_por_id(data["secretario_id"])
                if not secretario:
                    raise ResourceNotFound("Secretario")
            linea.secretario_id = data["secretario_id"]

        if guardar_datos():
            return success_response(
                message="Línea actualizada exitosamente", data=linea.to_dict()
            )

    except Exception as e:
        return jsonify({"error": f"Error al actualizar línea: {str(e)}"}), 500


def delete_linea(id_linea):
    """Suspender una línea (no se elimina físicamente)"""
    try:
        linea = get_linea_by_id(id_linea=id_linea)
        if not linea:
            raise ResourceNotFound("Linea")

        linea.suspendido = True
        if guardar_datos():
            return success_response(message="Línea suspendida exitosamente")

    except Exception as e:

        return jsonify({"error": f"Error al suspender línea: {str(e)}"}), 500


def get_secretarios_disponibles():
    personas = get_users_by_rol(rol="secretario")
    resultado = [
        {"id": p.id, "nombre": p.nombre, "apellido": p.apellido} for p in personas
    ]
    return success_response(data=resultado)
