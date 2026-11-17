// Poligrafiya bo'limi — Bloknot: mijoz ekrani, sozlama migratsiyasi, admin panel, hisob-kitob.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== BLOKNOT: MIJOZ EKRANI ======================

    function buildBloknotForm() {
        // standart qiymatlarni tiklaymiz
        let defSize = bloknotConfig.sizes.findIndex(s => s.isDefault);
        let sizeIdx = defSize >= 0 ? defSize : 0;
        let size = bloknotConfig.sizes[sizeIdx];
        let defSpring = (size?.spring || []).findIndex(s => s.isDefault);
        bloknotSelected = {
            sizeIndex: sizeIdx,
            twoSide: false,
            springIndex: defSpring >= 0 ? defSpring : 0,
            extras: { tisneniya: false, lak3d: false, qattiq: false }
        };

        return `
            <div class="step-title">Bloknot o'lchami:</div>
            <div class="options-group" id="bloknotSizeGroup"></div>

            <div class="step-title" style="margin-top:16px;">Ichki varoqlar pechati:</div>
            <div class="options-group" id="bloknotSideGroup"></div>

            <div class="step-title" style="margin-top:16px;">Prujina joyi:</div>
            <div class="options-group" id="bloknotSpringGroup"></div>

            <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlovlar:</div>
            <div class="options-group" id="bloknotExtraGroup"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate(); updateBloknotInfo();">
            </div>
        `;
    }

    function renderBloknotOptions() {
        const sizeGroup = document.getElementById('bloknotSizeGroup');
        if (!sizeGroup) return;

        let size = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];

        sizeGroup.innerHTML = bloknotConfig.sizes.map((s, idx) => `
            <button class="opt-btn ${idx === bloknotSelected.sizeIndex ? 'active' : ''}"
                    onclick="selectBloknotSize(${idx})">${s.name}</button>
        `).join('');

        document.getElementById('bloknotSideGroup').innerHTML = `
            <button class="opt-btn ${!bloknotSelected.twoSide ? 'active' : ''}"
                    onclick="selectBloknotSide(false)">Bir tomonlama</button>
            <button class="opt-btn ${bloknotSelected.twoSide ? 'active' : ''}"
                    onclick="selectBloknotSide(true)">Ikki tomonlama</button>
        `;

        document.getElementById('bloknotSpringGroup').innerHTML = (size.spring || []).map((s, idx) => `
            <button class="opt-btn ${idx === bloknotSelected.springIndex ? 'active' : ''}"
                    onclick="selectBloknotSpring(${idx})">${s.name}</button>
        `).join('');

        // Tisneniya va 3D lak mustaqil — ikkalasi ham birga yoqilishi mumkin
        document.getElementById('bloknotExtraGroup').innerHTML = `
            <button class="opt-btn ${bloknotSelected.extras.tisneniya ? 'active' : ''}"
                    onclick="toggleBloknotExtra('tisneniya')">🔨 Tisneniya</button>
            <button class="opt-btn ${bloknotSelected.extras.lak3d ? 'active' : ''}"
                    onclick="toggleBloknotExtra('lak3d')">✨ 3D lak</button>
            <button class="opt-btn ${bloknotSelected.extras.qattiq ? 'active' : ''}"
                    onclick="toggleBloknotExtra('qattiq')">📕 Qattiq muqova</button>
        `;

        updateBloknotInfo();
    }

    function updateBloknotInfo() {
        const box = document.getElementById('bloknotInfoText');
        if (!box) return;
        let s = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];
        let qatorlar = [];
        if (bloknotConfig.infoText) qatorlar.push(bloknotConfig.infoText);
        qatorlar.push(`<b>${s.name}</b> o'lchami: ${s.label}`);

        let qty = Math.max(parseInt(document.getElementById('inpQuantity')?.value) || 0, 0);

        if (qty > 0) {
            let totalLeaves = qty * (s.innerMultiplier || 0);
            let innerSheets = Math.ceil(totalLeaves / (s.innerDivisor || 1)) + (bloknotConfig.innerReserveSheets || 0);
            qatorlar.push(`Ichki varoqlar: <b>${totalLeaves.toLocaleString('ru-RU')} ta barg</b> → ${innerSheets.toLocaleString('ru-RU')} ta A3 list (${bloknotConfig.innerReserveSheets || 0} zapas bilan)`);

            let a3 = qty * (s.a3Share || 0);
            let jami = bloknotLaminatsiyaTotal(qty, s.a3Share);
            let L = bloknotConfig.laminatsiya;
            let izoh = a3 <= (L.firstPackSheets ?? 1000)
                ? `birinchi paket (${L.firstPackSheets} listgacha)`
                : `${L.firstPackSheets} list + ${(a3 - L.firstPackSheets).toLocaleString('ru-RU')} ta qo'shimcha`;
            qatorlar.push(
                `Laminatsiya (majburiy): <b>${a3.toLocaleString('ru-RU')} ta A3 list</b> → ` +
                `<b>${jami.toLocaleString('ru-RU')} so'm</b> <span style="color:var(--text-muted)">(${izoh})</span>`
            );
        }

        if (bloknotSelected.extras.tisneniya && bloknotConfig.tisneniya.klishePrice > 0) {
            qatorlar.push(`Tisneniya klishesi: <b>${bloknotConfig.tisneniya.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        if (bloknotSelected.extras.lak3d && bloknotConfig.lak3d.klishePrice > 0) {
            qatorlar.push(`3D lak klishesi: <b>${bloknotConfig.lak3d.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }

        box.innerHTML = qatorlar.join('<br>');
    }

    function selectBloknotSize(idx) {
        bloknotSelected.sizeIndex = idx;
        let size = bloknotConfig.sizes[idx];
        let defSpring = (size?.spring || []).findIndex(s => s.isDefault);
        bloknotSelected.springIndex = defSpring >= 0 ? defSpring : 0;
        renderBloknotOptions();
        calculate();
    }

    function selectBloknotSide(twoSide) {
        bloknotSelected.twoSide = twoSide;
        renderBloknotOptions();
        calculate();
    }

    function selectBloknotSpring(idx) {
        bloknotSelected.springIndex = idx;
        renderBloknotOptions();
        calculate();
    }

    // Tisneniya va 3D lak mustaqil checkbox — ikkalasi ham birga yoqilishi mumkin
    function toggleBloknotExtra(key) {
        bloknotSelected.extras[key] = !bloknotSelected.extras[key];
        renderBloknotOptions();
        calculate();
    }

    // ====================== BLOKNOT: SOZLAMA MIGRATSIYASI ======================
    // Eski tuzilmadagi saqlangan sozlamalarni yangisiga o'tkazadi,
    // shunda foydalanuvchi kiritgan narxlar yo'qolmaydi.

    function migrateBloknotConfig(saqlangan, standart) {
        let cfg = { ...standart };

        // --- o'lchamlar ---
        // Eski tuzilmada usti/ichki narxlari to'g'ridan-to'g'ri admin tomonidan kiritilar edi
        // (coverPrice/innerOnePrice/innerTwoPrice). Yangi modelda bu narxlar Ofset bo'limining
        // haqiqiy qog'oz bazasidan hisoblanadi — shu sabab eski dona-narxlari endi mos kelmaydi
        // va ko'chirilmaydi. Faqat geometriyaga bog'liq (a3Share, nomi, o'lchami) va — bo'lsa —
        // allaqachon yangi maydonlar (coverGsm, innerMultiplier/Divisor, assemblyPrice, spring)
        // saqlanadi.
        if (Array.isArray(saqlangan.sizes) && saqlangan.sizes.length > 0) {
            cfg.sizes = saqlangan.sizes.map((s, i) => {
                let standartOlcham = standart.sizes.find(d => d.name === s.name) || standart.sizes[i] || standart.sizes[0];

                let a3 = s.a3Share;
                if (a3 === undefined) {
                    let nom = (s.name || '').toUpperCase();
                    a3 = nom === 'A4' ? 1.0 : nom === 'A5' ? 0.5 : nom === 'A6' ? 0.25
                       : (standartOlcham.a3Share ?? 0.5);
                }

                // Eski global `spring` (bloknotConfig.spring) bo'lsa — uni shu o'lchamning
                // boshlang'ich prujina narxi sifatida ko'chiramiz (admin keyin har bir
                // o'lcham uchun alohida sozlashi kerak bo'ladi).
                let spring = Array.isArray(s.spring) && s.spring.length > 0
                    ? s.spring.map((sp, j) => ({
                        key: sp.key || ('p' + j),
                        name: sp.name || (standartOlcham.spring[j]?.name) || `Variant ${j + 1}`,
                        price: sp.price ?? (standartOlcham.spring[j]?.price ?? 0),
                        isDefault: !!sp.isDefault
                      }))
                    : (Array.isArray(saqlangan.spring) && saqlangan.spring.length > 0
                        ? saqlangan.spring.map((sp, j) => ({
                            key: sp.key || ('p' + j),
                            name: sp.name || (standartOlcham.spring[j]?.name) || `Variant ${j + 1}`,
                            price: sp.price ?? 0,
                            isDefault: !!sp.isDefault
                          }))
                        : standartOlcham.spring.map(sp => ({ ...sp })));
                if (!spring.some(sp => sp.isDefault)) spring[0].isDefault = true;

                return {
                    key: s.key || ('s' + i),
                    name: s.name || standartOlcham.name,
                    label: s.label || standartOlcham.label,
                    a3Share: a3,
                    coverGsm: s.coverGsm ?? standartOlcham.coverGsm,
                    innerMultiplier: s.innerMultiplier ?? standartOlcham.innerMultiplier,
                    innerDivisor: s.innerDivisor ?? standartOlcham.innerDivisor,
                    assemblyPrice: s.assemblyPrice ?? standartOlcham.assemblyPrice,
                    spring,
                    isDefault: !!s.isDefault
                };
            });
            if (!cfg.sizes.some(s => s.isDefault)) cfg.sizes[0].isDefault = true;
        }

        if (typeof saqlangan.innerReserveSheets === 'number') cfg.innerReserveSheets = saqlangan.innerReserveSheets;

        // --- laminatsiya: eski "lak" (A3 pog'onali) endi majburiy "laminatsiya" ---
        cfg.laminatsiya = { ...standart.laminatsiya };
        if (saqlangan.laminatsiya && saqlangan.laminatsiya.firstPackSheets !== undefined) {
            cfg.laminatsiya = { ...cfg.laminatsiya, ...saqlangan.laminatsiya };
        } else if (saqlangan.lak && saqlangan.lak.firstPackSheets !== undefined) {
            cfg.laminatsiya = { ...cfg.laminatsiya, ...saqlangan.lak };
        }

        // --- tisneniya / 3D lak ---
        // (taxiFee endi ko'chirilmaydi — eski saqlangan qiymat bo'lsa ham e'tiborga
        // olinmaydi, chunki Taxi endi umumiy "🚕 Taxi xarajatlari" panelidan olinadi.)
        cfg.tisneniya = { ...standart.tisneniya, ...(saqlangan.tisneniya || {}) };
        cfg.lak3d = { ...standart.lak3d, ...(saqlangan.lak3d || {}) };
        cfg.qattiqMuqova = { ...standart.qattiqMuqova, ...(saqlangan.qattiqMuqova || {}) };

        // --- ma'lumot matni ---
        if (typeof saqlangan.infoText === 'string') cfg.infoText = saqlangan.infoText;

        return cfg;
    }

    // ====================== BLOKNOT: ADMIN PANEL ======================

    function renderAdminBloknotTables() {
        // --- o'lchamlar jadvali ---
        let tb = document.getElementById('adminBloknotSizeTableBody');
        if (tb) {
            if (bloknotConfig.sizes.length === 0) {
                tb.innerHTML = `<tr><td colspan="11" style="text-align:center; color: var(--text-muted); padding:20px;">O'lcham kiritilmagan.</td></tr>`;
            } else {
                tb.innerHTML = bloknotConfig.sizes.map((s, idx) => {
                    let top = (s.spring && s.spring[0]) || { price: 0 };
                    let side = (s.spring && s.spring[1]) || { price: 0 };
                    return `
                    <tr>
                        <td><input type="text" class="bl-size-name" value="${s.name}" style="width:100%;"></td>
                        <td><input type="text" class="bl-size-label" value="${s.label}" style="width:100%;"></td>
                        <td><input type="number" min="0" step="0.05" class="bl-size-a3" value="${s.a3Share}" style="width:100%;" oninput="updateBloknotLamPreview()"></td>
                        <td><input type="number" min="0" class="bl-size-covergsm" value="${s.coverGsm}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-innermult" value="${s.innerMultiplier}" style="width:100%;"></td>
                        <td><input type="number" min="1" class="bl-size-innerdiv" value="${s.innerDivisor}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-assembly" value="${s.assemblyPrice}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-springtop" value="${top.price}" style="width:100%;"></td>
                        <td><input type="number" min="0" class="bl-size-springside" value="${side.price}" style="width:100%;"></td>
                        <td style="text-align:center;">
                            <input type="radio" name="blSizeDefault" class="bl-size-default" ${s.isDefault ? 'checked' : ''}>
                        </td>
                        <td style="text-align:right;">
                            <button class="btn btn-sm btn-danger" onclick="deleteBloknotSize(${idx})">🗑</button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }

        // --- boshqa maydonlar ---
        let q = (id) => document.getElementById(id);
        if (q('bloknotInnerReserveSheets')) q('bloknotInnerReserveSheets').value = bloknotConfig.innerReserveSheets;
        if (q('bloknotLamFirstSheets'))  q('bloknotLamFirstSheets').value  = bloknotConfig.laminatsiya.firstPackSheets;
        if (q('bloknotLamFirstPrice'))   q('bloknotLamFirstPrice').value   = bloknotConfig.laminatsiya.firstPackPrice;
        if (q('bloknotLamNextPrice'))    q('bloknotLamNextPrice').value    = bloknotConfig.laminatsiya.nextSheetPrice;
        if (q('bloknotTisneniyaPrice'))  q('bloknotTisneniyaPrice').value  = bloknotConfig.tisneniya.pricePerUnit;
        if (q('bloknotKlishePrice'))     q('bloknotKlishePrice').value     = bloknotConfig.tisneniya.klishePrice;
        if (q('bloknotLak3dPrice'))      q('bloknotLak3dPrice').value      = bloknotConfig.lak3d.pricePerUnit;
        if (q('bloknotLak3dKlishePrice'))q('bloknotLak3dKlishePrice').value = bloknotConfig.lak3d.klishePrice;
        if (q('bloknotQattiqMuqovaPrice')) q('bloknotQattiqMuqovaPrice').value = bloknotConfig.qattiqMuqova.pricePerUnit;
        if (q('bloknotInfoTextInput'))   q('bloknotInfoTextInput').value   = bloknotConfig.infoText || '';

        ['bloknotLamFirstSheets','bloknotLamFirstPrice','bloknotLamNextPrice'].forEach(id => {
            let el = q(id);
            if (el) el.oninput = updateBloknotLamPreview;
        });
        updateBloknotLamPreview();
    }

    // Admin panelda laminatsiya formulasini namuna bilan ko'rsatadi
    function updateBloknotLamPreview() {
        let box = document.getElementById('bloknotLamPreview');
        if (!box) return;

        let son = (id, d) => { let v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? d : v; };
        let birinchiList = son('bloknotLamFirstSheets', 1000);
        let birinchiNarx = son('bloknotLamFirstPrice', 350000);
        let keyingiNarx  = son('bloknotLamNextPrice', 500);

        // birinchi o'lchamning A3 ulushi bilan namuna
        let a3El = document.querySelector('.bl-size-a3');
        let a3Ulush = a3El ? (parseFloat(a3El.value) || 1) : 1;

        let namuna = [1000, 3000];
        let qatorlar = namuna.map(qty => {
            let a3 = qty * a3Ulush;
            let jami = a3 <= birinchiList ? birinchiNarx : birinchiNarx + (a3 - birinchiList) * keyingiNarx;
            return `${qty} dona → ${a3.toLocaleString('ru-RU')} A3 → ${jami.toLocaleString('ru-RU')} so'm`;
        });
        box.innerHTML = qatorlar.join('<br>') +
            `<div style="color:var(--text-muted); margin-top:4px;">(1-o'lcham, A3 ulushi ${a3Ulush})</div>`;
    }

    function addBloknotSizeRow() {
        collectBloknotTablesFromUI();
        bloknotConfig.sizes.push({
            key: 'yangi' + Date.now(), name: 'A5', label: '148x210mm',
            a3Share: 0.5, coverGsm: 250, innerMultiplier: 40, innerDivisor: 4, assemblyPrice: 2000,
            spring: [
                { key: 'top', name: 'Yuqoridan', price: 0, isDefault: true },
                { key: 'side', name: 'Yonidan', price: 0, isDefault: false }
            ],
            isDefault: false
        });
        renderAdminBloknotTables();
    }

    function deleteBloknotSize(idx) {
        if (bloknotConfig.sizes.length <= 1) {
            showToast("⚠️ Kamida bitta o'lcham qolishi kerak!");
            return;
        }
        if (!confirm("Ushbu o'lchamni o'chirmoqchimisiz?")) return;
        collectBloknotTablesFromUI();
        let ediStandart = bloknotConfig.sizes[idx].isDefault;
        bloknotConfig.sizes.splice(idx, 1);
        if (ediStandart && bloknotConfig.sizes.length > 0) bloknotConfig.sizes[0].isDefault = true;
        renderAdminBloknotTables();
    }

    // jadvaldagi kiritilgan qiymatlarni obyektga yig'adi
    function collectBloknotTablesFromUI() {
        let nomlar = document.querySelectorAll('.bl-size-name');
        if (nomlar.length > 0) {
            let labels     = document.querySelectorAll('.bl-size-label');
            let a3s        = document.querySelectorAll('.bl-size-a3');
            let coverGsms  = document.querySelectorAll('.bl-size-covergsm');
            let innerMults = document.querySelectorAll('.bl-size-innermult');
            let innerDivs  = document.querySelectorAll('.bl-size-innerdiv');
            let assemblies = document.querySelectorAll('.bl-size-assembly');
            let springTops = document.querySelectorAll('.bl-size-springtop');
            let springSides= document.querySelectorAll('.bl-size-springside');
            let defaults   = document.querySelectorAll('.bl-size-default');
            let yangi = [];
            nomlar.forEach((el, i) => {
                let oldSpring = bloknotConfig.sizes[i]?.spring || [];
                yangi.push({
                    key: bloknotConfig.sizes[i]?.key || ('s' + i),
                    name: (el.value || '').trim() || `O'lcham ${i + 1}`,
                    label: (labels[i]?.value || '').trim(),
                    a3Share: parseFloat(a3s[i]?.value) || 0,
                    coverGsm: parseFloat(coverGsms[i]?.value) || 0,
                    innerMultiplier: parseFloat(innerMults[i]?.value) || 0,
                    innerDivisor: Math.max(1, parseFloat(innerDivs[i]?.value) || 1),
                    assemblyPrice: parseFloat(assemblies[i]?.value) || 0,
                    spring: [
                        { key: oldSpring[0]?.key || 'top', name: oldSpring[0]?.name || 'Yuqoridan', price: parseFloat(springTops[i]?.value) || 0, isDefault: oldSpring[0]?.isDefault !== false },
                        { key: oldSpring[1]?.key || 'side', name: oldSpring[1]?.name || 'Yonidan', price: parseFloat(springSides[i]?.value) || 0, isDefault: oldSpring[1]?.isDefault === true }
                    ],
                    isDefault: defaults[i]?.checked || false
                });
            });
            if (yangi.length > 0 && !yangi.some(s => s.isDefault)) yangi[0].isDefault = true;
            bloknotConfig.sizes = yangi;
        }
    }

    function saveBloknotConfig() {
        collectBloknotTablesFromUI();

        let son = (id, standart) => {
            let v = parseFloat(document.getElementById(id)?.value);
            return isNaN(v) || v < 0 ? standart : v;
        };

        bloknotConfig.innerReserveSheets        = Math.max(0, son('bloknotInnerReserveSheets', 100));
        bloknotConfig.laminatsiya.firstPackSheets = Math.max(1, son('bloknotLamFirstSheets', 1000));
        bloknotConfig.laminatsiya.firstPackPrice  = son('bloknotLamFirstPrice', 0);
        bloknotConfig.laminatsiya.nextSheetPrice  = son('bloknotLamNextPrice', 0);
        bloknotConfig.tisneniya.pricePerUnit    = son('bloknotTisneniyaPrice', 0);
        bloknotConfig.tisneniya.klishePrice     = son('bloknotKlishePrice', 0);
        bloknotConfig.lak3d.pricePerUnit        = son('bloknotLak3dPrice', 0);
        bloknotConfig.lak3d.klishePrice         = son('bloknotLak3dKlishePrice', 0);
        bloknotConfig.qattiqMuqova.pricePerUnit = son('bloknotQattiqMuqovaPrice', 0);
        bloknotConfig.infoText = (document.getElementById('bloknotInfoTextInput')?.value || '').trim();

        // asosiy o'lcham yorlig'ini ham yangilaymiz
        let std = bloknotConfig.sizes.find(s => s.isDefault) || bloknotConfig.sizes[0];
        if (std && std.label) poligrafiyaSizeLabels.bloknot = std.label;

        localStorage.setItem('erp_bloknot_config', JSON.stringify(bloknotConfig));
        if (typeof logAudit === 'function') logAudit("Bloknot sozlamalari o'zgartirildi", "O'lchamlar, narxlar yoki qo'shimcha sozlamalar yangilandi");
        renderAdminBloknotTables();
        showToast("💾 Bloknot sozlamalari saqlandi!");
    }

    // ====================== BLOKNOT: HISOB-KITOB ======================

    // Laminatsiya umumiy summasi — A3 listlar soni bo'yicha pog'onali hisob (MAJBURIY qism)
    function bloknotLaminatsiyaTotal(qty, a3Share) {
        let L = bloknotConfig.laminatsiya || {};
        let birinchiList = L.firstPackSheets ?? 1000;
        let birinchiNarx = L.firstPackPrice ?? 0;
        let keyingiNarx  = L.nextSheetPrice ?? 0;

        let a3Soni = qty * (a3Share || 0);
        if (a3Soni <= birinchiList) return birinchiNarx;          // minimal to'lov
        return birinchiNarx + (a3Soni - birinchiList) * keyingiNarx;
    }

    // Usti + osti (Karton, Ofset A3): 1 A3 listga size.a3Share ulushida bitta bloknotning
    // usti+ostisi to'g'ri keladi (masalan A6 = 1/4, ya'ni 1 A3 listga 4 ta to'plam).
    // Bitta bosqichda (side=1) forma/pechat qilinadi — usti va osti bitta A3 varoqda birga
    // joylashtirilib bosiladi.
    function calculateBloknotCover(qty, size) {
        let workingSheetsNeeded = Math.ceil(qty * (size.a3Share || 0));
        return calculateOfsetJobFixedSheets('A3', qty, 1, 'Karton', size.coverGsm, workingSheetsNeeded, false);
    }

    // Ichki varoqlar (Ofset 80gr, A3): adad × innerMultiplier = kerakli barg soni, so'ng
    // innerDivisor'ga bo'linib (1 A3 list buklanib shuncha bargga aylanadi) kerakli A3 list
    // soni topiladi, va har bir tirajga bir marta innerReserveSheets qo'shiladi. Ikki tomonlama
    // tanlansa — old/orqa sahifalar matni har xil bo'lgani uchun har doim CHUJOY (alohida
    // forma/bosma).
    function calculateBloknotInner(qty, size, twoSide) {
        let totalLeaves = qty * (size.innerMultiplier || 0);
        let workingSheetsNeeded = Math.ceil(totalLeaves / (size.innerDivisor || 1)) + (bloknotConfig.innerReserveSheets || 0);
        let side = twoSide ? 2 : 1;
        return calculateOfsetJobFixedSheets('A3', qty, side, 'Ofset', 80, workingSheetsNeeded, twoSide);
    }

    function calculateBloknot(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let size = bloknotConfig.sizes[bloknotSelected.sizeIndex] || bloknotConfig.sizes[0];
        let spring = (size.spring && size.spring[bloknotSelected.springIndex]) || (size.spring && size.spring[0]) || { name: '', price: 0 };

        let unit = 0;
        let costItems = [];
        let qismlar = [`Bloknot ${size.name} (${size.label})`];

        // 1) Usti + osti (Karton, Ofset A3)
        let coverResult = calculateBloknotCover(qty, size);
        if (coverResult) {
            unit += coverResult.perPieceCostRaw;
            costItems.push({ label: `Usti/osti qog'ozi (Karton ${size.coverGsm}gr, ${coverResult.rawName})`, qty: `${coverResult.totalSheets} xom varoq`, total: Math.round(coverResult.totalPaperCost) });
            costItems.push({ label: 'Usti/osti forma (klishe)', qty: `${coverResult.totalPlates} plastina`, total: Math.round(coverResult.totalPlateCost) });
            costItems.push({ label: 'Usti/osti bosma (pechat)', qty: `${coverResult.totalWorkingSheets} ta A3 varoq`, total: Math.round(coverResult.totalPrintCost) });
        } else {
            qismlar.push(`⚠️ Karton ${size.coverGsm}gr uchun Ofset A3 bazasi topilmadi`);
        }

        // 2) Ichki varoqlar (Ofset 80gr, A3)
        let innerResult = calculateBloknotInner(qty, size, bloknotSelected.twoSide);
        if (innerResult) {
            unit += innerResult.perPieceCostRaw;
            costItems.push({ label: `Ichki varoq qog'ozi (Ofset 80gr, ${innerResult.rawName})`, qty: `${innerResult.totalSheets} xom varoq`, total: Math.round(innerResult.totalPaperCost) });
            costItems.push({ label: 'Ichki varoq forma (klishe)', qty: `${innerResult.totalPlates} plastina`, total: Math.round(innerResult.totalPlateCost) });
            costItems.push({ label: 'Ichki varoq bosma (pechat)', qty: `${innerResult.totalWorkingSheets} ta A3 varoq`, total: Math.round(innerResult.totalPrintCost) });
        } else {
            qismlar.push('⚠️ Ofset 80gr uchun A3 bazasi topilmadi');
        }
        qismlar.push(bloknotSelected.twoSide ? 'ichki 2 tomonlama' : 'ichki 1 tomonlama');

        // 3) Prujina joyi narxi (o'lcham bo'yicha)
        unit += (spring.price || 0);
        qismlar.push(`prujina ${(spring.name || '').toLowerCase()}`);
        costItems.push({ label: `Prujina (${spring.name})`, qty: `${qty} dona`, total: Math.round((spring.price || 0) * qty) });

        // 4) Yig'ish xarajati (majburiy, o'lcham bo'yicha)
        unit += (size.assemblyPrice || 0);
        costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round((size.assemblyPrice || 0) * qty) });

        // 5) Laminatsiya (majburiy, A3 list bo'yicha pog'onali)
        let lamJami = bloknotLaminatsiyaTotal(qty, size.a3Share);
        if (lamJami > 0) {
            unit += lamJami / qty;
            costItems.push({ label: 'Laminatsiya', qty: `${Math.ceil(qty * (size.a3Share || 0))} A3 list`, total: Math.round(lamJami) });
        }

        // 6) Tisneniya (ixtiyoriy, checkbox)
        if (bloknotSelected.extras.tisneniya) {
            let klishe = bloknotConfig.tisneniya.klishePrice || 0;
            unit += (bloknotConfig.tisneniya.pricePerUnit || 0) + (klishe / qty);
            qismlar.push('tisneniya');
            costItems.push({ label: 'Tisneniya', qty: `${qty} dona`, total: Math.round((bloknotConfig.tisneniya.pricePerUnit || 0) * qty + klishe) });
        }

        // 7) 3D lak (ixtiyoriy, checkbox — Tisneniyadan mustaqil)
        if (bloknotSelected.extras.lak3d) {
            let klishe = bloknotConfig.lak3d.klishePrice || 0;
            unit += (bloknotConfig.lak3d.pricePerUnit || 0) + (klishe / qty);
            qismlar.push('3D lak');
            costItems.push({ label: '3D lak', qty: `${qty} dona`, total: Math.round((bloknotConfig.lak3d.pricePerUnit || 0) * qty + klishe) });
        }

        // 8) Qattiq muqova (ixtiyoriy) — narxi admin kiritadi, so'm/dona
        if (bloknotSelected.extras.qattiq) {
            let narx = bloknotConfig.qattiqMuqova.pricePerUnit || 0;
            unit += narx;
            qismlar.push('qattiq muqova');
            costItems.push({ label: 'Qattiq muqova', qty: `${qty} dona`, total: Math.round(narx * qty) });
        }

        // Taxi xarajati bu yerda qo'shilmaydi — umumiy "🚕 Taxi xarajatlari" (poligrafiya)
        // mexanizmi orqali calculate() ichida avtomatik qo'shiladi (barcha poligrafiya
        // mahsulotlariga bir xil, bloknot uchun alohida emas).

        return { unitPrice: unit, details: qismlar.join(' | '), costItems };
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('bloknot');
