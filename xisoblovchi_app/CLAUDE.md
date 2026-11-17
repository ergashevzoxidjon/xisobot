# Xisoblovchi — Bosmaxona ERP (Xisobot platformasi ichida)

Bosmaxona uchun narx hisoblash va buyurtma tizimi. **2026-11-17 dan Xisobot platformasi (Flask) ichida ishlaydi**:
`/xisoblovchi/` manzilida, Xisobot login'i bilan. Asosiy loyiha — Xisobot; alohida `xisoblovchi.mylogo.uz` sayti va uning
GitHub repozitoriyasi (`ergashevzoxidjon/xisoblovchi`) endi manba emas — o'zgarishlar shu papkada qilinadi.

## Xisobot ichidagi ishlash tartibi (muhim)

- **Server tomoni** — ildizdagi `xisoblovchi.py` (blueprint): faylllarni login'dan keyin beradi, sahifaga `window.XIS`
  (rol, CSRF, bazadagi sozlamalar) joylaydi, `/api/kv` (saqlash), `/api/admin-tasdiq`, `/api/rasm`, `/zaxira` (eksport/import).
- **Rol Xisobot roli bilan aniqlanadi** (`?rol=` havolasi va PIN darvozasi yo'q): `calc.edit` ruxsati (admin, ish boshqaruvchi) —
  "admin rejimi", qolganlar (menejer, boss) — "menejer rejimi". Ruxsatlar `permissions.py` da: `calc.view`, `calc.edit`.
- **Ma'lumotlar bazada** (`xis_kv` jadvali, `XisKV` modeli): `umumiy/server-xotira.js` brauzer `localStorage`'ini almashtiradi —
  hisob-kitob kodi o'zgarmagan, hamma `localStorage.getItem/setItem('erp_...')` serverga ketadi. Yangi sozlama qo'shsangiz
  hech narsa qo'shimcha qilish shart emas. Istisnolar `xisoblovchi.py` da: `USER_KEYS` (har foydalanuvchiga alohida —
  savatcha), `MERGE_KEYS` (hamma yozadigan ro'yxatlar — arxiv, audit: birlashtiriladi), `BLOCKED_KEYS` (eski PIN bazasi).
  Boshqa kalitni menejer yozolmaydi (faqat shu sahifa ochiqligida xotirada turadi).
- **Bir vaqtda tahrirlash**: har kalitning versiyasi bor; eskirgan nusxa saqlanmaydi, ekranda "sahifani yangilang" chiqadi.
- **"Admin PIN" o'rniga admin akkauntining paroli** (past marjani tasdiqlash, 👁️ to'liq hisob-kitob): `adminTasdiq(parol)` →
  `/api/admin-tasdiq`. Mustaqil rejimda (`window.XIS` yo'q, masalan `testlar/`) eski PIN ishlaydi.
- **Rasmlar** — `uploads/xisoblovchi/` (gitignore'da), kalit kerak emas, faqat admin rejimi yuklaydi.
- **PWA/service worker o'chirilgan** (kirish sessiya bilan, ma'lumot serverdan).
- **Eski saytdan ko'chirish**: narxlar eski brauzer `localStorage`'ida edi — `/xisoblovchi/zaxira` sahifasida ko'rsatma bor.
- Testlar: `python tests/scenario_xisoblovchi.py` (server) va `testlar/index.html` (hisob formulalari, quyida).
- `passenger_wsgi.py`, `sw.js`, `manifest.webmanifest` va `.deploy/deploy.json` ko'chirilmagan (eski mustaqil deploy uchun edi).

## Tuzilma

```
index.html                  ← AVTOMATIK YIG'ILADI — qo'lda tahrirlamang!  (Xisobot serverga shuni beradi)
.deploy/yigish.py          ← bo'lim HTML qismlaridan index.html ni yig'adi
.deploy/deploy.json        ← deploy agent sozlamalari (server, yig'ish buyrug'i)
umumiy/
  index.template.html       ← sahifa skeleti (login, sarlavha, kalkulyator, admin, hisobotlar)
  core.css                  ← umumiy uslublar
  yordamchi.js              ← 1-yuklanadi: bo'limlar ro'yxati, xatodan himoya, umumiy yordamchilar
  core.js                   ← login, navigatsiya, init(), generateForm()/calculate() tarqatuvchilari
  custom-products.js        ← admin qo'shadigan "maxsus" mahsulotlar
  full-calc.js              ← 👁️ to'liq hisob-kitob modali
  admin-ux.js               ← admin panel: yuqori panel, tez o'tish, saqlanmagan o'zgarishlar, Ctrl+S
  narx-tekshiruv.js         ← admin: "🔎 Narxlarni tekshirish" (kiritilmagan va boshlang'ich narxlar ro'yxati)
  server-xotira.js          ← 1-yuklanadi: localStorage → server (xis_kv), adminTasdiq(), "← Xisobot" paneli
  rasm-ombori.js            ← rasmlarni serverda saqlash, rasmniServergaYuklash()
  mahsulot-malumoti.js      ← har qanday mahsulot uchun rasm + ma'lumot ("ℹ️ Mahsulot haqida")
  marja-nazorat.js          ← minimal marja chegarasi va admin tasdig'i
  ishga-tushirish.js        ← oxirgi yuklanadi: init() ni chaqiradi, service worker'ni ro'yxatdan o'tkazadi
ikonkalar umumiy/icons/
testlar/                    ← hisob-kitob regressiya testlari (testlar/index.html, qarang: "Testlar")
bolimlar/<nomi>/<nomi>.html|.css|.js
  poligrafiya  (Flayer, Listovka, Doorhanger, Buklet, Bloknot, Paket, Kalendar, Papka, Kubarik, Konvert, Otkritka, Diplom, Katalog, Vizitka, Stiker)
               JS 13 ta faylga bo'lingan (bitta global ko'lam, shu tartibda yuklanadi): asos, bloknot, varaqli (Konvert+Otkritka),
               diplom, katalog, paket, kubarik, papka, kalendar, vizitka, stiker, dvigatel (Doorhanger + umumiy dvigatel),
               poligrafiya (faqat ro'yxatdan o'tkazish — oxirida). Har bir qism oxirida POLI_QISMLAR ga o'zini yozadi;
               qism yuklanmasa bo'lim "ishlamayapti" bo'ladi. Yangi qism qo'shsangiz: shablondagi <script> ro'yxatiga va
               poligrafiya.js dagi POLI_KUTILGAN_QISMLAR ga ham kiriting.
  textile      (Futbolka ... Shoper, Bayroqlar)
  suvenir      (Ruchka, Termos, ... Zontik, Koja papkalar, Guvohnomalar)
  reklama      (Baner, Orakal, ..., Roll Up, Pauk, PopUp, PromoStoyka, Tablichka, Nastolniy tablichka, Stend)
  qogoz        (faqat admin: "Qog'oz bo'limi" — Ofset qog'oz narxlari + Konvert qog'ozlari)
  ofset        (Ofset pechat kalkulyatori + Ofset qog'oz bazasi)
  sifravoy     (Raqamli pechat kalkulyatori)
```

## Qoidalar

1. **`index.html` ni hech qachon to'g'ridan-to'g'ri tahrirlamang.** HTML o'zgarishi →
   `bolimlar/<nomi>/<nomi>.html` yoki `umumiy/index.template.html`, so'ng `python3 .deploy/yigish.py`
   (Windows: `py .deploy\yigish.py`). Yig'uvchi index.html qo'lda o'zgartirilganini sezsa to'xtaydi
   (`--majburiy` bilan ustidan yozadi).
2. JS/CSS alohida fayl sifatida yuklanadi, lekin yig'uvchi har bir havolaga fayl mazmunidan versiya qo'shadi
   (`core.js?v=1a2b3c4d`) — brauzer keshdagi eski faylni ishlatmasligi uchun. Shuning uchun **JS/CSS o'zgargandan
   keyin ham yig'uvchini** ishga tushiring (deploy agent buni o'zi qiladi).
