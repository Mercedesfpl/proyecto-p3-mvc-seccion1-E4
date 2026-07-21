from flask import Blueprint
from ..controllers import userControllers

user_scope = Blueprint("user", __name__)


@user_scope.route("/", methods=["GET", "POST"])
def index():
    return userControllers.index()


@user_scope.route("/register", methods=["GET", "POST"])
def register():
    return userControllers.show_form_register()


@user_scope.route("/forgot-password", methods=["GET"])
def show_form_forgot_pass():
    return userControllers.show_form_forgot_pass()
