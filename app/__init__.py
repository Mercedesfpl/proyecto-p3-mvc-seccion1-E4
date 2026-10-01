from flask import Flask
from config import Config
from .extensions import db, login_manager, migrate, mail, socketio, limiter, jwt, cors
from flask_jwt_extended import JWTManager
from .models.models import Usuario
from .routes import auth_scope, errors_scope, admin_scope, user_scope


def create_app():
    # Configuracion inicial de la aplicacion
    app = Flask(
        __name__,
        template_folder=Config.TEMPLATE_FOLDER,
        static_folder=Config.STATIC_FOLDER,
    )
    app.config.from_object(Config)
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="threading")
    limiter.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        origins=[
            "http://127.0.0.1:5000",  # Tu frontend web local
            "http://192.168.1.6:8081",
            "https://tu-sitio-web.com",  # Tu dominio de producción web
        ],
        supports_credentials=True,  # OBLIGATORIO para que el sitio web lea/escriba Cookies con Axios
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-CSRF-Token",
        ],  # Headers permitidos
    )

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(Usuario, int(user_id))

    # Los blueprint que se estan manejando
    app.register_blueprint(errors_scope, url_prefix="/")
    app.register_blueprint(auth_scope, url_prefix="/api")
    app.register_blueprint(admin_scope, url_prefix="/admin")
    app.register_blueprint(user_scope, url_prefix="/")

    with app.app_context():
        db.create_all()

    # from .routes import websocket_events

    return app
