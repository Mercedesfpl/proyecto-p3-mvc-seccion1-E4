import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("DB_TOKEN", "")  # Para Encriptar la DB

    DEBUG = True
    ENCRYPT_DB = True

    TEMPLATE_FOLDER = "views/templates/"
    STATIC_FOLDER = "views/static/"

    # --- Configuración de JWT y Cookies ---
    JWT_SECRET_KEY = "abhgtfrdertyuhgtrdfrtgfde12356478256424"  # ¡Cámbiala!
    # 1. Decirle a la extensión que busque los tokens en las cookies
    JWT_TOKEN_LOCATION = ["cookies"]
    # 2. Hacer que la cookie sea HttpOnly e insegura en desarrollo (cambiar en producción)
    JWT_COOKIE_SECURE = False  # Usar True en producción con HTTPS
    JWT_COOKIE_CSRF_PROTECT = False  # HABILITAR protección CSRF (ver sección final)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Tokens de acceso expiran en 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # Refresh token válido por 30 días
    JWT_SAME_SITE = "Lax"
    # 3. Limitar las rutas donde se envían las cookies (buena práctica)
    JWT_ACCESS_COOKIE_PATH = "/"  # Se envía solo a rutas que empiezan con /api/
    JWT_REFRESH_COOKIE_PATH = "/"  # El refresh solo a /token/refresh
