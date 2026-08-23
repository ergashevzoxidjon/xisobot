from decimal import Decimal

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db, login_manager
from utils import now_local, today_local, to_money, ZERO

ROLES = ["admin", "menejer", "xarajatchi", "buxgalter"]

STATUS_NEW = "yangi"
STATUS_IN_PROGRESS = "jarayonda"
STATUS_READY = "tayyor"
STATUS_DELIVERED = "yetkazildi"
STATUS_CANCELLED = "bekor qilindi"

ORDER_STATUSES = [STATUS_NEW, STATUS_IN_PROGRESS, STATUS_READY, STATUS_DELIVERED, STATUS_CANCELLED]
# Bekor qilingan buyurtma moliyaviy hisob-kitobga kirmaydi
ACTIVE_STATUSES = [STATUS_NEW, STATUS_IN_PROGRESS]
COUNTABLE_STATUSES = [s for s in ORDER_STATUSES if s != STATUS_CANCELLED]

# Ruxsat etilgan holat o'tishlari — "yetkazildi"dan "yangi"ga qaytib bo'lmaydi
ALLOWED_TRANSITIONS = {
    STATUS_NEW:         [STATUS_IN_PROGRESS, STATUS_READY, STATUS_CANCELLED],
    STATUS_IN_PROGRESS: [STATUS_NEW, STATUS_READY, STATUS_CANCELLED],
    STATUS_READY:       [STATUS_IN_PROGRESS, STATUS_DELIVERED, STATUS_CANCELLED],
    STATUS_DELIVERED:   [STATUS_READY],   # faqat xato tuzatish uchun orqaga
    STATUS_CANCELLED:   [STATUS_NEW],     # bekor qilinganini qayta tiklash
}


def can_transition(from_status, to_status):
    if from_status == to_status:
        return True
    return to_status in ALLOWED_TRANSITIONS.get(from_status, [])

PAYMENT_UNPAID = "to'lanmagan"
PAYMENT_PARTIAL = "qisman"
PAYMENT_FULL = "to'liq"
PAYMENT_STATUSES = [PAYMENT_UNPAID, PAYMENT_PARTIAL, PAYMENT_FULL]

EXPENSE_CATEGORIES = ["ijara", "ish haqi", "kommunal", "transport", "xomashyo", "jihoz", "soliq", "boshqa"]

MONEY = db.Numeric(14, 2)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    role = db.Column(db.String(20), default="menejer", nullable=False)
    is_active_user = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=now_local)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_active(self):
        """Flask-Login shu xossaga qarab bloklangan foydalanuvchini kiritmaydi."""
        return bool(self.is_active_user)

    @property
    def display_name(self):
        return self.full_name or self.username


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=now_local)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)

    orders = db.relationship("Order", backref="client", lazy="select")

    # Ro'yxatlarda statistika SQL agregat orqali oldindan hisoblanadi
    # (queries.clients_with_stats). Bo'lmasa — yozuvlar bo'ylab hisoblanadi.
    _stats = None

    def attach_stats(self, orders_count, total_ordered, total_paid):
        self._stats = {
            "orders_count": orders_count,
            "total_ordered": total_ordered,
            "total_paid": total_paid,
        }

    @property
    def total_debt(self):
        """Faqat bekor qilinmagan buyurtmalar bo'yicha qarz."""
        if self._stats is not None:
            return self._stats["total_ordered"] - self._stats["total_paid"]
        total = ZERO
        for o in self.orders:
            if o.status != STATUS_CANCELLED:
                total += o.remaining
        return total

    @property
    def orders_count(self):
        if self._stats is not None:
            return self._stats["orders_count"]
        return sum(1 for o in self.orders if o.status != STATUS_CANCELLED)

    @property
    def total_revenue(self):
        if self._stats is not None:
            return self._stats["total_paid"]
        total = ZERO
        for o in self.orders:
            if o.status != STATUS_CANCELLED:
                total += o.paid_amount_calc
        return total


