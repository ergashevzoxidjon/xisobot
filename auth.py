from datetime import timedelta

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user

from extensions import db
from models import User, LoginAttempt, ROLES, log_action
from permissions import permission_required, home_endpoint
from utils import ValidationError, parse_text, parse_choice, now_local

auth_bp = Blueprint("auth", __name__)

MIN_PASSWORD_LEN = 6

# Parolni terib topishdan himoya
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:45]
    return (request.remote_addr or "")[:45]


def recent_failures(username, ip):
    """Oxirgi LOCKOUT_MINUTES ichidagi muvaffaqiyatsiz urinishlar soni."""
    since = now_local() - timedelta(minutes=LOCKOUT_MINUTES)
    return LoginAttempt.query.filter(
        LoginAttempt.created_at >= since,
        db.or_(LoginAttempt.username == username, LoginAttempt.ip_address == ip),
    ).count()


def record_failure(username, ip):
    db.session.add(LoginAttempt(username=username[:80], ip_address=ip))
    db.session.commit()


def clear_failures(username, ip):
    since = now_local() - timedelta(minutes=LOCKOUT_MINUTES)
    LoginAttempt.query.filter(
        LoginAttempt.created_at >= since,
        db.or_(LoginAttempt.username == username, LoginAttempt.ip_address == ip),
    ).delete(synchronize_session=False)
    db.session.commit()


def _validate_password(raw, field="Parol"):
    raw = (raw or "").strip()
    if len(raw) < MIN_PASSWORD_LEN:
        raise ValidationError(f"{field}: kamida {MIN_PASSWORD_LEN} ta belgidan iborat bo'lishi kerak.")
    if len(raw) > 128:
        raise ValidationError(f"{field}: juda uzun.")
    return raw


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for(home_endpoint()))

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        ip = client_ip()

        # ---- urinishlar cheklovi ----
        failures = recent_failures(username, ip)
        if failures >= MAX_ATTEMPTS:
            flash(
                f"Juda ko'p muvaffaqiyatsiz urinish. {LOCKOUT_MINUTES} daqiqadan so'ng "
                "qayta urinib ko'ring.", "danger",
            )
            return render_template("login.html"), 429

        user = User.query.filter_by(username=username).first()

        if user and not user.is_active_user:
            flash("Bu hisob bloklangan. Administratorga murojaat qiling.", "danger")
            return render_template("login.html")

        if user and user.check_password(password):
            clear_failures(username, ip)
            login_user(user)
            log_action(user, "login", "user", user.id, f"IP: {ip}")
            db.session.commit()
            return redirect(url_for(home_endpoint()))

        record_failure(username, ip)
        left = MAX_ATTEMPTS - failures - 1
        if left <= 2:
            flash(f"Login yoki parol noto'g'ri. Qolgan urinishlar: {max(left, 0)}", "danger")
        else:
            flash("Login yoki parol noto'g'ri.", "danger")

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))


# ---------- o'z parolini o'zgartirish (barcha rollar uchun) ----------

@auth_bp.route("/parol", methods=["GET", "POST"])
@login_required
def change_password():
    if request.method == "POST":
        current = request.form.get("current_password") or ""
        if not current_user.check_password(current):
            flash("Joriy parol noto'g'ri.", "danger")
            return render_template("change_password.html")

        try:
            new = _validate_password(request.form.get("new_password"), "Yangi parol")
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("change_password.html")

        if new != (request.form.get("confirm_password") or ""):
            flash("Yangi parol va tasdiqlash mos kelmadi.", "danger")
            return render_template("change_password.html")

        current_user.set_password(new)
        log_action(current_user, "password_change", "user", current_user.id, None)
        db.session.commit()
        flash("Parol o'zgartirildi.", "success")
        return redirect(url_for(home_endpoint()))

    return render_template("change_password.html")


# ---------- foydalanuvchi boshqaruvi (faqat admin) ----------

@auth_bp.route("/foydalanuvchilar")
@login_required
@permission_required("users.manage")
def users_list():
    users = User.query.order_by(User.is_active_user.desc(), User.username).all()
    return render_template("users.html", users=users)


