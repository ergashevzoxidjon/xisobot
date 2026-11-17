    let textileDatabase = {};
    let textileEditState = { materials: [], colors: [] };
    let selectedTextileMaterial = '';
    let selectedTextileColor = '';

    function txId(prefix) {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    }

    // Berilgan baza narxdan standart tiraj zinapoyasini yasaymiz
    function txDefaultTiers(base) {
        return [
            { from: 1, to: 10, mul: 1.00 },
            { from: 11, to: 50, mul: 0.92 },
            { from: 51, to: 100, mul: 0.85 },
            { from: 101, to: 200, mul: 0.79 },
            { from: 201, to: 500, mul: 0.74 },
            { from: 501, to: 0, mul: 0.70 }
        ].map(r => ({
            from: r.from, to: r.to,
            basePrice: Math.round(base * r.mul / 500) * 500,
            printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        }));
    }

    // ====================== DTF Pechat narxi (avtomatik, BARCHA tekstil turlariga umumiy) ======================
    // Mashina eni maksimal 58 sm bo'lgan rulon. Old va orqa tomon bo'laklari ALOHIDA-ALOHIDA emas,
    // BITTA umumiy rulonga birgalikda, eng optimal holda joylashtiriladi (kerak bo'lsa aylantirilib):
    // baland (uzun) bo'laklardan boshlab, bitta qatorga sig'guncha yonma-yon qo'yiladi (hatto old va
    // orqa bo'laklari aralash bo'lsa ham), sig'may qolgan bo'lak keyingi qatorga o'tadi. Shu tariqa
    // topilgan umumiy rulon uzunligi bo'yicha narx hisoblanadi: har 100 sm uchun rollPrice, umumiy
    // uzunlik 100 sm dan kichik bo'lsa ham eng kami rollPrice olinadi. Bosish (yopishtirish) mehnat
    // narxi alohida qo'shiladi. Taxi — umumiy (umumiy/yordamchi.js), jami summaga bir marta qo'shiladi.
    let textileDtfConfig = {
        rollWidthCm: 58,   // mashinaning maksimal eni — faqat ma'lumot/ogohlantirish uchun
        rollLengthCm: 100, // narx belgilangan bo'lak uzunligi (sm)
        rollPrice: 90000,  // shu uzunlikdagi (58x100 sm) DTF narxi, so'm — shu bilan birga eng kam summa
        gapCm: 0.5,        // qatorlar orasidagi masofa (5 mm), sm
        frontFee: 2000,    // bosish narxi — oldi tomon (so'm/dona)
        backFee: 5000,     // bosish narxi — orqa tomon (so'm/dona)
        kepkaFee: 1000     // kepkaga bosish narxi — tomon farqisiz, bitta flat summa (so'm/dona)
    };

    // Oxirgi hisoblangan umumiy (old+orqa birgalikdagi) joylashuv — "👁️ Joylashuvni ko'rish"
    // modali shundan o'qiydi.
    let lastTextileDtfLayout = null;

    // Old va orqa tomon bo'laklarini BITTA 58 sm enli rulonga birgalikda, eng optimal (2 o'lchamli)
    // joylashtirish. "MaxRects — Best Short Side Fit" algoritmi qo'llaniladi (2D bin-packing'da
    // sanoatda eng yaxshi natija beradigan usullardan biri, masalan o'yin tekstura-atlaslarini
    // joylashtirishda ishlatiladi): oddiy "qator-qator" yoki "guillotine" usullaridan farqli
    // o'laroq, bo'sh joylar QATTIQ bo'linmaydi — bo'lak qo'yilganda unga tegib turgan HAR BIR bo'sh
    // to'rtburchak qayta (kerak bo'lsa 4 qismga) bo'linadi, shu bilan hech qanday foydali bo'sh joy
    // yo'qolib qolmaydi. Bundan tashqari har bir bo'lak uchun yo'nalish (oddiy yoki aylantirilgan)
    // OLDINDAN qat'iy belgilanmaydi — har bir bo'lak joylashtirilayotganda, mavjud bo'sh joylarga
    // ENG YAXSHI mos keladigan yo'nalish (va joy) dinamik tanlanadi.
    function textilePackCombined(front, back, n, rollWidth, gapCm) {
        rollWidth = parseFloat(rollWidth) || 58;
        gapCm = parseFloat(gapCm) || 0;
        n = Math.max(1, parseInt(n) || 1);

        // Bitta turdagi bo'lak uchun ikkala mumkin bo'lgan yo'nalishni (oddiy va aylantirilgan)
        // qaytaradi — qaysi biri ishlatilishi har bir dona uchun alohida, joylashtirish vaqtida
        // hal qilinadi (pastga qarang).
        function orientations(x, y) {
            x = parseFloat(x) || 0; y = parseFloat(y) || 0;
            if (x <= 0 || y <= 0) return null;
            let opts = [{ w: x, h: y, rotated: false }, { w: y, h: x, rotated: true }];
            if (Math.abs(x - y) < 1e-9) opts = [opts[0]]; // kvadrat — ikkala yo'nalish bir xil
            opts.forEach(o => { o.fits = o.w <= rollWidth; });
            return opts;
        }

        let frontOpts = orientations(front && front.x, front && front.y);
        let backOpts = orientations(back && back.x, back && back.y);

        let items = [];
        if (frontOpts) for (let i = 0; i < n; i++) items.push({ type: 'front', options: frontOpts, sortKey: Math.max(frontOpts[0].w, frontOpts[0].h) });
        if (backOpts) for (let i = 0; i < n; i++) items.push({ type: 'back', options: backOpts, sortKey: Math.max(backOpts[0].w, backOpts[0].h) });

        if (items.length === 0) {
            return { items: [], totalLength: 0, pieceCount: 0, fitsAll: true, rollWidth, gapCm };
        }

        // Kattaroq bo'laklardan boshlaymiz — shunda avval "asosiy" joylashuv shakllanadi, keyin
        // kichikroq bo'laklar qolgan bo'sh joylarni (hattoki turli kattalikdagilarini ham) to'ldiradi.
        items.sort((a, b) => b.sortKey - a.sortKey);

        const BIG = items.reduce((s, it) => s + it.sortKey + gapCm, 0) + rollWidth + 1; // "cheksiz" balandlik o'rnini bosadi
        let freeRects = [{ x: 0, y: 0, w: rollWidth, h: BIG }];
        let maxBottom = 0;
        let anyDoesNotFit = false;

        // Bir-birini butunlay qamrab olgan (ortiqcha) bo'sh to'rtburchaklarni tozalaymiz —
        // ro'yxat shishib, sekinlashib ketmasligi uchun.
        function pruneContained() {
            for (let i = freeRects.length - 1; i >= 0; i--) {
                let a = freeRects[i];
                for (let j = 0; j < freeRects.length; j++) {
                    if (i === j) continue;
                    let b = freeRects[j];
                    if (a.x >= b.x - 0.001 && a.y >= b.y - 0.001 && a.x + a.w <= b.x + b.w + 0.001 && a.y + a.h <= b.y + b.h + 0.001) {
                        freeRects.splice(i, 1);
                        break;
                    }
                }
            }
        }

        items.forEach(item => {
            // Ikkala yo'nalish (oddiy/aylantirilgan) va BARCHA bo'sh joylar orasidan — "Best Short
            // Side Fit": joylashtirilgach ENG KAM qisqa tomon (va teng bo'lsa uzun tomon ham) bo'sh
            // qoladigan variant tanlanadi. Shu bilan bo'lak har doim eng "tor" mos keladigan joyga tushadi.
            let best = null;
            item.options.forEach(opt => {
                let needW = opt.w + gapCm, needH = opt.h + gapCm;
                freeRects.forEach((fr, idx) => {
                    if (needW <= fr.w + 0.001 && needH <= fr.h + 0.001) {
                        let leftoverW = fr.w - needW, leftoverH = fr.h - needH;
                        let shortSide = Math.min(leftoverW, leftoverH), longSide = Math.max(leftoverW, leftoverH);
                        if (!best || shortSide < best.shortSide - 0.001 ||
                            (Math.abs(shortSide - best.shortSide) <= 0.001 && longSide < best.longSide)) {
                            best = { idx, opt, shortSide, longSide };
                        }
                    }
                });
            });

            let x, y, w, h, rotated, fits, needW, needH;
            if (best) {
                let fr = freeRects[best.idx];
                x = fr.x; y = fr.y; w = best.opt.w; h = best.opt.h; rotated = best.opt.rotated; fits = true;
                needW = w + gapCm; needH = h + gapCm;
            } else {
                // Bo'lak ikkala yo'nalishda ham hech qayerga sig'madi (masalan rulon enidan katta) —
                // pastga, alohida joy sifatida qo'yamiz; ogohlantirish fitsAll orqali chiqadi.
                let opt = item.options[0];
                x = 0; y = maxBottom; w = opt.w; h = opt.h; rotated = opt.rotated; fits = false;
                needW = w + gapCm; needH = h + gapCm;
                anyDoesNotFit = true;
            }

            item.x = x; item.y = y; item.w = w; item.h = h; item.rotated = rotated; item.fits = fits;
            maxBottom = Math.max(maxBottom, y + h);

            // Joylashtirilgan bo'lak bilan kesishgan HAR BIR bo'sh to'rtburchakni (nafaqat
            // ishlatilganini) qolgan qismlariga bo'lib qayta hosil qilamiz.
            let ix1 = x, iy1 = y, ix2 = x + needW, iy2 = y + needH;
            let next = [];
            freeRects.forEach(fr => {
                let fx1 = fr.x, fy1 = fr.y, fx2 = fr.x + fr.w, fy2 = fr.y + fr.h;
                let overlaps = ix1 < fx2 - 0.001 && fx1 < ix2 - 0.001 && iy1 < fy2 - 0.001 && fy1 < iy2 - 0.001;
                if (!overlaps) { next.push(fr); return; }
                if (fx1 < ix1) next.push({ x: fx1, y: fy1, w: ix1 - fx1, h: fr.h });
                if (fx2 > ix2) next.push({ x: ix2, y: fy1, w: fx2 - ix2, h: fr.h });
                if (fy1 < iy1) next.push({ x: fx1, y: fy1, w: fr.w, h: iy1 - fy1 });
                if (fy2 > iy2) next.push({ x: fx1, y: iy2, w: fr.w, h: fy2 - iy2 });
            });
            freeRects = next.filter(r => r.w > 0.01 && r.h > 0.01);
            pruneContained();
        });

        let totalLength = maxBottom;
        let fitsAll = !anyDoesNotFit;

        return { items, totalLength, pieceCount: items.length, fitsAll, rollWidth, gapCm };
    }

    // Butun buyurtma uchun umumiy DTF (rulon material) xarajati. Old va orqa tomon bo'laklari
    // textilePackCombined() orqali BITTA rulonga birgalikda joylashtirilib, shu umumiy uzunlik
    // bo'yicha narx hisoblanadi: har 100 sm uchun rollPrice, umumiy uzunlik 100 sm dan kam
    // bo'lsa ham eng kami rollPrice olinadi.
    function textileDtfTotal(front, back, qty, cfg) {
        cfg = cfg || textileDtfConfig;
        let n = Math.max(1, parseInt(qty) || 1);
        let rollWidth = parseFloat(cfg.rollWidthCm) || 58;
        let gapCm = parseFloat(cfg.gapCm) || 0;

        let layout = textilePackCombined(front, back, n, rollWidth, gapCm);

        if (layout.pieceCount === 0) {
            return { cost: 0, totalLength: 0, pieceCount: 0, minQollandi: false, layout: null };
        }

        let pricePerCm = (parseFloat(cfg.rollPrice) || 0) / (parseFloat(cfg.rollLengthCm) || 100);
        let raw = layout.totalLength * pricePerCm;
        let minPrice = parseFloat(cfg.rollPrice) || 0;
        let minQollandi = raw < minPrice;
        return {
            cost: Math.round(minQollandi ? minPrice : raw),
            totalLength: layout.totalLength, pieceCount: layout.pieceCount, minQollandi, layout
        };
    }

    // Bosish (DTF yopishtirish) mehnat narxi — DONA boshiga, tomon(lar)ga qarab.
    // Kepka boshqacha: tomon farqisiz bitta flat summa.
    function textileBosishNarxi(productKey, front, back, cfg) {
        cfg = cfg || textileDtfConfig;
        let frontActive = (parseFloat(front && front.x) > 0) && (parseFloat(front && front.y) > 0);
        let backActive = (parseFloat(back && back.x) > 0) && (parseFloat(back && back.y) > 0);
        if (!frontActive && !backActive) return 0;
        if (productKey === 'kepka') return parseFloat(cfg.kepkaFee) || 0;
        return (frontActive ? (parseFloat(cfg.frontFee) || 0) : 0) + (backActive ? (parseFloat(cfg.backFee) || 0) : 0);
    }

    // ====================== DTF rulonga joylashuv sxemasi (modal) ======================
    // "👁️" tugmasi bosilganda — oxirgi hisoblangan umumiy joylashuv (lastTextileDtfLayout) asosida
    // rulonni va unga terilgan bo'laklarni (old va orqa BITTA sxemada, rangi bilan ajratilgan)
    // sxematik SVG rasm ko'rinishida chizib, modalda ko'rsatadi.
    function buildDtfLayoutSvg(layout) {
        const maxW = 300; // px — rulon enini shu kenglikka moslab masshtablaymiz
        let scale = maxW / layout.rollWidth;
        let svgW = layout.rollWidth * scale;
        let svgH = Math.max(50, layout.totalLength * scale);
        let colors = { front: 'var(--primary)', back: 'var(--magenta)' };

        let rects = '';
        layout.items.forEach((it, idx) => {
            let x = it.x * scale, y = it.y * scale, w = it.w * scale, h = it.h * scale;
            let color = colors[it.type] || 'var(--primary)';
            rects += `<rect x="${(x + 1).toFixed(1)}" y="${(y + 1).toFixed(1)}" width="${Math.max(0, w - 2).toFixed(1)}" height="${Math.max(0, h - 2).toFixed(1)}" rx="3" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1.5"/>`;
            rects += `<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2).toFixed(1)}" font-size="9" text-anchor="middle" dominant-baseline="middle" fill="var(--ink)">${idx + 1}</text>`;
        });

        return `<svg viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}" width="100%" style="max-width:${maxW}px; display:block; background:#fff; border:2px solid var(--ink); border-radius:6px;">
            ${rects}
        </svg>`;
    }

    function showDtfLayoutModal() {
        let layout = lastTextileDtfLayout;
        let overlay = document.getElementById('dtfLayoutOverlay');
        let body = document.getElementById('dtfLayoutModalBody');
        let title = document.getElementById('dtfLayoutModalTitle');
        if (!overlay || !body) return;
        if (!layout || layout.pieceCount === 0) { showToast("⚠️ Hech qanday tomonga pechat kiritilmagan."); return; }

        title.innerText = "Rulonga joylashuvi (old + orqa)";
        let hasFront = layout.items.some(it => it.type === 'front');
        let hasBack = layout.items.some(it => it.type === 'back');
        let legend = (hasFront && hasBack) ? `
            <div style="display:flex; gap:14px; margin-bottom:10px; font-size:0.78rem;">
                <span><span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:2px;margin-right:4px;"></span>Old tomon</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:var(--magenta);border-radius:2px;margin-right:4px;"></span>Orqa tomon</span>
            </div>` : '';

        body.innerHTML = `
            <div class="dtf-layout-info">
                Rulon eni: <strong>${layout.rollWidth} sm</strong><br>
                Jami dona: <strong>${layout.pieceCount}</strong> | Sarflangan rulon uzunligi: <strong>${layout.totalLength.toFixed(1)} sm</strong>
                ${!layout.fitsAll ? `<br><span style="color:#dc2626;">⚠️ Ba'zi bo'laklar mashina eniga (${layout.rollWidth} sm) sig'maydi!</span>` : ''}
            </div>
            ${legend}
            <div class="dtf-layout-svg-wrap">${buildDtfLayoutSvg(layout)}</div>
        `;
        overlay.classList.add('open');
    }

    function closeDtfLayoutModal() {
        let overlay = document.getElementById('dtfLayoutOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function renderTextileDtfConfigAdmin() {
        let ids = {
            rollWidthCm: 'txDtfRollWidth', rollLengthCm: 'txDtfRollLength', rollPrice: 'txDtfRollPrice',
            gapCm: 'txDtfGap', frontFee: 'txDtfFrontFee', backFee: 'txDtfBackFee',
            kepkaFee: 'txDtfKepkaFee'
        };
        Object.keys(ids).forEach(k => {
            let el = document.getElementById(ids[k]);
            if (el) el.value = textileDtfConfig[k];
        });
    }

    function saveTextileDtfConfig() {
        let get = (id, fallback) => {
            let el = document.getElementById(id);
            let v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fallback : v;
        };
        let cfg = {
            rollWidthCm: get('txDtfRollWidth', 58),
            rollLengthCm: get('txDtfRollLength', 100),
            rollPrice: get('txDtfRollPrice', 0),
            gapCm: get('txDtfGap', 0),
            frontFee: get('txDtfFrontFee', 0),
            backFee: get('txDtfBackFee', 0),
            kepkaFee: get('txDtfKepkaFee', 0)
        };
        if (cfg.rollLengthCm <= 0) {
            showToast("⚠️ Bo'lak uzunligi 0 dan katta bo'lishi kerak!");
            return;
        }
        if (cfg.rollWidthCm <= 0) {
            showToast("⚠️ Mashina eni 0 dan katta bo'lishi kerak!");
            return;
        }
        textileDtfConfig = cfg;
        localStorage.setItem('erp_textile_dtf_config', JSON.stringify(textileDtfConfig));
        if (typeof logAudit === 'function') {
            logAudit("Textile DTF narxi o'zgartirildi",
                `Rulon: ${cfg.rollPrice.toLocaleString()} so'm / ${cfg.rollLengthCm}sm`);
        }
        showToast("💾 DTF sozlamalari saqlandi!");
    }

    function getDefaultTextileDb() {
        const db = {};
        textileKeys.forEach(key => {
            if (key === 'bayroqlar') return; // o'z alohida bazasiga (bayroqDatabase) ega, material/rang dvigatelini ishlatmaydi
            let base = defaultPrices[key] || 45000;
            db[key] = {
                materials: [
                    { id: txId('MAT'), name: 'Paxta 100% (standart)', tiers: txDefaultTiers(base) },
                    { id: txId('MAT'), name: 'Paxta/Polyester (peniye)', tiers: txDefaultTiers(base * 1.15) },
                    { id: txId('MAT'), name: 'Polyester (sport)', tiers: txDefaultTiers(base * 0.9) }
                ],
                // Rang — doimiy ustama sifatida qo'shiladi (tirajdan qat'iy nazar bir xil).
                // Standart ranglar 0, qiyin ranglar qimmatroq.
                colors: [
                    { id: txId('CLR'), name: 'Oq', hex: '#ffffff', surcharge: 0 },
                    { id: txId('CLR'), name: 'Qora', hex: '#111827', surcharge: 5000 },
                    { id: txId('CLR'), name: "Ko'k", hex: '#1d4ed8', surcharge: 3000 },
                    { id: txId('CLR'), name: 'Qizil', hex: '#dc2626', surcharge: 3000 }
                ]
            };
        });
        return db;
    }
    // (Eslatma: DTF pechat narxi endi bu yerda emas — textileDtfConfig orqali BARCHA turlarga umumiy.)

    function normalizeTextileItem(it, prefix) {
        it = it || {};
        return {
            id: it.id || txId(prefix),
            name: (it.name || '').toString(),
            hex: (it.hex || '#94a3b8').toString(),
            tiers: normalizeTierList(it.tiers)
        };
    }

    // Ranglar endi tirajga bog'liq oraliqlar jadvaliga ega emas — har biri BITTA doimiy
    // ustama (so'm) qiymatiga ega. Eski (tiraj-jadvalli) ma'lumotdan migratsiya: birinchi
    // oraliqning narxini doimiy ustama sifatida olamiz, shunda mavjud narxlar yo'qolib qolmaydi.
    function normalizeTextileColor(c) {
        c = c || {};
        let surcharge;
        if (typeof c.surcharge === 'number' || typeof c.surcharge === 'string') {
            surcharge = parseFloat(c.surcharge) || 0;
        } else if (Array.isArray(c.tiers) && c.tiers.length > 0) {
            let first = normalizeTierList(c.tiers)[0];
            surcharge = first ? (parseFloat(first.basePrice) || 0) : 0;
        } else {
            surcharge = 0;
        }
        return {
            id: c.id || txId('CLR'),
            name: (c.name || '').toString(),
            hex: (c.hex || '#94a3b8').toString(),
            surcharge
        };
    }

    function getTextileConfig(key) {
        let cfg = textileDatabase[key] || {};
        return {
            materials: (cfg.materials || []).map(m => normalizeTextileItem(m, 'MAT')),
            colors: (cfg.colors || []).map(normalizeTextileColor)
        };
    }

    // Material uchun berilgan tirajdagi narxi (materiallar hamon tiraj bo'yicha oraliqlarga ega)
    function textileItemPrice(item, qty) {
        if (!item) return 0;
        let t = findTierForQty(item.tiers, qty);
        return t ? t.basePrice : 0;
    }

    // Rang ustamasi — doimiy, tirajga bog'liq emas
    function textileColorSurcharge(color) {
        return color ? (parseFloat(color.surcharge) || 0) : 0;
    }

    // --- Admin muharriri ---

    function loadTextileEditState(key) {
        let cfg = getTextileConfig(key);
        textileEditState = {
            materials: JSON.parse(JSON.stringify(cfg.materials)),
            colors: JSON.parse(JSON.stringify(cfg.colors))
        };
        renderTextileEditor('materials');
        renderTextileEditor('colors');
        renderTextileDtfConfigAdmin();
    }

    function textileEditorContainer(kind) {
        return document.getElementById(kind === 'materials' ? 'textileMaterialsEditor' : 'textileColorsEditor');
    }

    function renderTextileEditor(kind) {
        if (kind === 'colors') { renderTextileColorsEditor(); return; }
        const box = textileEditorContainer(kind);
        if (!box) return;
        const list = textileEditState[kind] || [];

        if (list.length === 0) {
            box.innerHTML = `<div class="tx-empty">Hali qo'shilmagan. Pastdagi tugmani bosing.</div>`;
            return;
        }

        box.innerHTML = list.map((it, i) => `
            <div class="tx-item">
                <div class="tx-item-head">
                    <div class="form-group">
                        <label>Material nomi:</label>
                        <input type="text" value="${(it.name || '').replace(/"/g, '&quot;')}" placeholder="Masalan: Paxta 100%"
                               oninput="updateTextileItemName('${kind}', ${i}, this.value)">
                    </div>
                    <div class="tx-item-actions">
                        <button type="button" class="tx-btn" onclick="addTextileTier('${kind}', ${i})">+ Oraliq</button>
                        <button type="button" class="tx-btn" onclick="fillTextileDefaultTiers('${kind}', ${i})">⚡ Namuna oraliqlar</button>
                        <button type="button" class="tx-btn danger" onclick="removeTextileItem('${kind}', ${i})">🗑️ O'chirish</button>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="tier-table">
                        <thead><tr>
                            <th style="width:90px;">Dan (dona)</th>
                            <th style="width:90px;">Gacha</th>
                            <th style="width:140px;">Narxi (so'm)</th>
                            <th style="width:70px;"></th>
                        </tr></thead>
                        <tbody>
                            ${(it.tiers || []).length === 0
                                ? `<tr><td colspan="4" style="padding:10px 4px; color:#b45309; font-size:0.8rem;">Oraliq yo'q — narx 0 bo'lib qoladi. "+ Oraliq" tugmasini bosing.</td></tr>`
                                : it.tiers.map((t, ti) => `
                                    <tr>
                                        <td><input type="number" min="1" value="${t.from}" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'from', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.to}" placeholder="∞" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'to', this.value)"></td>
                                        <td><input type="number" min="0" value="${t.basePrice}" oninput="updateTextileTier('${kind}', ${i}, ${ti}, 'basePrice', this.value)"></td>
                                        <td><button type="button" class="tier-remove" onclick="removeTextileTier('${kind}', ${i}, ${ti})">✕</button></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
                ${(() => {
                    let msgs = tierValidationMessages(it.tiers);
                    return msgs.length === 0 ? '' : `<div class="tier-warning">⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}</div>`;
                })()}
            </div>
        `).join('');
    }

    // Ranglar — kompakt bitta qatorli ko'rinish: tusi, nomi va DOIMIY ustama (bitta son), tiraj
    // jadvali yo'q. Har bir mahsulotda odatda 3-7 ta rang bo'ladi — shuning uchun bu ancha
    // ixchamroq va qulayroq, avvalgi (har birida 6 qatorli to'liq jadval) ko'rinishga qaraganda.
    function renderTextileColorsEditor() {
        const box = textileEditorContainer('colors');
        if (!box) return;
        const list = textileEditState.colors || [];

        if (list.length === 0) {
            box.innerHTML = `<div class="tx-empty">Hali qo'shilmagan. Pastdagi tugmani bosing.</div>`;
            return;
        }

        box.innerHTML = list.map((it, i) => `
            <div class="tx-color-row">
                <input type="color" class="tx-color-row-swatch" value="${it.hex || '#94a3b8'}" oninput="updateTextileItemHex(${i}, this.value)">
                <div class="form-group tx-color-row-name">
                    <label>Rang nomi</label>
                    <input type="text" value="${(it.name || '').replace(/"/g, '&quot;')}" placeholder="Masalan: Qora"
                           oninput="updateTextileItemName('colors', ${i}, this.value)">
                </div>
                <div class="form-group tx-color-row-surcharge">
                    <label>Ustama (so'm)</label>
                    <input type="number" min="0" value="${parseFloat(it.surcharge) || 0}" placeholder="0"
                           oninput="updateTextileColorSurcharge(${i}, this.value)">
                </div>
                <button type="button" class="tx-btn danger" onclick="removeTextileItem('colors', ${i})">🗑️</button>
            </div>
        `).join('');
    }

    function updateTextileColorSurcharge(idx, value) {
        if (!textileEditState.colors[idx]) return;
        textileEditState.colors[idx].surcharge = parseFloat(value) || 0;
    }

    function addTextileItem(kind) {
        let isColor = (kind === 'colors');
        if (isColor) {
            textileEditState.colors.push({ id: txId('CLR'), name: '', hex: '#94a3b8', surcharge: 0 });
        } else {
            let base = defaultPrices[currentManagingProduct] || 45000;
            textileEditState.materials.push({ id: txId('MAT'), name: '', tiers: txDefaultTiers(base) });
        }
        renderTextileEditor(kind);
    }

    function updateTextileItemHex(idx, value) {
        if (!textileEditState.colors[idx]) return;
        textileEditState.colors[idx].hex = value;
    }

    function removeTextileItem(kind, idx) {
        let it = textileEditState[kind][idx];
        if (it && !confirm(`"${it.name || 'Nomsiz'}" o'chirilsinmi?`)) return;
        textileEditState[kind].splice(idx, 1);
        renderTextileEditor(kind);
    }

    function updateTextileItemName(kind, idx, value) {
        if (!textileEditState[kind][idx]) return;
        textileEditState[kind][idx].name = value;
    }

    function addTextileTier(kind, idx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        let sorted = normalizeTierList(it.tiers);
        let last = sorted.slice(-1)[0];
        it.tiers = sorted;
        it.tiers.push({
            from: last ? (tierUpper(last) === Infinity ? last.from + 1 : tierUpper(last) + 1) : 1,
            to: 0,
            basePrice: last ? last.basePrice : 0,
            printPrices: { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        });
        renderTextileEditor(kind);
    }

    function removeTextileTier(kind, idx, tIdx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        it.tiers.splice(tIdx, 1);
        renderTextileEditor(kind);
    }

    function updateTextileTier(kind, idx, tIdx, field, value) {
        let it = textileEditState[kind][idx];
        if (!it || !it.tiers[tIdx]) return;
        it.tiers[tIdx][field] = (field === 'basePrice') ? (parseFloat(value) || 0) : (parseInt(value) || 0);
        // Faqat ogohlantirishlarni yangilaymiz — butun jadvalni qayta chizsak, kursor sakraydi
        renderTextileWarningsOnly(kind, idx);
    }

    function renderTextileWarningsOnly(kind, idx) {
        const box = textileEditorContainer(kind);
        if (!box) return;
        const card = box.querySelectorAll('.tx-item')[idx];
        if (!card) return;
        let old = card.querySelector('.tier-warning');
        let msgs = tierValidationMessages(textileEditState[kind][idx].tiers);
        if (old) old.remove();
        if (msgs.length > 0) {
            let div = document.createElement('div');
            div.className = 'tier-warning';
            div.innerHTML = `⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}`;
            card.appendChild(div);
        }
    }

    // Faqat materiallar uchun ishlatiladi (ranglarda endi oraliq jadvali yo'q)
    function fillTextileDefaultTiers(kind, idx) {
        let it = textileEditState[kind][idx];
        if (!it) return;
        if ((it.tiers || []).length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;
        let first = normalizeTierList(it.tiers)[0];
        let base = first ? first.basePrice : (defaultPrices[currentManagingProduct] || 45000);
        it.tiers = txDefaultTiers(base);
        renderTextileEditor(kind);
    }

    function saveTextileConfig() {
        if (!currentManagingProduct) return;

        for (let it of textileEditState.materials) {
            if (!it.name || !it.name.trim()) {
                showToast("⚠️ Har bir materialning nomi bo'lishi kerak!");
                return;
            }
            if (normalizeTierList(it.tiers).length === 0) {
                showToast(`⚠️ "${it.name}" uchun kamida bitta oraliq kiriting!`);
                return;
            }
        }
        for (let it of textileEditState.colors) {
            if (!it.name || !it.name.trim()) {
                showToast("⚠️ Har bir rangning nomi bo'lishi kerak!");
                return;
            }
        }
        if (textileEditState.materials.length === 0) {
            showToast("⚠️ Kamida bitta material qo'shing!");
            return;
        }
        textileDatabase[currentManagingProduct] = {
            materials: textileEditState.materials.map(m => normalizeTextileItem(m, 'MAT')),
            colors: textileEditState.colors.map(normalizeTextileColor)
        };
        localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));
        if (typeof logAudit === 'function') logAudit("Textile narxlari o'zgartirildi", `Mahsulot: ${currentManagingProduct}`);
        loadTextileEditState(currentManagingProduct);
        showToast("💾 Textile sozlamalari saqlandi!");
    }

    // --- Kalkulyator uchun jadval ko'rinishi ---
    // Material va o'lchamlarning oraliq chegaralari har xil bo'lishi mumkin,
    // shuning uchun barcha chegaralarni birlashtirib chiqaramiz.
    function renderTextileTierPreview(mat, color, front, back, qty, marginPercent) {
        const box = document.getElementById('tierPreviewBox');
        if (!box) return;

        // Material oraliq chegaralari asosida jadval qatorlari chiqariladi. DTF narxi
        // endi tirajga qarab uzluksiz o'zgaradi (umumiy summa dona soniga bo'linadi), shuning
        // uchun ular alohida "nuqta" qo'shmaydi — faqat unitAt(t) ichida hisoblab chiqiladi.
        // Rang doimiy ustama (tirajga bog'liq emas), shuning uchun bu yerga kirmaydi.
        let points = new Set();
        [mat].filter(Boolean).forEach(it => normalizeTierList(it.tiers).forEach(t => points.add(t.from)));

        let sorted = [...points].sort((a, b) => a - b);
        if (sorted.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

        let m = 1 + ((parseFloat(marginPercent) || 0) / 100);
        let n = parseInt(qty) || 1;
        let colorSurcharge = textileColorSurcharge(color);
        let bosishPerUnit = textileBosishNarxi(activeProductType, front, back, textileDtfConfig);

        const unitAt = (t) => {
            let dtfRes = textileDtfTotal(front, back, t, textileDtfConfig);
            return Math.round((
                textileItemPrice(mat, t) +
                colorSurcharge +
                bosishPerUnit +
                (dtfRes.cost / t)
            ) * m);
        };

        box.style.display = 'block';
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted);">Material, rang va pechat narxi birgalikda hisoblangan.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th><th style="text-align:right;">Eng kam miqdorda jami</th></tr></thead>
                <tbody>
                    ${sorted.map((from, i) => {
                        let to = (i < sorted.length - 1) ? sorted[i + 1] - 1 : 0;
                        let unit = unitAt(from);
                        let isActive = n >= from && (to === 0 || n <= to);
                        return `
                            <tr class="${isActive ? 'tier-active' : ''}">
                                <td>${tierLabel({ from, to })}${isActive ? ' ✓' : ''}</td>
                                <td style="text-align:right;">${unit.toLocaleString()} so'm</td>
                                <td style="text-align:right;">${(unit * from).toLocaleString()} so'm</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // --- Kalkulyatordagi material / rang tugmachalari ---

    function renderTextilePickers(type) {
        let cfg = getTextileConfig(type);

        const matBox = document.getElementById('textileMaterialButtons');
        if (matBox) {
            if (!cfg.materials.some(m => m.id === selectedTextileMaterial)) {
                selectedTextileMaterial = cfg.materials[0] ? cfg.materials[0].id : '';
            }
            matBox.innerHTML = cfg.materials.length === 0
                ? `<span class="tx-empty">Admin panelda material qo'shilmagan.</span>`
                : cfg.materials.map(m => `
                    <button type="button" class="color-swatch-btn ${selectedTextileMaterial === m.id ? 'active' : ''}"
                            style="padding:6px 14px;" onclick="selectTextileMaterial('${m.id}')">${m.name}</button>
                `).join('');
        }

        const colorGroup = document.getElementById('textileColorGroup');
        const colorBox = document.getElementById('textileColorButtons');
        if (colorGroup && colorBox) {
            if (cfg.colors.length === 0) {
                colorGroup.style.display = 'none';
                selectedTextileColor = '';
            } else {
                colorGroup.style.display = 'flex';
                if (!cfg.colors.some(c => c.id === selectedTextileColor)) {
                    selectedTextileColor = cfg.colors[0].id;
                }
                colorBox.innerHTML = cfg.colors.map(c => `
                    <button type="button" class="color-swatch-btn ${selectedTextileColor === c.id ? 'active' : ''}"
                            onclick="selectTextileColor('${c.id}')" title="${c.name}">
                        <span class="color-swatch-dot" style="background:${c.hex};"></span>
                        <span>${c.name}</span>
                    </button>
                `).join('');
            }
        }

        calculate();
    }

    function selectTextileMaterial(id) {
        selectedTextileMaterial = id;
        renderTextilePickers(activeProductType);
    }

    function selectTextileColor(id) {
        selectedTextileColor = id;
        renderTextilePickers(activeProductType);
    }

    // Admin ro'yxatida chop narxini "eng qimmatdan → eng arzongacha" ko'rinishida chiqaramiz

// Kepka va Shoper — faqat OLD tomonga pechat tushadi (kepkaning old qismi, shoperning old yuzasi);
// orqa tomon bu mahsulotlarda amalda ishlatilmaydi, shuning uchun ularga orqa tomon o'lcham
// maydoni umuman ko'rsatilmaydi.
const textileSingleSidedTypes = ['kepka', 'shoper', 'sumka'];

function generateFormHtml_textile(type) {
    let html = '';
            let txCfg = getTextileConfig(type);
            selectedTextileMaterial = txCfg.materials[0] ? txCfg.materials[0].id : '';
            selectedTextileColor = txCfg.colors[0] ? txCfg.colors[0].id : '';
            let singleSided = textileSingleSidedTypes.includes(type);

            html = `
                <div class="form-group" style="margin-bottom:14px;">
                    <label>Material (mato turi):</label>
                    <div class="tx-pick-row" id="textileMaterialButtons"></div>
                </div>
                <div class="form-group" style="margin-bottom:14px;" id="textileColorGroup">
                    <label>Mato rangi:</label>
                    <div class="tx-pick-row" id="textileColorButtons"></div>
                </div>

                <div class="price-size-box" style="margin-bottom:14px;">
                    <div class="price-size-title">🖨️ ${singleSided ? 'Pechat o\'lchami' : 'Old tomon pechati'} (sm)</div>
                    <div class="tx-xy-row">
                        <div class="form-group">
                            <label>Eni (X):</label>
                            <input type="number" id="inpFrontX" value="20" min="0" step="0.5" oninput="calculate()" onchange="calculate()" onkeyup="calculate()">
                        </div>
                        <span class="tx-xy-sep">×</span>
                        <div class="form-group">
                            <label>Bo'yi (Y):</label>
                            <input type="number" id="inpFrontY" value="25" min="0" step="0.5" oninput="calculate()" onchange="calculate()" onkeyup="calculate()">
                        </div>
                        <div class="tx-area-info" id="frontAreaInfo"></div>
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">Mashina eni max 58 sm — bo'laklar rulonga eng optimal (kerak bo'lsa aylantirilgan) holda joylashtiriladi.</div>
                </div>

                ${singleSided ? '' : `
                <div class="price-size-box" style="margin-bottom:14px;">
                    <div class="price-size-title">🖨️ Orqa tomon pechati (sm)</div>
                    <div class="tx-xy-row">
                        <div class="form-group">
                            <label>Eni (X):</label>
                            <input type="number" id="inpBackX" value="0" min="0" step="0.5" oninput="calculate()" onchange="calculate()" onkeyup="calculate()">
                        </div>
                        <span class="tx-xy-sep">×</span>
                        <div class="form-group">
                            <label>Bo'yi (Y):</label>
                            <input type="number" id="inpBackY" value="0" min="0" step="0.5" oninput="calculate()" onchange="calculate()" onkeyup="calculate()">
                        </div>
                        <div class="tx-area-info" id="backAreaInfo"></div>
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-muted); margin-top:8px;">0 qoldirsangiz — orqa tomonga pechat qilinmaydi. Mashina eni max 58 sm — bo'laklar rulonga eng optimal (kerak bo'lsa aylantirilgan) holda joylashtiriladi.</div>
                </div>
                `}

                <div class="price-size-box" style="margin-bottom:14px;">
                    <div class="price-size-title">🧵 Rulonga joylashtirish${singleSided ? '' : ' (old + orqa birga)'}</div>
                    <div id="dtfCombinedInfo" style="font-size:0.85rem; color:var(--text-main);"></div>
                </div>

                <div class="form-group">
                    <label>Adad (dona):</label>
                    <input type="number" id="inpQuantity" value="10" min="1" oninput="calculate()">
                </div>
            `;

    return html;
}

function calculateResult_textile(activeProductTypeParam, qty, marginPercent) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;
                let cfg = getTextileConfig(activeProductType);
                let mat = cfg.materials.find(m => m.id === selectedTextileMaterial) || cfg.materials[0] || null;
                let color = cfg.colors.find(c => c.id === selectedTextileColor) || null;

                let front = {
                    x: parseFloat(document.getElementById('inpFrontX')?.value) || 0,
                    y: parseFloat(document.getElementById('inpFrontY')?.value) || 0
                };
                let back = {
                    x: parseFloat(document.getElementById('inpBackX')?.value) || 0,
                    y: parseFloat(document.getElementById('inpBackY')?.value) || 0
                };

                let n = Math.max(1, parseInt(qty) || 1);
                let matCost = textileItemPrice(mat, qty);
                let colorCost = textileColorSurcharge(color);
                let dtfRes = textileDtfTotal(front, back, n, textileDtfConfig);
                let bosishPerUnit = textileBosishNarxi(activeProductType, front, back, textileDtfConfig);
                let dtfPerUnit = dtfRes.cost / n;
                // Taxi bu yerda emas — umumiy taxi core.js → calculateIchki() da jami summaga qo'shiladi
                baseUnitPrice = matCost + colorCost + bosishPerUnit + dtfPerUnit;

                // Old/orqa maydonlari ostida faqat oddiy holat ko'rsatiladi — qatorlar/joylashuv
                // endi ALOHIDA emas, old+orqa BIRGALIKDA bitta rulonga joylashtirilgani uchun,
                // umumiy natija pastdagi "Rulonga joylashtirish" qutisida, bitta "👁️" tugmasi bilan chiqadi.
                lastTextileDtfLayout = dtfRes.layout;
                const yozMaydon = (elId, active) => {
                    let el = document.getElementById(elId);
                    if (!el) return;
                    el.innerHTML = active
                        ? `<span style="color:var(--text-main);">✓ pechat qilinadi</span>`
                        : `<span style="color:var(--text-muted);">Pechatsiz</span>`;
                };
                yozMaydon('frontAreaInfo', front.x > 0 && front.y > 0);
                yozMaydon('backAreaInfo', back.x > 0 && back.y > 0);

                const combinedEl = document.getElementById('dtfCombinedInfo');
                if (combinedEl) {
                    if (!dtfRes.layout || dtfRes.layout.pieceCount === 0) {
                        combinedEl.innerHTML = `<span style="color:var(--text-muted);">Pechat kiritilmagan</span>`;
                    } else {
                        let warn = dtfRes.layout.fitsAll ? '' : ` <span style="color:#dc2626;">(⚠️ ba'zi bo'laklar mashina eniga sig'maydi!)</span>`;
                        combinedEl.innerHTML = `${dtfRes.layout.pieceCount} dona jami → ${dtfRes.totalLength.toFixed(1)} sm rulon${warn}`
                            + ` <button type="button" class="dtf-eye-btn" title="Rulonga joylashuvni ko'rish" onclick="showDtfLayoutModal()">👁️</button>`;
                    }
                }

                let parts = [mat ? mat.name : 'Material tanlanmagan'];
                if (color) parts.push(`Rang: ${color.name}`);
                parts.push(front.x * front.y > 0 ? `Oldi: ${front.x}×${front.y} sm` : 'Oldi: pechatsiz');
                parts.push(back.x * back.y > 0 ? `Orqa: ${back.x}×${back.y} sm` : 'Orqa: pechatsiz');
                if (dtfRes.pieceCount > 0) {
                    parts.push(`DTF: ${dtfRes.cost.toLocaleString()} so'm${dtfRes.minQollandi ? ' (eng kam)' : ''} / ${n} donaga bo'lingan (${dtfRes.totalLength.toFixed(1)} sm rulon)`);
                }
                if (bosishPerUnit > 0) parts.push(`Bosish: ${bosishPerUnit.toLocaleString()} so'm/dona`);
                let activeT = mat ? findTierForQty(mat.tiers, qty) : null;
                if (activeT) parts.push(`Oraliq: ${tierLabel(activeT)}`);
                details = parts.join(' | ');

                renderTextileTierPreview(mat, color, front, back, qty, marginPercent);

    return { details, baseUnitPrice };
}

