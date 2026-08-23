import os


def _bool(name, default=False):
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    # Production'da DEBUG hech qachon yoqilmasligi kerak.
    DEBUG = _bool("FLASK_DEBUG", False)

    _db_url = os.environ.get("DATABASE_URL", "sqlite:///poligrafiya.db")
    # Render.com "postgres://" beradi, SQLAlchemy esa "postgresql://" kutadi
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    # cPanel MySQL: drayverni ko'rsatamiz va o'zbekcha matn uchun utf8mb4 qo'yamiz
    if _db_url.startswith("mysql://"):
        _db_url = _db_url.replace("mysql://", "mysql+pymysql://", 1)
    if _db_url.startswith("mysql+pymysql://") and "charset=" not in _db_url:
        _db_url += ("&" if "?" in _db_url else "?") + "charset=utf8mb4"
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        # Umumiy hostingda MySQL bo'sh turgan ulanishni uzib qo'yadi —
        # eskirgan ulanishni o'zimiz yangilaymiz ("server has gone away" oldini oladi)
        "pool_recycle": 280,
    }

    # Sessiya cookie xavfsizligi
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # HTTPS orqali ishlaganda (Render va h.k.) SESSION_COOKIE_SECURE=1 qo'ying
    SESSION_COOKIE_SECURE = _bool("SESSION_COOKIE_SECURE", False)

    WTF_CSRF_TIME_LIMIT = None  # sessiya davomida token amal qiladi

    # Ro'yxatlarda bir sahifadagi qatorlar soni
    PER_PAGE = int(os.environ.get("PER_PAGE", 25))

    # Buyurtmaga biriktiriladigan fayllar
    UPLOAD_FOLDER = os.environ.get(
        "UPLOAD_FOLDER",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads"),
    )
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_UPLOAD_MB", 25)) * 1024 * 1024
    ALLOWED_EXTENSIONS = {
        ".pdf", ".ai", ".cdr", ".psd", ".eps", ".svg",
        ".jpg", ".jpeg", ".png", ".tif", ".tiff",
        ".doc", ".docx", ".xls", ".xlsx", ".zip", ".rar",
    }