3. Bo'lim HTML fayli `<!-- @blok NOMI -->` ... `<!-- @/blok -->` bloklaridan iborat; shablondagi
   `<!-- @include bolim/NOMI -->` o'rniga qo'yiladi (grid — bosh sahifa kartochkalari,
   admin — admin panel bloklari, modal — qalqib chiquvchi oyna).
4. Barcha fayllar klassik `<script>` — umumiy global ko'lamni bo'lishadi (modul emas).
   Bitta nomni ikki faylda `let`/`const` bilan e'lon qilish butun faylni sindiradi.

## Bo'limlar mustaqilligi (bir bo'lim buzilsa, qolganlari ishlaydi)

- Har bir bo'lim JS fayli **oxirida** `bolimRoyxatdan('<nomi>', { talab: [...], init() {...} })`
  chaqiradi. Fayl xato bilan yuklansa bu chaqiruv bo'lmaydi → bo'lim "ishlamayapti" deb belgilanadi,
  bosh sahifada ogohlantirish chiqadi, kartochkalari bloklanadi.
- `init()` — shu bo'limning `localStorage` ma'lumotlarini yuklaydi. `core.js → bolimlarniIshgaTushir()`
  ularni `try/catch` bilan, `BOLIM_INIT_TARTIBI` tartibida chaqiradi (Ofset Poligrafiyadan oldin).