class OrderType(db.Model):
    """Buyurtma turlari ma'lumotnomasi — narx avtomatik qo'yilishi uchun."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    unit = db.Column(db.String(20), default="dona")
    default_price = db.Column(MONEY, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=now_local)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey("client.id"), nullable=False, index=True)
    order_type = db.Column(db.String(100))
    description = db.Column(db.Text)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(MONEY, default=0)
    total_price = db.Column(MONEY, default=0)
    status = db.Column(db.String(20), default=STATUS_NEW, nullable=False, index=True)
    deadline = db.Column(db.Date, index=True)
    created_at = db.Column(db.DateTime, default=now_local, index=True)
    updated_at = db.Column(db.DateTime, default=now_local, onupdate=now_local)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    # bir vaqtda tahrirlashni aniqlash uchun (optimistik qulflash)
    version = db.Column(db.Integer, default=1, nullable=False)
    # yumshoq o'chirish — yozuv yo'qolmaydi, faqat ro'yxatlarda ko'rinmaydi
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)
    deleted_by = db.Column(db.Integer, db.ForeignKey("user.id"))

    creator = db.relationship("User", foreign_keys=[created_by])
    payments = db.relationship(
        "Payment", backref="order", lazy="select", cascade="all, delete-orphan"
    )
    files = db.relationship(
        "OrderFile", backref="order", lazy="select", cascade="all, delete-orphan"
    )
    items = db.relationship(
        "OrderItem", backref="order", lazy="select", cascade="all, delete-orphan",
        order_by="OrderItem.position",
    )

    # ---- hisoblanadigan qiymatlar (to'lovlar jadvalidan) ----

    # SQL agregat orqali oldindan hisoblangan qiymat (queries.py)
    _paid_cache = None

    def attach_paid(self, amount):
        self._paid_cache = to_money(amount)

    @property
    def paid_amount_calc(self):
        if self._paid_cache is not None:
            return self._paid_cache
        total = ZERO
        for p in self.payments:
            total += to_money(p.amount)
        return total

    @property
    def remaining(self):
        return to_money(self.total_price) - self.paid_amount_calc

    @property
    def payment_status(self):
        paid = self.paid_amount_calc
        total = to_money(self.total_price)
        if paid <= ZERO:
            return PAYMENT_UNPAID
        if paid >= total and total > ZERO:
            return PAYMENT_FULL
        return PAYMENT_PARTIAL

    @property
    def is_overdue(self):
        if not self.deadline:
            return False
        if self.status in (STATUS_DELIVERED, STATUS_CANCELLED):
            return False
        return self.deadline < today_local()

    @property
    def days_left(self):
        if not self.deadline:
            return None
        return (self.deadline - today_local()).days

    def recalc_total(self):
        self.total_price = to_money(Decimal(self.quantity or 0) * to_money(self.unit_price))

    # ---- ko'p qatorli buyurtma ----

    @property
    def items_summary(self):
        """Ro'yxatlarda ko'rsatiladigan qisqa tavsif: "Vizitka" yoki "Vizitka +2 ta"."""
        items = self.items
        if not items:
            return self.order_type or "-"
        if len(items) == 1:
            return items[0].order_type
        return f"{items[0].order_type} +{len(items) - 1} ta"

    def recalc_from_items(self):
        """Jami summa va miqdorni qatorlardan qayta hisoblaydi.

        Buyurtmadagi `order_type`, `quantity`, `unit_price`, `total_price`
        ustunlari qatorlardan kelib chiqib to'ldiriladi — shu tufayli
        eski hisobotlar, Excel eksporti va Telegram xabarlari o'zgarishsiz
        ishlashda davom etadi.
        """
        total = ZERO
        quantity = 0
        for item in self.items:
            item.total_price = to_money(
                Decimal(item.quantity or 0) * to_money(item.unit_price)
            )
            total += item.total_price
            quantity += item.quantity or 0

        self.total_price = total
        self.quantity = quantity
        if self.items:
            self.order_type = self.items[0].order_type
            # birlik narxi faqat bitta qatorli buyurtmada ma'noga ega
            self.unit_price = self.items[0].unit_price if len(self.items) == 1 else ZERO


    # ---- buyurtma bo'yicha xarajat va foyda ----

    _expense_cache = None

    def attach_expenses(self, amount):
        self._expense_cache = to_money(amount)

    @property
    def expenses_total(self):
        """Shu buyurtmaga yozilgan xarajatlar jami."""
        if self._expense_cache is not None:
            return self._expense_cache
        total = ZERO
        for e in self.expenses:
            total += to_money(e.amount)
        return total

    @property
    def profit(self):
        """Buyurtma summasi minus shu buyurtmaga yozilgan xarajatlar."""
        return to_money(self.total_price) - self.expenses_total


class OrderItem(db.Model):
    """Buyurtma tarkibidagi bitta mahsulot qatori.

    Bir mijoz bir vaqtda bir nechta mahsulot buyurtma qilishi mumkin —
    ularning hammasi bitta buyurtma raqami va bitta hisob-faktura ostida turadi.
    """
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, index=True)
    order_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(MONEY, default=0, nullable=False)
    total_price = db.Column(MONEY, default=0, nullable=False)
    # formadagi tartibni saqlaydi
    position = db.Column(db.Integer, default=0, nullable=False)


class Payment(db.Model):
    """Har bir to'lov alohida yoziladi — tushum aynan to'lov sanasi bo'yicha
    hisoblanishi va to'lovlar tarixi ko'rinishi uchun."""
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, index=True)
    amount = db.Column(MONEY, nullable=False)
    paid_on = db.Column(db.Date, default=today_local, nullable=False, index=True)
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now_local)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))

    creator = db.relationship("User", foreign_keys=[created_by])


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), default="boshqa", nullable=False, index=True)
    amount = db.Column(MONEY, nullable=False)
    description = db.Column(db.String(255))
    date = db.Column(db.Date, default=today_local, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=now_local)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    # Xarajat aniq bir buyurtmaga tegishli bo'lishi mumkin (qog'oz, bo'yoq,
    # pechat) yoki umumiy bo'lishi mumkin (ijara, ish haqi) — o'shanda bo'sh.
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), index=True)

    creator = db.relationship("User", foreign_keys=[created_by])
    order = db.relationship("Order", backref="expenses", foreign_keys=[order_id])


class CompanySettings(db.Model):
    """Firma rekvizitlari — hisob-fakturada ko'rsatiladi. Bitta yozuv (id=1)."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), default="Poligrafiya xizmati")
    address = db.Column(db.String(255))
    phone = db.Column(db.String(100))
    email = db.Column(db.String(120))
    tax_id = db.Column(db.String(50))          # STIR
    bank_name = db.Column(db.String(200))
    bank_account = db.Column(db.String(50))    # hisob raqam
    bank_mfo = db.Column(db.String(20))
    invoice_note = db.Column(db.String(500))   # hisob-faktura pastidagi matn
    updated_at = db.Column(db.DateTime, default=now_local, onupdate=now_local)

    @staticmethod
    def get():
        settings = db.session.get(CompanySettings, 1)
        if not settings:
            settings = CompanySettings(id=1)
            db.session.add(settings)
            db.session.commit()
        return settings


