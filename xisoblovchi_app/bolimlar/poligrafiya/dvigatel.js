// Poligrafiya bo'limi — Doorhanger va umumiy poligrafiya dvigateli (grammaj, Ofset/Raqamli tanlash, hisob).
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== DOORHANGER (poligrafiya, FAQAT A3 ofset, majburiy CHUJOY) ======================
    // O'lchami (95x210mm) — ilgak/kesim joylashuvi sabab bosma plastinasini "aylantirib"
    // (SVOY) bosib bo'lmaydi, garchi bitta A3 varoqqa 6 dona (juft son) sig'sa ham — shuning
    // uchun old/orqa tomon uchun har doim ALOHIDA forma/bosma (CHUJOY) majburiy qilinadi
    // (calculateOfsetForMachine'ning forceChujoy parametri orqali). Qog'oz grammaji tanlovi
    // (poligrafiyaGsmDatabase.doorhanger) o'zgarishsiz — admin mavjud "Ruxsat etilgan Qog'oz
    // Grammajlari" panelida boshqaradi. Visochka (osish uchun teshik) — barcha buyurtmalarga
    // avtomatik, mijozga ko'rsatilmaydigan, tiered narx (Papka'dagi bilan bir xil naqsh).
    let doorhangerConfig = {
        paperType: 'Karton',
        // Narxi endi "Ofset pechat kalkulyatori" admin bo'limidagi umumiy Visochka
        // sozlamasidan (ofsetFinishingServices.visochka.a3) olinadi — bu yerda faqat
        // Doorhanger shu xizmatdan foydalanadimi-yo'qmi belgilanadi.
        visochkaEnabled: true
    };

    function renderAdminDoorhangerConfig() {
        let q = id => document.getElementById(id);
        if (q('doorhangerVisochkaEnabled')) q('doorhangerVisochkaEnabled').checked = !!doorhangerConfig.visochkaEnabled;
    }

    function saveDoorhangerConfig() {
        let chk = document.getElementById('doorhangerVisochkaEnabled');
        doorhangerConfig.visochkaEnabled = chk ? chk.checked : doorhangerConfig.visochkaEnabled;
        localStorage.setItem('erp_doorhanger_config', JSON.stringify(doorhangerConfig));
        if (typeof logAudit === 'function') {
            logAudit("Doorhanger sozlamalari o'zgartirildi", `Visochka ishlatiladi: ${doorhangerConfig.visochkaEnabled ? 'ha' : 'yo\'q'}`);
        }
        showToast("💾 Doorhanger sozlamalari saqlandi!");
    }

    // Doorhanger uchun mavjud generic poligrafiya HTML shabloni ishlatilmaydi — chunki
    // Pechat usuli (Ofset/Raqamli) va Bosma tomoni (1/2) tanlovlari umuman ko'rsatilmasligi
    // kerak (ikkalasi ham qat'iy belgilangan: faqat Ofset, faqat Chujoy).
    function buildDoorhangerForm() {
        let gsmList = poligrafiyaGsmDatabase.doorhanger || [];
        let defaultIdx = gsmList.findIndex(g => g.isDefault);
        selectedPoligrafiyaGsmIndex = defaultIdx >= 0 ? defaultIdx : 0;
        return `
            <div class="poli-calc">
                <div class="poli-spec-row">
                    <div class="poli-spec-icon">📐</div>
                    <div>
                        <div class="poli-spec-label">Standart o'lcham</div>
                        <div class="poli-spec-value">${poligrafiyaSizeLabels.doorhanger}</div>
                    </div>
                </div>
                <div class="step-title">Qog'oz grammaji</div>
                <div class="poli-paper-grid" id="poligrafiyaGsmGroup"></div>
                <div class="poli-spec-row poli-spec-row-muted">
                    <div class="poli-spec-icon">🖨️</div>
                    <div>
                        <div class="poli-spec-label">Pechat usuli</div>
                        <div class="poli-spec-value">Faqat Ofset (A3, ikki tomonlama — Chujoy)</div>
                    </div>
                </div>
                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function calculateDoorhanger(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let gsmList = poligrafiyaGsmDatabase.doorhanger || [];
        let g = gsmList[selectedPoligrafiyaGsmIndex] || gsmList.find(x => x.isDefault) || gsmList[0];
        let costItems = [];
        let unit = 0;
        let details;

        if (!g) {
            return { details: '⚠️ Doorhanger uchun grammaj bazasi topilmadi — admin panelda tekshiring.', baseUnitPrice: 0, costItems: [] };
        }

        let paperTypeName = g.paperType || doorhangerConfig.paperType || 'Karton';
        let size = parsePoligrafiyaSizeLabel(poligrafiyaSizeLabels.doorhanger);
        let r = size ? calculateOfsetForMachine('A3', size.w, size.h, qty, 2, paperTypeName, g.gsm, true) : null;

        if (r) {
            unit += r.perPieceCostRaw;
            costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
            costItems.push({ label: 'Forma (klishe, Chujoy — 8 plastina)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
            costItems.push({ label: 'Bosma (pechat, Chujoy)', qty: `${r.totalWorkingSheets} ta A3 varoq`, total: Math.round(r.totalPrintCost) });
            details = `Doorhanger chop etish (${poligrafiyaSizeLabels.doorhanger}) | ${paperTypeName} ${g.gsm}gr | Ofset A3 | Chujoy (ikki tomonlama)`;
        } else {
            details = `⚠️ ${paperTypeName} ${g.gsm}gr uchun Ofset A3 bazasi topilmadi — admin panelda tekshiring.`;
        }

        let visochkaTotal = doorhangerConfig.visochkaEnabled ? papkaTieredTotal(qty, ofsetFinishingServices.visochka.a3) : 0;
        if (visochkaTotal > 0) {
            unit += visochkaTotal / qty;
            costItems.push({ label: 'Visochka', qty: `${qty} dona`, total: Math.round(visochkaTotal) });
        }

        return { details, baseUnitPrice: unit, costItems };
    }

    function selectPoligrafiyaGsm(index) {
        selectedPoligrafiyaGsmIndex = index;
        document.querySelectorAll('#poligrafiyaGsmGroup .poli-paper-option').forEach((el, idx) => {
            el.classList.toggle('active', idx === index);
        });
        calculate();
    }

    // Menejer Ofset yoki Raqamli (Sifravoy) pechatni tanlaydi — narx shu bo'limning
    // haqiqiy qog'oz bazasidan hisoblanadi (calculateResult_poligrafiya ichida).
    function selectPoligrafiyaEngine(engine) {
        // Adad ofset minimal tirajidan kam bo'lsa, Ofset tugmasi o'chirilgan — bosilsa ham hech narsa bo'lmaydi
        let btn = document.querySelector(`#poligrafiyaEngineGroup [data-engine="${engine}"]`);
        if (btn && btn.disabled) return;
        poliAvtoRaqamli = false; // menejer o'zi tanladi
        selectedPoligrafiyaEngine = engine;
        document.querySelectorAll('#poligrafiyaEngineGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.engine === engine);
        });
        calculate();
    }

    function selectPoligrafiyaSides(sides) {
        selectedPoligrafiyaSides = sides;
        document.querySelectorAll('#poligrafiyaSidesGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.sides) === sides);
        });
        calculate();
    }

    // Ofset minimal tiraj tufayli avtomatik Raqamli pechatga o'tkazilganmi? (adad yetarli bo'lsa, qaytariladi)
    let poliAvtoRaqamli = false;

    // Ofset tugmasi holati va ogohlantirishni adadga moslaydi (calculateResult_poligrafiya chaqiradi)
    function poliOfsetHolatiniYangila(ofsetMumkin, minTiraj, qty) {
        let btn = document.querySelector('#poligrafiyaEngineGroup [data-engine="ofset"]');
        if (btn) {
            btn.disabled = !ofsetMumkin;
            btn.classList.toggle('opt-btn-disabled', !ofsetMumkin);
            btn.title = ofsetMumkin ? '' : `Ofset pechat uchun kamida ${minTiraj.toLocaleString()} dona kerak — mutaxassisga bog'laning`;
        }
        document.querySelectorAll('#poligrafiyaEngineGroup .opt-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.engine === selectedPoligrafiyaEngine);
        });
        let box = document.getElementById('poliOfsetMinOgoh');
        if (box) {
            box.style.display = ofsetMumkin ? 'none' : 'block';
            box.innerHTML = ofsetMumkin ? '' : `⚠️ Ofset pechat uchun eng kam adad — <b>${minTiraj.toLocaleString()} dona</b>. `
                + `Siz ${qty.toLocaleString()} dona kiritdingiz, shuning uchun narx <b>Raqamli (Sifravoy) pechatda</b> hisoblandi. `
                + `Mijoz ofsetda chop etishni xohlasa — <b>mutaxassisga bog'laning</b>.`;
        }
    }

    // "97x210mm" kabi o'lcham yorlig'idan W x H (mm) raqamlarini ajratib oladi.
    function parsePoligrafiyaSizeLabel(label) {
        let m = /^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i.exec(label || '');
        if (!m) return null;
        return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
    }

    // Raqamli (Sifravoy) Pechat bo'limidagi qog'oz uchun bir dona narxini hisoblaydi —
    // calculate_raqamli() dagi aynan o'sha joylashtirish (grid-fitting) formulasi,
    // faqat margin (65%) qo'shilmagan holda — umumiy margin keyinroq calculate() da qo'shiladi.
    function calculateDigitalPriceForPaper(paperObj, w, h, qty, sides) {
        if (!paperObj || !w || !h || !qty || qty < 1) return null;
        let pW = paperObj.p_eni || 310;
        let pH = paperObj.p_boyi || 440;
        const gap = 2;

        let cols1 = Math.floor((pW + gap) / (w + gap));
        let rows1 = Math.floor((pH + gap) / (h + gap));
        let count1 = cols1 * rows1;

        let cols2 = Math.floor((pW + gap) / (h + gap));
        let rows2 = Math.floor((pH + gap) / (w + gap));
        let count2 = cols2 * rows2;

        let perSheet = count1;
        let isRotated = false;
        if (count2 > count1) { perSheet = count2; isRotated = true; }

        if (perSheet <= 0) return null;

        let sheetsNeeded = Math.ceil(qty / perSheet);
        let unitPaperPrice = (sides === 1) ? paperObj.price1 : paperObj.price2;
        let totalPaperCost = sheetsNeeded * unitPaperPrice;

        return { unitPrice: totalPaperCost / qty, perSheet, sheetsNeeded, isRotated };
    }



