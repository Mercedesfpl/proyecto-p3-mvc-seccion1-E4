from ..models.userModels import UserSession
from flask_mail import Message
from app.extensions import mail
from flask import jsonify


def enviar_correo_recuperacion(userData: UserSession, code: str):
    # Construimos el mensaje del correo
    msg = Message("Recuperación de contraseña", recipients=[userData.email])
    msg.body = f"""Hola {userData.nombre},

    Solicitaste restablecer tu contraseña. Usa el siguiente código de 6 dígitos para continuar:

    {code}

    Este código es válido por 10 minutos.

    Si no solicitaste esto, puedes ignorar este mensaje de forma segura.
    """

    # # Enviamos el correo
    try:
        mail.send(msg)
    except Exception as e:
        # En producción, registra el error en un log, pero no reveles detalles al usuario
        print(f"Error enviando email: {e}")
        return False

    return True
