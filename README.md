# Poligrafiya hisobot tizimi

Flask asosidagi veb-ilova: buyurtmalar, to'lovlar, xarajatlar, moliyaviy hisobot, tahlil va Telegram bildirishnomalari.

---

## Ishga tushirish

### Mavjud bazangiz bo'lsa

```bash
cd poligrafiya_app
pip install -r requirements.txt
python migrate_db.py     # zaxira nusxa oladi va bazani yangilaydi
python app.py
```

`migrate_db.py` ni bir necha marta ishga tushirish xavfsiz — bajarilgan qadamlar takrorlanmaydi.

### Noldan boshlash

```bash
cd poligrafiya_app
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python seed.py                 # admin va standart buyurtma turlari
python app.py
```

`seed.py` administrator uchun tasodifiy parol yaratadi va ekranga chiqaradi. O'zingiz belgilash uchun:

```bash
set ADMIN_PASSWORD=parolim && python seed.py     # Linux/Mac: ADMIN_PASSWORD=parolim python seed.py
```

Brauzerda: `http://localhost:5000`

### Namuna ma'lumotlar bilan sinash

```bash
python seed_demo.py     # DIQQAT: real bazada ishlatmang
```

---

## Rollar

| Rol | Nima qila oladi |
|---|---|
| **Admin** | Barchasi + foydalanuvchilar, sozlamalar, jurnal, o'chirish |
| **Menejer** | Buyurtma yaratish/tahrirlash, to'lov, mijozlar, fayl biriktirish |
| **Ish boshqaruvchi** | Faqat xarajat kiritish va ko'rish |
| **Buxgalter** | Hisobotlarni ko'rish + Excel eksport (o'zgartira olmaydi) |

Himoya ikki qatlamli: menyuda ko'rinmaydi **va** server tomonida bloklanadi.

---

## Imkoniyatlar

**Buyurtmalar** — yaratish, tahrirlash, nusxalash, o'chirish (tiklash mumkin), qidiruv va filtr, sahifalash, holat o'tishlari nazorati, hisob-faktura chop etish, fayl biriktirish (maket).

**To'lovlar** — har biri alohida yoziladi. Tushum **to'lov sanasi** bo'yicha hisoblanadi. Qolgan qarzdan ortiq to'lov qabul qilinmaydi.

**Mijozlar** — batafsil sahifa: buyurtmalar tarixi, jami summa, to'langan, qarzdorlik.

**Xarajatlar** — 8 turkum, tahrirlash, filtr, kim kiritgani.

**Moliyaviy hisobot** — oylar kesimida tushum/xarajat/foyda, grafik, turkum taqsimoti, Excel.

**Tahlil** — eng foydali mijozlar, mahsulot turlari, o'rtacha buyurtma, bekor qilish darajasi, qarzdorlar.

**Bosh sahifa** — muddati o'tgan/yaqin buyurtmalar, eski qarzlar, o'tgan oyga nisbatan foyda o'zgarishi.

**Telegram** — yangi buyurtma, to'lov va kunlik xulosa xabarlari.

**Sozlamalar** — firma rekvizitlari (hisob-faktura uchun), buyurtma turlari, Telegram.

**Xavfsizlik** — CSRF, ma'lumot tekshiruvi, login urinishlari cheklovi (5 marta / 15 daqiqa), parol siyosati, foydalanuvchini bloklash, harakatlar jurnali, optimistik qulflash.

---

## Telegram sozlash

1. Telegram'da **@BotFather** → `/newbot` → token oling
2. Botingizga `/start` yozing
3. **@userinfobot** ga yozing → Chat ID ni oling
4. Tizimda: *Sozlamalar → Telegram* → token va Chat ID ni kiriting → saqlang
5. "Sinov xabarini yuborish" tugmasi bilan tekshiring

### Kunlik xulosani avtomatlashtirish

**Windows (Task Scheduler):**

