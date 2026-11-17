// Poligrafiya bo'limi — Kalendar.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== KALENDAR (poligrafiya, 8 pastki tur) ======================
    // Qog'oz (Melovka/Karton) narxi hech qaerda takrorlanmaydi — Ofset (ofsetRawPapers) va,
    // faqat "compound" guruh bloki uchun, Raqamli (digitalPapersDatabase) bo'limining umumiy
    // bazasidan real narx qidiriladi (calculateResult_poligrafiya bilan bir xil naqsh). Imposition
    // ("necha dona bir varoqqa sig'adi") calculateOfsetForMachine() ichida allaqachon avtomatik.
    let kalendarConfig = {
        subtypes: [
            { key: 'desk_a6', name: 'A6 Stol kalendar', group: 'compound',
              blockW: 105, blockH: 148, coverW: 105, coverH: 148,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 15000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'desk_a5', name: 'A5 Stol kalendar', group: 'compound',
              blockW: 148, blockH: 210, coverW: 148, coverH: 210,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 18000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'desk_a4', name: 'A4 Stol kalendar', group: 'compound',
              blockW: 210, blockH: 297, coverW: 210, coverH: 297,
              listOptions: [7, 13], defaultListCount: 7, fixedListCount: null,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: [ { key: 'standart', name: 'Standart qattiq muqova', price: 22000 } ],
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'wall_quarter', name: 'Devoriy kvartal kalendar', group: 'compound',
              blockW: 297, blockH: 210, coverW: 297, coverH: 210,
              listOptions: null, defaultListCount: null, fixedListCount: 4,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: null,
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'wall_flip', name: 'Devoriy varaqlanadigan kalendar', group: 'compound',
              blockW: 297, blockH: 210, coverW: 297, coverH: 210,
              listOptions: null, defaultListCount: null, fixedListCount: 13,
              blockGsmOptions: [105, 115, 130, 150, 170, 200, 250, 300], defaultBlockGsm: 150,
              coverGsmOptions: [250, 300, 350], defaultCoverGsm: 250,
              hardCoverOptions: null,
              extras: { laminatsiya: { price: 0 }, prujina: { price: 0 }, yigish: { price: 0 }, tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'poster_a3', name: 'Plakat kalendar A3', group: 'poster', w: 297, h: 420, machine: 'A3',
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'poster_a2', name: 'Plakat kalendar A2', group: 'poster', w: 420, h: 594, machine: 'A2',
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } },
            { key: 'pocket', name: 'Karmanniy kalendar', group: 'pocket', w: 70, h: 100,
              gsmOptions: [200, 250, 300], defaultGsm: 250,
              extras: { tisneniya: { price: 0, klishePrice: 0 }, lak: { price: 0 } } }
        ]
    };

    let kalendarSelected = {
        subtypeIndex: 0, listCount: 7, coverType: 'soft', hardCoverIndex: 0,
        blockGsm: 150, coverGsm: 250, gsm: 250, engine: 'ofset', sides: 2,
        extras: { tisneniya: false, lak: false }
    };

    function resetKalendarSelectedForSubtype(idx) {
        let s = kalendarConfig.subtypes[idx] || kalendarConfig.subtypes[0];
        kalendarSelected.subtypeIndex = idx;
        kalendarSelected.listCount = s.defaultListCount || (s.listOptions ? s.listOptions[0] : null);
        kalendarSelected.coverType = 'soft';
        kalendarSelected.hardCoverIndex = 0;
        kalendarSelected.blockGsm = s.defaultBlockGsm || null;
        kalendarSelected.coverGsm = s.defaultCoverGsm || null;
        kalendarSelected.gsm = s.defaultGsm || null;
        kalendarSelected.engine = 'ofset';
        kalendarSelected.sides = (s.group === 'compound') ? 2 : 1;
        kalendarSelected.extras = { tisneniya: false, lak: false };
    }

    function buildKalendarForm() {
        let startIdx = (kalendarSelected.subtypeIndex >= 0 && kalendarConfig.subtypes[kalendarSelected.subtypeIndex]) ? kalendarSelected.subtypeIndex : 0;
        resetKalendarSelectedForSubtype(startIdx);
        return `
            <div class="step-title">Kalendar turi:</div>
            <div class="options-group" id="kalendarSubtypeGroup"></div>

            <div id="kalendarDynamicOptions"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
            </div>
        `;
    }

    function renderKalendarOptions() {
        const group = document.getElementById('kalendarSubtypeGroup');
        if (!group) return;
        group.innerHTML = kalendarConfig.subtypes.map((s, idx) => `
            <button class="opt-btn ${idx === kalendarSelected.subtypeIndex ? 'active' : ''}"
                    onclick="selectKalendarSubtype(${idx})">${s.name}</button>
        `).join('');
        renderKalendarDynamicOptions();
    }

    function selectKalendarSubtype(idx) {
        resetKalendarSelectedForSubtype(idx);
        renderKalendarOptions();
        calculate();
    }

    const KALENDAR_EXTRA_LABELS = { laminatsiya: '🧴 Laminatsiya', prujina: '🌀 Prujina', yigish: "🧷 Yig'ish", tisneniya: '🔨 Tisneniya', lak: '✨ LAK' };
    // Laminatsiya/Prujina/Yig'ish — mijoz/menejer tanlamaydi, admin narx kiritsa har doim
    // qo'shiladi (calculateKalendar() ichida). Faqat shu ikkitasi menejerga tugma sifatida chiqadi.
    const KALENDAR_TOGGLEABLE_EXTRAS = ['tisneniya', 'lak'];

    function renderKalendarDynamicOptions() {
        let box = document.getElementById('kalendarDynamicOptions');
        if (!box) return;
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        let html = '';

        if (s.group === 'compound') {
            if (s.listOptions && s.listOptions.length > 0) {
                html += `
                    <div class="step-title" style="margin-top:16px;">Blok varaq soni:</div>
                    <div class="options-group" id="kalendarListGroup">
                        ${s.listOptions.map(n => `<button class="opt-btn ${kalendarSelected.listCount === n ? 'active' : ''}" onclick="selectKalendarListCount(${n})">${n} varaqli</button>`).join('')}
                    </div>`;
            } else {
                html += `
                    <div class="poli-spec-row poli-spec-row-muted">
                        <div class="poli-spec-icon">📄</div>
                        <div><div class="poli-spec-label">Blok varaq soni</div><div class="poli-spec-value">${s.fixedListCount} varaq (belgilangan)</div></div>
                    </div>`;
            }

            if (s.hardCoverOptions) {
                html += `
                    <div class="step-title" style="margin-top:16px;">Muqova turi:</div>
                    <div class="options-group" id="kalendarCoverTypeGroup">
                        <button class="opt-btn ${kalendarSelected.coverType === 'soft' ? 'active' : ''}" onclick="selectKalendarCoverType('soft')">Oddiy muqova</button>
                        <button class="opt-btn ${kalendarSelected.coverType === 'hard' ? 'active' : ''}" onclick="selectKalendarCoverType('hard')">Qattiq muqova</button>
                    </div>`;
                if (kalendarSelected.coverType === 'hard' && s.hardCoverOptions.length > 0) {
                    html += `
                    <div class="options-group" id="kalendarHardCoverGroup">
                        ${s.hardCoverOptions.map((h, idx) => `<button class="opt-btn ${kalendarSelected.hardCoverIndex === idx ? 'active' : ''}" onclick="selectKalendarHardCover(${idx})">${h.name}</button>`).join('')}
                    </div>`;
                }
            }

            html += `
                <div class="step-title" style="margin-top:16px;">Blok qog'ozi grammaji:</div>
                <div class="options-group" id="kalendarBlockGsmGroup">
                    ${s.blockGsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.blockGsm === g ? 'active' : ''}" onclick="selectKalendarBlockGsm(${g})">${g}gr</button>`).join('')}
                </div>`;

            if (kalendarSelected.coverType !== 'hard') {
                html += `
                <div class="step-title" style="margin-top:16px;">${s.fixedListCount != null ? 'Asos (karton) grammaji' : 'Muqova (karton) grammaji'}:</div>
                <div class="options-group" id="kalendarCoverGsmGroup">
                    ${s.coverGsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.coverGsm === g ? 'active' : ''}" onclick="selectKalendarCoverGsm(${g})">${g}gr</button>`).join('')}
                </div>`;
            }

            html += `
                <div class="step-title" style="margin-top:16px;">Pechat usuli (blok):</div>
                <div class="options-group" id="kalendarEngineGroup">
                    <button class="opt-btn ${kalendarSelected.engine === 'ofset' ? 'active' : ''}" onclick="selectKalendarEngine('ofset')">🖨️ Ofset Pechat</button>
                    <button class="opt-btn ${kalendarSelected.engine === 'raqamli' ? 'active' : ''}" onclick="selectKalendarEngine('raqamli')">🖥️ Raqamli Pechat</button>
                </div>`;
        } else {
            html += `
                <div class="step-title" style="margin-top:16px;">Qog'oz grammaji:</div>
                <div class="options-group" id="kalendarGsmGroup">
                    ${s.gsmOptions.map(g => `<button class="opt-btn ${kalendarSelected.gsm === g ? 'active' : ''}" onclick="selectKalendarGsm(${g})">${g}gr</button>`).join('')}
                </div>`;
        }

        html += `
            <div class="step-title" style="margin-top:16px;">Bosma tomoni:</div>
            <div class="options-group" id="kalendarSidesGroup">
                <button class="opt-btn ${kalendarSelected.sides === 1 ? 'active' : ''}" onclick="selectKalendarSides(1)">Bir tomonlama</button>
                <button class="opt-btn ${kalendarSelected.sides === 2 ? 'active' : ''}" onclick="selectKalendarSides(2)">Ikki tomonlama</button>
            </div>`;

        // Laminatsiya/Prujina/Yig'ish mijoz/menejerdan yashirilgan — admin narx kiritsa,
        // avtomatik (har doim) qo'shiladi. Faqat haqiqiy ixtiyoriy qo'shimchalar (Tisneniya/LAK)
        // tugma sifatida ko'rsatiladi.
        let extraKeys = Object.keys(s.extras || {}).filter(k => KALENDAR_TOGGLEABLE_EXTRAS.includes(k));
        if (extraKeys.length > 0) {
            html += `
                <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlovlar:</div>
                <div class="options-group" id="kalendarExtrasGroup">
                    ${extraKeys.map(k => `<button class="opt-btn ${kalendarSelected.extras[k] ? 'active' : ''}" onclick="toggleKalendarExtra('${k}')">${KALENDAR_EXTRA_LABELS[k] || k}</button>`).join('')}
                </div>`;
        }

        box.innerHTML = html;
        updateKalendarInfo();
    }

    function selectKalendarListCount(n) { kalendarSelected.listCount = n; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarCoverType(type) { kalendarSelected.coverType = type; kalendarSelected.hardCoverIndex = 0; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarHardCover(idx) { kalendarSelected.hardCoverIndex = idx; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarBlockGsm(g) { kalendarSelected.blockGsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarCoverGsm(g) { kalendarSelected.coverGsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarGsm(g) { kalendarSelected.gsm = g; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarEngine(e) { kalendarSelected.engine = e; renderKalendarDynamicOptions(); calculate(); }
    function selectKalendarSides(sd) { kalendarSelected.sides = sd; renderKalendarDynamicOptions(); calculate(); }
    function toggleKalendarExtra(key) { kalendarSelected.extras[key] = !kalendarSelected.extras[key]; renderKalendarDynamicOptions(); calculate(); }

    function updateKalendarInfo() {
        let box = document.getElementById('kalendarInfoText');
        let wrap = document.getElementById('kalendarInfoBox');
        if (!box || !wrap) return;
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        let qismlar = [];
        if (s.group === 'compound') {
            qismlar.push(`<b>${s.name}</b> — blok: ${s.blockW}×${s.blockH}mm, ${s.fixedListCount != null ? 'asos' : 'muqova'}: ${s.coverW}×${s.coverH}mm`);
        } else {
            qismlar.push(`<b>${s.name}</b> — o'lcham: ${s.w}×${s.h}mm`);
        }
        if (kalendarSelected.extras.tisneniya && s.extras.tisneniya && s.extras.tisneniya.klishePrice > 0) {
            qismlar.push(`Tisneniya klishesi: <b>${s.extras.tisneniya.klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        wrap.style.display = 'block';
        box.innerHTML = qismlar.join('<br>');
    }

    // Bloklar/muqova narxi hech qaerda takrorlanmaydi — Ofset (ofsetRawPapers) va Raqamli
    // (digitalPapersDatabase) bo'limining umumiy bazasidan haqiqiy narx qidiriladi
    // (calculateResult_poligrafiya bilan bir xil naqsh). Imposition (necha dona bir varoqqa
    // sig'adi) calculateOfsetForMachine() ichida allaqachon avtomatik hisoblanadi.
    function calculateKalendar(qty) {
        let s = kalendarConfig.subtypes[kalendarSelected.subtypeIndex] || kalendarConfig.subtypes[0];
        qty = Math.max(parseInt(qty) || 1, 1);
        let unit = 0;
        let qismlar = [];
        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];

        if (s.group === 'compound') {
            let listCount = (s.fixedListCount != null) ? s.fixedListCount : (kalendarSelected.listCount || (s.listOptions ? s.listOptions[0] : 1));

            // --- BLOK ---
            let blockUnit = 0;
            let blockInfo = '';
            let blockQty = qty * listCount;
            let blockResult = null;
            if (kalendarSelected.engine === 'raqamli') {
                let paperEntry = (typeof digitalPapersDatabase !== 'undefined') ? digitalPapersDatabase.find(p => {
                    let m = /(\d+)/.exec(p.name || '');
                    return m && parseInt(m[1]) === kalendarSelected.blockGsm;
                }) : null;
                if (paperEntry) {
                    let r = calculateDigitalPriceForPaper(paperEntry, s.blockW, s.blockH, blockQty, kalendarSelected.sides);
                    if (r) { blockUnit = r.unitPrice; blockInfo = 'Raqamli Pechat'; }
                }
            } else {
                let results = ['A3', 'A2', 'A1']
                    .map(m => calculateOfsetForMachine(m, s.blockW, s.blockH, blockQty, kalendarSelected.sides, 'Melovka', kalendarSelected.blockGsm))
                    .filter(Boolean);
                if (results.length > 0) {
                    results.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    blockResult = results[0];
                    blockUnit = blockResult.perPieceCostRaw;
                    blockInfo = `Ofset (${blockResult.machine})`;
                }
            }
            if (blockInfo) {
                unit += blockUnit * listCount;
                qismlar.push(`Blok: ${listCount} varaq × ${s.blockW}×${s.blockH}mm, Melovka ${kalendarSelected.blockGsm}gr (${blockInfo})`);
                if (blockResult) {
                    costItems.push({ label: `Blok qog'ozi (${blockResult.paperName} ${blockResult.paperGsm}gr, ${blockResult.rawName})`, qty: `${blockResult.totalSheets} xom varoq`, total: Math.round(blockResult.totalPaperCost) });
                    costItems.push({ label: 'Blok forma (klishe)', qty: `${blockResult.totalPlates} plastina`, total: Math.round(blockResult.totalPlateCost) });
                    costItems.push({ label: 'Blok bosma (pechat)', qty: `${blockResult.totalWorkingSheets} ta ${blockResult.machine} varoq`, total: Math.round(blockResult.totalPrintCost) });
                } else {
                    costItems.push({ label: `Blok (${blockInfo}, ${listCount} varaq/nusxa)`, qty: `${qty} nusxa`, total: Math.round(blockUnit * listCount * qty) });
                }
            } else {
                showToast(`⚠️ Blok uchun ${kalendarSelected.blockGsm}gr Melovka bazasi topilmadi — admin panelda tekshiring.`);
            }

            // --- MUQOVA / ASOS ---
            if (kalendarSelected.coverType === 'hard' && s.hardCoverOptions && s.hardCoverOptions.length > 0) {
                let hc = s.hardCoverOptions[kalendarSelected.hardCoverIndex] || s.hardCoverOptions[0];
                unit += (hc.price || 0);
                qismlar.push(`Muqova: ${hc.name} (${(hc.price || 0).toLocaleString()} so'm/dona)`);
                costItems.push({ label: `Muqova (${hc.name})`, qty: `${qty} dona`, total: Math.round((hc.price || 0) * qty) });
            } else {
                let coverResults = ['A3', 'A2', 'A1']
                    .map(m => calculateOfsetForMachine(m, s.coverW, s.coverH, qty, 1, 'Karton', kalendarSelected.coverGsm))
                    .filter(Boolean);
                if (coverResults.length > 0) {
                    coverResults.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    let cr = coverResults[0];
                    unit += cr.perPieceCostRaw;
                    let coverLabel = s.fixedListCount != null ? 'Asos' : 'Muqova';
                    qismlar.push(`${coverLabel}: Karton ${kalendarSelected.coverGsm}gr (Ofset ${cr.machine})`);
                    costItems.push({ label: `${coverLabel} qog'ozi (${cr.paperName} ${cr.paperGsm}gr, ${cr.rawName})`, qty: `${cr.totalSheets} xom varoq`, total: Math.round(cr.totalPaperCost) });
                    costItems.push({ label: `${coverLabel} forma (klishe)`, qty: `${cr.totalPlates} plastina`, total: Math.round(cr.totalPlateCost) });
                    costItems.push({ label: `${coverLabel} bosma (pechat)`, qty: `${cr.totalWorkingSheets} ta ${cr.machine} varoq`, total: Math.round(cr.totalPrintCost) });
                } else {
                    showToast(`⚠️ ${s.fixedListCount != null ? 'Asos' : 'Muqova'} uchun ${kalendarSelected.coverGsm}gr Karton bazasi topilmadi — admin panelda tekshiring.`);
                }
            }
        } else if (s.group === 'poster') {
            let r = calculateOfsetForMachine(s.machine, s.w, s.h, qty, kalendarSelected.sides, 'Melovka', kalendarSelected.gsm);
            if (r) {
                unit += r.perPieceCostRaw;
                qismlar.push(`${s.name}: ${s.w}×${s.h}mm, Melovka ${kalendarSelected.gsm}gr (Ofset ${r.machine}, ${r.itemsPerSheet} dona/varoq)`);
                costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
            } else {
                showToast(`⚠️ ${kalendarSelected.gsm}gr Melovka uchun ${s.machine} ofset bazasi topilmadi — admin panelda tekshiring.`);
            }
        } else if (s.group === 'pocket') {
            let r = calculateOfsetForMachine('A3', s.w, s.h, qty, kalendarSelected.sides, 'Melovka', kalendarSelected.gsm);
            if (r) {
                unit += r.perPieceCostRaw;
                qismlar.push(`${s.name}: ${s.w}×${s.h}mm, Melovka ${kalendarSelected.gsm}gr (Ofset A3, ${r.itemsPerSheet} dona/varoq — optimal joylashtirilgan)`);
                costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
            } else {
                showToast(`⚠️ ${kalendarSelected.gsm}gr Melovka uchun A3 ofset bazasi topilmadi — admin panelda tekshiring.`);
            }
        }

        // --- Laminatsiya/Prujina/Yig'ish: mijoz/menejer tanlamaydi — admin narxi bo'lsa
        // doim (avtomatik) qo'shiladi. Tisneniya/LAK — haqiqiy ixtiyoriy, menejer tanlaydi.
        let extras = s.extras || {};
        if (extras.laminatsiya) {
            unit += (extras.laminatsiya.price || 0);
            qismlar.push('Laminatsiya');
            costItems.push({ label: 'Laminatsiya', qty: `${qty} dona`, total: Math.round((extras.laminatsiya.price || 0) * qty) });
        }
        if (extras.prujina) {
            unit += (extras.prujina.price || 0);
            qismlar.push('Prujina');
            costItems.push({ label: 'Prujina', qty: `${qty} dona`, total: Math.round((extras.prujina.price || 0) * qty) });
        }
        if (extras.yigish) {
            unit += (extras.yigish.price || 0);
            qismlar.push("Yig'ish");
            costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round((extras.yigish.price || 0) * qty) });
        }
        if (kalendarSelected.extras.tisneniya && extras.tisneniya) {
            unit += (extras.tisneniya.price || 0);
            costItems.push({ label: 'Tisneniya', qty: `${qty} dona`, total: Math.round((extras.tisneniya.price || 0) * qty) });
            if (extras.tisneniya.klishePrice > 0) {
                unit += (extras.tisneniya.klishePrice / qty);
                costItems.push({ label: 'Tisneniya klishesi (bir martalik)', qty: '1 marta', total: Math.round(extras.tisneniya.klishePrice) });
            }
            qismlar.push('Tisneniya' + (extras.tisneniya.klishePrice > 0 ? ' + klishe' : ''));
        }
        if (kalendarSelected.extras.lak && extras.lak) {
            unit += (extras.lak.price || 0);
            qismlar.push('LAK');
            costItems.push({ label: 'LAK', qty: `${qty} dona`, total: Math.round((extras.lak.price || 0) * qty) });
        }

        updateKalendarInfo();
        return { unitPrice: unit, details: qismlar.join(' | ') || s.name, costItems };
    }

    // --- Kalendar admin muharriri ---

    function renderAdminKalendarTables() {
        let box = document.getElementById('kalendarSubtypesAdminContainer');
        if (!box) return;

        box.innerHTML = kalendarConfig.subtypes.map((s, idx) => {
            let dimsHtml = '';
            if (s.group === 'compound') {
                let coverLabel = s.fixedListCount != null ? 'Asos' : 'Muqova';
                dimsHtml = `
                    <div class="form-row">
                        <div class="form-group"><label>Blok eni (mm):</label><input type="number" min="1" value="${s.blockW}" onchange="updKalendarField(${idx},'blockW',this.value)"></div>
                        <div class="form-group"><label>Blok bo'yi (mm):</label><input type="number" min="1" value="${s.blockH}" onchange="updKalendarField(${idx},'blockH',this.value)"></div>
                        <div class="form-group"><label>${coverLabel} eni (mm):</label><input type="number" min="1" value="${s.coverW}" onchange="updKalendarField(${idx},'coverW',this.value)"></div>
                        <div class="form-group"><label>${coverLabel} bo'yi (mm):</label><input type="number" min="1" value="${s.coverH}" onchange="updKalendarField(${idx},'coverH',this.value)"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Standart blok grammaji:</label>
                            <select onchange="updKalendarField(${idx},'defaultBlockGsm',this.value)">
                                ${s.blockGsmOptions.map(g => `<option value="${g}" ${g === s.defaultBlockGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Standart ${coverLabel.toLowerCase()} grammaji:</label>
                            <select onchange="updKalendarField(${idx},'defaultCoverGsm',this.value)">
                                ${s.coverGsmOptions.map(g => `<option value="${g}" ${g === s.defaultCoverGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                        ${s.fixedListCount != null
                            ? `<div class="form-group"><label>Blok varaq soni (qat'iy):</label><input type="number" min="1" value="${s.fixedListCount}" onchange="updKalendarField(${idx},'fixedListCount',this.value)"></div>`
                            : `<div class="form-group"><label>Standart varaq soni:</label>
                                 <select onchange="updKalendarField(${idx},'defaultListCount',this.value)">
                                     ${(s.listOptions || []).map(n => `<option value="${n}" ${n === s.defaultListCount ? 'selected' : ''}>${n} varaqli</option>`).join('')}
                                 </select></div>`}
                    </div>`;
                if (s.hardCoverOptions) {
                    dimsHtml += `
                    <div style="margin-top:8px;">
                        <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Qattiq muqova narx jadvali:</label>
                        <table class="admin-table" style="margin-top:6px;">
                            <thead><tr><th>Nomi</th><th style="width:160px;">Narxi (so'm/dona)</th><th style="width:60px;"></th></tr></thead>
                            <tbody>
                                ${s.hardCoverOptions.map((h, hIdx) => `
                                    <tr>
                                        <td><input type="text" value="${h.name}" onchange="updKalendarHardCoverField(${idx},${hIdx},'name',this.value)"></td>
                                        <td><input type="number" min="0" value="${h.price || 0}" onchange="updKalendarHardCoverField(${idx},${hIdx},'price',this.value)"></td>
                                        <td><button class="btn btn-outline" style="padding:4px 8px;" onclick="removeKalendarHardCover(${idx},${hIdx})">✕</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                        <button class="btn btn-outline" style="margin-top:6px; padding:4px 10px; font-size:0.78rem;" onclick="addKalendarHardCover(${idx})">+ Qattiq muqova varianti</button>
                    </div>`;
                }
            } else {
                dimsHtml = `
                    <div class="form-row">
                        <div class="form-group"><label>Eni (mm):</label><input type="number" min="1" value="${s.w}" onchange="updKalendarField(${idx},'w',this.value)"></div>
                        <div class="form-group"><label>Bo'yi (mm):</label><input type="number" min="1" value="${s.h}" onchange="updKalendarField(${idx},'h',this.value)"></div>
                        <div class="form-group"><label>Standart grammaj:</label>
                            <select onchange="updKalendarField(${idx},'defaultGsm',this.value)">
                                ${s.gsmOptions.map(g => `<option value="${g}" ${g === s.defaultGsm ? 'selected' : ''}>${g}gr</option>`).join('')}
                            </select>
                        </div>
                    </div>`;
            }

            let extraKeys = Object.keys(s.extras || {});
            let extrasHtml = `<div class="form-row">` + extraKeys.map(k => {
                let e = s.extras[k];
                let klisheField = (k === 'tisneniya') ? `
                    <div class="form-group"><label>${KALENDAR_EXTRA_LABELS[k]} klishesi (bir martalik):</label><input type="number" min="0" value="${e.klishePrice || 0}" onchange="updKalendarExtraField(${idx},'${k}','klishePrice',this.value)"></div>` : '';
                return `
                    <div class="form-group"><label>${KALENDAR_EXTRA_LABELS[k]} (so'm/dona):</label><input type="number" min="0" value="${e.price || 0}" onchange="updKalendarExtraField(${idx},'${k}','price',this.value)"></div>
                    ${klisheField}`;
            }).join('') + `</div>`;

            return `
                <div class="add-pen-card" style="margin-bottom:14px; border:1px solid var(--border, #e2e8f0);">
                    <div class="add-pen-card-title" style="font-size:0.92rem;">${s.name}</div>
                    ${dimsHtml}
                    ${extrasHtml}
                </div>`;
        }).join('');
    }

    function updKalendarField(idx, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s) return;
        const numericFields = ['blockW', 'blockH', 'coverW', 'coverH', 'w', 'h', 'defaultBlockGsm', 'defaultCoverGsm', 'defaultGsm', 'defaultListCount', 'fixedListCount'];
        s[field] = numericFields.includes(field) ? (parseFloat(value) || 0) : value;
    }

    function updKalendarExtraField(idx, extraKey, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.extras || !s.extras[extraKey]) return;
        s.extras[extraKey][field] = parseFloat(value) || 0;
    }

    function updKalendarHardCoverField(idx, hIdx, field, value) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.hardCoverOptions || !s.hardCoverOptions[hIdx]) return;
        s.hardCoverOptions[hIdx][field] = (field === 'price') ? (parseFloat(value) || 0) : value;
    }

    function addKalendarHardCover(idx) {
        let s = kalendarConfig.subtypes[idx];
        if (!s) return;
        if (!s.hardCoverOptions) s.hardCoverOptions = [];
        s.hardCoverOptions.push({ key: 'variant_' + Date.now(), name: 'Yangi variant', price: 0 });
        renderAdminKalendarTables();
    }

    function removeKalendarHardCover(idx, hIdx) {
        let s = kalendarConfig.subtypes[idx];
        if (!s || !s.hardCoverOptions) return;
        if (s.hardCoverOptions.length <= 1) { showToast("⚠️ Kamida bitta qattiq muqova varianti qolishi kerak."); return; }
        s.hardCoverOptions.splice(hIdx, 1);
        renderAdminKalendarTables();
    }

    function saveKalendarConfig() {
        localStorage.setItem('erp_kalendar_config', JSON.stringify(kalendarConfig));
        if (typeof logAudit === 'function') {
            logAudit("Kalendar sozlamalari o'zgartirildi", `${kalendarConfig.subtypes.length} ta pastki tur yangilandi`);
        }
        showToast("💾 Kalendar sozlamalari saqlandi!");
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('kalendar');
