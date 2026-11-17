// ====================== UMUMIY YORDAMCHI FAYL ======================
// Bu fayl ENG BIRINCHI yuklanadi. Unda:
//   1) Bo'limlar ro'yxati va xatolikdan himoya (bir bo'lim buzilsa, qolganlari ishlayveradi)
//   2) Bir nechta bo'lim birga ishlatadigan umumiy yordamchi funksiyalar va holatlar
//      (tiraj jadvali, klishe/taxi narxlari, rasm o'rnbosari va h.k.)

    // ====================== BO'LIMLAR RO'YXATI VA XATOLIKDAN HIMOYA ======================
    // Har bir bo'lim fayli (bolimlar/<nomi>/<nomi>.js) oxirida bolimRoyxatdan() ni chaqiradi.
    // Fayl sintaksis xatosi bilan umuman yuklanmasa yoki yuklanish paytida xato bersa,
    // bu chaqiruv sodir bo'lmaydi — tizim shu bo'limni "ishlamayapti" deb belgilaydi,
    // uning mahsulot kartochkalarini bloklaydi, qolgan bo'limlar esa odatdagidek ishlaydi.
    const BOLIM_NOMLARI = {
        ofset: 'Ofset pechat',
        sifravoy: 'Sifravoy pechat',
        poligrafiya: 'Poligrafiya',
        textile: 'Textile',
        suvenir: 'Suvenir',
        reklama: 'Reklama',
        qogoz: "Qog'oz bo'limi"
    };
    // Bosh sahifadagi har bir bo'lim kartochkalari to'rining id si (bo'lim ishlamasa xiralashtiriladi)
    const BOLIM_GRID_ID = {
        ofset: 'grid-ofset',
        sifravoy: 'grid-sifravoy',
        poligrafiya: 'grid-poligrafiya',
        textile: 'grid-textile',
        suvenir: 'grid-souvenir',
        reklama: 'grid-reklama'
    };
    const BOLIMLAR = {}; // nomi -> { tayyor, xato, init, talab }
    let bolimlarYuklanmoqda = true; // sahifa yuklanish bosqichi tugaguncha true

    // sozlama: { init: function () {...} — saqlangan ma'lumotlarni yuklash,
    //            talab: ['ofset', ...] — shu bo'lim ishlashi uchun kerak bo'lgan boshqa bo'limlar }
    function bolimRoyxatdan(nomi, sozlama) {
        sozlama = sozlama || {};
        let oldingi = BOLIMLAR[nomi];
        BOLIMLAR[nomi] = {
            tayyor: !(oldingi && oldingi.xato),
            xato: oldingi ? oldingi.xato : null,
            init: sozlama.init || null,
            talab: sozlama.talab || []
        };
    }

    function bolimXatosi(nomi, xato) {
        let matn = (xato && xato.message) ? xato.message : String(xato);
        BOLIMLAR[nomi] = Object.assign(BOLIMLAR[nomi] || { init: null, talab: [] }, { tayyor: false, xato: matn });
        console.error(`[${BOLIM_NOMLARI[nomi] || nomi}] bo'limida xato:`, xato);
    }

    // Bo'lim o'zi va u talab qiladigan barcha bo'limlar ishlayaptimi?
    function bolimIshlaydimi(nomi, _korilgan) {
        let b = BOLIMLAR[nomi];
        if (!b || !b.tayyor) return false;
        _korilgan = _korilgan || {};
        if (_korilgan[nomi]) return true;
        _korilgan[nomi] = true;
        return b.talab.every(t => bolimIshlaydimi(t, _korilgan));
    }

    // Bo'lim nega ishlamayotganini odam tushunadigan matnda qaytaradi
    function bolimXatoSababi(nomi) {
        let b = BOLIMLAR[nomi];
        if (!b) return `${BOLIM_NOMLARI[nomi] || nomi} bo'limi fayli yuklanmadi (bolimlar/${nomi}/${nomi}.js).`;
        if (!b.tayyor) return `${BOLIM_NOMLARI[nomi] || nomi} bo'limida xato: ${b.xato || "noma'lum"}`;
        let buzuq = b.talab.find(t => !bolimIshlaydimi(t));
        if (buzuq) return `${BOLIM_NOMLARI[nomi] || nomi} bo'limi ${BOLIM_NOMLARI[buzuq] || buzuq} bo'limiga bog'liq, u esa hozir ishlamayapti.`;
        return '';
    }

    // Yuklanish paytida bo'lim faylidagi xatoni ushlab, o'sha bo'limga yozib qo'yamiz.
    // (Yuklanib bo'lgandan keyingi xatolar — masalan tugma bosilgandagi — bo'limni o'chirmaydi.)
    window.addEventListener('error', function (e) {
        if (!bolimlarYuklanmoqda || !e || !e.filename) return;
        let m = e.filename.match(/bolimlar\/([a-z_]+)\//);
        if (m) bolimXatosi(m[1], e.error || e.message);
    });

    // Bo'lim ishlamasa — bosh sahifadagi kartochkalarini xiralashtirib, yuqorida ogohlantirish chiqaramiz
    function bolimXatolariniKorsat() {
        let buzuqlar = Object.keys(BOLIM_NOMLARI).filter(n => !bolimIshlaydimi(n));
        buzuqlar.forEach(n => {
            let grid = document.getElementById(BOLIM_GRID_ID[n]);
            if (grid) {
                grid.classList.add('bolim-ishlamayapti');
                grid.title = bolimXatoSababi(n);
            }
        });
        let banner = document.getElementById('bolimXatoBanner');
        if (!banner) return;
        if (buzuqlar.length === 0) { banner.style.display = 'none'; return; }
        let esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        banner.innerHTML = '⚠️ ' + buzuqlar.map(n => `<b>${BOLIM_NOMLARI[n]}</b>`).join(', ')
            + " bo'limi(lari) xatolik tufayli vaqtincha ishlamayapti. Qolgan bo'limlar odatdagidek ishlaydi."
            + '<br><small>' + buzuqlar.map(n => esc(bolimXatoSababi(n))).join('<br>') + '</small>';
        banner.style.display = 'block';
    }

    // Boshqa bo'limga tegishli qiymatni xavfsiz o'qish: o'sha bo'lim yuklanmagan bo'lsa zaxira qaytadi
    function xavfsizOl(fn, zaxira) {
        try { return fn(); } catch (e) { return zaxira; }
    }

    // ====================== UMUMIY HOLATLAR VA YORDAMCHILAR ======================
    // Quyidagilar bir nechta bo'lim (va core.js) tomonidan ishlatiladi, shuning uchun
    // biror bo'lim buzilsa ham ular mavjud bo'lib turishi kerak.

    // Admin "model qo'shish" formasida joriy mahsulot turida qaysi chop ustunlari ko'rinadi
    let currentPrintColumns = { uv: true, sifravoy: true, dtf: false, gravirovka: false, labels: { uv: 'UF Pechat', sifravoy: 'Sifravoy', dtf: 'UF DTF', gravirovka: 'Gravirovka' } };

    // Kalkulyatorda tanlangan chop turi (Suvenir, Maxsus mahsulotlar va Klishe hisobi ishlatadi)
    let selectedPrintType = 'uv';

    // Tisneniya (gravirovka) tanlanganda bir martalik "Klishe" (qolip) narxi qo'shiladigan turlar.
    // Bu narx buyurtma miqdoriga bog'liq emas — bir marta, butun buyurtma uchun qo'shiladi.
    let klisheFeeProductTypes = ['yejidnevnik', 'koja_papka', 'guvohnoma'];
    let klisheOneTimePrices = { yejidnevnik: 150000, koja_papka: 150000, guvohnoma: 150000 };

    function saveKlisheFee() {
        let input = document.getElementById('klisheFeeInput');
        if (!input || !currentManagingProduct) return;
        let price = parseFloat(input.value) || 0;
        klisheOneTimePrices[currentManagingProduct] = price;
        localStorage.setItem('erp_klishe_prices', JSON.stringify(klisheOneTimePrices));
        if (typeof logAudit === 'function') logAudit("Klishe narxi o'zgartirildi", `${currentManagingProduct}: ${price.toLocaleString()} so'm`);
        showToast("💾 Klishe narxi saqlandi!");
    }

    // ====================== TAXI (YETKAZIB BERISH) — BITTA UMUMIY NARX ======================
    // BARCHA bo'limlardagi (Poligrafiya, Textile, Bayroqlar, Suvenir, Reklama, Ofset, Sifravoy,
    // maxsus mahsulotlar) HAR BIR hisob-kitobga, miqdordan qat'iy nazar, BIR MARTA qo'shiladi
    // (marja bilan). Bo'limlarda alohida taxi narxi YO'Q — faqat Admin panel → "🚕 Taxi".
    // Qo'shiladigan joylar: core.js → calculateIchki(), ofset.js → calculate_ofset(),
    // sifravoy.js → calculate_raqamli().
    const TAXI_STANDART_NARX = 150000;
    let taxiNarxi = TAXI_STANDART_NARX;

    function renderTaxiAdmin() {
        let el = document.getElementById('taxiNarxiInput');
        if (el) el.value = taxiNarxi;
    }

    function saveTaxiNarxi() {
        let el = document.getElementById('taxiNarxiInput');
        let v = el ? parseFloat(el.value) : NaN;
        if (isNaN(v) || v < 0) {
            showToast("⚠️ Taxi narxi 0 yoki undan katta son bo'lishi kerak!");
            return;
        }
        let eski = taxiNarxi;
        taxiNarxi = v;
        localStorage.setItem('erp_taxi_narxi', JSON.stringify(taxiNarxi));
        if (typeof logAudit === 'function') {
            logAudit("Taxi narxi o'zgartirildi", `${eski.toLocaleString()} → ${taxiNarxi.toLocaleString()} so'm`);
        }
        showToast("💾 Taxi narxi saqlandi!");
    }

    // ====================== ISHXONA MARJASI ======================
    // Kalkulyatorda kiritilgan marja ESLAB QOLINADI: boshqa mahsulot ochilganda maydon 65 ga
    // qaytib ketmaydi, oxirgi kiritilgan qiymat qo'yiladi (sahifa yangilanguncha).
    // 0% ham to'g'ri qiymat — standart faqat maydon bo'sh yoki noto'g'ri bo'lganda olinadi.
    // (Oldin `parseFloat(...) || 65` 0 ni ham 65 ga aylantirardi.)
    const MARJA_STANDART = 65;
    const joriyMarjalar = {}; // marja maydoni id si -> oxirgi kiritilgan qiymat

    // Hisob-kitobda ishlatiladigan marja: maydondagi qiymat (va uni eslab qoladi)
    function marjaOl(inputId, standart) {
        let el = document.getElementById(inputId);
        let v = el ? parseFloat(el.value) : NaN;
        if (!isNaN(v) && v >= 0) {
            joriyMarjalar[inputId] = v;
            return v;
        }
        return marjaQiymati(inputId, standart); // maydon bo'sh (yozilayotgan) bo'lsa — oxirgi qiymat
    }

    // Marja maydonini chizishda qo'yiladigan boshlang'ich qiymat
    function marjaQiymati(inputId, standart) {
        return (inputId in joriyMarjalar) ? joriyMarjalar[inputId] : standart;
    }

    // Jami summaga qo'shiladigan taxi — marja bilan
    function taxiMarjaBilan(marginPercent) {
        return Math.round(taxiNarxi * (1 + (parseFloat(marginPercent) || 0) / 100));
    }

    /* =========================================================================
       MIQDOR ORALIQLARI (TIRAJ JADVALI)
       Suvenir mahsulotlarida narx buyurtma miqdoriga qarab o'zgaradi.
       Har bir model o'z jadvaliga ega: { from, to, basePrice, printPrices }
       - to = 0 yoki bo'sh  -> cheksiz ("va undan yuqori")
       - biror katak 0 bo'lsa -> modelning umumiy (jadvaldan tashqari) narxi ishlatiladi
       Jadval bo'sh bo'lsa eski tartib (bitta qat'iy narx) saqlanadi.
       ========================================================================= */

    const TIER_PRINT_KEYS = ['uv', 'sifravoy', 'dtf', 'gravirovka'];

    function normalizeTier(t) {
        t = t || {};
        let pp = t.printPrices || {};
        let out = {
            from: Math.max(1, parseInt(t.from) || 1),
            to: Math.max(0, parseInt(t.to) || 0),
            basePrice: parseFloat(t.basePrice) || 0,
            // minPrice faqat textile pechat narxida ishlatiladi (eng kam pechat summasi).
            // Boshqa joylarda 0 bo'lib qoladi va hisobga ta'sir qilmaydi.
            minPrice: parseFloat(t.minPrice) || 0,
            printPrices: {}
        };
        TIER_PRINT_KEYS.forEach(k => { out.printPrices[k] = parseFloat(pp[k]) || 0; });
        return out;
    }

    function normalizeTierList(list) {
        if (!Array.isArray(list)) return [];
        return list
            .map(normalizeTier)
            .filter(t => t.from >= 1)
            .sort((a, b) => a.from - b.from);
    }

    function tierUpper(t) {
        return (t.to && t.to > 0) ? t.to : Infinity;
    }

    function tierLabel(t) {
        return (t.to && t.to > 0) ? `${t.from}–${t.to} dona` : `${t.from}+ dona`;
    }

    // Berilgan miqdorga mos oraliqni topamiz.
    // Aniq mos kelmasa: miqdor eng kichik oraliqdan pastda bo'lsa birinchisi,
    // eng kattasidan yuqorida bo'lsa oxirgisi ishlatiladi (narx hech qachon "yo'qolib qolmaydi").
    function findTierForQty(tiers, qty) {
        let list = normalizeTierList(tiers);
        if (list.length === 0) return null;
        let n = parseInt(qty) || 1;
        for (let t of list) {
            if (n >= t.from && n <= tierUpper(t)) return t;
        }
        if (n < list[0].from) return list[0];
        return list[list.length - 1];
    }

    // Bo'shliq va ustma-ust tushgan oraliqlarni admin ko'rib turishi uchun ogohlantiramiz
    function tierValidationMessages(list) {
        let msgs = [];
        let sorted = normalizeTierList(list);
        if (sorted.length === 0) return msgs;

        if (sorted[0].from > 1) {
            msgs.push(`1–${sorted[0].from - 1} dona uchun oraliq yo'q. Bu miqdorda eng birinchi oraliq narxi ishlatiladi.`);
        }
        for (let i = 0; i < sorted.length - 1; i++) {
            let cur = sorted[i], next = sorted[i + 1];
            let curTo = tierUpper(cur);
            if (curTo === Infinity) {
                msgs.push(`"${tierLabel(cur)}" cheksiz oraliq, undan keyingi qatorlar hech qachon ishlamaydi.`);
                break;
            }
            if (next.from <= curTo) {
                msgs.push(`"${tierLabel(cur)}" va "${tierLabel(next)}" ustma-ust tushyapti. ${next.from}–${curTo} miqdorida birinchisi ishlatiladi.`);
            } else if (next.from > curTo + 1) {
                msgs.push(`${curTo + 1}–${next.from - 1} dona uchun oraliq yo'q.`);
            }
        }
        let last = sorted[sorted.length - 1];
        if (tierUpper(last) !== Infinity) {
            msgs.push(`${tierUpper(last)} donadan yuqori miqdor uchun oraliq yo'q — oxirgi oraliq narxi ishlatiladi. Buni "Gacha" ni 0 qilib yopishingiz mumkin.`);
        }
        return msgs;
    }

    // via.placeholder.com xizmati yopilgan/ishonchsiz bo'lgani uchun (rasm o'rniga bo'sh
    // qutича chiqishiga sabab bo'lgan) — tashqi xizmatga bog'liq bo'lmagan, doim ishlaydigan
    // mahalliy SVG rasm-o'rnbosar. Internet/xizmat holatidan qat'iy nazar har doim ko'rinadi.
    function placeholderImg(text, w, h) {
        w = w || 150; h = h || 150;
        let label = (text || "Rasm yo'q").toString();
        let fontSize = Math.max(10, Math.floor(Math.min(w, h) / 8));
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    // Yuklangan rasm localStorage'da base64 matn sifatida saqlanadi. Brauzer xotirasi ~5 MB,
    // telefon kamerasidagi bitta rasm esa 3–5 MB bo'lishi mumkin — shuning uchun rasm saqlashdan
    // oldin kichraytiriladi va siqiladi (kartochkalarda rasm 150px atrofida ko'rinadi).
    const RASM_MAX_OLCHAM = 600;  // eng uzun tomon, px
    const RASM_SIFAT = 0.8;
    const RASM_SIQISH_CHEGARASI = 60000; // shundan uzun data-URL rasmlar siqiladi (~45 KB)

    function convertBase64(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                let natija = fileReader.result;
                // Siqilgan rasm serverga yuboriladi (rasm-ombori.js, agar admin yoqqan bo'lsa); bo'lmasa data-URL qoladi
                const saqla = d => (typeof rasmniServergaYuklash === 'function' ? rasmniServergaYuklash(d) : Promise.resolve(d));
                if (file && /^image\/(png|jpe?g|webp|bmp)$/i.test(file.type)) {
                    rasmniSiqish(natija).then(saqla, () => saqla(natija)).then(resolve, () => resolve(natija));
                } else {
                    saqla(natija).then(resolve, () => resolve(natija));
                }
            };
            fileReader.onerror = (error) => reject(error);
        });
    }

    // data-URL rasmni RASM_MAX_OLCHAM gacha kichraytirib WebP (yoki JPEG) ga siqadi.
    // Natija asl rasmdan katta chiqsa yoki rasm ochilmasa — asl rasm qaytariladi.
    function rasmniSiqish(dataUrl) {
        return new Promise(resolve => {
            if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpe?g|webp|bmp)/i.test(dataUrl)) {
                resolve(dataUrl);
                return;
            }
            let img = new Image();
            img.onload = () => {
                try {
                    let k = Math.min(1, RASM_MAX_OLCHAM / Math.max(img.naturalWidth, img.naturalHeight));
                    let w = Math.max(1, Math.round(img.naturalWidth * k));
                    let h = Math.max(1, Math.round(img.naturalHeight * k));
                    let canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    let yangi = canvas.toDataURL('image/webp', RASM_SIFAT);
                    if (!yangi.startsWith('data:image/webp')) {
                        // WebP qo'llab-quvvatlanmaydi — JPEG (shaffof joylar oq bo'ladi)
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                        yangi = canvas.toDataURL('image/jpeg', RASM_SIFAT);
                    }
                    resolve(yangi.length < dataUrl.length ? yangi : dataUrl);
                } catch (e) {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    // Bir martalik tozalash: avval siqilmasdan saqlangan katta rasmlarni localStorage'dagi
    // barcha JSON yozuvlar ichidan topib siqadi (xotira to'lib "exceeded the quota" xatosi
    // chiqmasligi uchun). Siqadigan narsa bo'lmasa null qaytaradi — init() kutmasdan ishlaydi.
    function saqlanganRasmlarniSiqish() {
        let kalitlar = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                let kalit = localStorage.key(i);
                let qiymat = localStorage.getItem(kalit);
                if (qiymat && qiymat.length > RASM_SIQISH_CHEGARASI && qiymat.includes('data:image/')) kalitlar.push(kalit);
            }
        } catch (e) { return null; }
        if (kalitlar.length === 0) return null;

        function aylan(obyekt, vazifalar) {
            if (Array.isArray(obyekt) || (obyekt && typeof obyekt === 'object')) {
                Object.keys(obyekt).forEach(k => {
                    let v = obyekt[k];
                    if (typeof v === 'string') {
                        if (v.length > RASM_SIQISH_CHEGARASI && /^data:image\/(png|jpe?g|webp|bmp)/i.test(v)) {
                            vazifalar.push(rasmniSiqish(v).then(yangi => {
                                if (yangi !== v) { obyekt[k] = yangi; return true; }
                                return false;
                            }));
                        }
                    } else {
                        aylan(v, vazifalar);
                    }
                });
            }
        }

        return Promise.all(kalitlar.map(kalit => {
            let data;
            try { data = JSON.parse(localStorage.getItem(kalit)); } catch (e) { return false; }
            let vazifalar = [];
            aylan(data, vazifalar);
            return Promise.all(vazifalar).then(natijalar => {
                if (!natijalar.some(Boolean)) return false;
                try { localStorage.setItem(kalit, JSON.stringify(data)); return true; } catch (e) { return false; }
            });
        })).then(natijalar => {
            let soni = natijalar.filter(Boolean).length;
            if (soni > 0) console.info(`[Xotira] ${soni} ta yozuvdagi katta rasmlar siqildi.`);
            return soni;
        });
    }

    // Xotira (localStorage) to'lsa setItem xato otadi va bu xato bo'lim init()'ini yoki saqlash
    // tugmasini butunlay sindiradi. Endi xato ushlanadi: bo'lim ishlashda davom etadi,
    // foydalanuvchiga esa nima bo'lgani ko'rsatiladi (shu o'zgarish saqlanmagan bo'ladi).
    (function () {
        try {
            let asl = Storage.prototype.setItem;
            Storage.prototype.setItem = function (kalit, qiymat) {
                try {
                    return asl.call(this, kalit, qiymat);
                } catch (e) {
                    let toldi = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
                    if (!toldi) throw e;
                    console.error(`[Xotira] "${kalit}" saqlanmadi — brauzer xotirasi to'lgan.`, e);
                    if (typeof showToast === 'function') {
                        try { showToast("⚠️ Brauzer xotirasi to'lgan — o'zgarish saqlanmadi! Keraksiz rasmlar yoki modellarni o'chiring."); } catch (e2) {}
                    }
                    return undefined;
                }
            };
        } catch (e) {}
    })();