| Maydon | Qiymat |
|---|---|
| Program | `C:\...\python.exe` |
| Arguments | `send_daily.py` |
| Start in | `C:\...\poligrafiya_app` |
| Trigger | Har kuni 09:00 |

**Linux (crontab):**

```
0 9 * * * cd /yo'l/poligrafiya_app && /yo'l/venv/bin/python send_daily.py
```

**Render.com:** Cron Job servisi yarating, buyruq: `python send_daily.py`

Muddat eslatmasi uchun alohida: `python send_daily.py --deadlines`

---

## Testlar

```bash
python tests/run_all.py
```

Flask o'rnatilmagan bo'lsa ham ishlaydi. Tekshiradi: ma'lumot validatsiyasi, moliyaviy hisob-kitob, barcha shablonlar × 4 rol, url_for endpointlari, CSRF tokenlari, route himoyasi, model tuzilishi.

---

## Internetda joylashtirish

### Umumiy hosting: cPanel + Passenger (hostmaster.uz va o'xshashlari)

Kirish nuqtasi — `passenger_wsgi.py`. cPanel "Setup Python App" bo'limida:

| Maydon | Qiymat |
|---|---|
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |

Environment o'zgaruvchilari (o'sha bo'limning pastida):

| Nomi | Qiymati |
|---|---|
| `SECRET_KEY` | uzun tasodifiy matn — **majburiy** |
| `DATABASE_URL` | `mysql://foydalanuvchi:parol@localhost/baza_nomi` |
| `SESSION_COOKIE_SECURE` | `1` (sayt HTTPS'da bo'lsa) |

`config.py` `mysql://` ni o'zi `mysql+pymysql://` ga aylantiradi va `utf8mb4`
qo'shadi — qo'lda yozish shart emas.

Birinchi ishga tushirishda cPanel terminalida: `python seed.py` (admin yaratadi).

**Har safar kod o'zgarganda cPanel'da "Restart" bosiladi** — Passenger eski
nusxani xotirada saqlaydi.

### Render.com (PostgreSQL bilan)

- **Build**: `pip install -r requirements.txt && pip install psycopg2-binary`
- **Start**: `gunicorn app:app --workers 2 --timeout 60`
- `DATABASE_URL` — Render bergan PostgreSQL manzili (`postgres://` o'zi tuzatiladi)
- `UPLOAD_FOLDER` — doimiy disk yo'li

**Muhim:** biriktirilgan fayllar diskda saqlanadi. Render'da "Persistent Disk"
ulang, aks holda har deploy'da fayllar yo'qoladi. cPanel'da bu muammo yo'q.

---

## Fayllar tuzilishi

| Fayl | Vazifasi |
|---|---|
| `app.py` · `config.py` | Ilova yig'ilishi va sozlamalar |
| `models.py` | Jadvallar va biznes qoidalari |
| `queries.py` | Agregat so'rovlar (N+1 oldini olish) |
| `utils.py` | Pul (Decimal), Toshkent vaqti, validatsiya |
| `permissions.py` | 4 rol va 14 ruxsat |
| `orders.py` | Buyurtmalar, to'lovlar, fayllar, hisob-faktura |
| `finance.py` | Xarajatlar, hisobot, tahlil, Excel |
| `clients.py` · `auth.py` · `settings.py` | Mijozlar, kirish, sozlamalar |
| `telegram_bot.py` · `notifications.py` | Telegram integratsiyasi |
| `send_daily.py` | Kunlik xulosa (server vazifasi) |
| `migrate_db.py` | Bazani yangilash |
| `seed.py` · `seed_demo.py` | Boshlang'ich / namuna ma'lumotlar |
| `tests/` | Avtomatik testlar |

---

## Keyingi bosqichda qo'shsa bo'ladi

Narx kalkulyatori (format, qog'oz, ranglilik bo'yicha), mavsumiylik tahlili, mijoz portali (login'siz buyurtma holatini ko'rish), integratsion testlar (`pytest`), Alembic migratsiya.