- `talab`: **poligrafiya → ofset, sifravoy** (Bloknot/Papka/Kalendar/Doorhanger Ofset qog'oz bazasi va
  hisobidan foydalanadi). Baner/Orakal admin bazasi Suvenirdagi umumiy "model" boshqaruvini ishlatadi.
- `openCalc`, `calculate`, `openProductManager` xatodan himoyalangan (`mahsulotBolimiTekshir`,
  `calculateIchki`, `openProductManagerIchki`).
- `core.js`/`yordamchi.js` dan boshqa bo'lim o'zgaruvchisiga murojaat qilish kerak bo'lsa —
  `xavfsizOl(() => ..., zaxira)` yoki `typeof fn === 'function'` bilan o'rang.
- Bir nechta bo'lim ishlatadigan narsa (tiraj jadvali funksiyalari, `taxiNarxi` — yagona umumiy taxi narxi, klishe narxlari,
  `selectedPrintType`, `placeholderImg`, `convertBase64`) `umumiy/yordamchi.js` da turadi.

## Muhim biznes qoidalari

- **Ofset minimal tiraji** (`poligrafiyaMahsulotSozlama`, `POLI_DVIGATEL_TURLARI` — Flayer, Listovka, Buklet): adad kam bo'lsa Ofset tugmasi `disabled`, hisob Raqamli pechatda. Admin → mahsulot →
  "⚙️ Mahsulot sozlamalari" (bichish o'lchami, qo'shimcha ishlov narxi ham shu yerda).
- **Pardozlash narxlari — bitta umumiy joy**: `ofsetFinishingServices` (visochka, laminatsiya, lak, tisneniya ×
  A3/A2/A1), admin: Ofset pechat → "✂️ Pardozlash xizmatlari". Papka va Paket shundan oladi — mahsulotda alohida
  lak/tisneniya narxi YOZMANG.
