    let defaultPrices = {
        flayer: 300, listovka: 250, doorhanger: 450, buklet: 800, bloknot: 6000, paket: 4000, kalendar: 12000, papka: 7000, kubarik: 15000, konvert: 1500, otkritka: 2000, diplom: 3000, katalog: 15000, vizitka: 500, stiker: 1000,
        futbolka: 45000, kepka: 25000, svitshot: 75000, xudi: 95000, jiletka: 85000, shoper: 20000, sumka: 25000, polo: 55000, longsliv: 85000, lenta: 8000,
        ruchka: 3000, yejidnevnik: 35000, termos: 60000, brelok: 8000, bakal: 25000, suv_idishlar: 30000, naborlar: 150000, beyjik: 12000, plagetkalar: 70000, powerbanklar: 90000, koja_papka: 60000, guvohnoma: 25000, znachok: 5000,
        baner: 35000, orakal: 45000, setka_orakal: 50000, tumanka: 40000, xolst: 85000,
        // Roll Up/Pauk/PopUp/PromoStoyka narxi o'lcham variantidan (reklamaStendSizeDatabase) to'g'ridan-to'g'ri
        // olinadi — bu yerdagi qiymatlar faqat ehtiyot uchun (variant topilmasa ishlatiladi).
        rollup: 350000, pauk: 250000, popup: 1200000, promostoyka: 400000,
        ofset_pechat: 150, sifravoy_pechat: 800
    };

    const allCategories = {
        poligrafiya: [
            { key: 'flayer', name: 'Flayer', icon: '📄' },
            { key: 'listovka', name: 'Listovka', icon: '📑' },
            { key: 'doorhanger', name: 'Doorhanger', icon: '🏷️' },
            { key: 'buklet', name: 'Buklet', icon: '📖' },
            { key: 'bloknot', name: 'Bloknot', icon: '📓' },
            { key: 'paket', name: 'Paket', icon: '🛍️' },
            { key: 'kalendar', name: 'Kalendar', icon: '📅' },
            { key: 'papka', name: 'Papka', icon: '📁' },
            { key: 'kubarik', name: 'Kubarik', icon: '🧊' },
            { key: 'konvert', name: 'Konvert', icon: '✉️' },
            { key: 'otkritka', name: 'Otkritka', icon: '💌' },
            { key: 'diplom', name: 'Diplom', icon: '🎓' },
            { key: 'katalog', name: 'Katalog', icon: '📚' },
            { key: 'vizitka', name: 'Vizitka', icon: '💼' },
            { key: 'stiker', name: 'Stiker', icon: '🏷️' }
        ],
        textile: [
            { key: 'futbolka', name: 'Futbolka', icon: '👕' },
            { key: 'kepka', name: 'Kepka', icon: '🧢' },
            { key: 'svitshot', name: 'Svitshot', icon: '👔' },
            { key: 'xudi', name: 'Xudi', icon: '🧥' },
            { key: 'jiletka', name: 'Jiletka', icon: '🥼' },
            { key: 'shoper', name: 'Shoper', icon: '👜' },
            { key: 'sumka', name: 'Sumkalar', icon: '🎒' },
            { key: 'polo', name: 'Polo', icon: '👕' },
            { key: 'longsliv', name: 'Longsliv', icon: '🧥' },
            { key: 'lenta', name: 'Lenta', icon: '🎗️' },
            // Bayroqlar: Tekstil bo'limida ko'rsatiladi, lekin material/rang-tiraj dvigatelidan
            // TUBDAN farqli o'z alohida hisoblash mexanizmiga ega (qarang: textile.js "BAYROQLAR"
            // bo'limi) — shuning uchun quyida har joyda `key !== 'bayroqlar'` bilan ajratib olinadi.
            { key: 'bayroqlar', name: 'Bayroqlar', icon: '🚩' }
        ],
        souvenir: [
            { key: 'ruchka', name: 'Ruchka', icon: '🖊️' },
            { key: 'yejidnevnik', name: 'Yejidnevnik', icon: '📘' },
            { key: 'termos', name: 'Termos', icon: '🥤' },
            { key: 'brelok', name: 'Brelok', icon: '🔑' },
            { key: 'bakal', name: 'Bakal', icon: '☕' },
            { key: 'suv_idishlar', name: 'Suv idishlar', icon: '🍾' },
            { key: 'naborlar', name: 'Naborlar', icon: '🎁' },
            { key: 'beyjik', name: 'Beyjik', icon: '🪪' },
            { key: 'plagetkalar', name: 'Plagetkalar', icon: '🏆' },
            { key: 'powerbanklar', name: 'Powerbanklar', icon: '🔋' },
            { key: 'fleshka', name: 'Fleshka', icon: '💾' },
            { key: 'statuetka', name: 'Statuetka', icon: '🏅' },
            { key: 'kardxolder', name: 'Kardxolder', icon: '💳' },
            { key: 'soat', name: 'Soat', icon: '⌚' },
            { key: 'zontik', name: 'Zontik', icon: '☂️' },
            { key: 'koja_papka', name: 'Koja papkalar', icon: '💼' },
            { key: 'guvohnoma', name: 'Guvohnomalar', icon: '📇' },
            { key: 'znachok', name: 'Znachok', icon: '📍' }
        ],
        reklama: [
            { key: 'baner', name: 'Baner', icon: '🖼️' },
            { key: 'orakal', name: 'Orakal', icon: '🌆' },
            { key: 'setka_orakal', name: 'Setka Orakal', icon: '🏁' },
            { key: 'tumanka', name: 'Tumanka', icon: '🌫️' },
            { key: 'xolst', name: 'Xolst', icon: '🎨' },
            { key: 'rollup', name: 'Roll Up', icon: '📜' },
            { key: 'pauk', name: 'Pauk', icon: '🕷️' },
            { key: 'popup', name: 'PopUp', icon: '⛺' },
            { key: 'promostoyka', name: 'PromoStoyka', icon: '📣' },
            { key: 'tablichka', name: 'Tablichkalar', icon: '🪧' },
            { key: 'nastolniy_tablichka', name: 'Nastolniy tablichkalar', icon: '🔖' },
            { key: 'stend', name: 'Stendlar', icon: '📋' }
        ],
        ofset: [
            { key: 'ofset_pechat', name: 'Ofset pechat kalkulyatori', icon: '🖨️' }
        ],
        qogoz: [
            { key: 'qogoz_bolimi', name: "Qog'oz narxlari", icon: '📄' }
        ],
        sifravoy: [
            { key: 'sifravoy_pechat', name: 'Raqamli Pechat Kalkulyatori', icon: '🖨️' }
        ]
    };

    const souvenirKeys = allCategories.souvenir.map(item => item.key);
    const textileKeys = allCategories.textile.map(item => item.key);
    const reklamaBanTypes = ['baner', 'orakal', 'setka_orakal', 'tumanka', 'xolst'];
    // Roll Up/Pauk/PopUp/PromoStoyka — o'lchami bo'yicha maydonga (kv.m) emas, balki har bir tayyor
    // o'lcham-variant uchun ADMIN BELGILAGAN QAT'IY NARXGA ega mahsulotlar (reklamaBanTypes'dan farqli
    // arxitektura — batafsili reklama.js da). Material (Glyans/Matoviy) tanlovi narxga ta'sir qilmaydi.
    const reklamaStendTypes = ['rollup', 'pauk', 'popup', 'promostoyka', 'tablichka', 'nastolniy_tablichka', 'stend'];
    const hasSizesTypes = []; // razmerlar (Kichik/O'rta/Katta) bo'yicha ustama qo'llaniladigan turlar (hozircha hech biri ishlatmaydi)
    const oneSidedOnlySouvenirs = ['plagetkalar', 'naborlar', 'statuetka', 'soat', 'kardxolder', 'zontik', 'znachok']; // faqat bir tomonlama pechat qilinadigan turlar (ikki tomonlama variant ko'rsatilmaydi)
    // Standart "UF Pechat / Sifravoy Pechat" juftligi o'rniga boshqacha chop turlari to'plamidan foydalanadigan suvenir turlari.
    // Ichki holatda 'uv' | 'dtf' | 'gravirovka' kalitlaridan foydalaniladi (narxlar ham shu nomlar bilan saqlanadi),
    // faqat mijoz/admin ko'radigan yorliq matni har xil bo'lishi mumkin. 'uv' kaliti yo'q bo'lsa, UF Pechat varianti umuman ko'rsatilmaydi.
    const poligrafiyaKeys = allCategories.poligrafiya.map(item => item.key);

    let activeProductType = '';
    let currentManagingProduct = null;
    let currentCalcResult = {};
    let quoteCart = [];
    let usersDb = [];
    let currentUser = null;
    let auditLog = [];
    let quoteArchive = [];
    let activeQuoteArchiveId = null;

    // Bo'limlarni ishga tushirish tartibi muhim: Poligrafiya (Bloknot/Kalendar/Doorhanger)
    // Ofset qog'oz bazasiga qator qo'shadi, shuning uchun Ofset undan oldin yuklanadi.
    const BOLIM_INIT_TARTIBI = ['ofset', 'sifravoy', 'qogoz', 'poligrafiya', 'textile', 'suvenir', 'reklama'];

    function bolimlarniIshgaTushir() {
        BOLIM_INIT_TARTIBI.forEach(nomi => {
            if (!bolimIshlaydimi(nomi)) return; // fayli yuklanmagan, xato bergan yoki bog'liq bo'limi ishlamayapti
            try {
                if (BOLIMLAR[nomi].init) BOLIMLAR[nomi].init();
            } catch (e) {
                bolimXatosi(nomi, e);
            }
        });
        bolimlarYuklanmoqda = false;
    }

    function init() {
        // 1) Umumiy ma'lumotlar (barcha bo'limlar uchun)
        loadQuoteCart();

        let savedPrices = localStorage.getItem('erp_default_prices');
        if (savedPrices) {
            defaultPrices = { ...defaultPrices, ...JSON.parse(savedPrices) };
        }

        let savedKlisheFees = localStorage.getItem('erp_klishe_prices');
        if (savedKlisheFees) {
            try {
                klisheOneTimePrices = { ...klisheOneTimePrices, ...JSON.parse(savedKlisheFees) };
            } catch (e) {}
        }

        // Bitta umumiy taxi narxi. Eski bo'limma-bo'lim qiymatlar (erp_taxi_expenses, Textile
        // taxiFee, erp_bayroq_delivery_fee) endi o'qilmaydi — standart TAXI_STANDART_NARX.
        let savedTaxi = localStorage.getItem('erp_taxi_narxi');
        if (savedTaxi !== null) {
            try {
                let v = JSON.parse(savedTaxi);
                if (typeof v === 'number' && v >= 0) taxiNarxi = v;
            } catch (e) {}
        }
        renderTaxiAdmin();

        // Xisobot ichida (window.XIS): foydalanuvchi serverdan keladi (Xisobot login'i), PIN bazasi yo'q.
        if (window.XIS) {
            usersDb = [serverFoydalanuvchi()];
        } else {
        try {
            let savedUsers = localStorage.getItem('erp_users_db');
            usersDb = savedUsers ? JSON.parse(savedUsers) : getDefaultUsersDb();
            if (!Array.isArray(usersDb) || usersDb.length === 0) usersDb = getDefaultUsersDb();
        } catch (e) { usersDb = getDefaultUsersDb(); }
        migrateLegacyDefaultUserNames();
        }

        try {
            let savedAudit = localStorage.getItem('erp_audit_log');
            auditLog = savedAudit ? JSON.parse(savedAudit) : [];
        } catch (e) { auditLog = []; }

        try {
            let savedArchive = localStorage.getItem('erp_quote_archive');
            quoteArchive = savedArchive ? JSON.parse(savedArchive) : [];
        } catch (e) { quoteArchive = []; }

        // 2) Bo'limlar — har biri o'z init() funksiyasi bilan, bir-biridan mustaqil
        bolimlarniIshgaTushir();

        renderAdminCategoryGrid();
        bolimXatolariniKorsat();

        // Rol havolada ko'rsatilgan bo'lsa (?rol=admin / ?rol=menejer) — login/PIN so'ralmaydi.
        // Oddiy havola (rolsiz) — rol tanlash va PIN kiritish ekrani (kirish darvozasi).
        let havolaRoli = rolHavoladan();
        if (havolaRoli) {
            completeLoginGate(havolaRoli);
            return;
        }

        // Kirish darvozasi: shu brauzer TAB sessiyasida allaqachon kirilgan bo'lsa (sahifa yangilansa ham)
        // qayta so'ramaymiz; aks holda tizim login ekranida qoladi (index.html da standart holat shu).
        try {
            let savedUserId = sessionStorage.getItem('erp_current_user_id');
            if (savedUserId) {
                let user = usersDb.find(u => u.id === savedUserId);
                if (user) {
                    completeLoginGate(user);
                    return;
                }
            }
        } catch (e) {}
    }

    // ====================== ROL HAVOLA BO'YICHA (PINsiz) ======================
    // Alohida havolalar:
    //   Admin:    <sayt>/?rol=admin    (yoki  <sayt>/?admin  yoki  <sayt>/#admin)
    //   Menejer:  <sayt>/?rol=menejer  (yoki  <sayt>/?menejer  yoki  <sayt>/#menejer)
    // Rolsiz oddiy havola — kirish darvozasi (rol tanlash + PIN). Havola parol emas: uni bilgan kishi PINsiz kiradi.
    // Narxlar va sozlamalar faqat shu brauzerning localStorage'ida turadi, boshqalarning ma'lumotiga ta'sir qilmaydi.
    // Natija: foydalanuvchi obyekti yoki null (havolada rol yo'q).
    // Xisobot ichida: rol havoladan emas, server tomonidan (Xisobot roli bo'yicha) aniqlanadi.
    function serverFoydalanuvchi() {
        return { id: window.XIS.user.id, name: window.XIS.user.name, pin: '', role: window.XIS.rol };
    }

    function rolHavoladan() {
        if (window.XIS) return serverFoydalanuvchi();
        let rol = null;
        try {
            let q = new URLSearchParams(location.search);
            let h = (location.hash || '').replace('#', '').toLowerCase();
            let r = (q.get('rol') || '').toLowerCase();
            if (r === 'admin' || q.has('admin') || h === 'admin') rol = 'admin';
            else if (r === 'menejer' || q.has('menejer') || h === 'menejer') rol = 'menejer';
        } catch (e) {}
        if (!rol) return null;
        let user = usersDb.find(u => u.role === rol);
        return user || (rol === 'admin' ? { id: 'u_admin', name: 'admin', pin: '', role: 'admin' } : { id: 'u_menejer', name: 'menejer', pin: '', role: 'menejer' });
    }

    // Login muvaffaqiyatli bo'lgach (yoki sessiyadan tiklangach) darvozani yopib, asosiy ilovani ko'rsatadi.
    // Rolga qarab boshlang'ich ekran ham farqlanadi: admin — to'g'ridan-to'g'ri Admin Panelga,
    // menejer — hisoblash (mahsulotlar) ekraniga tushadi.
    function completeLoginGate(user) {
        currentUser = user;
        let app = document.getElementById('appContainer');
        if (app) app.style.display = 'block';
        updateCurrentUserBadge();

        if (user.role === 'admin') {
            openAdminModal();
        } else {
            showScreen('selectionScreen');
        }
    }

    function showToast(text) {
        let t = document.getElementById("toast");
        t.innerText = text;
        t.className = "show";
        setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000);
    }

    // Ekranlar orasida "bitta qadam orqaga" tugmasi ishlashi uchun eng oxirgi va undan oldingi
    // ekranni kuzatib boramiz. Chuqur (ko'p bosqichli) tarix emas — bu ilovada ekranlar deyarli
    // hammasi to'g'ridan-to'g'ri "asosiy" holatlardan (kalkulyator, admin, hisobotlar, taklif)
    // ochilgani uchun bitta qadam yetarli.
    let currentScreenId = 'selectionScreen';
    let previousScreenId = 'selectionScreen';

    function showScreen(screenId) {
        // Admin panelda saqlanmagan o'zgarish bo'lsa — chiqishdan oldin so'raladi (admin-ux.js)
        if (typeof adminEkranidanChiqishMumkinmi === 'function' && !adminEkranidanChiqishMumkinmi(screenId)) return;
        if (screenId !== currentScreenId) {
            previousScreenId = currentScreenId;
            currentScreenId = screenId;
        }
        document.querySelectorAll('.screen, #selectionScreen').forEach(el => el.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
    }

    // Yagona "⬅️ Orqaga" tugmasi — bir qadam oldingi ekranga qaytaradi.
    function goBackScreen() {
        showScreen(previousScreenId || 'selectionScreen');
    }

    // Sarlavha (logotip) bosilganda — foydalanuvchi login/parol bilan kirgach qaysi ekranga
    // tushgan bo'lsa, aynan o'sha ekranga qaytaradi: admin — Admin Panel, menejer — kalkulyator
    // (mahsulotlar) ro'yxati.
    function goToLoginLandingScreen() {
        if (!currentUser) return;
        if (currentUser.role === 'admin') {
            openAdminModal();
        } else {
            showScreen('selectionScreen');
        }
    }

    // ====================== FOYDALANUVCHILAR VA ROLLAR ======================
    function getDefaultUsersDb() {
        return [
            { id: 'u_admin', name: 'admin', pin: '1234', role: 'admin' },
            { id: 'u_menejer', name: 'menejer', pin: '1234', role: 'menejer' }
        ];
    }

    // Eski (avvalroq saqlangan) bazalarda hali "Administrator"/"menejer1" nomlari qolgan bo'lishi mumkin —
    // bir martalik migratsiya bilan yangi standart login nomlariga ("admin"/"menejer") o'tkazamiz.
    // Faqat aniq eski standart qiymatlarga mos kelgan yozuvlarga tegamiz — foydalanuvchi qo'lda
    // o'zgartirgan ismlar yoki PIN kodlar bunga tegmaydi.
    function migrateLegacyDefaultUserNames() {
        let changed = false;
        usersDb.forEach(u => {
            if (u.id === 'u_admin' && u.name === 'Administrator') {
                u.name = 'admin';
                changed = true;
            }
            if (u.role === 'menejer' && u.name === 'menejer1' && u.pin === '123456') {
                u.name = 'menejer';
                u.pin = '1234';
                changed = true;
            }
        });
        if (changed) {
            try { localStorage.setItem('erp_users_db', JSON.stringify(usersDb)); } catch (e) {}
        }
    }

    function requireLogin(allowedRoles, onSuccess) {
        // Agar shu sessiyada allaqachon mos rol bilan kirilgan bo'lsa, qayta so'ramaymiz
        if (currentUser && allowedRoles.includes(currentUser.role)) {
            onSuccess(currentUser);
            return;
        }
        if (window.XIS) { showToast("⚠️ Sizda bu bo'limga kirish huquqi yo'q!"); return; }
        let pin = prompt("Kirish PIN kodini kiriting:", "");
        if (pin === null) return;
        let user = usersDb.find(u => u.pin === pin);
        if (!user) {
            showToast("⚠️ Noto'g'ri PIN kod!");
            return;
        }
        if (!allowedRoles.includes(user.role)) {
            showToast("⚠️ Sizda bu bo'limga kirish huquqi yo'q!");
            return;
        }
        currentUser = user;
        updateCurrentUserBadge();
        onSuccess(user);
    }

    function logoutUser() {
        // Xisobot ichida chiqish — Xisobotning o'ziga qaytish (sessiya Xisobot'da boshqariladi)
        if (window.XIS) { location.href = window.XIS.chiqish; return; }
        if (typeof logAudit === 'function' && currentUser) logAudit('Tizimdan chiqildi', currentUser.name);
        if (typeof marjaTasdiqniTozala === 'function') marjaTasdiqniTozala();
        currentUser = null;
        try { sessionStorage.removeItem('erp_current_user_id'); } catch (e) {}
        updateCurrentUserBadge();
        showScreen('selectionScreen');
    }

    function updateCurrentUserBadge() {
        // Ichki ekranlardagi "Orqaga" tugmasi rolga qarab: admin — Admin panelga, menejer — mahsulotlar ro'yxatiga
        let orqagaMatn = currentUser && currentUser.role === 'admin' ? "⬅️ Admin panelga" : "⬅️ Mahsulotlar ro'yxatiga";
        document.querySelectorAll('.ekran-orqaga-btn').forEach(b => { b.innerText = orqagaMatn; });
        let el = document.getElementById('currentUserBadge');
        if (!el) return;
        if (currentUser) {
            el.style.display = 'inline-flex';
            el.innerText = `👤 ${currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Menejer'}) ✕`;
        } else {
            el.style.display = 'none';
        }
    }

    function renderUsersTable() {
        let tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = usersDb.map((u, idx) => `
            <tr>
                <td><input type="text" class="usr-name" value="${u.name}" style="width:100%;"></td>
                <td><input type="text" class="usr-pin" value="${u.pin}" style="width:100%;" maxlength="12"></td>
                <td>
                    <select class="usr-role" style="width:100%; height:36px; border-radius:6px; border:1.5px solid var(--border); padding:0 8px;">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="menejer" ${u.role === 'menejer' ? 'selected' : ''}>Menejer</option>
                    </select>
                </td>
                <td style="text-align:right;"><button class="btn btn-danger" onclick="deleteUser(${idx})">🗑️</button></td>
            </tr>
        `).join('');
    }

    function addUserRow() {
        usersDb.push({ id: 'u_' + Date.now(), name: 'Yangi foydalanuvchi', pin: '0000', role: 'menejer' });
        renderUsersTable();
    }

    function deleteUser(idx) {
        if (usersDb.length <= 1) {
            showToast("⚠️ Kamida bitta foydalanuvchi qolishi kerak!");
            return;
        }
        if (!confirm("Foydalanuvchini o'chirmoqchimisiz?")) return;
        usersDb.splice(idx, 1);
        renderUsersTable();
    }

    function saveUsers() {
        let names = document.querySelectorAll('.usr-name');
        let pins = document.querySelectorAll('.usr-pin');
        let roles = document.querySelectorAll('.usr-role');
        let updated = [];
        names.forEach((el, i) => {
            updated.push({
                id: usersDb[i]?.id || ('u_' + Date.now() + i),
                name: (el.value || '').trim() || 'Foydalanuvchi',
                pin: (pins[i]?.value || '').trim() || '0000',
                role: roles[i]?.value || 'menejer'
            });
        });
        if (!updated.some(u => u.role === 'admin')) {
            showToast("⚠️ Kamida bitta admin bo'lishi kerak!");
            return;
        }
        usersDb = updated;
        localStorage.setItem('erp_users_db', JSON.stringify(usersDb));
        logAudit('Foydalanuvchilar yangilandi', `${usersDb.length} ta foydalanuvchi`);
        renderUsersTable();
        showToast("💾 Foydalanuvchilar saqlandi!");
    }

    // ====================== O'ZGARISHLAR TARIXI (AUDIT LOG) ======================
    function logAudit(action, details) {
        auditLog.unshift({
            id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Noma\'lum',
            action,
            details: details || ''
        });
        if (auditLog.length > 500) auditLog = auditLog.slice(0, 500);
        try { localStorage.setItem('erp_audit_log', JSON.stringify(auditLog)); } catch (e) {}
        renderAuditLogTable();
    }

    function renderAuditLogTable() {
        let tbody = document.getElementById('auditLogTableBody');
        if (!tbody) return;
        if (auditLog.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">Hozircha o'zgarish tarixi yo'q.</td></tr>`;
            return;
        }
        tbody.innerHTML = auditLog.slice(0, 200).map(a => `
            <tr>
                <td style="font-family:var(--font-mono); font-size:0.78rem; white-space:nowrap;">${new Date(a.timestamp).toLocaleString('uz-UZ')}</td>
                <td>${a.user}</td>
                <td>${a.action}</td>
                <td style="color:var(--text-muted); font-size:0.82rem;">${a.details}</td>
            </tr>
        `).join('');
    }

    // ====================== TIJORIY TAKLIF (SAVATCHA) ======================
    function loadQuoteCart() {
        try {
            let saved = localStorage.getItem('erp_quote_cart');
            quoteCart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            quoteCart = [];
        }
        updateQuoteCartBadge();
    }

    function saveQuoteCart() {
        try { localStorage.setItem('erp_quote_cart', JSON.stringify(quoteCart)); } catch (e) {}
    }

    function updateQuoteCartBadge() {
        let badge = document.getElementById('quoteCartBadge');
        if (!badge) return;
        if (quoteCart.length > 0) {
            badge.style.display = 'inline-flex';
            badge.innerText = quoteCart.length;
        } else {
            badge.style.display = 'none';
        }
    }

    function getProductDisplayName(type) {
        for (let cat in allCategories) {
            let found = allCategories[cat].find(p => p.key === type);
            if (found) return { name: found.name, icon: found.icon };
        }
        return { name: (currentCalcResult && currentCalcResult.name) || type, icon: '📦' };
    }

    function handleQuoteButtonClick() {
        let calcEl = document.getElementById('calcScreen');
        let onCalcScreen = calcEl && calcEl.style.display !== 'none';
        if (onCalcScreen && currentCalcResult && currentCalcResult.totalPrice > 0) {
            addToQuoteCart();
        }
        openQuoteCart();
    }

    function addToQuoteCart() {
        if (typeof marjaRuxsatBormi === 'function' && !marjaRuxsatBormi()) return; // minimal marjadan past — admin tasdig'i kerak
        if (!currentCalcResult || !currentCalcResult.totalPrice) {
            showToast("⚠️ Avval mahsulotni hisoblang!");
            return;
        }
        let info = getProductDisplayName(activeProductType);
        quoteCart.push({
            cartId: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            type: activeProductType,
            name: info.name,
            icon: info.icon,
            details: currentCalcResult.details,
            qty: currentCalcResult.qty,
            unitPrice: currentCalcResult.unitPrice,
            totalPrice: currentCalcResult.totalPrice
        });
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
        showToast("✅ Tijoriy taklifga qo'shildi: " + info.name);
    }

    function removeFromQuoteCart(cartId) {
        quoteCart = quoteCart.filter(item => item.cartId !== cartId);
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
    }

    function clearQuoteCart() {
        if (quoteCart.length === 0) return;
        if (!confirm("Savatchani butunlay tozalashni tasdiqlaysizmi?")) return;
        quoteCart = [];
        saveQuoteCart();
        updateQuoteCartBadge();
        renderQuoteCartItems();
    }

    // Tijoriy taklif/savatchada bir martalik taxi xarajati yozuvi ko'rsatilmaydi (narxga qo'shilgan bo'lib qoladi)
    function taklifTafsiloti(details) {
        return String(details == null ? '' : details).replace(/\s*\|\s*Taxi \(bir martalik\)[^|]*/g, '');
    }

    function renderQuoteCartItems() {
        let container = document.getElementById('quoteCartItems');
        if (!container) return;

        if (quoteCart.length === 0) {
            container.innerHTML = `<div class="quote-cart-empty">Savatcha bo'sh.<br>Mahsulotni hisoblab, "🧾 Tijoriy taklif" tugmasini bosing.</div>`;
        } else {
            container.innerHTML = quoteCart.map(item => `
                <div class="quote-cart-item">
                    <div class="quote-cart-item-icon">${item.icon}</div>
                    <div class="quote-cart-item-info">
                        <div class="quote-cart-item-name">${item.name}</div>
                        <div class="quote-cart-item-details">${taklifTafsiloti(item.details)}</div>
                        <div class="quote-cart-item-meta">${item.qty.toLocaleString()} dona × ${item.unitPrice.toLocaleString()} so'm</div>
                    </div>
                    <div class="quote-cart-item-total">${item.totalPrice.toLocaleString()} so'm</div>
                    <button class="quote-cart-item-remove" onclick="removeFromQuoteCart('${item.cartId}')">✕</button>
                </div>
            `).join('');
        }

        let grandTotal = quoteCart.reduce((sum, item) => sum + item.totalPrice, 0);
        let totalEl = document.getElementById('quoteCartGrandTotal');
        if (totalEl) totalEl.innerText = grandTotal.toLocaleString() + " so'm";

        let genBtn = document.getElementById('quoteGenerateBtn');
        if (genBtn) genBtn.disabled = quoteCart.length === 0;
    }

    function openQuoteCart() {
        renderQuoteCartItems();
        let panel = document.getElementById('quoteCartPanel');
        let overlay = document.getElementById('quoteCartOverlay');
        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }

    function closeQuoteCart() {
        let panel = document.getElementById('quoteCartPanel');
        let overlay = document.getElementById('quoteCartOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    function generateQuoteOffer() {
        if (quoteCart.length === 0) {
            showToast("⚠️ Savatcha bo'sh!");
            return;
        }

        let grandTotal = quoteCart.reduce((sum, item) => sum + item.totalPrice, 0);
        let todayStr = new Date().toLocaleDateString('uz-UZ');

        let rowsHtml = quoteCart.map((item, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.icon} ${item.name}<div class="quote-offer-details">${taklifTafsiloti(item.details)}</div></td>
                <td>${item.qty.toLocaleString()} dona</td>
                <td>${item.unitPrice.toLocaleString()} so'm</td>
                <td>${item.totalPrice.toLocaleString()} so'm</td>
            </tr>
        `).join('');

        document.getElementById('quoteOfferContent').innerHTML = `
            <div class="quote-offer-doc">
                <div class="quote-offer-header">
                    <div>
                        <div class="quote-offer-brand"><img src="umumiy/logo.png" alt="myprint.uz"></div>
                        <div class="quote-offer-sub">Tijoriy taklif</div>
                    </div>
                    <div class="quote-offer-date">${todayStr}</div>
                </div>
                <div class="quote-offer-client">
                    <label>Mijoz nomi:</label>
                    <input type="text" id="quoteClientName" placeholder="Kompaniya yoki mijoz nomini kiriting (ixtiyoriy)" oninput="updateActiveQuoteClientName(this.value)">
                </div>
                <table class="quote-offer-table">
                    <thead>
                        <tr><th>#</th><th>Mahsulot</th><th>Miqdor</th><th>Birlik narxi</th><th>Summa</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr class="quote-offer-grand-total-row">
                            <td colspan="4">Umumiy summa:</td>
                            <td>${grandTotal.toLocaleString()} so'm</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="quote-offer-footer">
                    Taklif amal qilish muddati: 7 kun. Narxlar bahoga qarab o'zgarishi mumkin.
                </div>
            </div>
        `;

        showScreen('quoteScreen');
        closeQuoteCart();
        saveCurrentQuoteToArchive();
    }

    // ====================== BUYURTMALAR / TAKLIFLAR ARXIVI ======================
    function saveCurrentQuoteToArchive() {
        if (quoteCart.length === 0) return;
        let grandTotal = quoteCart.reduce((sum, item) => sum + item.totalPrice, 0);
        let record = {
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            date: new Date().toISOString(),
            client: 'Nomsiz mijoz',
            items: quoteCart.map(i => ({ type: i.type, name: i.name, icon: i.icon, details: i.details, qty: i.qty, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
            grandTotal,
            status: 'yuborilgan',
            createdBy: currentUser ? currentUser.name : 'Noma\'lum'
        };
        quoteArchive.unshift(record);
        if (quoteArchive.length > 1000) quoteArchive = quoteArchive.slice(0, 1000);
        activeQuoteArchiveId = record.id;
        localStorage.setItem('erp_quote_archive', JSON.stringify(quoteArchive));
        if (typeof logAudit === 'function') logAudit('Tijoriy taklif yaratildi', `${record.items.length} ta mahsulot, ${grandTotal.toLocaleString()} so'm`);
    }

    function updateActiveQuoteClientName(value) {
        if (!activeQuoteArchiveId) return;
        let rec = quoteArchive.find(q => q.id === activeQuoteArchiveId);
        if (!rec) return;
        rec.client = (value || '').trim() || 'Nomsiz mijoz';
        localStorage.setItem('erp_quote_archive', JSON.stringify(quoteArchive));
    }

    function updateQuoteArchiveStatus(id, status) {
        let rec = quoteArchive.find(q => q.id === id);
        if (!rec) return;
        rec.status = status;
        localStorage.setItem('erp_quote_archive', JSON.stringify(quoteArchive));
        if (typeof logAudit === 'function') logAudit("Taklif holati o'zgartirildi", `${rec.client}: ${quoteStatusLabel(status)}`);
        showToast('✅ Holat yangilandi!');
    }

    function quoteStatusLabel(status) {
        return status === 'qabul_qilingan' ? 'Qabul qilingan' : (status === 'bekor_qilingan' ? 'Bekor qilingan' : 'Yuborilgan');
    }

    function viewArchivedQuote(id) {
        let rec = quoteArchive.find(q => q.id === id);
        if (!rec) return;
        let rowsHtml = rec.items.map((item, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.icon || ''} ${item.name}<div class="quote-offer-details">${taklifTafsiloti(item.details)}</div></td>
                <td>${item.qty.toLocaleString()} dona</td>
                <td>${item.unitPrice.toLocaleString()} so'm</td>
                <td>${item.totalPrice.toLocaleString()} so'm</td>
            </tr>
        `).join('');
        document.getElementById('quoteOfferContent').innerHTML = `
            <div class="quote-offer-doc">
                <div class="quote-offer-header">
                    <div>
                        <div class="quote-offer-brand"><img src="umumiy/logo.png" alt="myprint.uz"></div>
                        <div class="quote-offer-sub">Tijoriy taklif (arxivdan) — ${quoteStatusLabel(rec.status)}</div>
                    </div>
                    <div class="quote-offer-date">${new Date(rec.date).toLocaleDateString('uz-UZ')}</div>
                </div>
                <div class="quote-offer-client">
                    <label>Mijoz nomi:</label>
                    <input type="text" value="${rec.client}" disabled>
                </div>
                <table class="quote-offer-table">
                    <thead>
                        <tr><th>#</th><th>Mahsulot</th><th>Miqdor</th><th>Birlik narxi</th><th>Summa</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr class="quote-offer-grand-total-row">
                            <td colspan="4">Umumiy summa:</td>
                            <td>${rec.grandTotal.toLocaleString()} so'm</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="quote-offer-footer">
                    Taklif amal qilish muddati: 7 kun. Narxlar bahoga qarab o'zgarishi mumkin.
                </div>
            </div>
        `;
        activeQuoteArchiveId = null;
        showScreen('quoteScreen');
    }

    function renderQuoteArchiveTable() {
        let tbody = document.getElementById('quoteArchiveTableBody');
        if (!tbody) return;
        if (quoteArchive.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Hozircha arxivlangan takliflar yo'q.</td></tr>`;
            return;
        }
        tbody.innerHTML = quoteArchive.map(q => `
            <tr>
                <td>${new Date(q.date).toLocaleDateString('uz-UZ')}</td>
                <td>${q.client}</td>
                <td>${q.items.length} ta</td>
                <td>${q.grandTotal.toLocaleString()} so'm</td>
                <td>
                    <select onchange="updateQuoteArchiveStatus('${q.id}', this.value)" style="width:100%; height:32px; border-radius:6px; border:1.5px solid var(--border); padding:0 6px; font-size:0.8rem;">
                        <option value="yuborilgan" ${q.status === 'yuborilgan' ? 'selected' : ''}>Yuborilgan</option>
                        <option value="qabul_qilingan" ${q.status === 'qabul_qilingan' ? 'selected' : ''}>Qabul qilingan</option>
                        <option value="bekor_qilingan" ${q.status === 'bekor_qilingan' ? 'selected' : ''}>Bekor qilingan</option>
                    </select>
                </td>
                <td style="text-align:right;"><button class="btn" style="background:#4f46e5; padding:6px 10px;" onclick="viewArchivedQuote('${q.id}')">👁 Ko'rish</button></td>
            </tr>
        `).join('');
    }

    // ====================== STATISTIK BOSHQARUV PANELI ======================
    function renderAnalyticsTab() {
        let container = document.getElementById('analyticsContent');
        if (!container) return;

        if (quoteArchive.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:30px;">Hisobot uchun hali ma'lumot yo'q — kamida bitta tijoriy taklif yarating.</p>`;
            return;
        }

        let totalOrders = quoteArchive.length;
        let totalRevenue = quoteArchive.reduce((s, q) => s + q.grandTotal, 0);
        let avgOrderValue = Math.round(totalRevenue / totalOrders);

        let productCounts = {};
        quoteArchive.forEach(q => {
            (q.items || []).forEach(i => {
                productCounts[i.name] = (productCounts[i.name] || 0) + 1;
            });
        });
        let topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        let maxCount = topProducts.length ? topProducts[0][1] : 1;

        let monthlyRevenue = {};
        quoteArchive.forEach(q => {
            let d = new Date(q.date);
            let key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + q.grandTotal;
        });
        let months = Object.keys(monthlyRevenue).sort().slice(-6);
        let maxMonthRevenue = Math.max(...months.map(m => monthlyRevenue[m]), 1);

        container.innerHTML = `
            <div class="analytics-summary-row">
                <div class="analytics-card"><div class="analytics-card-label">Jami takliflar</div><div class="analytics-card-value">${totalOrders}</div></div>
                <div class="analytics-card"><div class="analytics-card-label">Jami summa</div><div class="analytics-card-value">${totalRevenue.toLocaleString()} so'm</div></div>
                <div class="analytics-card"><div class="analytics-card-label">O'rtacha buyurtma</div><div class="analytics-card-value">${avgOrderValue.toLocaleString()} so'm</div></div>
            </div>

            <div class="analytics-section-title">🏆 Eng ko'p buyurtma qilingan mahsulotlar</div>
            <div class="analytics-bars">
                ${topProducts.map(([name, count]) => `
                    <div class="analytics-bar-row">
                        <span class="analytics-bar-label">${name}</span>
                        <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(count / maxCount * 100).toFixed(0)}%;"></div></div>
                        <span class="analytics-bar-value">${count}</span>
                    </div>
                `).join('')}
            </div>

            <div class="analytics-section-title">📅 Oylik aylanma (so'nggi ${months.length} oy)</div>
            <div class="analytics-bars">
                ${months.map(m => `
                    <div class="analytics-bar-row">
                        <span class="analytics-bar-label">${m}</span>
                        <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(monthlyRevenue[m] / maxMonthRevenue * 100).toFixed(0)}%;"></div></div>
                        <span class="analytics-bar-value">${monthlyRevenue[m].toLocaleString()} so'm</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function openAdminModal() {
        requireLogin(['admin'], () => {
            closeProductManager();
            showScreen('adminScreen');
        });
    }

    function openReportsScreen() {
        requireLogin(['admin', 'menejer'], () => {
            showScreen('reportsScreen');
            renderReportsScreen();
        });
    }

    function renderReportsScreen() {
        let isAdmin = currentUser && currentUser.role === 'admin';
        let usersTabBtn = document.getElementById('reportsTabBtn_users');
        // Xisobot ichida foydalanuvchilar/PIN boshqaruvi yo'q (foydalanuvchilarni Xisobot boshqaradi)
        if (usersTabBtn) usersTabBtn.style.display = (isAdmin && !window.XIS) ? 'inline-flex' : 'none';
        switchReportsTab('statistika');
    }

    function switchReportsTab(tab) {
        let tabs = ['statistika', 'arxiv', 'audit', 'users'];
        tabs.forEach(t => {
            let panel = document.getElementById('reportsTab_' + t);
            let btn = document.getElementById('reportsTabBtn_' + t);
            if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
            if (btn) btn.classList.toggle('active', t === tab);
        });
        if (tab === 'statistika') renderAnalyticsTab();
        else if (tab === 'arxiv') renderQuoteArchiveTable();
        else if (tab === 'audit') renderAuditLogTable();
        else if (tab === 'users') {
            if (!currentUser || currentUser.role !== 'admin' || window.XIS) {
                showToast("⚠️ Bu bo'lim faqat admin uchun!");
                switchReportsTab('statistika');
                return;
            }
            renderUsersTable();
        }
    }

    // Har bir toifa uchun bosma sanoatining o'zi kabi CMYK ranglaridan foydalanamiz (Cyan/Magenta/
    // Yellow/Ink) — ilovaning umumiy vizual tiliga (logotip, --primary/--magenta/--yellow/--ink)
    // mos, shu bilan birga har bir bo'limni bir-biridan tezda ajratib olishga yordam beradi.
    // Har bir bo'lim o'z rangiga ega — bo'limlar bir-biridan yaqqol ajralib turishi uchun
    // barcha 6 tasi HAR XIL aksentga ega (ikkitasi bir xil rangda takrorlanmaydi).
    const adminCatMeta = {
        poligrafiya: { title: 'Poligrafiya mahsulotlari', icon: '🖨️', accent: 'cyan' },
        textile:     { title: 'Tekstil mahsulotlari',     icon: '👕', accent: 'magenta' },
        souvenir:    { title: 'Suvenir mahsulotlari',     icon: '🎁', accent: 'yellow' },
        reklama:     { title: 'Reklama mahsulotlari',     icon: '🖼️', accent: 'ink' },
        ofset:       { title: 'Ofset pechat',             icon: '⚙️', accent: 'green' },
        qogoz:       { title: "Qog'oz bo'limi",           icon: '📄', accent: 'green' }
    };
    // Sifravoy pechat admin ekranida alohida bo'lim emas: uning qog'oz narxlari Qog'oz bo'limida.
    // Bu bo'limlar admin ekranida yonma-yon (yarim-yarim) chiqadi.
    const adminCatYonmaYon = ['ofset', 'qogoz'];

    function renderAdminCategoryGrid() {
        let container = document.getElementById('adminCategoryGridContainer');

        const renderSection = (catKey, items) => {
            let meta = adminCatMeta[catKey];
            return `
            <div class="admin-cat-section admin-cat-accent-${meta.accent}" data-cat-section="${catKey}">
                <div class="admin-cat-section-head">
                    <span class="admin-cat-section-badge">${meta.icon}</span>
                    <span class="admin-cat-section-title">${meta.title}</span>
                    <span class="admin-cat-section-count">${items.length} ta</span>
                </div>
                <div class="admin-cat-grid">
                    ${items.map(item => `
                        <div class="admin-cat-card" data-cat-name="${item.name.toLowerCase()}" onclick="openProductManager('${item.key}', '${item.name.replace(/'/g, "\\'")}')">
                            <span class="admin-cat-icon-badge">${item.icon}</span>
                            <span class="admin-cat-name">${item.name}</span>
                            <span class="admin-cat-go">→</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        };

        let yonmaYon = Object.keys(adminCatMeta).filter(k => adminCatYonmaYon.includes(k));
        container.innerHTML = Object.keys(adminCatMeta).filter(k => !adminCatYonmaYon.includes(k))
            .map(catKey => renderSection(catKey, allCategories[catKey])).join('')
            + `<div class="admin-cat-row">${yonmaYon.map(catKey => renderSection(catKey, allCategories[catKey])).join('')}</div>`;

        let totalItems = Object.keys(adminCatMeta).reduce((sum, k) => sum + allCategories[k].length, 0);
        let summaryEl = document.getElementById('adminCatSummary');
        if (summaryEl) summaryEl.innerText = `${totalItems} ta mahsulot turi · ${Object.keys(adminCatMeta).length} ta bo'lim`;

        let searchInput = document.getElementById('adminCategorySearchInput');
        if (searchInput) searchInput.value = '';
        let emptyState = document.getElementById('adminCatEmptyState');
        if (emptyState) emptyState.style.display = 'none';
        if (typeof narxTekshiruvChiz === 'function') narxTekshiruvChiz();
        if (typeof rasmOmboriChiz === 'function') rasmOmboriChiz();
        if (typeof marjaChegaraChiz === 'function') marjaChegaraChiz();
    }

    // Admin Panel bosh ekranidagi qidiruv — mahsulot nomi bo'yicha kartalarni filtrlaydi,
    // hech qaysi mahsuloti mos kelmagan bo'limni butunlay yashiradi.
    function filterAdminCategoryGrid() {
        let input = (document.getElementById('adminCategorySearchInput')?.value || '').toLowerCase().trim();
        let sections = document.querySelectorAll('#adminCategoryGridContainer .admin-cat-section');
        let anyVisible = false;
        sections.forEach(section => {
            let cards = section.querySelectorAll('.admin-cat-card');
            let sectionHasMatch = false;
            cards.forEach(card => {
                let matches = !input || card.dataset.catName.includes(input);
                card.style.display = matches ? 'flex' : 'none';
                if (matches) sectionHasMatch = true;
            });
            section.style.display = sectionHasMatch ? 'block' : 'none';
            if (sectionHasMatch) anyVisible = true;
        });
        // Yonma-yon qatorda ikkala bo'lim ham yashirin bo'lsa, qatorning o'zi ham bo'sh joy qoldirmasin
        document.querySelectorAll('#adminCategoryGridContainer .admin-cat-row').forEach(row => {
            row.style.display = [...row.children].some(s => s.style.display !== 'none') ? '' : 'none';
        });
        let emptyState = document.getElementById('adminCatEmptyState');
        if (emptyState) emptyState.style.display = anyVisible ? 'none' : 'block';
    }

    // Admin panelda mahsulot bazasini ochish. Bo'lim ishlamasa ochilmaydi; ochishda xato bo'lsa
    // sahifa qotib qolmaydi — ogohlantirish chiqadi va bo'limlar ro'yxatiga qaytiladi.
    function openProductManager(key, name) {
        if (!mahsulotBolimiTekshir(key)) return;
        // Baner/Orakal kabi oddiy reklama mahsulotlarining bazasi Suvenir bo'limidagi umumiy
        // "model/narx" boshqaruvi (savePen, renderAdminPensTable...) orqali ochiladi.
        if (reklamaBanTypes.includes(key) && !bolimIshlaydimi('suvenir')) {
            showToast("⚠️ Bu baza Suvenir bo'limidagi model boshqaruvi orqali ishlaydi — u hozir ishlamayapti. " + bolimXatoSababi('suvenir'));
            return;
        }
        try {
            openProductManagerIchki(key, name);
            if (typeof adminUxMahsulotOchildi === 'function') adminUxMahsulotOchildi(key, name);
        } catch (e) {
            console.error(`"${key}" admin bazasini ochishda xato:`, e);
            showToast("⚠️ Bu mahsulot bazasini ochishda xato: " + e.message);
            closeProductManager();
        }
    }

    function openProductManagerIchki(key, name) {
        currentManagingProduct = key;
        if (typeof mahsulotMalumotiAdminChiz === 'function') mahsulotMalumotiAdminChiz(key);
        document.getElementById('adminCategorySelection').style.display = 'none';
        document.getElementById('adminSpecificProductManager').style.display = 'block';
        document.getElementById('currentManagingTitle').innerText = `${name} — Bazasini Boshqarish`;

        let isDigital = (key === 'sifravoy_pechat');
        let isOfset = (key === 'ofset_pechat');
        let isQogoz = (key === 'qogoz_bolimi');
        let isBloknot = (key === 'bloknot');
        let isPapka = (key === 'papka');
        let isKalendar = (key === 'kalendar');
        let isKubarik = (key === 'kubarik');
        let isPaket = (key === 'paket');
        let isVaraqli = (key === 'konvert');
        let isOtkritka = (key === 'otkritka');
        let isDiplom = (key === 'diplom');
        let isKatalog = (key === 'katalog');
        let isStiker = (key === 'stiker');
        let isVizitka = (key === 'vizitka');
        let isPoligrafiya = poligrafiyaKeys.includes(key) && !isStiker && !isVizitka && !isBloknot && !isPapka && !isKalendar && !isKubarik && !isPaket && !isVaraqli && !isOtkritka && !isDiplom && !isKatalog;
        let isBayroq = (key === 'bayroqlar');
        let isTextile = textileKeys.includes(key) && !isBayroq;
        let isStend = (key === 'stend');
        let isTablichka = xavfsizOl(() => tablichkaMi(key), false); // Bayroqlar kabi mahsulotlar katalogi (reklama.js)
        let isReklamaStend = reklamaStendTypes.includes(key) && !isStend && !isTablichka;

        document.getElementById('ofsetAdminPanelBox').style.display = isOfset ? 'block' : 'none';
        document.getElementById('qogozAdminBox').style.display = isQogoz ? 'block' : 'none';
        document.getElementById('poligrafiyaSizeAdminBox').style.display = isPoligrafiya ? 'block' : 'none';
        document.getElementById('bloknotAdminBox').style.display = isBloknot ? 'block' : 'none';
        document.getElementById('papkaAdminBox').style.display = isPapka ? 'block' : 'none';
        document.getElementById('kalendarAdminBox').style.display = isKalendar ? 'block' : 'none';
        document.getElementById('kubarikAdminBox').style.display = isKubarik ? 'block' : 'none';
        document.getElementById('paketAdminBox').style.display = isPaket ? 'block' : 'none';
        document.getElementById('varaqliAdminBox').style.display = isVaraqli ? 'block' : 'none';
        document.getElementById('otkritkaAdminBox').style.display = isOtkritka ? 'block' : 'none';
        document.getElementById('diplomAdminBox').style.display = isDiplom ? 'block' : 'none';
        document.getElementById('katalogAdminBox').style.display = isKatalog ? 'block' : 'none';
        document.getElementById('stikerAdminBox').style.display = isStiker ? 'block' : 'none';
        document.getElementById('vizitkaAdminBox').style.display = isVizitka ? 'block' : 'none';
        // Baner/Orakal/... — maksimal chop eni (reklama.js)
        if (typeof renderAdminReklamaMaxEni === 'function') renderAdminReklamaMaxEni(key);
        document.getElementById('adminTextileBox').style.display = isTextile ? 'block' : 'none';
        document.getElementById('reklamaStendAdminBox').style.display = isReklamaStend ? 'block' : 'none';
        document.getElementById('tablichkaAdminBox').style.display = isTablichka ? 'block' : 'none';
        document.getElementById('stendAdminBox').style.display = isStend ? 'block' : 'none';
        document.getElementById('bayroqAdminBox').style.display = isBayroq ? 'block' : 'none';

        let isDoorhanger = (key === 'doorhanger');
        document.getElementById('doorhangerVisochkaAdminBox').style.display = isDoorhanger ? 'block' : 'none';
        if (isDoorhanger) renderAdminDoorhangerConfig();

        // Tisneniya uchun bir martalik Klishe narxi — hozircha faqat Yejidnevnikda
        let hasKlisheFee = klisheFeeProductTypes.includes(key);
        document.getElementById('klisheFeeAdminBox').style.display = hasKlisheFee ? 'block' : 'none';
        if (hasKlisheFee) {
            document.getElementById('klisheFeeInput').value = klisheOneTimePrices[key] !== undefined ? klisheOneTimePrices[key] : 0;
        }

        let maxsusBolim = isDigital || isOfset || isQogoz || isPoligrafiya || isBloknot || isPapka || isKalendar || isKubarik || isPaket || isVaraqli || isOtkritka || isDiplom || isKatalog || isStiker || isVizitka || isTextile || isReklamaStend || isTablichka || isStend || isBayroq;
        document.getElementById('adminModelAddForm').style.display = maxsusBolim ? 'none' : 'block';
        document.getElementById('adminModelTableCard').style.display = maxsusBolim ? 'none' : 'block';

        if (isBayroq) {
            renderBayroqAdmin();
            return;
        }
        if (isTextile) {
            loadTextileEditState(key);
            return;
        }
        if (isQogoz) {
            renderAdminQogozBolimi();
            return;
        }
        if (isOfset) {
            renderAdminOfsetPapersMatrix();
            loadOfsetMachineSettingsToUI();
            renderOfsetFinishingServicesAdmin();
            return;
        }
        if (isDigital) {
            // Qog'oz jadvali endi Qog'oz bo'limida; bu yerda faqat yo'naltiruvchi izoh
            return;
        }
        if (isStend) {
            renderAdminStend();
            return;
        }
        if (isTablichka) {
            renderTablichkaAdmin(key);
            return;
        }
        if (isReklamaStend) {
            renderReklamaStendTierRangesEditor(key);
            renderAdminReklamaStendSizeTable(key);
            return;
        }
        if (isBloknot) {
            renderAdminBloknotTables();
            return;
        }
        if (isPapka) {
            renderAdminPapkaTable();
            return;
        }
        if (isKalendar) {
            renderAdminKalendarTables();
            return;
        }
        if (isKubarik) {
            renderAdminKubarik();
            return;
        }
        if (isPaket) {
            renderAdminPaket();
            return;
        }
        if (isVaraqli) {
            renderAdminVaraqli();
            return;
        }
        if (isOtkritka) {
            renderAdminOtkritka();
            return;
        }
        if (isDiplom) {
            renderAdminDiplom();
            return;
        }
        if (isKatalog) {
            renderAdminKatalog();
            return;
        }
        if (isStiker) {
            renderAdminStiker();
            return;
        }
        if (isVizitka) {
            renderAdminVizitka();
            return;
        }
        if (isPoligrafiya) {
            renderAdminPoligrafiyaGsmTable();
            renderAdminPoliMahsulotSozlama();
            return;
        }

        document.getElementById('tableListTitle').innerText = `📋 ${name} Bazasidagi Modellar Ro'yxati`;

        let isSouvenir = souvenirKeys.includes(key);
        document.getElementById('souvenirFieldsRow').style.display = isSouvenir ? 'grid' : 'none';
        document.getElementById('colorsBox').style.display = isSouvenir ? 'block' : 'none';
        document.getElementById('lentaBox').style.display = (key === 'beyjik') ? 'block' : 'none';
        document.getElementById('detailsBox').style.display = (key === 'naborlar') ? 'block' : 'none';
        // Suvenirlarda mahsulot narxi ham, chop narxlari ham faqat miqdor oraliqlari jadvalidan olinadi —
        // shuning uchun bitta qat'iy narx maydonlari umuman ko'rsatilmaydi.
        document.getElementById('printPricesBox').style.display = isSouvenir ? 'none' : 'block';
        document.getElementById('basePriceGroup').style.display = isSouvenir ? 'none' : 'flex';

        let isNaborType = (key === 'naborlar');
        let printScheme = xavfsizOl(() => printTypeSchemes[key], null) || null; // suvenir.js

        // Sxemada aynan qaysi kalitlar borligiga qarab ko'rsatamiz.
        // Masalan kardxolder sxemasida gravirovka yo'q — u umuman chiqmaydi.
        let showUv    = !printScheme || !!printScheme.uv;
        let showDtf   = isNaborType || (printScheme && !!printScheme.dtf);
        let showGrav  = isNaborType || (printScheme && !!printScheme.gravirovka);
        let showSifra = !isNaborType && !printScheme;

        document.getElementById('uvCheckLabel').style.display         = showUv    ? 'flex' : 'none';
        document.getElementById('sifravoyCheckLabel').style.display   = showSifra ? 'flex' : 'none';
        document.getElementById('dtfCheckLabel').style.display        = showDtf   ? 'flex' : 'none';
        document.getElementById('gravirovkaCheckLabel').style.display = showGrav  ? 'flex' : 'none';
        document.getElementById('dtfCheckLabelText').innerText = (printScheme && printScheme.dtf) || 'UF DTF';
        document.getElementById('gravirovkaCheckLabelText').innerText = (printScheme && printScheme.gravirovka) || 'Gravirovka';

        document.getElementById('uvPriceGroup').style.display         = showUv    ? 'flex' : 'none';
        document.getElementById('sifravoyPriceGroup').style.display   = showSifra ? 'flex' : 'none';
        document.getElementById('dtfPriceGroup').style.display        = showDtf   ? 'flex' : 'none';
        document.getElementById('gravirovkaPriceGroup').style.display = showGrav  ? 'flex' : 'none';
        document.getElementById('dtfPriceLabelText').innerText = (printScheme && printScheme.dtf) || 'UF DTF';
        document.getElementById('gravirovkaPriceLabelText').innerText = (printScheme && printScheme.gravirovka) || 'Gravirovka';

        let hasSizes = hasSizesTypes.includes(key);
        document.getElementById('sizePricesBox').style.display = hasSizes ? 'block' : 'none';

        // Miqdor oraliqlari jadvali: faqat suvenir turlarida.
        // Naborlarda chop narxi tarkibdagi detallardan olinadi, shuning uchun u yerda faqat mahsulot narxi ustuni chiqadi.
        currentPrintColumns = {
            uv: isNaborType ? false : showUv,
            sifravoy: isNaborType ? false : showSifra,
            dtf: isNaborType ? false : showDtf,
            gravirovka: isNaborType ? false : showGrav,
            labels: {
                uv: 'UF Pechat',
                sifravoy: 'Sifravoy',
                dtf: (printScheme && printScheme.dtf) || 'UF DTF',
                gravirovka: (printScheme && printScheme.gravirovka) || 'Gravirovka'
            }
        };
        document.getElementById('tiersBox').style.display = isSouvenir ? 'block' : 'none';

        cancelPenEdit();
        renderAdminPensTable();
    }

    function closeProductManager() {
        if (typeof narxTekshiruvChiz === 'function') narxTekshiruvChiz(); // saqlangan narxlar hisobga olinsin
        document.getElementById('adminCategorySelection').style.display = 'block';
        document.getElementById('adminSpecificProductManager').style.display = 'none';
    }

    function editBasePrice() {
        let oldPrice = defaultPrices[currentManagingProduct] || 0;
        let newPrice = prompt("Yangi tan narxini (baza narxini) kiriting (so'mda):", oldPrice);
        if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
            defaultPrices[currentManagingProduct] = parseFloat(newPrice);
            localStorage.setItem('erp_default_prices', JSON.stringify(defaultPrices));
            if (typeof logAudit === 'function') logAudit("Baza narxi o'zgartirildi", `${currentManagingProduct}: ${oldPrice.toLocaleString()} → ${parseFloat(newPrice).toLocaleString()} so'm`);
            renderAdminPensTable();
            showToast("✅ Baza narxi yangilandi!");
        }
    }

    function filterProducts() {
        if (typeof boshSahifaFiltr === 'function' && boshSahifaFiltr()) return;
        let input = document.getElementById('searchInput').value.toLowerCase();
        let cards = document.getElementsByClassName('product-card');
        for (let card of cards) {
            let title = card.innerText.toLowerCase();
            card.style.display = title.includes(input) ? "flex" : "none";
        }
    }

    // Mahsulot turi qaysi bo'limga tegishli. null — umumiy qism (masalan admin qo'shgan maxsus mahsulotlar).
    // Ro'yxatlarning hech biriga kirmagan tur generateForm() da Poligrafiya sifatida hisoblanadi.
    function mahsulotBolimi(type) {
        if (type === 'ofset_pechat') return 'ofset';
        if (type === 'sifravoy_pechat') return 'sifravoy';
        if (type === 'qogoz_bolimi') return 'qogoz';
        if (typeof isCustomProductKey === 'function' && isCustomProductKey(type)) return null;
        if (souvenirKeys.includes(type)) return 'suvenir';
        if (textileKeys.includes(type)) return 'textile';
        if (reklamaBanTypes.includes(type) || reklamaStendTypes.includes(type)) return 'reklama';
        return 'poligrafiya';
    }

    // Bo'lim ishlamasa — ogohlantirib, false qaytaradi (kalkulyator/admin oynasi ochilmaydi)
    function mahsulotBolimiTekshir(type) {
        let bolim = mahsulotBolimi(type);
        if (!bolim || bolimIshlaydimi(bolim)) return true;
        showToast('⚠️ ' + bolimXatoSababi(bolim));
        return false;
    }

    function openCalc(type, name) {
        if (!mahsulotBolimiTekshir(type)) return;
        activeProductType = type;
        document.getElementById('currentProductName').innerText = type === 'sifravoy_pechat' ? 'Raqamli Pechat Kalkulyatori' : (type === 'ofset_pechat' ? 'Ofset Pechat Kalkulyatori' : (name + " — Hisoblash Moduli"));
        try {
            generateForm(type);
            if (typeof mahsulotMalumotiKorsat === 'function') mahsulotMalumotiKorsat(type);
        } catch (e) {
            console.error(`"${type}" kalkulyator formasini chizishda xato:`, e);
            document.getElementById('dynamicForm').innerHTML =
                `<div class="bolim-xato-quti">⚠️ Bu mahsulot kalkulyatorini ochishda xato yuz berdi: ${String(e.message).replace(/</g, '&lt;')}</div>`;
        }
        showScreen('calcScreen');
        calculate();
    }

    async function copyResult() {
        if (typeof marjaRuxsatBormi === 'function' && !marjaRuxsatBormi()) return; // minimal marjadan past — admin tasdig'i kerak
        let text = `${currentCalcResult.name}\n\n`;
        text += `ℹ️ Tafsilot: ${currentCalcResult.details}\n`;
        text += `🔹 Miqdori: ${currentCalcResult.qty} dona\n`;
        text += `🔹 Birlik narxi: ${currentCalcResult.unitPrice.toLocaleString()} so'm\n`;
        text += `💰 Jami Summa: ${currentCalcResult.totalPrice.toLocaleString()} so'm`;

        if (currentCalcResult.imageUrl && /^(data:image|uploads\/|https?:)/.test(currentCalcResult.imageUrl)) {
            try {
                let response = await fetch(currentCalcResult.imageUrl);
                let blob = await response.blob();
                
                if (navigator.clipboard && window.ClipboardItem) {
                    let data = [new ClipboardItem({ 
                        [blob.type]: blob,
                        "text/plain": new Blob([text], { type: "text/plain" })
                    })];
                    await navigator.clipboard.write(data);
                    showToast("📋 Rasm va matn nusxalandi! Telegramga paste (Ctrl+V) qiling.");
                    return;
                }
            } catch (e) {
                console.log("Clipboard rasm xatosi:", e);
            }
        }

        navigator.clipboard.writeText(text);
        showToast("📋 Matn nusxalandi!");
    }


