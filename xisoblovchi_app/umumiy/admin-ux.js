// ====================== ADMIN PANEL: QULAYLIK QATLAMI ======================
// Admin panelning barcha bo'limlari uchun umumiy:
//   1) Yuqori panel (sticky): "Admin › Bo'lim" yo'li, boshqa mahsulotga tez o'tish, saqlash holati.
//   2) Bo'lim ichida tez o'tish: sahifadagi har bir blok (kartochka) sarlavhasiga tugma.
//   3) Saqlanmagan o'zgarishlar: o'zgargan blok belgilanadi, saqlamasdan chiqishda ogohlantirish,
//      Ctrl+S — kursor turgan blokni saqlaydi.
// Bo'lim fayllariga tegmaydi: har qanday "save..." tugmasi bosilgach, o'sha blok "saqlangan" hisoblanadi
// (agar showToast ⚠️/❌ bilan xato bildirmagan bo'lsa).

    const ADMIN_BOLIM_NOMI = { poligrafiya: 'Poligrafiya', textile: 'Textile', souvenir: 'Suvenir', reklama: 'Reklama',
        ofset: 'Ofset pechat', sifravoy: 'Sifravoy pechat', qogoz: "Qog'oz bo'limi" };

    // ---------- 3) Saqlanmagan o'zgarishlar ----------
    // Admin menejerining bevosita bolalari — mahsulot bo'lim bloklari (bloknotAdminBox, adminTextileBox...)
    const ADMIN_BOX = '#adminSpecificProductManager > *, #adminCategorySelection > *';

    function adminBlokiniTop(el) {
        return el.closest('.add-pen-card') || el.closest(ADMIN_BOX);
    }

    // Qidiruv/filtr maydonlari ma'lumotni o'zgartirmaydi — ular hisobga olinmaydi
    function adminKuzatilmaydi(el) {
        let id = (el.id || '').toLowerCase();
        return !el.matches('input, select, textarea') || el.type === 'search' || id.includes('search') || id.includes('filter') || el.hasAttribute('data-ux-skip');
    }

    function adminSaqlanmaganlar() {
        return document.querySelectorAll('#adminScreen .ux-dirty');
    }

    function adminHolatniYangila() {
        let el = document.getElementById('adminSaveState');
        if (!el) return;
        let n = adminSaqlanmaganlar().length;
        el.classList.toggle('is-dirty', n > 0);
        el.textContent = n > 0 ? `● Saqlanmagan o'zgarishlar (${n} blok)` : '✓ Hammasi saqlangan';
    }

    function adminTozala(konteyner) {
        if (!konteyner) return;
        konteyner.classList.remove('ux-dirty');
        konteyner.querySelectorAll('.ux-dirty').forEach(x => x.classList.remove('ux-dirty'));
        adminHolatniYangila();
    }

    // Saqlanmagan o'zgarish bo'lsa — foydalanuvchidan so'raydi. true: davom etish mumkin.
    function adminChiqishMumkinmi() {
        let n = adminSaqlanmaganlar().length;
        if (n === 0) return true;
        if (!confirm(`Admin panelda ${n} ta blokda saqlanmagan o'zgarish bor.\nSaqlamasdan chiqsangiz, ular yo'qoladi. Davom etasizmi?`)) return false;
        adminTozala(document.getElementById('adminScreen'));
        return true;
    }

    document.addEventListener('input', adminOzgarishniBelgila, true);
    document.addEventListener('change', adminOzgarishniBelgila, true);
    function adminOzgarishniBelgila(e) {
        let el = e.target;
        if (!el || !el.closest || !el.closest('#adminScreen') || adminKuzatilmaydi(el)) return;
        let blok = adminBlokiniTop(el);
        if (blok) { blok.classList.add('ux-dirty'); adminHolatniYangila(); }
    }

    // "save..." tugmasi bosilgach (uning o'z onclick'i bajarilib bo'lgach) blokni saqlangan deb belgilaymiz.
    // Bosishdan oldingi toast matnini eslab qolamiz: saqlash yangi ⚠️/❌ xabar chiqarsa — saqlanmagan.
    let adminOldingiToast = '';
    const saveTugmasi = e => e.target && e.target.closest && e.target.closest('#adminScreen button[onclick^="save"]');
    document.addEventListener('click', function (e) {
        if (saveTugmasi(e)) adminOldingiToast = (document.getElementById('toast') || {}).innerText || '';
    }, true);
    document.addEventListener('click', function (e) {
        let btn = saveTugmasi(e);
        if (!btn) return;
        let toast = (document.getElementById('toast') || {}).innerText || '';
        if (toast !== adminOldingiToast && /^\s*(⚠️|❌)/.test(toast)) return; // saqlash xato bilan tugadi
        // Bo'lim blokida yagona "Saqlash" tugmasi bo'lsa (masalan Bloknot, Textile) — u butun blokni saqlaydi
        let box = btn.closest(ADMIN_BOX);
        let boxdagiSave = box ? [...box.querySelectorAll('button[onclick^="save"]')].filter(b => b.offsetParent !== null).length : 0;
        adminTozala(boxdagiSave === 1 ? box : (btn.closest('.add-pen-card') || box));
    });

    // Ctrl+S — kursor turgan blokning "Saqlash" tugmasi
    document.addEventListener('keydown', function (e) {
        if (!((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы'))) return;
        let screen = document.getElementById('adminScreen');
        if (!screen || screen.style.display === 'none') return;
        e.preventDefault();
        let faol = document.activeElement && document.activeElement.closest ? document.activeElement : null;
        let blok = faol && faol.closest('#adminScreen') ? adminBlokiniTop(faol) : null;
        let btn = null;
        while (blok && !btn) {
            btn = [...blok.querySelectorAll('button[onclick^="save"]')].find(b => b.offsetParent !== null);
            blok = btn ? blok : (blok.parentElement ? adminBlokiniTop(blok.parentElement) : null);
        }
        if (btn) btn.click();
        else showToast("ℹ️ Saqlash uchun avval saqlanadigan maydonga kursorni qo'ying.");
    });

    window.addEventListener('beforeunload', function (e) {
        if (adminSaqlanmaganlar().length === 0) return;
        e.preventDefault();
        e.returnValue = '';
    });

    // ---------- 1) Yuqori panel ----------
    function adminMahsulotToifasi(key) {
        return Object.keys(allCategories).find(cat => allCategories[cat].some(p => p.key === key)) || null;
    }

    function adminMahsulotAlmashtir(key) {
        let sel = document.getElementById('adminProductSwitcher');
        if (key === currentManagingProduct) return;
        let item = Object.values(allCategories).flat().find(p => p.key === key);
        if (!item || !adminChiqishMumkinmi()) {
            if (sel) sel.value = currentManagingProduct;
            return;
        }
        openProductManager(item.key, item.name);
        window.scrollTo({ top: 0 });
    }

    function adminOrqaga() {
        if (!adminChiqishMumkinmi()) return;
        closeProductManager();
        window.scrollTo({ top: 0 });
    }

    // ---------- 2) Bo'lim ichida tez o'tish ----------
    function adminBolimNavigatsiyasi() {
        let nav = document.getElementById('adminSectionNav');
        let manager = document.getElementById('adminSpecificProductManager');
        if (!nav || !manager) return;
        let sarlavhalar = [...manager.querySelectorAll('.add-pen-card-title, .table-card h3')]
            .filter(el => el.offsetParent !== null && el.textContent.trim());
        if (sarlavhalar.length < 2) { nav.style.display = 'none'; nav.innerHTML = ''; return; }
        nav.style.display = 'flex';
        nav.innerHTML = '<span class="admin-section-nav-label">Tez o\'tish:</span>';
        sarlavhalar.forEach(el => {
            let b = document.createElement('button');
            b.type = 'button';
            b.className = 'admin-section-chip';
            b.textContent = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 42);
            b.onclick = () => (el.closest('.add-pen-card, .table-card') || el).scrollIntoView({ behavior: 'smooth', block: 'start' });
            nav.appendChild(b);
        });
    }

    // core.js → openProductManager() muvaffaqiyatli ochilgach chaqiriladi
    function adminUxMahsulotOchildi(key, name) {
        adminTozala(document.getElementById('adminSpecificProductManager'));
        let cat = adminMahsulotToifasi(key);
        let yol = document.getElementById('adminBreadcrumb');
        if (yol) yol.textContent = `Admin panel › ${ADMIN_BOLIM_NOMI[cat] || (key === 'ofset_pechat' ? 'Ofset pechat' : key === 'sifravoy_pechat' ? 'Sifravoy pechat' : "Bo'lim")}`;
        let sel = document.getElementById('adminProductSwitcher');
        if (sel) {
            sel.innerHTML = Object.keys(allCategories).map(c => `
                <optgroup label="${ADMIN_BOLIM_NOMI[c] || c}">
                    ${allCategories[c].map(p => `<option value="${p.key}" ${p.key === key ? 'selected' : ''}>${p.icon || ''} ${p.name}</option>`).join('')}
                </optgroup>`).join('');
        }
        // Bloklar chizilib bo'lgach (ba'zilari keyingi kadrda) navigatsiyani quramiz
        setTimeout(adminBolimNavigatsiyasi, 0);
    }

    // Admin ekranidan boshqa ekranga o'tishda saqlanmagan o'zgarishlarni tekshiradi (core.js → showScreen)
    function adminEkranidanChiqishMumkinmi(yangiEkran) {
        if (yangiEkran === 'adminScreen') return true;
        let screen = document.getElementById('adminScreen');
        if (!screen || screen.style.display === 'none') return true;
        return adminChiqishMumkinmi();
    }
