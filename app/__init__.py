from flask import Flask
from config import Config
from .extensions import db, login_manager, migrate, mail, socketIO
from flask_jwt_extended import JWTManager
from .models.models import Usuario
from .routes import auth_scope, errors_scope, admin_scope

# Configuracion inicial de la aplicacion
app = Flask(
    __name__, template_folder=Config.TEMPLATE_FOLDER, static_folder=Config.STATIC_FOLDER
)
app.config.from_object(Config)
db.init_app(app)
migrate.init_app(app, db)
login_manager.init_app(app)
mail.init_app(app)
jwt = JWTManager(app)
socketIO.init_app(app, cors_allowed_origins="*", async_mode="threading")
app.socketIO = socketIO

from .routes import websocket_events

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Usuario, int(user_id))


# Los blueprint que se estan manejando
app.register_blueprint(errors_scope, url_prefix="/")
app.register_blueprint(auth_scope, url_prefix="/api")
app.register_blueprint(admin_scope, url_prefix="/admin")