- **Paket** (`paketConfig`, `calculatePaket`) — FAQAT Karton, har turning `standartGsm` i (A5 190, A4 210, A3 230,
  A2 250); menejer ro'yxatdan boshqa grammaj tanlashi mumkin. Tur (A5–A2) → tayyor o'lcham (X bo'yi, Y eni, Z kengligi — majburiy).
  Bichish (1 tomon) = (X+Z+3)×(Y+Z+3) → Ofset (A3/A2/A1, eng arzon pechat). Bir xil dizayn: ofsetga 2×adad;
  har xil: adad, qog'oz/forma/pechat ×2 (zapasni `calculateOfsetForMachine` o'zi qo'shadi, +100). Laminatsiya,
  visochka (ofsetFinishingServices), lak, tisneniya — 2×adad bo'lak, mashina narxida. Yig'ish, lenta — har paketga.
  O'lcham tayyor ro'yxatda bo'lmasa — turning bir martalik pichoq narxi. Ma'lumot yetmasa `hisobYaroqsiz` → narx "—".
- **Konvert** (`varaqliConfig`, `calculateVaraqli`): tur (tayyor o'lcham + bichim + tiraj bo'yicha Sifravoy/UF dona
  narxi) yoki o'z o'lchami (bichim formula bilan + bir martalik pichoq). Qog'oz — `qogozRoyxati('konvert')`
  (Qog'oz bo'limi). Pechat: Sifravoy / UF / pechatsiz + Tisneniya (umumiy, A3).
- **Otkritka** (`otkritkaConfig`, `calculateOtkritka`) — FAQAT Sifravoy pechat. Menejer YOYILGAN o'lchamni kiritadi
  (tur bosilsa — turning `bichishEni/Boyi`). Otkritkaning O'Z qog'oz ro'yxati (`otkritkaConfig.qogozlar`, Sifravoy
  bazasidan alohida; maydonlar Sifravoy bilan bir xil: q_eni/q_boyi/p_eni/p_boyi/price1/price2) va `lakQogoz`
  (Colotech 300g A2, 680×480) — 3D lak/folga faqat shu qog'ozda + `lakTierlar` (faqat lak/folga ishi, varaq bo'yicha).
  Hisob `calculateDigitalPriceForPaper`, 1/2 tomon. Laminatsiya ixtiyoriy (umumiy: SRA3 — A3, A2 — A2).
  Har turning qo'shimcha xizmati (so'm/dona).
- **Qog'oz bo'limi** (`bolimlar/qogoz/`, admin kaliti `qogoz_bolimi`): Ofset qog'oz narxi — `saveOfsetQogozNarxlari()`,
  mashina (forma/bosma) — `saveOfsetMashinaSozlamalari()` alohida (bir-birining maydonlarini saqlab yubormasin).
- **Kubarik** (`kubarikConfig`): Bloknot kabi — qog'oz Ofset A3 bazasidan, turlar (Oq/Rangli/Kleyli/Pechatli) admin tahrirlaydi.
- **Reklama maksimal chop eni** (`reklamaMaxEni`: baner 3.1, orakal/setka/tumanka 1.5 m): IKKALA tomon ham
  kattaroq bo'lsa ogohlantirish (aylantirib sig'sa — yo'q).
- **Taxi** — bitta umumiy `taxiNarxi`, har buyurtmaga bir marta, marja bilan. **Marja** — `marjaOl()`/`marjaQiymati()`
  (0% ham to'g'ri; kiritilgan qiymat mahsulotlar orasida eslab qolinadi).
- Admin panelda har qanday `save...` nomli tugma `admin-ux.js` tomonidan "saqlandi" deb hisoblanadi — yangi
  saqlash tugmasi nomini ham `save` bilan boshlang.

## Deploy agent