function generateForm(type) {
    const form = document.getElementById('dynamicForm');
    const rightCol = document.getElementById('rightPanelColumn');
    let html = '';

    if (souvenirKeys.includes(type)) {
        generateForm_suvenir(type, form, rightCol);
        return;
    }

    if (type === 'ofset_pechat') {
        generateForm_ofset(type, form, rightCol);
        return;
    }

    if (type === 'sifravoy_pechat') {
        generateForm_raqamli(type, form, rightCol);
        return;
    } else {
        let tableContainerId = document.getElementById('digitalTableContainer');
        if (tableContainerId) tableContainerId.style.display = 'none';
        let ofsetContainerId = document.getElementById('ofsetTableContainer');
        if (ofsetContainerId) ofsetContainerId.style.display = 'none';
        // Ustun kengligi CSS orqali (telefonda bitta ustunga o'tishi uchun inline style ishlatilmaydi)
        document.querySelector('.calc-grid').classList.remove('calc-grid-teng');
    }

        rightCol.className = "right-panel-col";
        rightCol.style.display = "flex";
        rightCol.innerHTML = `
            <div class="margin-card">
                <div class="form-group">
                    <label>Ishxona Marjasi (%):</label>
                    <input type="number" id="inpMargin" value="${marjaQiymati('inpMargin', MARJA_STANDART)}" min="0" step="1" oninput="calculate()">
                </div>
            </div>
            <div class="result-box">
                <div>
                    <h3 style="margin-bottom: 12px; color: var(--text-main); font-size: 1rem;">Hisob-kitob Natijasi</h3>
                    <div class="result-item"><span>Tafsilot:</span> <strong id="resDetails" style="text-align: right; max-width: 60%;">-</strong></div>
                    <div class="result-item"><span>Miqdor / Hajm:</span> <strong id="resQuantity">0 dona</strong></div>
                    <div class="result-item"><span>Birlik narxi:</span> <strong id="resUnitPrice">0 so'm</strong></div>
                    <div class="result-item result-total"><span>Jami summa:</span> <span id="resTotalPrice">0 so'm</span></div>
                </div>
                <div id="priceSuggestionBox" style="display:none;"></div>
                <div id="tierPreviewBox" style="display:none; margin-top:16px;"></div>
                <div style="margin-top: 20px; display:flex; gap:8px;">
                    <button class="btn" style="flex:1;" onclick="copyResult()">📋 Natijani nusxalash</button>
                    <button class="btn btn-outline" title="To'liq hisob-kitob (parol talab qilinadi)" onclick="openFullCalcInfoModal()">👁️</button>
                </div>
            </div>
        `;

    if (type === 'bayroqlar') {
        html = generateFormHtml_bayroq();
    }
    else if (textileKeys.includes(type)) {
        html = generateFormHtml_textile(type);
    }
    else if (type === 'stend') {
        html = buildStendForm();
    }
    else if (xavfsizOl(() => tablichkaMi(type), false)) {
        html = generateFormHtml_tablichka(type);
    }
    else if (reklamaStendTypes.includes(type)) {
        html = generateFormHtml_reklamaStend(type);
    }
    else if (reklamaBanTypes.includes(type)) {
        html = generateFormHtml_reklama(type);
    }
    else if (type === 'bloknot') {
        html = buildBloknotForm();
    }
    else if (type === 'papka') {
        html = buildPapkaForm();
    }
    else if (type === 'kalendar') {
        html = buildKalendarForm();
    }
    else if (type === 'kubarik') {
        html = buildKubarikForm();
    }
    else if (type === 'paket') {
        html = buildPaketForm();
    }
    else if (type === 'konvert') {
        html = buildVaraqliForm(type);
    }
    else if (type === 'otkritka') {
        html = buildOtkritkaForm();
    }
    else if (type === 'diplom') {
        html = buildDiplomForm();
    }
    else if (type === 'katalog') {
        html = buildKatalogForm();
    }
    else if (type === 'stiker') {
        html = buildStikerForm();
    }
    else if (type === 'vizitka') {
        html = buildVizitkaForm();
    }
    else if (type === 'doorhanger') {
        html = buildDoorhangerForm();
    }
    else if (typeof isCustomProductKey === 'function' && isCustomProductKey(type)) {
        html = generateFormHtml_custom(type);
    }
    else {
        html = generateFormHtml_poligrafiya(type);
    }

    form.innerHTML = html;

    if (type === 'bayroqlar') {
        renderBayroqPicker();
    }
    else if (textileKeys.includes(type)) {
        renderTextilePickers(type);
    }

    if (type === 'bloknot') {
        renderBloknotOptions();
        return;
    }

    if (type === 'papka') {
        renderPapkaOptions();
        return;
    }

    if (type === 'kalendar') {
        renderKalendarOptions();
        return;
    }

    if (type === 'kubarik') {
        renderKubarikOptions();
        return;
    }

    if (type === 'paket') {
        renderPaketOptions();
        return;
    }

    if (type === 'konvert') {
        renderVaraqliOptions(type);
        return;
    }

    if (type === 'otkritka') {
        renderOtkritkaOptions();
        return;
    }

    if (type === 'diplom') {
        renderDiplomOptions();
        return;
    }

    if (type === 'stiker') {
        renderStikerOptions();
        return;
    }

    if (type === 'vizitka') {
        renderVizitkaOptions();
        return;
    }

    if (type === 'katalog') {
        renderKatalogOptions();
        return;
    }

    if (type === 'stend') {
        renderStendOptions();
        return;
    }

    if (xavfsizOl(() => tablichkaMi(type), false)) {
        renderTablichkaPicker(type);
        return;
    }

    if (reklamaStendTypes.includes(type)) {
        renderReklamaStendSizeOptions(type);
        return;
    }

    // xavfsizOl: Poligrafiya bo'limi yuklanmagan bo'lsa ham boshqa bo'limlar formasi chiziladi
    let gsmListForRender = xavfsizOl(() => poligrafiyaGsmDatabase[type], null) || [];
    if (gsmListForRender.length > 0 && document.getElementById('poligrafiyaGsmGroup')) {
        renderPoligrafiyaGsmOptions(gsmListForRender);
    }

}

