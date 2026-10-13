# app/controllers/esp32Controllers.py

from flask import jsonify, request
from ..services.esp32Services import Esp32Services
from ..models.exceptions import ResourceNotFound, ResourceNotValid


def create_esp32(data=None):
    try:
        if data is None:
            data = request.get_json()
        esp32 = Esp32Services.create_esp32(data)
        return jsonify({"success": True, "data": esp32.to_dict()}), 201
    except ResourceNotValid as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def update_esp32(id_esp32, data=None):
    try:
        if data is None:
            data = request.get_json()
        esp32 = Esp32Services.update_esp32(id_esp32, data)
        return jsonify({"success": True, "data": esp32}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except ResourceNotValid as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def delete_esp32(id_esp32):
    try:
        Esp32Services.delete_esp32(id_esp32)
        return jsonify({"success": True, "message": "ESP32 eliminado"}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_all_esp32():
    try:
        esp32s = Esp32Services.get_all_esp32()
        return jsonify({"success": True, "data": esp32s}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_esp32_by_id(id_esp32):
    try:
        esp32 = Esp32Services.get_esp32_by_id(id_esp32)
        return jsonify({"success": True, "data": esp32}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========================================================
# NUEVOS CONTROLLERS PARA ASIGNACION
# ========================================================

def get_disponibles():
    try:
        esp32s = Esp32Services.get_disponibles()
        return jsonify({"success": True, "data": esp32s}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_disponibles_para_bus():
    """ESP32 disponibles para un bus. Query: ?id_bus=X (opcional)"""
    try:
        id_bus = request.args.get("id_bus")
        id_bus_actual = int(id_bus) if id_bus else None
        esp32s = Esp32Services.get_disponibles_para_bus(id_bus_actual)
        return jsonify({"success": True, "data": esp32s}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_disponibles_para_parada():
    """ESP32 disponibles para una parada. Query: ?id_parada=X (opcional)"""
    try:
        id_parada = request.args.get("id_parada")
        id_parada_actual = int(id_parada) if id_parada else None
        esp32s = Esp32Services.get_disponibles_para_parada(id_parada_actual)
        return jsonify({"success": True, "data": esp32s}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def retirar_esp32(id_esp32):
    try:
        data = request.get_json() or {}
        motivo = data.get("motivo", "danado")
        Esp32Services.retirar_esp32(id_esp32, motivo)
        return jsonify({"success": True, "message": "ESP32 retirado exitosamente"}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def desasignar_esp32(id_esp32):
    try:
        Esp32Services.desasignar_de_bus(id_esp32)
        return jsonify({"success": True, "message": "ESP32 desasignado exitosamente"}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500