Avto-push/avto-pull skriptlari olib tashlangan — GitHub sinxronlash, yig'ish va serverga chiqarishni
Claude'ning **deploy-agent** skilli bajaradi ("deploy qil", "githubga yubor", "githubdan ol").
- Sozlamalar: `.deploy/deploy.json`. GitHub token: `.deploy/github_token.txt` (gitignore'da, hech qachon commit qilinmaydi).
- Tartib: pull → `python3 .deploy/yigish.py` → commit → push → server (cPanel Git: *Update from Remote*).
- Server: Hostmaster cPanel, `/home/mylogo/xisoblovchi.mylogo.uz`, Passenger (`passenger_wsgi.py`) fayllarni
  har so'rovda diskdan o'qiydi — odatda restart kerak emas; `passenger_wsgi.py` o'zgarsa `tmp/restart.txt` ga touch.

## Testlar

Hisob formulalariga (Ofset/Raqamli dvigatel, pardozlash, Stiker/Kubarik/Vizitka...) tegilganda `python -m http.server 8000`
va brauzerda `http://localhost:8000/testlar/` ni oching: 40 ta holat ilovani **toza xotira bilan** (saqlangan narxlarga
tegmasdan) hisoblab, `testlar/kutilgan.js` dagi qiymat bilan solishtiradi. Qizil qator — narx kutilmagan o'zgargan.
Formula ATAYLAB o'zgargan bo'lsa: `?yozib` bilan oching, chiqqan qiymatni `kutilgan.js` ga ko'chiring. Yangi holat —
`testlar/holatlar.js` ga qator qo'shing. (Kutilgan qiymatlar — namuna/snapshot, "to'g'ri narx" kafolati emas.)

## Admin yordamchilari

- **Narxlarni tekshirish** (`narx-tekshiruv.js`): yangi mahsulot/sozlama qo'shsangiz, uning "kiritilmagan narx" va
  "boshlang'ich (taxminiy) narx" tekshiruvini `narxMuammolari()` ga qo'shing. Taxminiy narxlar "tasdiqlandi" bo'ladi:
  config localStorage'da saqlanganda (Stiker, Kubarik) yoki `narxTasdiqla('<kalit>')` chaqirilganda (Reklama).
- **Mahsulot rasmi/ma'lumoti** (`mahsulot-malumoti.js`): hamma mahsulot admin sahifasida avtomatik chiqadi, ma'lumot
  `erp_mahsulot_malumoti` da.
- **Rasmlar serverda** (`rasm-ombori.js` + `passenger_wsgi.py`): admin kalitni kiritsa, `convertBase64()` siqilgan rasmni
  serverga yuboradi va qisqa manzil ("uploads/....webp") qaytaradi; xato bo'lsa data-URL qoladi. Kalit serverda
  `/home/mylogo/.xisoblovchi_token` faylida (gitga kirmaydi). `uploads/` gitignore'da. `<img>.src` mutlaq manzil
  qaytaradi — saqlashdan oldin `rasmManzilNisbiy()` dan o'tkazing.
- **Marja nazorati** (`marja-nazorat.js`): menejer minimal marjadan past kiritsa, `addToQuoteCart()` va `copyResult()`
  admin PIN tasdig'ini talab qiladi (`marjaRuxsatBormi()`). Yangi "natijani chiqaradigan" tugma qo'shsangiz — shuni chaqiring.
- **Telefon ko'rinishi**: `.calc-grid` ustunlarini `style` bilan emas, CSS sinfi (`calc-grid-teng`) bilan boshqaring —
  inline style telefon uchun media-qoidani bekor qiladi.

## Yangi mahsulot qo'shish

1. `umumiy/core.js` → `allCategories` va `defaultPrices` ga kalit qo'shing.
2. Bosh sahifa kartochkasi → `bolimlar/<nomi>/<nomi>.html` dagi `grid` bloki.
3. Forma/hisob → `bolimlar/<nomi>/<nomi>.js`; kerak bo'lsa `core.js` dagi `generateForm()`/`calculateIchki()`
   tarqatuvchisiga shox qo'shing. Saqlanadigan sozlama bo'lsa — yuklashni o'sha bo'limning `init()` iga yozing.
4. HTML o'zgargan bo'lsa `python3 .deploy/yigish.py`.

## Tekshirish

`python -m http.server 8000` (`.claude/launch.json` → `xisoblovchi-static`), brauzer konsolida xato yo'qligini
va bosh sahifada sariq ogohlantirish chiqmaganini tekshiring.