function generateFormHtml_poligrafiya(type) {
    let sizeLabel = poligrafiyaSizeLabels[type] || '';

    let gsmHtml = '';
    let gsmList = poligrafiyaGsmDatabase[type] || [];
    let usesRealPaperPricing = gsmList.length > 0;
    if (usesRealPaperPricing) {
        let defaultIdx = gsmList.findIndex(g => g.isDefault);
        selectedPoligrafiyaGsmIndex = defaultIdx >= 0 ? defaultIdx : 0;
        selectedPoligrafiyaEngine = 'ofset';
        poliAvtoRaqamli = false;
        selectedPoligrafiyaSides = (poligrafiyaSideTypes[type] === 1) ? 1 : 2;
        gsmHtml = `
            <div class="step-title">Qog'oz grammaji</div>
            <div class="poli-paper-grid" id="poligrafiyaGsmGroup"></div>

            <div class="step-title">Pechat usuli</div>
            <div class="options-group" id="poligrafiyaEngineGroup">
                <button type="button" class="opt-btn active" data-engine="ofset" onclick="selectPoligrafiyaEngine('ofset')">🖨️ Ofset Pechat</button>
                <button type="button" class="opt-btn" data-engine="raqamli" onclick="selectPoligrafiyaEngine('raqamli')">🖥️ Raqamli Pechat</button>
            </div>
            <div id="poliOfsetMinOgoh" class="poli-ofset-min-ogoh" style="display:none;"></div>

            <div class="step-title">Bosma tomoni</div>
            <div class="options-group" id="poligrafiyaSidesGroup">
                <button type="button" class="opt-btn ${selectedPoligrafiyaSides === 1 ? 'active' : ''}" data-sides="1" onclick="selectPoligrafiyaSides(1)">Bir tomonlama (4+0)</button>
                <button type="button" class="opt-btn ${selectedPoligrafiyaSides === 2 ? 'active' : ''}" data-sides="2" onclick="selectPoligrafiyaSides(2)">Ikki tomonlama (4+4)</button>
            </div>
        `;
    }

    let sideTypeVal = poligrafiyaSideTypes[type] ?? 1.6;
    let sideTypeLabel = sideTypeVal === 1 ? "Bir tomonlama (4+0)" : "Ikki tomonlama (4+4)";

    let html = `
        <div class="poli-calc">
            ${sizeLabel ? `
            <div class="poli-spec-row">
                <div class="poli-spec-icon">📐</div>
                <div>
                    <div class="poli-spec-label">Standart o'lcham</div>
                    <div class="poli-spec-value">${sizeLabel}</div>
                </div>
            </div>` : ''}
            ${gsmHtml}
            ${!usesRealPaperPricing ? `
            <div class="poli-spec-row poli-spec-row-muted">
                <div class="poli-spec-icon">🖨️</div>
                <div>
                    <div class="poli-spec-label">Bosma turi</div>
                    <div class="poli-spec-value">${sideTypeLabel}</div>
                </div>
            </div>` : ''}
            <div class="form-group poli-qty-group">
                <label>Adad (dona)</label>
                <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
            </div>
        </div>
    `;

    return html;
}