// ====================== BAYROQLAR (Flags) ======================
// Bu Tekstil bo'limidagi boshqa turlardan (futbolka/kepka/...) TUBDAN farqli, alohida, soddaroq
// dvigatel: mahsulotlar (rasm+narx) ro'yxati. Taxi — umumiy (umumiy/yordamchi.js), boshqa
// mahsulotlardagi kabi jami summaga bir marta qo'shiladi. Material/rang tanlovi yo'q,
// miqdor bo'yicha alohida chegirma zinapoyasi ham yo'q — chunki manba jadvalda (Google Sheets
// "Bayroqlar" varag'i) bunday narsalar yo'q edi.
//
// Formula manba jadvaldan aniq chiqarilgan (bir nechta qatorda tekshirilgan):
//   Narxi (dona) = Bayroq narxi × Marja;  Jami = Narxi × Soni + Taxi × Marja (umumiy taxi)
function bqId() { return 'BQ-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

// Nomlar — mijozning haqiqiy texnik xususiyatlari (o'lcham, mato, pechat turi va h.k.) bo'lgani
// uchun manba jadvaldan VERBATIM (originaldagidek, rus tilida) olingan — tarjima yoki
// qisqartirish xatolik kiritishi mumkin.
function getDefaultBayroqDatabase() {
    return [
        { id: bqId(), price: 1600000, imageUrl: '', name: "Флаг кабинетный пластиковой покрытием:\nРазмер флага: 1,20х2,20 м\nТкань флага: Атлас (сатин)\nПечать изображения: 2 х слоёная\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота стойки: 2.80 м (металлический золотистый)" },
        { id: bqId(), price: 500000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,60х2,20 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 2.50 м" },
        { id: bqId(), price: 650000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,70х3,00 м, 0,70х2,70 м\nТкань флага: Полиэстер 135гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкции: 3.40 м, 3.00 м" },
        { id: bqId(), price: 750000, imageUrl: '', name: "Флаг Парус уличный с конструкций «Г»\nРазмер флага: 0,80х3,00 м\nТкань флага: Полиэстер 200гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 3.40 м (Made in China)" },
        { id: bqId(), price: 500000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,70х2,70 м, 0,60х2,20 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 3.00 м, 2.50 м (Made in China)" },
        { id: bqId(), price: 900000, imageUrl: '', name: "Флаг Парус уличный с конструкций\nРазмер флага: 0,80х3,80 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота Парус конструкциии: 4.00 м (Made in China)" },
        { id: bqId(), price: 55000, imageUrl: '', name: "Настольный флаг с одинарным флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 110000, imageUrl: '', name: "Настольный флаг с двойной флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 130000, imageUrl: '', name: "Настольный флаг с тройной флагштоком\nРазмер флага: 0,15х0,25см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый" },
        { id: bqId(), price: 120000, imageUrl: '', name: "Настольный флаг с одинарным флагштоком\nРазмер флага: 0,20х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 160000, imageUrl: '', name: "Настольный флаг с двойной флагштоком\nРазмер флага: 0,20х0,30см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 220000, imageUrl: '', name: "Настольный флаг с тройной флагштоком\nРазмер флага: 0,20х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 42 см золотистый" },
        { id: bqId(), price: 130000, imageUrl: '', name: "Настольный флаг с «Т» флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см золотистый" },
        { id: bqId(), price: 70000, imageUrl: '', name: "Настольный флаг с «Т» флагштоком\nРазмер флага: 0,8х0,30 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 33 см золотистый" },
        { id: bqId(), price: 90000, imageUrl: '', name: "Настольный Вымпел с флагштоком (крючком)\nРазмер флага: 0,12х0,24 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 34 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 160000, imageUrl: '', name: "Настольный флаг с четырех рожковый флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 180000, imageUrl: '', name: "Настольный флаг с пяти рожковый флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 37 см серибристый (Made in Turkey)" },
        { id: bqId(), price: 75000, imageUrl: '', name: "Настольный флаг с «Г» флагштоком\nРазмер флага: 0,15х0,25 см\nТкань флага: Атлас (сатин) 150 гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка\nВысота флагштока: 35 см золотистый" },
        { id: bqId(), price: 80000, imageUrl: '', name: "Флаг Узбекистан уличный\nРазмер флага: 1,00х2,00 м\nТкань флага: Креп (атлас)\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 150000, imageUrl: '', name: "Флаг Узбекистан уличный\nРазмер флага: 1,00х1,50 м\nТкань флага: Полиэстер 135гр.\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Флаг уличный\nРазмер флага: 1,00х1,50 м\nТкань флага: Креп\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 85000, imageUrl: '', name: "Вымпел с бахромой\nРазмер флага: А4 (20х30см)\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Вымпел с бахромой\nРазмер флага: А3 (30х40см)\nТкань флага: Атлас (сатин) 150гр\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная\nОбработка: Лазерная обработка" },
        { id: bqId(), price: 100000, imageUrl: '', name: "Подушка с нанесением логотипа\nРазмер подушка: 35х35см\nТкань: Сатин\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная" },
        { id: bqId(), price: 120000, imageUrl: '', name: "Подушка с нанесением логотипа\nРазмер подушка: 45х45см\nТкань: Сатин\nПечать изображения: 2 х сторонняя\nТип печати: Сублимационная" },
        { id: bqId(), price: 150000, imageUrl: '', name: "Чехол для кулера\nРазмер: Стандарт\nТкань флага: Атлас (сатин) 150 гр.\nПечать изображении: 1х сторонняя\nТип печати: Сублимационная" }
    ];
}

let bayroqDatabase = getDefaultBayroqDatabase();
let selectedBayroqIndex = 0;
let bayroqEditId = null;
let bayroqAdminSearchFilter = '';

function bayroqShortName(item) {
    let first = ((item && item.name) || '').split('\n')[0].trim();
    return first.replace(/[:：]\s*$/, '') || 'Bayroq';
}

// O'chib qolgan via.placeholder.com xizmatiga ishora qiluvchi eski bayroq rasmlarini mahalliy
// SVG rasm-o'rnbosarga almashtiradi (suvenir modellari uchun: migrateDeadPlaceholderImages).
function migrateDeadBayroqPlaceholderImages() {
    if (!Array.isArray(bayroqDatabase)) return false;
    let bayroqChanged = false;
    bayroqDatabase.forEach(item => {
        if (item && typeof item.imageUrl === 'string' && item.imageUrl.includes('via.placeholder.com')) {
            item.imageUrl = placeholderImg(bayroqShortName(item) || 'Bayroq', 100, 75);
            bayroqChanged = true;
        }
    });
    if (bayroqChanged) localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));
    return bayroqChanged;
}

// ---------------- MA'LUMOT TUZILMASI ----------------
// Har bir bayroq/mahsulot: { id, name (qisqa nom), info (ma'lumot, ko'p qatorli matn), imageUrl,
//   tierlar: [{ from, to, konstruksiya, bayroq }] }
// Narx (dona) = (Konstruksiya narxi + Bayroq (material) narxi) × Marja — miqdorga mos oraliqdan olinadi.
// to = 0 — cheksiz ("va undan yuqori"). Konstruksiya narxi 0 bo'lsa mahsulotda konstruksiya tanlovi chiqmaydi.
let bayroqKonstruksiyaBilan = true; // mijoz tanlovi: standart — konstruksiya BILAN

// Eski ko'rinishdagi ({name: ko'p qatorli matn, price}) yozuvni yangisiga o'tkazadi. Eski narx konstruksiya
// ajratilmagan JAMI narx edi — shuning uchun "Bayroq narxi"ga yoziladi, admin keyin konstruksiyani ajratib kiritadi.
function bayroqMoslash(item) {
    if (!item) return item;
    if (!Array.isArray(item.tierlar) || item.tierlar.length === 0) {
        let qatorlar = String(item.name || '').split('\n');
        if (item.info === undefined) item.info = qatorlar.slice(1).map(s => s.trim()).filter(Boolean).join('\n');
        item.name = qatorlar[0].trim().replace(/[:：]\s*$/, '') || 'Bayroq';
        item.tierlar = [{ from: 1, to: 0, konstruksiya: 0, bayroq: parseFloat(item.price) || 0 }];
    }
    item.info = item.info || '';
    // "Konstruksiya bor" belgisi: eski yozuvlarda matndan (конструкц/стойк/флагшток) yoki konstruksiya narxidan aniqlanadi
    if (typeof item.konstruksiyaBor !== 'boolean') {
        item.konstruksiyaBor = item.tierlar.some(t => parseFloat(t.konstruksiya) > 0)
            || /конструкц|стойк|флагшток/i.test(item.name + ' ' + item.info);
    }
    delete item.price;
    return item;
}

function bayroqTierlar(item) {
    return ((item && item.tierlar) || [])
        .map(t => ({
            from: Math.max(1, parseInt(t.from) || 1),
            to: Math.max(0, parseInt(t.to) || 0),
            konstruksiya: Math.max(0, parseFloat(t.konstruksiya) || 0),
            bayroq: Math.max(0, parseFloat(t.bayroq) || 0)
        }))
        .sort((a, b) => a.from - b.from);
}

// Miqdorga mos oraliq; mos kelmasa: eng kichikdan pastda — birinchisi, eng kattadan yuqorida — oxirgisi
function bayroqTierFor(item, qty) {
    let list = bayroqTierlar(item);
    if (list.length === 0) return null;
    let n = parseInt(qty) || 1;
    for (let t of list) {
        if (n >= t.from && n <= tierUpper(t)) return t;
    }
    return n < list[0].from ? list[0] : list[list.length - 1];
}

// Konstruksiya bor mahsulotda mijoz "konstruksiya bilan" (standart) yoki "konstruksiyasiz" tanlay oladi
function bayroqKonstruksiyaBormi(item) {
    return !!(item && item.konstruksiyaBor);
}

// Kartochkada ko'rsatiladigan narx: birinchi oraliq (konstruksiya bilan), bir nechta oraliq bo'lsa "dan"
function bayroqKartaNarxi(item) {
    let list = bayroqTierlar(item);
    if (list.length === 0) return '—';
    let t = list[0];
    return (t.konstruksiya + t.bayroq).toLocaleString() + " so'm" + (list.length > 1 ? ' dan' : '');
}

// ---------------- MIJOZ (client) tomoni ----------------
function generateFormHtml_bayroq() {
    selectedBayroqIndex = bayroqDatabase.length > 0 ? 0 : -1;
    bayroqKonstruksiyaBilan = true;
    if (bayroqDatabase.length === 0) {
        return `<p style="color:var(--text-muted); font-size:0.85rem;">⚠️ Hali bayroq turlari kiritilmagan — Admin Panelda kiriting.</p>`;
    }
    return `
        <div class="step-title">1. Mahsulotni tanlang (<span id="bayroqAvailableCount">${bayroqDatabase.length}</span> ta mavjud):</div>
        <div class="bayroq-search-wrap">
            <input type="text" id="bayroqSearchInput" placeholder="🔎 Nomi bo'yicha qidirish..." oninput="renderBayroqPicker()">
        </div>
        <div class="bayroq-grid" id="bayroqGrid"></div>
        <div id="bayroqSpecBox"></div>
        <div class="form-group" style="margin-top:10px;">
            <label>2. Adad (dona):</label>
            <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
        </div>
    `;
}

// Sonlar bazadagi mahsulotlar soniga qarab (5 tadanmi, 100+ tadanmi) o'zgarishi mumkin —
// shuning uchun ICHKI scroll-quti ishlatilmaydi, .bayroq-grid har doim to'liq kengayadi va
// kartochkalar sahifaning umumiy oqimida joylashadi.
function renderBayroqPicker() {
    const grid = document.getElementById('bayroqGrid');
    if (!grid) return;
    let q = (document.getElementById('bayroqSearchInput')?.value || '').toLowerCase();
    let list = bayroqDatabase.filter(it => !q || bayroqShortName(it).toLowerCase().includes(q) || (it.info || '').toLowerCase().includes(q));
    let activeItem = bayroqDatabase[selectedBayroqIndex];
    let countEl = document.getElementById('bayroqAvailableCount');
    if (countEl) countEl.textContent = bayroqDatabase.length;
    grid.innerHTML = list.length > 0 ? list.map(item => `
        <div class="bayroq-card ${activeItem && activeItem.id === item.id ? 'active' : ''}" id="bayroq-card-${item.id}" onclick="selectBayroqItem('${item.id}')">
            <img src="${item.imageUrl || placeholderImg('Bayroq', 100, 75)}" alt="${bayroqShortName(item)}" onerror="this.src='${placeholderImg('No Img', 100, 75)}'">
            <div class="bayroq-card-name" title="${(item.name || '').replace(/"/g, '&quot;')}">${bayroqShortName(item)}</div>
        </div>
    `).join('') : `<p style="color:var(--text-muted); font-size:0.85rem;">🔍 Hech narsa topilmadi.</p>`;
}

function selectBayroqItem(id) {
    let idx = bayroqDatabase.findIndex(it => it.id === id);
    if (idx < 0) return;
    selectedBayroqIndex = idx;
    bayroqKonstruksiyaBilan = true; // yangi mahsulotda standart — konstruksiya BILAN
    document.querySelectorAll('#bayroqGrid .bayroq-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`bayroq-card-${id}`)?.classList.add('active');
    calculate();
}

function setBayroqKonstruksiya(bilan) {
    bayroqKonstruksiyaBilan = !!bilan;
    calculate();
}

// Tanlangan mahsulotning ma'lumoti + konstruksiya tanlovi (konstruksiya narxi bor mahsulotlarda)
function renderBayroqSpecBox() {
    let box = document.getElementById('bayroqSpecBox');
    if (!box) return;
    let item = bayroqDatabase[selectedBayroqIndex];
    if (!item) { box.innerHTML = ''; return; }
    let esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let konsHtml = bayroqKonstruksiyaBormi(item) ? `
        <div class="step-title" style="margin-top:8px;">Konstruksiya</div>
        <div class="options-group">
            <button type="button" class="opt-btn ${bayroqKonstruksiyaBilan ? 'active' : ''}" onclick="setBayroqKonstruksiya(true)">Konstruksiya bilan</button>
            <button type="button" class="opt-btn ${!bayroqKonstruksiyaBilan ? 'active' : ''}" onclick="setBayroqKonstruksiya(false)">Konstruksiyasiz</button>
        </div>` : '';
    let infoHtml = item.info ? `<div style="white-space:pre-line; background:rgba(0,0,0,0.03); border:1px solid var(--border); border-radius:8px; padding:10px; margin:8px 0; font-size:0.78rem; color:var(--text-muted); line-height:1.5;">${esc(item.info)}</div>` : '';
    box.innerHTML = infoHtml + konsHtml;
}

function calculateResult_bayroq(qty) {
    if (bayroqDatabase.length === 0) {
        return { details: "Bayroqlar bazasi bo'sh — Admin Panelda kiriting", baseUnitPrice: 0 };
    }
    if (selectedBayroqIndex < 0 || selectedBayroqIndex >= bayroqDatabase.length) selectedBayroqIndex = 0;
    let item = bayroqDatabase[selectedBayroqIndex];
    renderBayroqSpecBox();
    let t = bayroqTierFor(item, qty);
    if (!t) return { details: `${bayroqShortName(item)} — narx oraliqlari kiritilmagan (Admin Panel)`, baseUnitPrice: 0 };
    let konsBor = bayroqKonstruksiyaBormi(item);
    let kons = konsBor && bayroqKonstruksiyaBilan;
    // Narx (dona) = Konstruksiya + Bayroq (material); marja core.js da qo'shiladi
    let baseUnitPrice = t.bayroq + (kons ? t.konstruksiya : 0);
    let details = bayroqShortName(item)
        + (konsBor ? (kons ? ' | Konstruksiya bilan' : ' | Konstruksiyasiz') : '')
        + (bayroqTierlar(item).length > 1 ? ` | Narx oralig'i: ${tierLabel(t)}` : '');
    return { details, baseUnitPrice };
}

// ---------------- ADMIN tomoni ----------------
let bayroqAdminTierlar = [{ from: 1, to: 0, konstruksiya: 0, bayroq: 0 }]; // formadagi (saqlanmagan) oraliqlar

function renderBayroqAdmin() {
    bayroqAdminSearchFilter = '';
    let searchInput = document.getElementById('bayroqAdminSearchInput');
    if (searchInput) searchInput.value = '';
    cancelBayroqEdit();
    renderBayroqAdminGrid();
}

function filterBayroqAdminGrid() {
    bayroqAdminSearchFilter = (document.getElementById('bayroqAdminSearchInput')?.value || '').toLowerCase();
    renderBayroqAdminGrid();
}

function renderBayroqAdminGrid() {
    const grid = document.getElementById('bayroqAdminGrid');
    if (!grid) return;
    let countEl = document.getElementById('bayroqAdminCount');
    if (countEl) countEl.textContent = bayroqDatabase.length > 0 ? `${bayroqDatabase.length} ta mahsulot` : '';

    let list = bayroqDatabase.filter(it => !bayroqAdminSearchFilter ||
        bayroqShortName(it).toLowerCase().includes(bayroqAdminSearchFilter) ||
        (it.info || '').toLowerCase().includes(bayroqAdminSearchFilter));

    if (bayroqDatabase.length === 0) {
        grid.innerHTML = `<div class="model-grid-empty">📭 Hozircha hech qanday bayroq qo'shilmagan.<br>Yuqoridagi formadan birinchisini qo'shing.</div>`;
        return;
    }
    if (list.length === 0) {
        grid.innerHTML = `<div class="model-grid-empty">🔍 Qidiruvga mos mahsulot topilmadi.</div>`;
        return;
    }

    grid.innerHTML = list.map(item => `
        <div class="model-card">
            <div class="model-card-top">
                <div class="model-card-thumb">
                    <img src="${item.imageUrl || placeholderImg('No Img', 80, 80)}" onerror="this.src='${placeholderImg('No Img', 80, 80)}'">
                </div>
                <div class="model-card-head">
                    <div class="model-card-name" title="${(item.name || '').replace(/"/g, '&quot;')}">${bayroqShortName(item)}</div>
                </div>
                <div class="action-btns model-card-actions">
                    <button class="btn btn-warning" title="Tahrirlash" onclick="editBayroqItem('${item.id}')">✏️</button>
                    <button class="btn btn-danger" title="O'chirish" onclick="deleteBayroqItem('${item.id}')">🗑️</button>
                </div>
            </div>
            <div class="model-card-body">
                <div class="model-card-price">${bayroqKartaNarxi(item)}</div>
            </div>
        </div>
    `).join('');
}

// Narx oraliqlari jadvali (admin formasi)
function renderBayroqTierRows() {
    let box = document.getElementById('bayroqTierRows');
    if (!box) return;
    let konsBor = !!document.getElementById('bayroqKonsBor')?.checked;
    box.innerHTML = bayroqAdminTierlar.map((t, i) => `
        <div class="bayroq-tier-row ${konsBor ? '' : 'bez-konstruksiya'}">
            <div class="form-group"><label>Dan (dona)</label><input type="number" id="bqTier_from_${i}" min="1" value="${t.from}"></div>
            <div class="form-group"><label>Gacha (0 = cheksiz)</label><input type="number" id="bqTier_to_${i}" min="0" value="${t.to}"></div>
            <div class="form-group bq-kons-maydon"><label>Konstruksiya narxi (so'm)</label><input type="number" id="bqTier_kons_${i}" min="0" value="${t.konstruksiya}"></div>
            <div class="form-group"><label>Bayroq narxi (so'm)</label><input type="number" id="bqTier_bayroq_${i}" min="0" value="${t.bayroq}"></div>
            <button type="button" class="btn btn-danger" title="Oraliqni o'chirish" onclick="deleteBayroqTierRow(${i})">✕</button>
        </div>
    `).join('');
    let warn = document.getElementById('bayroqTierWarn');
    if (warn) {
        let msgs = tierValidationMessages(bayroqAdminTierlar);
        if (konsBor && !bayroqAdminTierlar.some(t => t.konstruksiya > 0)) msgs.unshift("Konstruksiya narxi kiritilmagan — mijoz \"konstruksiya bilan\" tanlasa ham narx o'zgarmaydi.");
        warn.innerHTML = msgs.map(m => `<div>⚠️ ${m}</div>`).join('');
    }
}

// "Konstruksiya bor" belgisi o'zgarganda — formadagi qiymatlar yo'qolmasin
function onBayroqKonsBorChange() {
    bayroqAdminTierlar = collectBayroqTierRows();
    renderBayroqTierRows();
}

function collectBayroqTierRows() {
    return bayroqAdminTierlar.map((t, i) => {
        let q = id => document.getElementById(id);
        if (!q(`bqTier_from_${i}`)) return t;
        return {
            from: Math.max(1, parseInt(q(`bqTier_from_${i}`).value) || 1),
            to: Math.max(0, parseInt(q(`bqTier_to_${i}`).value) || 0),
            konstruksiya: Math.max(0, parseFloat(q(`bqTier_kons_${i}`).value) || 0),
            bayroq: Math.max(0, parseFloat(q(`bqTier_bayroq_${i}`).value) || 0)
        };
    });
}

function addBayroqTierRow() {
    bayroqAdminTierlar = collectBayroqTierRows();
    let last = bayroqAdminTierlar[bayroqAdminTierlar.length - 1];
    let from = last ? (last.to > 0 ? last.to + 1 : last.from + 1) : 1;
    if (last && last.to === 0) last.to = Math.max(last.from, from - 1); // oldingi cheksiz oraliqni yopamiz
    bayroqAdminTierlar.push({ from, to: 0, konstruksiya: last ? last.konstruksiya : 0, bayroq: last ? last.bayroq : 0 });
    renderBayroqTierRows();
}

function deleteBayroqTierRow(i) {
    bayroqAdminTierlar = collectBayroqTierRows();
    if (bayroqAdminTierlar.length <= 1) { showToast("⚠️ Kamida bitta oraliq bo'lishi kerak"); return; }
    bayroqAdminTierlar.splice(i, 1);
    renderBayroqTierRows();
}

async function previewBayroqImage(inputEl) {
    const img = document.getElementById('bayroqImagePreview');
    const placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (!img || !inputEl.files || !inputEl.files[0]) return;
    let dataUrl = await convertBase64(inputEl.files[0]);
    img.src = dataUrl;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
}

function editBayroqItem(id) {
    let item = bayroqDatabase.find(it => it.id === id);
    if (!item) return;
    bayroqEditId = id;
    document.getElementById('bayroqFormTitle').innerText = "✏️ Bayroqni Tahrirlash";
    document.getElementById('bayroqNameInput').value = item.name || '';
    let infoEl = document.getElementById('bayroqInfoInput');
    infoEl.value = item.info || '';
    infoEl.style.height = 'auto';
    infoEl.style.height = Math.max(280, infoEl.scrollHeight) + 'px'; // ma'lumot to'liq ko'rinsin (scroll kerak bo'lmasin)
    document.getElementById('bayroqKonsBor').checked = !!item.konstruksiyaBor;
    bayroqAdminTierlar = bayroqTierlar(item);
    if (bayroqAdminTierlar.length === 0) bayroqAdminTierlar = [{ from: 1, to: 0, konstruksiya: 0, bayroq: 0 }];
    renderBayroqTierRows();
    let img = document.getElementById('bayroqImagePreview');
    let placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (item.imageUrl) {
        img.src = item.imageUrl; img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }
    document.getElementById('btnCancelBayroqEdit').style.display = 'inline-flex';
    let nameField = document.getElementById('bayroqNameInput');
    if (nameField && typeof nameField.scrollIntoView === 'function') {
        nameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function cancelBayroqEdit() {
    bayroqEditId = null;
    let title = document.getElementById('bayroqFormTitle');
    if (title) title.innerText = "➕ Yangi Bayroq Qo'shish";
    let nameEl = document.getElementById('bayroqNameInput');
    let infoEl = document.getElementById('bayroqInfoInput');
    let fileEl = document.getElementById('bayroqFileInput');
    if (nameEl) nameEl.value = '';
    if (infoEl) { infoEl.value = ''; infoEl.style.height = ''; }
    if (fileEl) fileEl.value = '';
    let konsEl = document.getElementById('bayroqKonsBor');
    if (konsEl) konsEl.checked = true; // yangi mahsulotda standart — konstruksiya bor
    bayroqAdminTierlar = [{ from: 1, to: 0, konstruksiya: 0, bayroq: 0 }];
    renderBayroqTierRows();
    let img = document.getElementById('bayroqImagePreview');
    let placeholder = document.getElementById('bayroqImagePreviewPlaceholder');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    let cancelBtn = document.getElementById('btnCancelBayroqEdit');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function saveBayroqItem() {
    let name = (document.getElementById('bayroqNameInput').value || '').trim();
    let info = (document.getElementById('bayroqInfoInput').value || '').trim();
    let konsBor = !!document.getElementById('bayroqKonsBor').checked;
    let tierlar = collectBayroqTierRows();
    if (!konsBor) tierlar.forEach(t => { t.konstruksiya = 0; });
    let imageUrl = document.getElementById('bayroqImagePreview').src || '';
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) imageUrl = '';
    if (typeof rasmManzilNisbiy === 'function') imageUrl = rasmManzilNisbiy(imageUrl); // server rasmi — ko'chma (nisbiy) manzil bilan saqlanadi

    if (!name) { showToast("⚠️ Mahsulot nomini kiriting!"); return; }
    if (!tierlar.some(t => t.bayroq > 0)) { showToast("⚠️ Kamida bitta oraliqqa bayroq narxini kiriting!"); return; }
    tierlar.sort((a, b) => a.from - b.from);

    if (bayroqEditId) {
        let item = bayroqDatabase.find(it => it.id === bayroqEditId);
        if (item) {
            item.name = name; item.info = info; item.tierlar = tierlar; item.konstruksiyaBor = konsBor;
            if (imageUrl) item.imageUrl = imageUrl;
            if (typeof logAudit === 'function') logAudit("Bayroq tahrirlandi", bayroqShortName(item));
        }
    } else {
        let newItem = { id: bqId(), name, info, tierlar, imageUrl, konstruksiyaBor: konsBor };
        bayroqDatabase.push(newItem);
        if (typeof logAudit === 'function') logAudit("Yangi bayroq qo'shildi", bayroqShortName(newItem));
    }

    localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));
    cancelBayroqEdit();
    renderBayroqAdminGrid();
    showToast("✅ Saqlandi!");
}

function deleteBayroqItem(id) {
    let item = bayroqDatabase.find(it => it.id === id);
    if (!item) return;
    if (!confirm(`"${bayroqShortName(item)}" o'chirilsinmi?`)) return;
    bayroqDatabase = bayroqDatabase.filter(it => it.id !== id);
    localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));
    if (typeof logAudit === 'function') logAudit("Bayroq o'chirildi", bayroqShortName(item));
    if (bayroqEditId === id) cancelBayroqEdit();
    renderBayroqAdminGrid();
    showToast("🗑️ O'chirildi!");
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('textile', {
        init: function () {
            // Textile bazasi: material va pechat o'lchamlari.
            // defaultPrices yuklangandan KEYIN turishi shart — namuna narxlar shundan olinadi.
            let savedTextile = localStorage.getItem('erp_textile_db');
            textileDatabase = savedTextile ? JSON.parse(savedTextile) : {};
            let txChanged = false;
            let defTx = null;
            textileKeys.forEach(k => {
                if (k === 'bayroqlar') return; // o'z alohida bazasi bor, quyida alohida yuklanadi
                let cur = textileDatabase[k];
                if (!cur || !(cur.materials || []).length) {
                    defTx = defTx || getDefaultTextileDb();
                    textileDatabase[k] = defTx[k];
                    txChanged = true;
                    return;
                }
                // Eski versiyada har mahsulot turi o'z pechat narxi jadvaliga (printRate) ega edi —
                // endi bu BUTUN tekstil bo'limiga umumiy DTF/Taxi sozlamasiga (textileDtfConfig)
                // almashtirildi. Eski saqlangan `printRate`/`printSizes` maydonlari (agar bo'lsa)
                // shunchaki e'tiborsiz qoldiriladi — o'chirilmaydi, lekin zarari ham yo'q.
                if (!Array.isArray(cur.colors) || cur.colors.length === 0) {
                    defTx = defTx || getDefaultTextileDb();
                    cur.colors = defTx[k].colors;
                    txChanged = true;
                }
            });
            if (txChanged) localStorage.setItem('erp_textile_db', JSON.stringify(textileDatabase));

            // Textile DTF/Taxi narxi — BARCHA tekstil turlariga umumiy (Bayroq Taxi bilan bir xil naqsh)
            let savedTextileDtf = localStorage.getItem('erp_textile_dtf_config');
            if (savedTextileDtf) {
                try {
                    let parsedDtf = JSON.parse(savedTextileDtf);
                    if (parsedDtf && typeof parsedDtf === 'object') {
                        textileDtfConfig = { ...textileDtfConfig, ...parsedDtf };
                    }
                } catch (e) {}
            }

            let savedBayroqDb = localStorage.getItem('erp_bayroq_db');
            if (savedBayroqDb) {
                try {
                    let parsed = JSON.parse(savedBayroqDb);
                    if (Array.isArray(parsed)) bayroqDatabase = parsed;
                } catch (e) {}
            }

            // Eski ({name, price}) yozuvlarni yangi tuzilmaga (nom, ma'lumot, narx oraliqlari) o'tkazish (idempotent)
            let eskiBor = bayroqDatabase.some(it => !Array.isArray(it.tierlar) || it.tierlar.length === 0);
            bayroqDatabase.forEach(bayroqMoslash);
            if (eskiBor && savedBayroqDb) localStorage.setItem('erp_bayroq_db', JSON.stringify(bayroqDatabase));

            // O'chib qolgan via.placeholder.com rasmlarini mahalliy rasm-o'rnbosarga almashtirish (idempotent)
            migrateDeadBayroqPlaceholderImages();
        }
    });
