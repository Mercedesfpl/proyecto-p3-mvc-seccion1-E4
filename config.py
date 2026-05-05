import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("DB_TOKEN", "")

    DEBUG = True
    ENCRYPT_DB = True

    TEMPLATE_FOLDER = "views/templates/"
    STATIC_FOLDER = "views/static/"

    # --- Configuración de JWT y Cookies ---
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    JWT_TOKEN_LOCATION = ["cookies"]
    # 2. Hacer que la cookie sea HttpOnly
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Tokens de acceso expiran en 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # Refresh token válido por 30 días
    JWT_SAME_SITE = "Lax"
    # 3. Limitar las rutas donde se envían las cookies
    JWT_ACCESS_COOKIE_PATH = "/"  # Se envía solo a rutas que empiezan con /api/
    JWT_REFRESH_COOKIE_PATH = "/"  # El refresh solo a /token/refresh

    # ---------Configuracion de Flask-Email----------
    # Configuración de Flask-Mail para envío de correos

    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587  # Puerto estándar para envío con seguridad TLS
    MAIL_USE_TLS = True  # Importante: activa STARTTLS
    MAIL_USE_SSL = False  # Si se usa SSL, debe ser True y el puerto 465, pero con TLS es el estándar actual
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")  # Tu dirección de correo
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")  # La contraseña de aplicación
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")  # Remitente por defecto