function calculateResult_poligrafiya(activeProductTypeParam, qty, baseCost) {
    let baseUnitPrice = baseCost;

    // Kiritish tekshiruvi: manfiy/mantiqsiz miqdorni tozalaymiz
    if (!Number.isFinite(qty) || qty < 1) {
        qty = 1;
        showToast("⚠️ Miqdor noto'g'ri kiritildi, 1 dona sifatida hisoblandi.");
    }

    let sizeLabel = poligrafiyaSizeLabels[activeProductType] || '';
    let gsmList = poligrafiyaGsmDatabase[activeProductType] || [];
    let details;

    if (gsmList.length > 0) {
        // Narx bu yerda qo'lda kiritilmaydi — tanlangan grammaj Ofset Pechat yoki
        // Raqamli Pechat bo'limidagi haqiqiy qog'oz bazasidan qidiriladi.
        let g = gsmList[selectedPoligrafiyaGsmIndex] || gsmList[0];
        let paperTypeName = g.paperType || 'Melovka';
        let gsmLabel = ` | ${paperTypeName} ${g.gsm}gr`;
        let sozlama = poliSozlama(activeProductType);
        // Hisob bichish (yoyilgan) o'lchami bo'yicha — masalan Konvert yopishtirishdan oldingi shakl
        let hisobOlcham = sozlama.yoyilganOlcham || sizeLabel;
        let size = parsePoligrafiyaSizeLabel(hisobOlcham);
        let sides = (selectedPoligrafiyaSides === 1) ? 1 : 2;

        // Ofset minimal tiraji: adad yetmasa — Raqamli pechatda hisoblanadi, Ofset tugmasi o'chadi
        let minTiraj = parseInt(sozlama.ofsetMinTiraj) || 0;
        let ofsetMumkin = !(minTiraj > 0 && qty < minTiraj);
        if (!ofsetMumkin && selectedPoligrafiyaEngine === 'ofset') {
            selectedPoligrafiyaEngine = 'raqamli';
            poliAvtoRaqamli = true;
        } else if (ofsetMumkin && poliAvtoRaqamli) {
            selectedPoligrafiyaEngine = 'ofset';
            poliAvtoRaqamli = false;
        }
        poliOfsetHolatiniYangila(ofsetMumkin, minTiraj, qty);

        let engine = (selectedPoligrafiyaEngine === 'raqamli') ? 'raqamli' : 'ofset';
        let engineLabel = engine === 'ofset' ? 'Ofset Pechat' : 'Raqamli Pechat';
        let priceFound = false;

        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];
        if (size) {
            if (engine === 'ofset') {
                let paperEntry = (typeof ofsetRawPapers !== 'undefined') ? ofsetRawPapers.find(p => p.gsm === g.gsm && p.name === paperTypeName) : null;
                if (paperEntry) {
                    let results = ['A3', 'A2', 'A1']
                        .map(m => calculateOfsetForMachine(m, size.w, size.h, qty, sides, paperEntry.name, g.gsm))
                        .filter(Boolean);
                    if (results.length > 0) {
                        results.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                        let r = results[0];
                        baseUnitPrice = r.perPieceCostRaw;
                        priceFound = true;
                        costItems.push({ label: `Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, qty: `${r.totalSheets} xom varoq`, total: Math.round(r.totalPaperCost) });
                        costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                        costItems.push({ label: 'Bosma (pechat)', qty: `${r.totalWorkingSheets} ta ${r.machine} varoq`, total: Math.round(r.totalPrintCost) });
                    }
                }
            } else {
                let paperEntry = (typeof digitalPapersDatabase !== 'undefined') ? digitalPapersDatabase.find(p => {
                    let m = /(\d+)/.exec(p.name || '');
                    return m && parseInt(m[1]) === g.gsm && (p.name || '').toLowerCase().startsWith(paperTypeName.toLowerCase());
                }) : null;
                if (paperEntry) {
                    let r = calculateDigitalPriceForPaper(paperEntry, size.w, size.h, qty, sides);
                    if (r) {
                        baseUnitPrice = r.unitPrice;
                        priceFound = true;
                        costItems.push({ label: `Qog'oz (Raqamli, ${g.gsm}gr)`, qty: `${r.sheetsNeeded} varoq`, total: Math.round(r.unitPrice * qty) });
                    }
                }
            }
        }

        if (priceFound) {
            details = (sizeLabel ? `Poligrafiya chop etish (${sizeLabel}${sozlama.yoyilganOlcham ? `, bichish ${sozlama.yoyilganOlcham}` : ''})` : "Poligrafiya chop etish")
                + gsmLabel + ` | ${engineLabel} | ${sides === 1 ? 'Bir tomonlama' : 'Ikki tomonlama'}`;
            if (!ofsetMumkin) details += ` (ofset uchun kamida ${minTiraj.toLocaleString()} dona)`;

            // Qo'shimcha ishlov (vyrubka+skleyka, bigovka...) — so'm/dona
            let ishlov = parseFloat(sozlama.ishlovNarxi) || 0;
            if (ishlov > 0) {
                let nomi = sozlama.ishlovNomi || "Qo'shimcha ishlov";
                baseUnitPrice += ishlov;
                costItems.push({ label: nomi, qty: `${qty} dona`, total: Math.round(ishlov * qty) });
                details += ` | ${nomi}`;
            }
        } else {
            baseUnitPrice = 0;
            details = `⚠️ ${paperTypeName} ${g.gsm}gr uchun ${engineLabel} bo'limida mos qog'oz topilmadi — administrator shu qog'ozni ${engineLabel} bo'limiga kiritishi kerak.`;
        }

        return { details, baseUnitPrice, costItems };
    } else {
        // Bu mahsulot turi uchun grammaj bazasi mavjud emas (masalan Paket, Kalendar) —
        // eski oddiy hisob: baza narx * bosma koeffitsienti.
        let sideFactor = poligrafiyaSideTypes[activeProductType] ?? 1.6;
        baseUnitPrice = baseCost * sideFactor;
        details = sizeLabel ? `Poligrafiya chop etish (${sizeLabel})` : "Poligrafiya chop etish";
        return { details, baseUnitPrice };
    }
}

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('dvigatel');