// Barcha hisob-kitoblar shu orqali o'tadi: biror mahsulot hisobida xato bo'lsa, sahifa qotib
// qolmaydi — xato natija oynasida ko'rsatiladi va konsolga yoziladi.
function calculate() {
    try {
        calculateIchki();
        if (typeof marjaNazoratYangila === 'function') marjaNazoratYangila(); // marja minimal chegaradan pastmi (marja-nazorat.js)
    } catch (e) {
        console.error(`"${activeProductType}" hisob-kitobida xato:`, e);
        let el = document.getElementById('resDetails');
        if (el) el.innerText = "⚠️ Hisob-kitobda xato: " + e.message;
    }
}

function calculateIchki() {
    let qty = parseInt(document.getElementById('inpQuantity')?.value) || 1;
    let baseCost = defaultPrices[activeProductType] || 1000;
    let baseUnitPrice = 0;
    let details = activeProductType.toUpperCase();
    let previewImgUrl = '';
    let previewNameText = activeProductType.toUpperCase();
    // To'liq hisob-kitob modali uchun (👁️) — ushbu buyurtmada NIMA va NECHTA ishlatilgani
    // hamda har birining tannarxi. Faqat ofset-asoslangan turlarda (Papka/Kalendar/Poligrafiya)
    // to'ldiriladi; boshqa turlarda bo'sh qoladi (modal bunday holda faqat Tafsilot matnini ko'rsatadi).
    let costItems = [];
    let hisobYaroqsiz = false; // true — narx chiqarilmaydi (ma'lumot yetarli emas)
    if (typeof getCustomProduct === 'function') {
        let cp = getCustomProduct(activeProductType);
        if (cp) { previewNameText = cp.name; details = cp.name; }
    }

    if (activeProductType === 'ofset_pechat') {
        calculate_ofset();
        return;
    }

    if (activeProductType === 'sifravoy_pechat') {
        calculate_raqamli();
        return;
    }

    let previewBox = document.getElementById('previewCardBox');
    let marginPercent = marjaOl('inpMargin', MARJA_STANDART); // 0% ham ishlaydi (yordamchi.js)

    if (souvenirKeys.includes(activeProductType)) {
        let r = calculateResult_suvenir(qty, baseCost, marginPercent, previewBox);
        details = r.details; baseUnitPrice = r.baseUnitPrice;
        previewImgUrl = r.previewImgUrl; previewNameText = r.previewNameText;
    }
    else {
        if(previewBox) previewBox.style.display = 'none';
        if (typeof renderTierPreview === 'function') renderTierPreview(null, qty, marginPercent); // suvenir.js
        if (activeProductType === 'bayroqlar') {
            let r = calculateResult_bayroq(qty);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (activeProductType === 'stend') {
            let res = calculateResult_stend(qty);
            baseUnitPrice = res.baseUnitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (xavfsizOl(() => tablichkaMi(activeProductType), false)) {
            let r = calculateResult_tablichka(activeProductType, qty);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (reklamaStendTypes.includes(activeProductType)) {
            let r = calculateResult_reklamaStend(activeProductType, qty);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (reklamaBanTypes.includes(activeProductType)) {
            let r = calculateResult_reklama(activeProductType, qty, baseCost);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (textileKeys.includes(activeProductType)) {
            let r = calculateResult_textile(activeProductType, qty, marginPercent);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else if (activeProductType === 'bloknot') {
            let res = calculateBloknot(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
        }
        else if (activeProductType === 'papka') {
            let res = calculatePapka(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            qty = res.effectiveQty; // MOQ (eng kam 100 dona) tufayli ko'tarilgan bo'lishi mumkin
            costItems = res.costItems || [];
        }
        else if (activeProductType === 'kalendar') {
            let res = calculateKalendar(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
        }
        else if (activeProductType === 'otkritka') {
            let res = calculateOtkritka(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'katalog') {
            let res = calculateKatalog(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'vizitka') {
            let res = calculateVizitka(qty, baseCost);
            baseUnitPrice = res.baseUnitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'stiker') {
            let res = calculateStiker(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'diplom') {
            let res = calculateDiplom(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'konvert') {
            let res = calculateVaraqli(activeProductType, qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'paket') {
            let res = calculatePaket(qty);
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'kubarik') {
            let res = calculateKubarik(qty);
            let kubTur = kubarikTuri();
            if (kubTur && kubTur.rasm) previewImgUrl = kubTur.rasm; // buyurtma/taklifnomada turning rasmi
            baseUnitPrice = res.unitPrice;
            details = res.details;
            costItems = res.costItems || [];
            hisobYaroqsiz = !!res.hisobYaroqsiz;
        }
        else if (activeProductType === 'doorhanger') {
            let res = calculateDoorhanger(qty);
            baseUnitPrice = res.baseUnitPrice;
            details = res.details;
            costItems = res.costItems || [];
        }
        else if (typeof isCustomProductKey === 'function' && isCustomProductKey(activeProductType)) {
            let r = calculateResult_custom(activeProductType, qty);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
        }
        else {
            let r = calculateResult_poligrafiya(activeProductType, qty, baseCost);
            details = r.details; baseUnitPrice = r.baseUnitPrice;
            costItems = r.costItems || [];
        }
    }

    if (document.getElementById('previewProductImg')) {
        document.getElementById('previewProductImg').src = previewImgUrl;
        document.getElementById('previewProductName').innerText = previewNameText;
    }

    let unitPrice = Math.round(baseUnitPrice * (1 + marginPercent / 100));
    let totalPrice = unitPrice * qty;
    // Hisob-kitob uchun ma'lumot yetarli bo'lmasa (masalan paket o'lchami kiritilmagan) — narx
    // chiqarilmaydi, aks holda faqat taxi summasi "narx" bo'lib ko'rinib qolardi.
    if (hisobYaroqsiz) {
        document.getElementById('resDetails').innerText = details;
        document.getElementById('resQuantity').innerText = qty.toLocaleString() + " dona";
        document.getElementById('resUnitPrice').innerText = "—";
        document.getElementById('resTotalPrice').innerText = "—";
        currentCalcResult = { details, qty, unitPrice: 0, totalPrice: 0, name: previewNameText, imageUrl: previewImgUrl,
            baseUnitPrice: 0, marginPercent, productType: activeProductType, costItems: [] };
        return;
    }

    if (reklamaBanTypes.includes(activeProductType)) {
        let chkUstanovka = document.getElementById('chkUstanovka');
        if (chkUstanovka && chkUstanovka.checked) {
            totalPrice += Math.round((reklamaExtraPrices.ustanovka || 0) * (1 + marginPercent / 100));
        }
    }

    // Tisneniya tanlansa — bir martalik Klishe narxi jami summaga qo'shiladi (dona soniga bog'liq emas)
    if (klisheFeeProductTypes.includes(activeProductType) && selectedPrintType === 'gravirovka') {
        let klishePrice = klisheOneTimePrices[activeProductType] || 0;
        if (klishePrice > 0) {
            totalPrice += Math.round(klishePrice * (1 + marginPercent / 100));
            details += ` | Klishe (bir martalik): ${klishePrice.toLocaleString()} so'm qo'shildi`;
            costItems.push({ label: 'Klishe (bir martalik)', qty: '1 marta', total: klishePrice });
        }
    }

    // Taxi — BARCHA bo'limlar uchun bitta umumiy narx (umumiy/yordamchi.js), har bir hisob-kitobga
    // miqdordan qat'iy nazar BIR MARTA qo'shiladi. To'liq hisob-kitob jadvalida (👁️) 0 bo'lsa ham ko'rinadi.
    costItems.push({ label: 'Taxi (bir martalik)', qty: '1 marta', total: taxiNarxi });
    if (taxiNarxi > 0) {
        totalPrice += taxiMarjaBilan(marginPercent);
        details += ` | Taxi (bir martalik): ${taxiNarxi.toLocaleString()} so'm qo'shildi`;
    }

    document.getElementById('resDetails').innerText = details;
    document.getElementById('resQuantity').innerText = qty.toLocaleString() + " dona";
    document.getElementById('resUnitPrice').innerText = unitPrice.toLocaleString() + " so'm";
    document.getElementById('resTotalPrice').innerText = totalPrice.toLocaleString() + " so'm";

    currentCalcResult = {
        details, qty, unitPrice, totalPrice, name: previewNameText, imageUrl: previewImgUrl,
        baseUnitPrice, marginPercent, productType: activeProductType, costItems
    };
    if (typeof renderPriceSuggestion === 'function') renderPriceSuggestion(activeProductType, unitPrice);
}

// ====================== STATISTIK NARX TAVSIYASI ======================
// Avvalgi tijoriy takliflar arxividagi shu mahsulot turi bo'yicha
// min/o'rtacha/maks birlik narxlarini ko'rsatadi — haqiqiy AI emas, oddiy statistika.
function renderPriceSuggestion(type, unitPrice) {
    let box = document.getElementById('priceSuggestionBox');
    if (!box) return;

    let history = (typeof quoteArchive !== 'undefined' ? quoteArchive : [])
        .flatMap(q => (q.items || []).filter(i => i.type === type))
        .map(i => i.unitPrice)
        .filter(p => typeof p === 'number' && p > 0);

    if (history.length < 2) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    let min = Math.min(...history);
    let max = Math.max(...history);
    let avg = Math.round(history.reduce((s, p) => s + p, 0) / history.length);

    let hint = '';
    if (unitPrice < min) hint = "⚠️ Joriy narx tarixiy minimaldan past.";
    else if (unitPrice > max) hint = "⚠️ Joriy narx tarixiy maksimaldan yuqori.";

    box.style.display = 'block';
    box.innerHTML = `
        <div class="price-suggestion-box">
            <div class="price-suggestion-title">📊 Tarixiy narx tavsiyasi (${history.length} ta oldingi buyurtma asosida)</div>
            <div class="price-suggestion-range">
                <span>Min: <strong>${min.toLocaleString()} so'm</strong></span>
                <span>O'rtacha: <strong>${avg.toLocaleString()} so'm</strong></span>
                <span>Maks: <strong>${max.toLocaleString()} so'm</strong></span>
            </div>
            ${hint ? `<div class="price-suggestion-hint">${hint}</div>` : ''}
        </div>
    `;
}
