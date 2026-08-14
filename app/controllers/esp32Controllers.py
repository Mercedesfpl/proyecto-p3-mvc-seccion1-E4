# app/controllers/esp32Controllers.py

from flask import jsonify, request
from ..services.esp32Services import Esp32Services
from ..models.exceptions import ResourceNotFound

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

def create_esp32():
    try:
        data = request.get_json()
        esp32 = Esp32Services.create_esp32(data)
        return jsonify({"success": True, "data": esp32}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

def update_esp32(id_esp32):
    try:
        data = request.get_json()
        esp32 = Esp32Services.update_esp32(id_esp32, data)
        return jsonify({"success": True, "data": esp32}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

def delete_esp32(id_esp32):
    try:
        Esp32Services.delete_esp32(id_esp32)
        return jsonify({"success": True, "message": "ESP32 eliminado"}), 200
    except ResourceNotFound as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500