import os

from flask import Flask, render_template

from config import Config
from extensions import db, login_manager, csrf


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    from template_helpers import register_template_helpers
    register_template_helpers(app)

    from permissions import register_permission_helpers
    register_permission_helpers(app)

    import models  # noqa: F401  (modellarni va user_loader'ni ro'yxatga oladi)

    from auth import auth_bp
    from main import main_bp
    from clients import clients_bp
    from orders import orders_bp
    from finance import finance_bp
    from stock import stock_bp
    from suppliers import suppliers_bp
    from settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(settings_bp)

    register_error_handlers(app)

    with app.app_context():
        db.create_all()

    return app


def register_error_handlers(app):
    @app.errorhandler(403)
    def forbidden(e):
        return render_template("errors/error.html", code=403,
                               title="Ruxsat yo'q",
                               message="Bu sahifaga kirish huquqingiz yo'q."), 403

    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/error.html", code=404,
                               title="Sahifa topilmadi",
                               message="Siz izlagan sahifa mavjud emas."), 404

    @app.errorhandler(500)
    def server_error(e):
        db.session.rollback()
        return render_template("errors/error.html", code=500,
                               title="Tizim xatosi",
                               message="Kutilmagan xato yuz berdi. Qayta urinib ko'ring."), 500

    from flask_wtf.csrf import CSRFError

    @app.errorhandler(CSRFError)
    def csrf_error(e):
        return render_template("errors/error.html", code=400,
                               title="Sessiya muddati tugadi",
                               message="Xavfsizlik tokeni eskirgan. Sahifani yangilab, qayta urinib ko'ring."), 400


app = create_app()

if __name__ == "__main__":
    app.run(
        debug=app.config["DEBUG"],
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
    )