class TelegramSettings(db.Model):
    """Telegram bot sozlamalari. Bitta yozuv (id=1)."""
    id = db.Column(db.Integer, primary_key=True)
    is_enabled = db.Column(db.Boolean, default=False, nullable=False)
    bot_token = db.Column(db.String(200))
    manager_chat_id = db.Column(db.String(50))    # rahbar / guruh chat ID
    notify_new_order = db.Column(db.Boolean, default=True, nullable=False)
    notify_payment = db.Column(db.Boolean, default=False, nullable=False)
    notify_daily = db.Column(db.Boolean, default=True, nullable=False)
    last_daily_sent = db.Column(db.Date)
    updated_at = db.Column(db.DateTime, default=now_local, onupdate=now_local)

    @staticmethod
    def get():
        s = db.session.get(TelegramSettings, 1)
        if not s:
            s = TelegramSettings(id=1)
            db.session.add(s)
            db.session.commit()
        return s

    @property
    def is_ready(self):
        return bool(self.is_enabled and self.bot_token and self.manager_chat_id)


class OrderFile(db.Model):
    """Buyurtmaga biriktirilgan maket fayllari."""
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)      # diskdagi nomi
    original_name = db.Column(db.String(255), nullable=False)  # foydalanuvchi ko'radigan nom
    size_bytes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=now_local)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))

    creator = db.relationship("User", foreign_keys=[created_by])

    @property
    def size_human(self):
        size = self.size_bytes or 0
        for unit in ("B", "KB", "MB", "GB"):
            if size < 1024:
                return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class LoginAttempt(db.Model):
    """Muvaffaqiyatsiz kirish urinishlari — parolni terib topishdan himoya."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), index=True)
    ip_address = db.Column(db.String(45), index=True)
    created_at = db.Column(db.DateTime, default=now_local, index=True)


class AuditLog(db.Model):
    """Muhim harakatlar izi — kim, qachon, nima qilgani."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True)
    action = db.Column(db.String(50), nullable=False)
    entity = db.Column(db.String(50))
    entity_id = db.Column(db.Integer)
    detail = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now_local, index=True)

    user = db.relationship("User", foreign_keys=[user_id])


def log_action(user, action, entity=None, entity_id=None, detail=None):
    entry = AuditLog(
        user_id=getattr(user, "id", None),
        action=action,
        entity=entity,
        entity_id=entity_id,
        detail=(detail or "")[:255],
    )
    db.session.add(entry)
    return entry
