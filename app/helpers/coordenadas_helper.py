# app/helpers/coordenadas_helper.py

def limpiar_coordenadas(coordenadas: str) -> str:
    """
    Limpia y formatea una cadena de coordenadas.
    Elimina espacios extra y asegura el formato consistente.
    """
    if not coordenadas:
        return ""
    
    # Eliminar espacios al inicio y final
    coordenadas = coordenadas.strip()
    
    # Eliminar espacios alrededor de la coma
    partes = coordenadas.split(",")
    if len(partes) == 2:
        lat = partes[0].strip()
        lng = partes[1].strip()
        return f"{lat},{lng}"
    
    return coordenadas


def validar_coordenadas(coordenadas: str) -> tuple:
    """
    Valida que las coordenadas que esten finas
    y estén dentro de los rangos permitidos.
    Retorna (es_valido, mensaje_error, latitud, longitud)
    """
    if not coordenadas:
        return False, "Las coordenadas son requeridas", None, None
    
    try:
        partes = coordenadas.split(",")
        if len(partes) != 2:
            return False, "Formato inválido. Use: latitud,longitud", None, None
        
        lat = float(partes[0].strip())
        lng = float(partes[1].strip())
        
        if lat < -90 or lat > 90:
            return False, "Latitud debe estar entre -90 y 90", None, None
        
        if lng < -180 or lng > 180:
            return False, "Longitud debe estar entre -180 y 180", None, None
        
        return True, "", lat, lng
        
    except ValueError:
        return False, "Las coordenadas deben ser números válidos", None, None


def formatear_coordenadas_para_mostrar(coordenadas: str) -> str:
    """
    Formatea coordenadas para mostrar en la interfaz.
    Ejemplo: "10.3447, -67.0400" -> "10.3447, -67.0400"
    """
    if not coordenadas:
        return ""
    
    partes = coordenadas.split(",")
    if len(partes) == 2:
        lat = partes[0].strip()
        lng = partes[1].strip()
        return f"{lat}, {lng}"
    
    return coordenadas


def coordenadas_a_lista(coordenadas: str) -> list:
    """
    Convierte coordenadas en formato string a lista [lat, lng]
    """
    if not coordenadas:
        return []
    
    partes = coordenadas.split(",")
    if len(partes) == 2:
        try:
            return [float(partes[0].strip()), float(partes[1].strip())]
        except ValueError:
            return []
    
    return []