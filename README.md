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
| **Boss** | Korxona rahbari — hamma narsani **faqat ko'radi**: hisobot, tahlil, Excel. Hech narsani o'zgartirmaydi |
| **Menejer** | Buyurtma yaratish/tahrirlash, to'lov, mijozlar, fayl biriktirish. **Moliya bo'limi ko'rinmaydi** — xarajat ham, foyda ham |
| **Ish boshqaruvchi** | **Ombor** (mahsulot qabul qilish va sarflash), **taminotchilar** (qarz-to'lov), xarajat kiritish, buyurtmalarni ko'rish, **moliyaviy hisobot va tahlilni ko'rish** |

Himoya ikki qatlamli: menyuda ko'rinmaydi **va** server tomonida bloklanadi.

---

## Imkoniyatlar

**Buyurtmalar** — bitta buyurtmada bir nechta mahsulot (jadval ko'rinishida), yaratish, tahrirlash, nusxalash, o'chirish (tiklash mumkin), qidiruv va filtr, sahifalash, holat o'tishlari nazorati, hisob-faktura chop etish, fayl biriktirish (maket).

**Mijozni tez kiritish** — buyurtma formasida mijoz nomini yozganda bazadagi mijozlar real vaqtda ko'rsatiladi. Mavjudi tanlanadi, yangisi esa buyurtma saqlanganda avtomatik ochiladi — oldin alohida mijoz yaratish shart emas.

**Tezkor tanlash** — buyurtma turlari tugmalar ko'rinishida. Bosilganda tanlangan qatorga tur va standart narx qo'yiladi.

**To'lovlar** — har biri alohida yoziladi. Tushum **to'lov sanasi** bo'yicha hisoblanadi. Mijoz qarzidan ko'p to'lasa qabul qilinadi: ortiqchasi **avans (zapas)** bo'lib qoladi va buyurtmada, mijoz kartasida hamda hisob-fakturada yashil rangda ko'rsatiladi. Kiritilganda ogohlantirish chiqadi.

**Mijozlar** — batafsil sahifa: buyurtmalar tarixi, jami summa, to'langan, qarzdorlik.

**Ombor** — qog'oz, bo'yoq, plyonka va boshqa mahsulotlar. Har mahsulotning kartochkasi bor: nomi, birligi, eng kam qoldiq. Ombor sahifasida bitta tugma — **"Kirim"**: yangi mahsulot ochish alohida sahifa emas, xuddi shu kirim jadvalining ichida bo'ladi — har qatorda mahsulot nomi yozib qidiriladi (avtomatik takliflar bilan), bazada topilmasa o'sha yerda birligini tanlab, sahifadan chiqmasdan yangi mahsulot ochiladi va kirim bilan birga saqlanadi. **Kirim** — sotib olingan mahsulot omborga qo'shiladi, **kimdan olinganligi (taminotchi)** va **to'lov holati** belgilanadi: naqd, **perechisleniye** (bank o'tkazmasi — qaysi tashkilot hisobidan to'langani ham so'raladi: Marvel Creative MChJ yoki MyPrint MChJ) yoki qarzga. O'sha kuni `xomashyo` turkumidagi xarajat sifatida yoziladi. **Chiqim** — mahsulot buyurtmaga sarflanadi: yangi xarajat yozilmaydi, faqat qoldiq kamayadi va o'sha buyurtmaning tannarxiga qo'shiladi. Shu tufayli bir xil pul ikki marta sanalmaydi. Har bir kirim va chiqim jurnalda saqlanadi: sana, soni, narx, kim qildi, qaysi buyurtmaga.

**Taminotchilar** — ombor kirimi "qarzga olindi" deb belgilansa, summa taminotchi balansiga qo'shiladi. Taminotchi kartochkasida: jami xarid, to'lovlar tarixi, joriy qarz. Qarzni qisman yoki to'liq to'lash mumkin (mijoz to'lovi kabi). Ro'yxatda eng ko'p savdo qilingan taminotchilar ajratib ko'rsatiladi — admin, boss va ish boshqaruvchi ko'radi. **Xarajatlar** sahifasida perechisleniye orqali to'langan summalar tashkilot (Marvel Creative MChJ / MyPrint MChJ) bo'yicha alohida jamlanadi — admin, boss va ish boshqaruvchi ko'radi.

**Xarajatlar** — avval buyurtma tanlanadi (raqam, mijoz yoki mahsulot nomi bo'yicha qidiriladi), so'ng jadvalga qatorlar yoziladi: **mahsulot, soni, narxi va jami** (jami avtomatik hisoblanadi). Buyurtma xarajatida mahsulot faqat **ombordan** olinadi — omborda yo'q narsani yozib bo'lmaydi, avval kirim qilish kerak. Qoldiq yetmasa ish to'xtamaydi, ogohlantirish chiqadi. Umumiy xarajatlarda turkum tugmalar orqali tanlanadi (ijara, ish haqi, kommunal, transport, xomashyo, jihoz, soliq, **ofis xarajatlari**) va matn erkin yoziladi; "buyurtma" turkumi tizim tomonidan avtomatik qo'yiladi, tanlov/filtrda ko'rinmaydi. Buyurtma sahifasida uning xarajati va haqiqiy foydasi ko'rinadi.

**Moliyaviy hisobot** (admin, boss, ish boshqaruvchi ko'radi) — yil kesimida oylar bo'yicha tushum/xarajat/foyda (ustunli grafik + foyda chizig'i), xarajat turkumlari halqasi, mahsulot turlari va **xarajati bo'lgan har bir buyurtmaning foizi va summasi bilan rentabellik jadvali**, Excel. Ilgari alohida "Xarajat tahlili" sahifasi bo'lgan — bir xil ishni qilgani uchun shu yerga birlashtirildi.

**Tahlil** (admin, boss, ish boshqaruvchi ko'radi) — eng foydali mijozlar, mahsulot turlari, o'rtacha buyurtma, bekor qilish darajasi, qarzdorlar.

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
| `stock.py` | Ombor: mahsulotlar, kirim va chiqim |
| `suppliers.py` | Taminotchilar: qarz-to'lov balansi |
| `clients.py` · `auth.py` · `settings.py` | Mijozlar, kirish, sozlamalar |
| `telegram_bot.py` · `notifications.py` | Telegram integratsiyasi |
| `send_daily.py` | Kunlik xulosa (server vazifasi) |
| `migrate_db.py` | Bazani yangilash |
| `seed.py` · `seed_demo.py` | Boshlang'ich / namuna ma'lumotlar |
| `tests/` | Avtomatik testlar |

---

## Keyingi bosqichda qo'shsa bo'ladi

Narx kalkulyatori (format, qog'oz, ranglilik bo'yicha), mavsumiylik tahlili, mijoz portali (login'siz buyurtma holatini ko'rish), integratsion testlar (`pytest`), Alembic migratsiya.
