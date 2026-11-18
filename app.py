import os
import time

from flask import Flask, g, has_request_context, render_template, request
from flask_login import current_user

from config import Config
from extensions import db, login_manager, csrf


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    # DIQQAT: bu tekshiruv atayin HAR BIR so'rovdan oldin ishlaydi (import
    # vaqtida emas) — aks holda migrate_db.py/seed.py/reset_password.py kabi
    # buyruq qatori skriptlari ham (ular `from app import create_app` qiladi,
    # bu esa shu faylni to'liq ishga tushiradi) SECRET_KEY sozlanmagan bo'lsa
    # ishlamay qolar edi, garchi ularga sessiya/cookie umuman kerak bo'lmasa
    # ham. Haqiqiy xavf faqat ilova jonli so'rovlarga javob bera boshlaganda.
    @app.before_request
    def _guard_default_secret_key():
        if not app.config["DEBUG"] and app.config["SECRET_KEY"] == "dev-secret-change-me":
            raise RuntimeError(
                "SECRET_KEY o'rnatilmagan! Standart kalit bilan production'da "
                "so'rovlarga javob berish xavfsiz emas — sessiya cookie'sini "
                "yasab, parolsiz admin bo'lib kirish mumkin. Server "
                "sozlamalarida (cPanel -> Setup Python App -> Environment "
                "variables) haqiqiy SECRET_KEY qiymatini belgilang va "
                "RESTART qiling."
            )

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
    from managers import managers_bp
    from hr import hr_bp
    from money import money_bp
    from xisoblovchi import xisoblovchi_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(managers_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(money_bp)
    app.register_blueprint(xisoblovchi_bp)

    register_error_handlers(app)

    with app.app_context():
        _create_missing_tables()

    register_timing(app)

    return app


def _create_missing_tables():
    """Jadvallar bor bo'lsa `create_all()` chaqirilmaydi: u har jadval uchun alohida
    so'rov yuboradi (~30 ta) va ilovaning sovuq startini sekinlashtiradi (2026-11-18).
    Bitta so'rov bilan jadvallar ro'yxati olinadi, yangi jadval bo'lsagina yaratiladi."""
    from sqlalchemy import inspect
    existing = set(inspect(db.engine).get_table_names())
    if any(name not in existing for name in db.metadata.tables):
        db.create_all()


SLOW_REQUEST_MS = 1500
_sql_timing_ready = False


def register_timing(app):
    """Har javobga `Server-Timing` sarlavhasi (faqat kirgan foydalanuvchiga):
    ilova vaqti, SQL vaqti va so'rovlar soni. Brauzerda DevTools -> Network -> Timing
    yoki fetch(...).headers.get('server-timing') orqali ko'rinadi — sekinlik
    tarmoqdami, ilovadami yoki bazadami, shuni ajratish uchun (2026-11-18).
    Juda sekin so'rovlar jurnalga ham yoziladi."""
    global _sql_timing_ready
    if not _sql_timing_ready:
        from sqlalchemy import event
        from sqlalchemy.engine import Engine

        @event.listens_for(Engine, "before_cursor_execute")
        def _sql_start(conn, cursor, statement, parameters, context, executemany):
            if has_request_context():
                context._t0 = time.perf_counter()

        @event.listens_for(Engine, "after_cursor_execute")
        def _sql_end(conn, cursor, statement, parameters, context, executemany):
            t0 = getattr(context, "_t0", None)
            if t0 is not None and has_request_context():
                g.sql_count = getattr(g, "sql_count", 0) + 1
                g.sql_time = getattr(g, "sql_time", 0.0) + (time.perf_counter() - t0)

        _sql_timing_ready = True

    @app.before_request
    def _timing_start():
        g.req_t0 = time.perf_counter()

    @app.after_request
    def _timing_end(response):
        t0 = getattr(g, "req_t0", None)
        if t0 is None:
            return response
        total_ms = (time.perf_counter() - t0) * 1000
        sql_ms = getattr(g, "sql_time", 0.0) * 1000
        sql_n = getattr(g, "sql_count", 0)
        if current_user.is_authenticated:
            response.headers["Server-Timing"] = (
                f'app;dur={total_ms:.0f}, db;dur={sql_ms:.0f};desc="{sql_n} queries"')
        if total_ms > SLOW_REQUEST_MS:
            app.logger.warning("Sekin so'rov: %s %s — %.0f ms (SQL: %d ta, %.0f ms)",
                               request.method, request.path, total_ms, sql_n, sql_ms)
        return response


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
