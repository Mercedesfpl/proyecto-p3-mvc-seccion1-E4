# app/helpers/coordenadas_helper.py
# VERSIÓN SIMPLIFICADA - SOLO LO QUE NECESITAS AHORA

import re
from typing import Tuple, Optional, Union

# ============================================================
# CONSTANTES
# ============================================================

PRECISION_DECIMALES = 6  # 6 decimales ≈ 0.11 metros de precisión
FORMATO_DB = "lat,lng"


# ============================================================
# FUNCIONES PRINCIPALES (LAS QUE REALMENTE USAS)
# ============================================================

def validar_coordenadas(coordenadas: str) -> tuple:
    """
    Valida que las coordenadas estén en formato correcto.
    Retorna (es_valido, mensaje_error, latitud, longitud)
    
    Ejemplo:
        >>> validar_coordenadas("10.5,-67.2")
        (True, "", 10.5, -67.2)
        
        >>> validar_coordenadas("999,-67.2")
        (False, "Latitud debe estar entre -90 y 90", None, None)
    """
    if not coordenadas:
        return False, "Las coordenadas son requeridas", None, None
    
    try:
        # Limpiar espacios
        coordenadas = coordenadas.strip()
        
        # Separar por coma
        partes = coordenadas.split(",")
        if len(partes) != 2:
            return False, "Formato inválido. Use: latitud,longitud", None, None
        
        lat = float(partes[0].strip())
        lng = float(partes[1].strip())
        
        # Validar rangos
        if lat < -90 or lat > 90:
            return False, f"Latitud {lat} debe estar entre -90 y 90", None, None
        
        if lng < -180 or lng > 180:
            return False, f"Longitud {lng} debe estar entre -180 y 180", None, None
        
        return True, "", lat, lng
        
    except ValueError:
        return False, "Las coordenadas deben ser números válidos", None, None


def redondear_coordenadas(coordenadas: str, precision: int = PRECISION_DECIMALES) -> str:
    """
    Redondea coordenadas a un número específico de decimales.
    SOLO PARA GUARDAR EN BD - reduce decimales innecesarios.
    
    Ejemplo:
        >>> redondear_coordenadas("10.355968448435593,-67.0579020312046")
        "10.355968,-67.057902"
    """
    if not coordenadas:
        return ""
    
    # Validar primero
    es_valido, _, lat, lng = validar_coordenadas(coordenadas)
    if not es_valido:
        return coordenadas  # Si no es válido, devolver como está
    
    # Redondear
    lat_red = round(lat, precision)
    lng_red = round(lng, precision)
    
    return f"{lat_red},{lng_red}"


def validar_y_redondear_coordenadas(coordenadas: str, precision: int = PRECISION_DECIMALES) -> tuple:
    """
    Valida Y redondea coordenadas en un solo paso.
    ¡ESTA ES LA FUNCIÓN PRINCIPAL QUE USARÁS!
    
    Returns:
        (es_valido, mensaje_error, lat_redondeada, lng_redondeada, coordenadas_redondeadas)
    
    Ejemplo:
        >>> validar_y_redondear_coordenadas("10.355968448435593, -67.0579020312046")
        (True, "", 10.355968, -67.057902, "10.355968,-67.057902")
    """
    # Validar
    es_valido, mensaje, lat, lng = validar_coordenadas(coordenadas)
    
    if not es_valido:
        return False, mensaje, None, None, ""
    
    # Redondear
    lat_red = round(lat, precision)
    lng_red = round(lng, precision)
    coordenadas_redondeadas = f"{lat_red},{lng_red}"
    
    return True, "", lat_red, lng_red, coordenadas_redondeadas


# ============================================================
# FUNCIONES DE UTILIDAD (PARA MOSTRAR EN FRONTEND)
# ============================================================

def coordenadas_a_objeto(coordenadas: str) -> dict:
    """
    Convierte coordenadas a objeto {lat, lng} para usar en mapas.
    ¡ÚTIL PARA EL FRONTEND!
    
    Ejemplo:
        >>> coordenadas_a_objeto("10.355968,-67.057902")
        {"lat": 10.355968, "lng": -67.057902}
    """
    if not coordenadas:
        return {"lat": None, "lng": None}
    
    es_valido, _, lat, lng = validar_coordenadas(coordenadas)
    
    if not es_valido:
        return {"lat": None, "lng": None}
    
    return {"lat": lat, "lng": lng}


def limpiar_coordenadas(coordenadas: str) -> str:
    """
    Limpia espacios y formatea coordenadas.
    ¡COMPATIBILIDAD CON CÓDIGO EXISTENTE!
    """
    if not coordenadas:
        return ""
    
    # Validar y redondear
    _, _, _, _, redondeadas = validar_y_redondear_coordenadas(coordenadas)
    return redondeadas


# ============================================================
# FUNCIONES PARA FORMATEAR (OPCIONALES)
# ============================================================

def formatear_coordenadas_para_mostrar(coordenadas: str) -> str:
    """
    Formatea coordenadas para mostrar en interfaz con espacio.
    Ejemplo: "10.355968,-67.057902" → "10.355968, -67.057902"
    """
    if not coordenadas:
        return ""
    
    obj = coordenadas_a_objeto(coordenadas)
    if obj["lat"] is None or obj["lng"] is None:
        return coordenadas
    
    return f"{obj['lat']}, {obj['lng']}"


def coordenadas_a_lista(coordenadas: str) -> list:
    """
    Convierte coordenadas a lista [lat, lng]
    Ejemplo: "10.355968,-67.057902" → [10.355968, -67.057902]
    """
    obj = coordenadas_a_objeto(coordenadas)
    if obj["lat"] is None or obj["lng"] is None:
        return []
    return [obj["lat"], obj["lng"]]