@auth_bp.route("/foydalanuvchilar/yangi", methods=["GET", "POST"])
@login_required
@permission_required("users.manage")
def user_new():
    if request.method == "POST":
        try:
            username = parse_text(request.form.get("username"), "Login", required=True, max_length=80)
            full_name = parse_text(request.form.get("full_name"), "To'liq ism", required=False, max_length=120)
            role = parse_choice(request.form.get("role"), "Rol", ROLES)
            password = _validate_password(request.form.get("password"))
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("user_form.html", roles=ROLES, user=None, form=request.form)

        if User.query.filter_by(username=username).first():
            flash("Bu login band.", "danger")
            return render_template("user_form.html", roles=ROLES, user=None, form=request.form)

        u = User(username=username, full_name=full_name, role=role)
        u.set_password(password)
        db.session.add(u)
        db.session.flush()
        log_action(current_user, "create", "user", u.id, f"{username} ({role})")
        db.session.commit()
        flash("Foydalanuvchi qo'shildi.", "success")
        return redirect(url_for("auth.users_list"))

    return render_template("user_form.html", roles=ROLES, user=None, form=None)


@auth_bp.route("/foydalanuvchilar/<int:user_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("users.manage")
def user_edit(user_id):
    u = User.query.get_or_404(user_id)

    if request.method == "POST":
        try:
            full_name = parse_text(request.form.get("full_name"), "To'liq ism", required=False, max_length=120)
            role = parse_choice(request.form.get("role"), "Rol", ROLES)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("user_form.html", roles=ROLES, user=u, form=request.form)

        # oxirgi adminni menejerga aylantirib qo'yishning oldini olamiz
        if u.role == "admin" and role != "admin":
            admin_count = User.query.filter_by(role="admin", is_active_user=True).count()
            if admin_count <= 1:
                flash("Tizimda kamida bitta faol administrator qolishi kerak.", "danger")
                return render_template("user_form.html", roles=ROLES, user=u, form=request.form)

        u.full_name = full_name
        u.role = role

        new_password = (request.form.get("password") or "").strip()
        if new_password:
            try:
                u.set_password(_validate_password(new_password))
            except ValidationError as e:
                flash(str(e), "danger")
                return render_template("user_form.html", roles=ROLES, user=u, form=request.form)

        log_action(current_user, "update", "user", u.id, f"{u.username} ({role})")
        db.session.commit()
        flash("Foydalanuvchi yangilandi.", "success")
        return redirect(url_for("auth.users_list"))

    return render_template("user_form.html", roles=ROLES, user=u, form=None)


@auth_bp.route("/foydalanuvchilar/<int:user_id>/holat", methods=["POST"])
@login_required
@permission_required("users.manage")
def user_toggle(user_id):
    u = User.query.get_or_404(user_id)

    if u.id == current_user.id:
        flash("O'zingizni bloklay olmaysiz.", "danger")
        return redirect(url_for("auth.users_list"))

    if u.is_active_user and u.role == "admin":
        admin_count = User.query.filter_by(role="admin", is_active_user=True).count()
        if admin_count <= 1:
            flash("Tizimda kamida bitta faol administrator qolishi kerak.", "danger")
            return redirect(url_for("auth.users_list"))

    u.is_active_user = not u.is_active_user
    log_action(current_user, "toggle", "user", u.id,
               f"{u.username} {'faollashtirildi' if u.is_active_user else 'bloklandi'}")
    db.session.commit()
    flash(f"{u.username} {'faollashtirildi' if u.is_active_user else 'bloklandi'}.", "success")
    return redirect(url_for("auth.users_list"))


@auth_bp.route("/jurnal")
@login_required
@permission_required("users.manage")
def audit_log():
    from models import AuditLog
    page = request.args.get("page", 1, type=int)
    pagination = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=50, error_out=False
    )
    return render_template("audit_log.html", entries=pagination.items, pagination=pagination)
