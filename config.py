import os
from dotenv import load_dotenv
from datetime import timedelta
from urllib.parse import urlparse, urlunparse, quote_plus

load_dotenv()  # carga de varibales del archivo .env


class Config:
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "bus_tracker")

    # Codificar la contraseña para evitar problemas de caracteres especiales
    DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)

    # Construcción segura por partes (usa DB_USER, DB_PASSWORD_ENCODED, etc.)
    _default_uri = (
        f"postgresql://{DB_USER}:{DB_PASSWORD_ENCODED}@"
        f"{DB_HOST}:{DB_PORT}/{DB_NAME}?options=-c%20client_encoding=latin1"
    )

    # Si existe DATABASE_URL en .env, sanearla y usarla; si no, usar la por defecto
    _raw_db_url = os.getenv("DATABASE_URL", "").strip()

    def _sanitize_database_url(raw_url):
        # eliminar BOM u otros caracteres invisibles al inicio
        raw_url = raw_url.lstrip("\ufeff").strip()
        if not raw_url:
            return None
        parsed = urlparse(raw_url)
        # si no hay password, devolver tal cual
        if not parsed.password:
            return raw_url
        # codificar la contraseña
        encoded_pwd = quote_plus(parsed.password)
        # reconstruir netloc con password codificada
        username = parsed.username or ""
        hostname = parsed.hostname or ""
        port = f":{parsed.port}" if parsed.port else ""
        netloc = f"{username}:{encoded_pwd}@{hostname}{port}"
        return urlunparse(
            (
                parsed.scheme,
                netloc,
                parsed.path or "",
                parsed.params,
                parsed.query,
                parsed.fragment,
            )
        )

    SQLALCHEMY_DATABASE_URI = _sanitize_database_url(_raw_db_url) or _default_uri
    print("DEBUG SQLALCHEMY_DATABASE_URI repr:", repr(SQLALCHEMY_DATABASE_URI))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("DB_TOKEN", "")

    DEBUG = True  # activa el modo depuración de FLask
    ENCRYPT_DB = True  # indica que la conexión a la BD debe ser cifrada (SSL), activa la encriptación de ciertos campos

    TEMPLATE_FOLDER = "frontend/views"
    STATIC_FOLDER = "frontend/static"
    # --- Configuración de JWT y Cookies ---
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    # 2. Hacer que la cookie sea HttpOnly
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = True
    # 3. Esta es la clave: Elige cuándo comprobar el CSRF
    # 'cookies' significa que SOLO pedirá el token CSRF si el JWT vino en una cookie (Web)
    # Si el JWT viene en el Header Authorization (React Native), ignorará el CSRF.
    JWT_CSRF_IN_COOKIES = True
    JWT_CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"]
    JWT_CSRF_CHECK_FORM_DATA = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Tokens de acceso expiran en 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # Refresh token válido por 30 días

    # 3. Seguridad de las cookies para el sitio Web
    JWT_COOKIE_SECURE = False  # Cambiar a True en producción (HTTPS)
    JWT_SAME_SITE = "Lax"
    JWT_ACCESS_COOKIE_PATH = "/"
    JWT_REFRESH_COOKIE_PATH = "/"
    JWT_ACCESS_COOKIE_NAME = "access_token"  # le dice a FLASK-JWT-Extendent que busco el cookie con esté nombre (access_token)

    # ---------Configuracion de Flask-Email----------
    # Configuración de Flask-Mail para envío de correos

    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587  # Puerto estándar para envío con seguridad TLS
    MAIL_USE_TLS = True  # Importante: activa STARTTLS
    MAIL_USE_SSL = False  # Si se usa SSL, debe ser True y el puerto 465, pero con TLS es el estándar actual
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")  # Tu dirección de correo
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")  # La contraseña de aplicación
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")  # Remitente por defecto

    # -------------Configuracion de flask Limited------
    RATELIMIT_DEFAULT_LIMITS = ["200 per day", "50 per hour"]
    RATELIMIT_STORAGE_URI = os.environ.get("REDIS_URL", "memory://")
    RATELIMIT_STRATEGY = "moving-window"  # Estrategia más segura contra ráfagas
