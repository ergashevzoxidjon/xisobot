    // ====================== REKLAMA STEND MAHSULOTLARI (Roll Up / Pauk / PopUp / PromoStoyka) ======================
    // Bular reklamaBanTypes'dan (baner/orakal/...) TUBDAN farqli: mijoz eni/bo'yini o'zi kiritmaydi —
    // har bir mahsulotning bir nechta TAYYOR o'lcham-varianti bor va har biri o'zining QAT'IY narxiga
    // ega (admin belgilaydi). Material (Glyans/Matoviy) esa faqat ko'rinish uchun — narxga ta'sir qilmaydi.
    const reklamaStendNames = { rollup: 'Roll Up', pauk: 'Pauk', popup: 'PopUp', promostoyka: 'PromoStoyka',
        tablichka: 'Tablichka', nastolniy_tablichka: 'Nastolniy tablichka', stend: 'Stend' };

    // Miqdor bo'yicha narx oraliqlari — har bir reklama-stend turiga umumiy, o'sha turning
    // BARCHA o'lchamlariga bir xil ustunlar sifatida qo'llaniladi (admin buni jadval ko'rinishida
    // sozlaydi). "to: 0" cheksiz ("va undan yuqori") degani.
    const reklamaStendDefaultQtyRanges = [
        { from: 1,   to: 3 },
        { from: 4,   to: 10 },
        { from: 11,  to: 20 },
        { from: 21,  to: 50 },
        { from: 51,  to: 100 },
        { from: 101, to: 0 }
    ];
    let reklamaStendQtyTiers = {
        rollup: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        pauk: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        popup: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        promostoyka: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        tablichka: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        nastolniy_tablichka: reklamaStendDefaultQtyRanges.map(r => ({ ...r })),
        stend: reklamaStendDefaultQtyRanges.map(r => ({ ...r }))
    };
    // Namuna chegirma koeffitsientlari — faqat boshlang'ich demo narxlarni to'ldirish uchun
    const reklamaStendSampleTierMultipliers = [1.00, 0.94, 0.88, 0.82, 0.77, 0.72];
    function withSampleReklamaStendTierPrices(basePrice) {
        return reklamaStendSampleTierMultipliers.map(m => Math.round((basePrice * m) / 100) * 100);
    }

    // Boshlang'ich (demo) narxlar — admin buni Admin Panel orqali o'ziga moslab o'zgartiradi.
    let reklamaStendSizeDatabase = {
        rollup: [
            { label: '800x2000mm', price: 350000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(350000) },
            { label: '1250x2000mm', price: 480000, tierPrices: withSampleReklamaStendTierPrices(480000) },
            { label: '1500x2000mm', price: 580000, tierPrices: withSampleReklamaStendTierPrices(580000) }
        ],
        pauk: [
            { label: '600x1600mm', price: 250000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(250000) },
            { label: '700x1700mm', price: 300000, tierPrices: withSampleReklamaStendTierPrices(300000) }
        ],
        popup: [
            { label: '2000x3000mm', price: 1200000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(1200000) }
        ],
        promostoyka: [
            { label: 'Standart', price: 400000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(400000) }
        ],
        // Tablichka va Nastolniy tablichka qatorlari — MODELLAR (rasm, razmerlar, ichki qog'oz sozlamasi bilan)
        tablichka: [
            { label: '200x300mm', price: 80000, tierPrices: withSampleReklamaStendTierPrices(80000), rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 },
            { label: '300x400mm', price: 120000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(120000), rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 },
            { label: '400x600mm', price: 180000, tierPrices: withSampleReklamaStendTierPrices(180000), rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 }
        ],
        nastolniy_tablichka: [
            { label: 'A5 (148x210mm)', price: 60000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(60000), rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 },
            { label: 'A4 (210x297mm)', price: 90000, tierPrices: withSampleReklamaStendTierPrices(90000), rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 }
        ],
        stend: [
            { label: '600x900mm', price: 350000, isDefault: true, tierPrices: withSampleReklamaStendTierPrices(350000) },
            { label: '1000x1500mm', price: 700000, tierPrices: withSampleReklamaStendTierPrices(700000) }
        ]
    };
    let selectedReklamaStendSizeIndex = -1;
    let reklamaStendMaterial = 'Glyans'; // 'Glyans' | 'Matoviy' — faqat ko'rsatish uchun, narxga ta'sir qilmaydi

    function reklamaStendTierUpper(t) { return (t.to && t.to > 0) ? t.to : Infinity; }
    function reklamaStendTierLabel(t) { return (t.to && t.to > 0) ? `${t.from}-${t.to}` : `${t.from}+`; }

    // Berilgan miqdorga mos oraliq indeksini topadi. Aniq mos kelmasa: miqdor eng kichik
    // oraliqdan pastda bo'lsa birinchisi, eng kattasidan yuqorida bo'lsa oxirgisi ishlatiladi.
    function findReklamaStendTierIdx(type, qty) {
        let tiers = reklamaStendQtyTiers[type] || [];
        if (tiers.length === 0) return -1;
        let n = parseInt(qty) || 1;
        for (let i = 0; i < tiers.length; i++) {
            if (n >= tiers[i].from && n <= reklamaStendTierUpper(tiers[i])) return i;
        }
        if (n < tiers[0].from) return 0;
        return tiers.length - 1;
    }

    function generateFormHtml_reklamaStend(type) {
        reklamaStendMaterial = 'Glyans';
        let sizeList = reklamaStendSizeDatabase[type] || [];
        let defaultIdx = sizeList.findIndex(s => s.isDefault);
        selectedReklamaStendSizeIndex = defaultIdx >= 0 ? defaultIdx : 0;

        let modelli = reklamaModelliMi(type);
        reklamaTablichkaQogoz = modelli && !!(sizeList[selectedReklamaStendSizeIndex] || {}).qogozKerak;
        let sizeHtml = sizeList.length > 0 ? `
            <div class="step-title">${modelli ? 'Modelni tanlang:' : "O'lcham:"}</div>
            <div class="options-group" id="reklamaStendSizeGroup"></div>
            ${modelli ? '<div id="reklamaModelInfoBox"></div>' : ''}
        ` : `<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">⚠️ Bu mahsulot uchun hali o'lcham/narx kiritilmagan — Admin Panelda kiriting.</p>`;

        return `
            ${sizeHtml}
            <div class="step-title">Material:</div>
            <div class="options-group" id="reklamaStendMaterialGroup" style="display:flex;">
                <button class="opt-btn active" onclick="setReklamaStendMaterial('Glyans', this)" style="flex:1;">Glyans</button>
                <button class="opt-btn" onclick="setReklamaStendMaterial('Matoviy', this)" style="flex:1;">Matoviy</button>
            </div>
            <div class="form-group" style="margin-top:12px;">
                <label>Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
            </div>
            <div id="reklamaStendTierPreviewBox" style="display:none; margin-top:12px;"></div>
        `;
    }

    // Mijozga tanlangan o'lchamning miqdor bo'yicha to'liq narx jadvalini ko'rsatadi —
    // qaysi oraliqda turgani ajratib beriladi (souvenir tier-preview bilan bir xil uslub).
    function renderReklamaStendTierPreview(type, qty) {
        const box = document.getElementById('reklamaStendTierPreviewBox');
        if (!box) return;
        let sizeList = reklamaStendSizeDatabase[type] || [];
        let size = sizeList[selectedReklamaStendSizeIndex] || sizeList[0];
        let tiers = reklamaStendQtyTiers[type] || [];

        if (!size || tiers.length === 0 || !Array.isArray(size.tierPrices) || size.tierPrices.length === 0) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }

        let activeIdx = findReklamaStendTierIdx(type, qty);
        box.style.display = 'block';
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted); margin-bottom:6px;">Ko'proq olsangiz — dona narxi arzonlashadi.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th></tr></thead>
                <tbody>
                    ${tiers.map((t, idx) => `
                        <tr class="${idx === activeIdx ? 'tier-active' : ''}">
                            <td>${reklamaStendTierLabel(t)} dona${idx === activeIdx ? ' ✓' : ''}</td>
                            <td style="text-align:right;">${(size.tierPrices[idx] || 0).toLocaleString()} so'm</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderReklamaStendSizeOptions(type) {
        let group = document.getElementById('reklamaStendSizeGroup');
        if (!group) return;
        if (reklamaModelliMi(type)) {
            renderReklamaModelKartochkalari(type);
            renderReklamaModelInfo(type);
            return;
        }
        let sizeList = reklamaStendSizeDatabase[type] || [];
        group.innerHTML = sizeList.map((s, idx) => `
            <button class="opt-btn ${idx === selectedReklamaStendSizeIndex ? 'active' : ''}" onclick="selectReklamaStendSize(${idx})">${s.label}</button>
        `).join('');
    }

    function selectReklamaStendSize(index) {
        selectedReklamaStendSizeIndex = index;
        if (reklamaModelliMi(activeProductType)) {
            let m = (reklamaStendSizeDatabase[activeProductType] || [])[index];
            reklamaTablichkaQogoz = !!(m && m.qogozKerak); // yangi model — admin belgilagan standart holat
            renderReklamaModelKartochkalari(activeProductType);
            renderReklamaModelInfo(activeProductType);
            calculate();
            return;
        }
        document.querySelectorAll('#reklamaStendSizeGroup .opt-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === index);
        });
        calculate();
    }

    function setReklamaStendMaterial(material, btnEl) {
        reklamaStendMaterial = material;
        document.querySelectorAll('#reklamaStendMaterialGroup button').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        calculate();
    }

    function calculateResult_reklamaStend(type, qty) {
        renderReklamaStendTierPreview(type, qty);

        let sizeList = reklamaStendSizeDatabase[type] || [];
        let size = sizeList[selectedReklamaStendSizeIndex] || sizeList[0];
        let typeName = reklamaStendNames[type] || type.toUpperCase();
        if (!size) {
            return { details: `${typeName} | Narx kiritilmagan`, baseUnitPrice: 0 };
        }

        // Miqdor oraliqlari sozlangan bo'lsa — narx shundan olinadi, aks holda bazaviy (qat'iy) narx ishlatiladi.
        let unitPrice = size.price;
        let tierNote = '';
        let tiers = reklamaStendQtyTiers[type] || [];
        if (tiers.length > 0 && Array.isArray(size.tierPrices)) {
            let idx = findReklamaStendTierIdx(type, qty);
            if (idx >= 0 && typeof size.tierPrices[idx] === 'number' && size.tierPrices[idx] > 0) {
                unitPrice = size.tierPrices[idx];
                tierNote = ` | Oraliq: ${reklamaStendTierLabel(tiers[idx])} dona`;
            }
        }

        let details = `${typeName} ${size.label} | Material: ${reklamaStendMaterial}${tierNote}`;
        if (reklamaModelliMi(type)) {
            if (reklamaTablichkaQogoz) {
                let qn = parseFloat(size.qogozNarxi) || 0;
                unitPrice += qn;
                details += ` | Ichiga qog'oz: kerak${qn > 0 ? ` (+${qn.toLocaleString()} so'm)` : ''}`;
            } else {
                details += " | Ichiga qog'oz: kerak emas";
            }
        }
        return { details, baseUnitPrice: unitPrice };
    }

    // ---- Admin Panel: miqdor oraliqlari (ranges) mini-muharriri ----
    // Oraliqlar shu turning BARCHA o'lchamlariga umumiy — jadvalning ustunlarini belgilaydi.
    function renderReklamaStendTierRangesEditor(type) {
        const container = document.getElementById('reklamaStendTierRangesEditor');
        if (!container) return;
        let tiers = reklamaStendQtyTiers[type] || [];
        container.innerHTML = tiers.length > 0 ? tiers.map((t, idx) => `
            <div class="tier-range-chip">
                <div class="tier-range-chip-field">
                    <label>Dan</label>
                    <input type="number" min="1" value="${t.from}" oninput="updateReklamaStendTierRange('${type}', ${idx}, 'from', this.value)">
                </div>
                <div class="tier-range-chip-field">
                    <label>Gacha</label>
                    <input type="number" min="0" value="${t.to || ''}" placeholder="∞" oninput="updateReklamaStendTierRange('${type}', ${idx}, 'to', this.value)">
                </div>
                <button type="button" class="tier-range-chip-remove" onclick="removeReklamaStendTierRange('${type}', ${idx})" title="O'chirish">×</button>
            </div>
        `).join('') : `<span style="color:var(--text-muted); font-size:0.82rem;">Hali oraliq qo'shilmagan — narx buyurtma miqdoridan qat'iy nazar bazaviy narxdan olinadi.</span>`;
    }

    function addReklamaStendTierRange() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        let type = currentManagingProduct;
        if (!reklamaStendQtyTiers[type]) reklamaStendQtyTiers[type] = [];
        let tiers = reklamaStendQtyTiers[type];
        let last = tiers[tiers.length - 1];
        let nextFrom = last ? ((last.to && last.to > 0) ? last.to + 1 : last.from + 1) : 1;
        tiers.push({ from: nextFrom, to: 0 });
        // Har bir o'lchamning narxlar ro'yxatiga ham yangi ustun (0 narx bilan) qo'shamiz — indekslar mos kelishi shart
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            if (!Array.isArray(s.tierPrices)) s.tierPrices = [];
            s.tierPrices.push(0);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
    }

    function updateReklamaStendTierRange(type, idx, field, value) {
        let tiers = reklamaStendQtyTiers[type];
        if (!tiers || !tiers[idx]) return;
        tiers[idx][field] = (field === 'to') ? (parseInt(value) || 0) : Math.max(1, parseInt(value) || 1);
        renderAdminReklamaStendSizeTable(type); // ustun sarlavhalari (oraliq nomi) yangilanishi kerak
    }

    function removeReklamaStendTierRange(type, idx) {
        let tiers = reklamaStendQtyTiers[type];
        if (!tiers || !tiers[idx]) return;
        tiers.splice(idx, 1);
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            if (Array.isArray(s.tierPrices)) s.tierPrices.splice(idx, 1);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
    }

    function fillDefaultReklamaStendTierRanges() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        let type = currentManagingProduct;
        if ((reklamaStendQtyTiers[type] || []).length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;

        reklamaStendQtyTiers[type] = reklamaStendDefaultQtyRanges.map(r => ({ ...r }));
        let tierCount = reklamaStendQtyTiers[type].length;
        (reklamaStendSizeDatabase[type] || []).forEach(s => {
            s.tierPrices = withSampleReklamaStendTierPrices(s.price || 0).slice(0, tierCount);
            while (s.tierPrices.length < tierCount) s.tierPrices.push(0);
        });
        renderReklamaStendTierRangesEditor(type);
        renderAdminReklamaStendSizeTable(type);
        showToast("📊 Namuna oraliqlar qo'yildi — narxlarni tekshiring!");
    }

    // ---- Admin Panel: o'lcham/narx jadvali — ustunlar miqdor oraliqlariga qarab dinamik chiqadi ----
    function renderAdminReklamaStendSizeTable(type) {
        let tbody = document.getElementById('adminReklamaStendSizeTableBody');
        let headerRow = document.getElementById('adminReklamaStendTierHeaderRow');
        if (!tbody || !headerRow) return;
        let list = reklamaStendSizeDatabase[type] || [];
        let tiers = reklamaStendQtyTiers[type] || [];

        let modelli = reklamaModelliMi(type);
        let sarlavha = document.getElementById('reklamaStendSizesTitle');
        if (sarlavha) sarlavha.innerText = modelli ? '🖼️ Modellar, rasmlar va narxlari' : "📐 O'lchamlar va Narxlari";
        let extraTh = modelli ? `
            <th style="width: 190px;">Rasmlar</th>
            <th style="width: 200px;">Razmerlari (menejerga ma'lumot)</th>
            <th style="width: 150px;">Ichiga qog'oz (standart)</th>` : '';
        headerRow.innerHTML = `
            <th style="width: 160px;">${modelli ? 'Model nomi' : "O'lcham"}</th>
            ${extraTh}
            <th style="width: 130px;">Bazaviy narx (so'm)</th>
            ${tiers.map(t => `<th style="width: 110px;">${reklamaStendTierLabel(t)} dona</th>`).join('')}
            <th style="width: 90px; text-align:center;">Standart</th>
            <th style="width: 70px; text-align: right;">Amal</th>
        `;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${4 + tiers.length + (modelli ? 3 : 0)}" style="text-align:center; color: var(--text-muted); padding:20px;">Hozircha o'lcham/narx kiritilmagan.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map((s, index) => {
            let tp = Array.isArray(s.tierPrices) ? s.tierPrices : [];
            let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            let extraTd = modelli ? `
                <td>
                    <div class="pen-extra-list" style="margin:0 0 6px;">
                        ${s.rasm ? `<div class="pen-extra-item"><img src="${s.rasm}" alt="asosiy"></div>` : '<span style="color:var(--text-muted); font-size:0.78rem;">asosiy rasm yo\'q</span>'}
                        ${(s.rasmlar || []).map((src, rIdx) => `<div class="pen-extra-item"><img src="${src}" alt=""><button type="button" title="O'chirish" onclick="reklamaModelQoshimchaRasmniOchir(${index}, ${rIdx})">✕</button></div>`).join('')}
                    </div>
                    <label style="font-size:0.74rem;">Asosiy rasm: <input type="file" accept="image/*" onchange="reklamaModelAsosiyRasm(${index}, this)"></label>
                    <label style="font-size:0.74rem;">Qo'shimcha (${REKLAMA_MODEL_QOSHIMCHA_RASM_MAX} gacha): <input type="file" accept="image/*" multiple onchange="reklamaModelQoshimchaRasmlar(${index}, this)"></label>
                </td>
                <td><textarea id="reklstend_razmer_${index}" rows="3" placeholder="masalan: 20x30, 30x40 sm" style="width:100%;">${esc(s.razmerlar)}</textarea></td>
                <td>
                    <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem;"><input type="checkbox" id="reklstend_qogozkerak_${index}" ${s.qogozKerak ? 'checked' : ''}> Standart: kerak</label>
                    <div class="input-unit" style="margin-top:6px;"><input type="number" min="0" id="reklstend_qogoznarx_${index}" value="${s.qogozNarxi || 0}"><span>so'm/dona</span></div>
                </td>` : '';
            return `
            <tr>
                <td><input type="text" id="reklstend_label_${index}" value="${esc(s.label)}"></td>
                ${extraTd}
                <td><input type="number" id="reklstend_price_${index}" value="${s.price}"></td>
                ${tiers.map((t, tIdx) => `<td><input type="number" min="0" id="reklstend_tier_${index}_${tIdx}" value="${tp[tIdx] || 0}"></td>`).join('')}
                <td style="text-align:center;"><input type="radio" name="reklstend_default" id="reklstend_default_${index}" ${s.isDefault ? 'checked' : ''} style="width:16px; height:16px; accent-color: var(--primary);"></td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn btn-danger" title="O'chirish" onclick="deleteReklamaStendSizeRow(${index})">🗑️</button>
                    </div>
                </td>
            </tr>
        `; }).join('');
    }

    function addReklamaStendSizeRow() {
        if (!currentManagingProduct || !reklamaStendTypes.includes(currentManagingProduct)) return;
        if (!reklamaStendSizeDatabase[currentManagingProduct]) reklamaStendSizeDatabase[currentManagingProduct] = [];
        let list = reklamaStendSizeDatabase[currentManagingProduct];
        let tierCount = (reklamaStendQtyTiers[currentManagingProduct] || []).length;
        reklamaModelQatorlariniOqi(currentManagingProduct); // jadvaldagi saqlanmagan o'zgarishlar yo'qolmasin (hamma turda)
        list.push({ label: reklamaModelliMi(currentManagingProduct) ? 'Yangi model' : "Yangi o'lcham", price: 0, isDefault: list.length === 0, tierPrices: new Array(tierCount).fill(0),
            ...(reklamaModelliMi(currentManagingProduct) ? { rasm: '', rasmlar: [], razmerlar: '', qogozKerak: false, qogozNarxi: 0 } : {}) });
        renderAdminReklamaStendSizeTable(currentManagingProduct);
    }

    function deleteReklamaStendSizeRow(index) {
        let list = reklamaStendSizeDatabase[currentManagingProduct] || [];
        if (!list[index]) return;
        if (confirm("Ushbu qatorni o'chirmoqchimisiz?")) {
            reklamaModelQatorlariniOqi(currentManagingProduct);
            let wasDefault = list[index].isDefault;
            list.splice(index, 1);
            if (wasDefault && list.length > 0) list[0].isDefault = true;
            renderAdminReklamaStendSizeTable(currentManagingProduct);
        }
    }

    function saveAllReklamaStendSizes() {
        if (!currentManagingProduct) return;
        let type = currentManagingProduct;
        let list = reklamaStendSizeDatabase[type] || [];
        let tiers = reklamaStendQtyTiers[type] || [];
        if (reklamaModelliMi(type)) {
            // Modellar rasmlari bilan birga saqlanadi (rasm/razmer/qog'oz maydonlari ro'yxatda turibdi)
            reklamaModelQatorlariniOqi(type);
            if (list.length > 0 && !list.some(s => s.isDefault)) list[0].isDefault = true;
            localStorage.setItem('erp_reklama_stend_sizes', JSON.stringify(reklamaStendSizeDatabase));
            localStorage.setItem('erp_reklama_stend_qty_tiers', JSON.stringify(reklamaStendQtyTiers));
            if (typeof logAudit === 'function') logAudit("Reklama modellari o'zgartirildi", `Mahsulot: ${type}, ${list.length} ta model, ${tiers.length} ta oraliq`);
            renderAdminReklamaStendSizeTable(type);
            if (typeof narxTasdiqla === 'function') narxTasdiqla('reklama_' + type);
            showToast("💾 Modellar va narxlar saqlandi!");
            return;
        }
        let updated = [];
        for (let index = 0; index < list.length; index++) {
            let labelInput = document.getElementById(`reklstend_label_${index}`);
            if (!labelInput) continue;
            let priceInput = document.getElementById(`reklstend_price_${index}`);
            let defaultInput = document.getElementById(`reklstend_default_${index}`);
            let tierPrices = tiers.map((t, tIdx) => {
                let el = document.getElementById(`reklstend_tier_${index}_${tIdx}`);
                return el ? (parseFloat(el.value) || 0) : 0;
            });
            updated.push({
                label: labelInput.value.trim() || "Nomsiz",
                price: parseFloat(priceInput.value) || 0,
                isDefault: defaultInput.checked,
                tierPrices
            });
        }
        if (updated.length > 0 && !updated.some(s => s.isDefault)) updated[0].isDefault = true;

        reklamaStendSizeDatabase[type] = updated;
        localStorage.setItem('erp_reklama_stend_sizes', JSON.stringify(reklamaStendSizeDatabase));
        localStorage.setItem('erp_reklama_stend_qty_tiers', JSON.stringify(reklamaStendQtyTiers));
        if (typeof logAudit === 'function') logAudit("Reklama stend o'lchamlari o'zgartirildi", `Mahsulot: ${type}, ${updated.length} ta o'lcham, ${tiers.length} ta oraliq`);
        renderAdminReklamaStendSizeTable(type);
        if (typeof narxTasdiqla === 'function') narxTasdiqla('reklama_' + type);
        showToast("💾 O'lchamlar va narxlar saqlandi!");
    }


    // ====================== TABLICHKA MODELLARI (rasmlar, razmerlar, ichki qog'oz) ======================
    // Tablichka va Nastolniy tablichka: har bir qator — alohida MODEL (nomi — label). Admin model uchun
    // asosiy rasm (rasm), qo'shimcha rasmlar (rasmlar), razmerlar matni (razmerlar — menejerga faqat
    // ma'lumot sifatida ko'rsatiladi), ichiga soladigan qog'oz uchun standart holat (qogozKerak) va
    // qog'oz narxi (qogozNarxi, so'm/dona) kiritadi. Menejer qog'ozni "Kerak / Kerak emas" deb o'zgartira oladi.
    const reklamaModelliTurlar = ['tablichka', 'nastolniy_tablichka'];
    const REKLAMA_MODEL_QOSHIMCHA_RASM_MAX = 12;
    let reklamaTablichkaQogoz = false; // menejer tanlovi (modelni tanlaganda standartga qaytadi)

    function reklamaModelliMi(type) { return reklamaModelliTurlar.includes(type); }

    function reklamaModelRasmlari(m) {
        return [m && m.rasm, ...((m && Array.isArray(m.rasmlar)) ? m.rasmlar : [])].filter(Boolean);
    }

    function renderReklamaModelKartochkalari(type) {
        let group = document.getElementById('reklamaStendSizeGroup');
        if (!group) return;
        let list = reklamaStendSizeDatabase[type] || [];
        group.classList.add('reklama-model-grid');
        group.innerHTML = list.map((m, idx) => `
            <div class="pen-card ${idx === selectedReklamaStendSizeIndex ? 'active' : ''}" onclick="selectReklamaStendSize(${idx})">
                <img src="${m.rasm || placeholderImg('Rasm yo\'q', 100, 75)}" alt="${m.label}" onerror="this.src='${placeholderImg('No Img', 100, 75)}'">
                <span class="pen-name" title="${m.label}">${m.label}</span>
            </div>
        `).join('');
    }

    function renderReklamaModelInfo(type) {
        let box = document.getElementById('reklamaModelInfoBox');
        if (!box) return;
        let list = reklamaStendSizeDatabase[type] || [];
        let m = list[selectedReklamaStendSizeIndex] || list[0];
        if (!m) { box.innerHTML = ''; return; }
        let rasmlar = reklamaModelRasmlari(m);
        let galereya = rasmlar.length > 1 ? `
            <div class="pen-gallery" style="display:flex;">
                <img class="pen-gallery-main" id="reklamaGalleryMain" src="${rasmlar[0]}" alt="${m.label}" onclick="if (typeof openPenGalleryZoom === 'function') openPenGalleryZoom(this.src)">
                <div class="pen-gallery-thumbs">
                    ${rasmlar.map((src, i) => `<img class="${i === 0 ? 'active' : ''}" src="${src}" alt="" onclick="showReklamaGalleryImage(${i})">`).join('')}
                </div>
            </div>` : '';
        let razmer = (m.razmerlar || '').trim();
        box.innerHTML = `
            ${galereya}
            ${razmer ? `<div class="reklama-model-razmer">📐 <b>Razmerlari:</b> ${razmer.replace(/</g, '&lt;')}</div>` : ''}
            <div class="step-title" style="margin-top:12px;">Ichiga soladigan qog'oz:</div>
            <div class="options-group" id="reklamaQogozGroup">
                <button type="button" class="opt-btn ${reklamaTablichkaQogoz ? 'active' : ''}" onclick="setReklamaTablichkaQogoz(true)">📄 Kerak${m.qogozNarxi > 0 ? ` (+${Number(m.qogozNarxi).toLocaleString()} so'm)` : ''}</button>
                <button type="button" class="opt-btn ${!reklamaTablichkaQogoz ? 'active' : ''}" onclick="setReklamaTablichkaQogoz(false)">Kerak emas</button>
            </div>`;
    }

    function showReklamaGalleryImage(i) {
        let list = reklamaStendSizeDatabase[activeProductType] || [];
        let m = list[selectedReklamaStendSizeIndex] || list[0];
        let rasmlar = reklamaModelRasmlari(m);
        let main = document.getElementById('reklamaGalleryMain');
        if (!main || !rasmlar[i]) return;
        main.src = rasmlar[i];
        document.querySelectorAll('#reklamaModelInfoBox .pen-gallery-thumbs img').forEach((el, k) => el.classList.toggle('active', k === i));
    }

    function setReklamaTablichkaQogoz(v) {
        reklamaTablichkaQogoz = !!v;
        renderReklamaModelInfo(activeProductType);
        calculate();
    }

    // Admin: qatordagi (saqlanmagan) maydonlarni ro'yxatga o'qiydi — rasm yuklash/qator o'chirishda yo'qolmasligi uchun
    function reklamaModelQatorlariniOqi(type) {
        let list = reklamaStendSizeDatabase[type] || [];
        let tiers = reklamaStendQtyTiers[type] || [];
        list.forEach((s, index) => {
            let labelInput = document.getElementById(`reklstend_label_${index}`);
            if (!labelInput) return;
            s.label = labelInput.value.trim() || 'Nomsiz';
            s.price = parseFloat(document.getElementById(`reklstend_price_${index}`).value) || 0;
            s.isDefault = document.getElementById(`reklstend_default_${index}`).checked;
            s.tierPrices = tiers.map((t, tIdx) => {
                let el = document.getElementById(`reklstend_tier_${index}_${tIdx}`);
                return el ? (parseFloat(el.value) || 0) : 0;
            });
            if (reklamaModelliMi(type)) {
                s.razmerlar = (document.getElementById(`reklstend_razmer_${index}`)?.value || '').trim();
                s.qogozKerak = !!document.getElementById(`reklstend_qogozkerak_${index}`)?.checked;
                s.qogozNarxi = parseFloat(document.getElementById(`reklstend_qogoznarx_${index}`)?.value) || 0;
            }
        });
    }

    async function reklamaModelAsosiyRasm(index, inputEl) {
        let type = currentManagingProduct;
        let m = (reklamaStendSizeDatabase[type] || [])[index];
        if (!m || !inputEl.files || !inputEl.files[0]) return;
        reklamaModelQatorlariniOqi(type);
        m.rasm = await convertBase64(inputEl.files[0]);
        renderAdminReklamaStendSizeTable(type);
    }

    async function reklamaModelQoshimchaRasmlar(index, inputEl) {
        let type = currentManagingProduct;
        let m = (reklamaStendSizeDatabase[type] || [])[index];
        if (!m) return;
        reklamaModelQatorlariniOqi(type);
        if (!Array.isArray(m.rasmlar)) m.rasmlar = [];
        for (const f of Array.from(inputEl.files || [])) {
            if (m.rasmlar.length >= REKLAMA_MODEL_QOSHIMCHA_RASM_MAX) {
                showToast(`⚠️ Qo'shimcha rasm ${REKLAMA_MODEL_QOSHIMCHA_RASM_MAX} tadan oshmasin.`);
                break;
            }
            try { m.rasmlar.push(await convertBase64(f)); } catch (e) { /* o'qilmagan rasm o'tkazib yuboriladi */ }
        }
        renderAdminReklamaStendSizeTable(type);
    }

    function reklamaModelQoshimchaRasmniOchir(index, rIdx) {
        let type = currentManagingProduct;
        let m = (reklamaStendSizeDatabase[type] || [])[index];
        if (!m || !Array.isArray(m.rasmlar)) return;
        reklamaModelQatorlariniOqi(type);
        m.rasmlar.splice(rIdx, 1);
        renderAdminReklamaStendSizeTable(type);
    }


    // ====================== STEND (turlar × material × chop etish turi) ======================
    // Menejer avval X va Y o'lchamni (mm) kiritadi. Material varag'i (standart 1200x2400 mm): kiritilgan
    // o'lcham varaqqa (aylantirib ham) sig'masa — "Siz kiritgan o'lcham reklama mahsuloti sig'maydi" xabari
    // chiqadi va narx hisoblanmaydi. Admin har bir stend turi uchun RUXSAT BERILGAN materiallar (Akril,
    // Fomaks, ABC, Alikapon) va chop etish turlarini (Ekosolvent, UF pechat, Gravirovka) belgilaydi —
    // ruxsat berilmagani menejerda o'chiq (bosib bo'lmaydigan) tugma bo'ladi.
    // Narx = maydon (kv.m) × (material narxi + chop narxi) + turning qo'shimcha narxi (so'm/dona), marjasiz.
    let stendConfig = {
        varaqEni: 1200,
        varaqBoyi: 2400,
        materiallar: [
            { key: 'akril', nomi: 'Akril', narx: 0 },
            { key: 'fomaks', nomi: 'Fomaks', narx: 0 },
            { key: 'abc', nomi: 'ABC', narx: 0 },
            { key: 'alikapon', nomi: 'Alikapon', narx: 0 }
        ],
        chopTurlari: [
            { key: 'ekosolvent', nomi: 'Ekosolvent', narx: 0 },
            { key: 'uf', nomi: 'UF pechat', narx: 0 },
            { key: 'gravirovka', nomi: 'Gravirovka', narx: 0 }
        ],
        turlar: [
            { key: 'stend1', nomi: 'Stend', materiallar: ['akril', 'fomaks', 'abc', 'alikapon'], chop: ['ekosolvent', 'uf', 'gravirovka'], qoshimchaNarx: 0, isDefault: true }
        ]
    };
    let stendSelected = { turIndex: 0, material: '', chop: '' };

    function stendTuri() { return stendConfig.turlar[stendSelected.turIndex] || stendConfig.turlar[0] || null; }
    function stendMaterial(key) { return stendConfig.materiallar.find(m => m.key === key) || null; }
    function stendChop(key) { return stendConfig.chopTurlari.find(c => c.key === key) || null; }

    // Tanlangan material/chop ruxsat berilgan bo'lmasa — birinchi ruxsat berilganiga o'tadi
    function stendTanlovniTuzat() {
        let t = stendTuri();
        if (!t) return;
        if (!t.materiallar.includes(stendSelected.material)) stendSelected.material = t.materiallar[0] || '';
        if (!t.chop.includes(stendSelected.chop)) stendSelected.chop = t.chop[0] || '';
    }

    function buildStendForm() {
        let def = stendConfig.turlar.findIndex(t => t.isDefault);
        stendSelected = { turIndex: def >= 0 ? def : 0, material: '', chop: '' };
        stendTanlovniTuzat();
        return `
            <div class="poli-calc">
                <div class="step-title">1. O'lchami <span class="paket-step-hint">(mm; material varag'i ${stendConfig.varaqEni}x${stendConfig.varaqBoyi} mm)</span></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>X — eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="stendX" min="1" value="600" oninput="calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Y — bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="stendY" min="1" value="900" oninput="calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="stendOgoh" class="reklama-eni-ogoh" style="display:none;"></div>

                <div class="step-title">2. Stend turi</div>
                <div class="options-group" id="stendTurGroup"></div>

                <div class="step-title">3. Material</div>
                <div class="options-group" id="stendMaterialGroup"></div>

                <div class="step-title">4. Chop etish turi</div>
                <div class="options-group" id="stendChopGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderStendOptions() {
        let turGroup = document.getElementById('stendTurGroup');
        if (!turGroup) return;
        stendTanlovniTuzat();
        let t = stendTuri();
        turGroup.innerHTML = stendConfig.turlar.length === 0
            ? `<span class="paket-xato">⚠️ Stend turlari kiritilmagan — Admin → Stend.</span>`
            : stendConfig.turlar.map((x, i) => `<button type="button" class="opt-btn ${i === stendSelected.turIndex ? 'active' : ''}" onclick="selectStendTur(${i})">${x.nomi}</button>`).join('');
        let tugma = (list, ruxsat, tanlangan, fn) => list.map(x => {
            let mumkin = !!t && ruxsat.includes(x.key);
            return `<button type="button" class="opt-btn ${x.key === tanlangan ? 'active' : ''} ${mumkin ? '' : 'opt-btn-disabled'}" ${mumkin ? '' : 'disabled title="Bu stend turida mavjud emas"'} onclick="${fn}('${x.key}')">${x.nomi}</button>`;
        }).join('');
        document.getElementById('stendMaterialGroup').innerHTML = tugma(stendConfig.materiallar, t ? t.materiallar : [], stendSelected.material, 'selectStendMaterial');
        document.getElementById('stendChopGroup').innerHTML = tugma(stendConfig.chopTurlari, t ? t.chop : [], stendSelected.chop, 'selectStendChop');
    }

    function selectStendTur(i) { stendSelected.turIndex = i; renderStendOptions(); calculate(); }
    function selectStendMaterial(k) { stendSelected.material = k; renderStendOptions(); calculate(); }
    function selectStendChop(k) { stendSelected.chop = k; renderStendOptions(); calculate(); }

    function calculateResult_stend(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let ogoh = document.getElementById('stendOgoh');
        let yaroqsiz = (xabar, korsat) => {
            if (ogoh) { ogoh.style.display = korsat ? 'block' : 'none'; ogoh.innerHTML = korsat ? `⚠️ <b>${xabar}</b>` : ''; }
            return { baseUnitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };
        let x = parseFloat(document.getElementById('stendX')?.value) || 0;
        let y = parseFloat(document.getElementById('stendY')?.value) || 0;
        if (!(x > 0 && y > 0)) return yaroqsiz("X va Y o'lchamlarini kiriting.", false);

        let W = parseFloat(stendConfig.varaqEni) || 0, H = parseFloat(stendConfig.varaqBoyi) || 0;
        let sigadi = (x <= W && y <= H) || (x <= H && y <= W); // aylantirib ham sig'adimi
        if (!sigadi) return yaroqsiz("Siz kiritgan o'lcham reklama mahsuloti sig'maydi", true);
        if (ogoh) { ogoh.style.display = 'none'; ogoh.innerHTML = ''; }

        let t = stendTuri();
        if (!t) return yaroqsiz("Stend turlari kiritilmagan — Admin → Stend.", false);
        stendTanlovniTuzat();
        let mat = stendMaterial(stendSelected.material), chop = stendChop(stendSelected.chop);
        if (!mat || !chop) return yaroqsiz("Bu stend turi uchun material yoki chop etish turi belgilanmagan — Admin → Stend.", false);
        let matNarx = parseFloat(mat.narx) || 0, chopNarx = parseFloat(chop.narx) || 0;
        if (!(matNarx > 0 || chopNarx > 0)) return yaroqsiz(`${mat.nomi} / ${chop.nomi} narxi kiritilmagan — Admin → Stend.`, false);

        let m2 = (x * y) / 1000000;
        let qosh = parseFloat(t.qoshimchaNarx) || 0;
        let unit = m2 * (matNarx + chopNarx) + qosh;
        let costItems = [
            { label: `Material (${mat.nomi}, ${m2.toFixed(2)} kv.m × ${matNarx.toLocaleString()})`, qty: `${qty} dona`, total: Math.round(m2 * matNarx * qty) },
            { label: `Chop (${chop.nomi}, ${m2.toFixed(2)} kv.m × ${chopNarx.toLocaleString()})`, qty: `${qty} dona`, total: Math.round(m2 * chopNarx * qty) }
        ];
        if (qosh > 0) costItems.push({ label: "Stend qo'shimcha narxi", qty: `${qty} dona`, total: Math.round(qosh * qty) });
        return {
            baseUnitPrice: unit, costItems,
            details: `${t.nomi} ${x}x${y}mm | ${mat.nomi} | ${chop.nomi}`
        };
    }

    // ---- Admin: Stend ----
    function renderAdminStend() {
        let q = id => document.getElementById(id);
        if (!q('stendAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('stendAdminVaraqEni').value = stendConfig.varaqEni;
        q('stendAdminVaraqBoyi').value = stendConfig.varaqBoyi;
        q('stendAdminMaterialBody').innerHTML = stendConfig.materiallar.map((m, i) => `
            <tr><td><b>${esc(m.nomi)}</b></td><td><input type="number" min="0" id="stendM_narx_${i}" value="${m.narx}"></td></tr>`).join('');
        q('stendAdminChopBody').innerHTML = stendConfig.chopTurlari.map((c, i) => `
            <tr><td><b>${esc(c.nomi)}</b></td><td><input type="number" min="0" id="stendC_narx_${i}" value="${c.narx}"></td></tr>`).join('');
        let belgi = (list, prefix, i, tanlangan) => list.map(x => `<label style="display:inline-flex; align-items:center; gap:4px; margin:2px 12px 2px 0; white-space:nowrap; font-size:0.84rem;"><input type="checkbox" id="${prefix}_${i}_${x.key}" ${tanlangan.includes(x.key) ? 'checked' : ''}> ${esc(x.nomi)}</label>`).join('');
        q('stendAdminTurlar').innerHTML = stendConfig.turlar.length === 0
            ? `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha tur yo'q — "+ Yangi stend turi" ni bosing.</td></tr>`
            : stendConfig.turlar.map((t, i) => `
            <tr>
                <td><input type="text" id="stendT_nomi_${i}" value="${esc(t.nomi)}" placeholder="Stend turi nomi"></td>
                <td>${belgi(stendConfig.materiallar, 'stendT_mat', i, t.materiallar)}</td>
                <td>${belgi(stendConfig.chopTurlari, 'stendT_chop', i, t.chop)}</td>
                <td><input type="number" min="0" id="stendT_qosh_${i}" value="${t.qoshimchaNarx || 0}"></td>
                <td style="text-align:center;"><input type="radio" name="stendTDefault" id="stendT_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteStendTur(${i})">✕</button></td>
            </tr>`).join('');
    }

    function collectStendFromUI() {
        let q = id => document.getElementById(id);
        if (!q('stendAdminTurlar')) return;
        let son = id => Math.max(0, parseFloat(q(id)?.value) || 0);
        let c = stendConfig;
        c.varaqEni = son('stendAdminVaraqEni');
        c.varaqBoyi = son('stendAdminVaraqBoyi');
        c.materiallar = c.materiallar.map((m, i) => q(`stendM_narx_${i}`) ? { ...m, narx: son(`stendM_narx_${i}`) } : m);
        c.chopTurlari = c.chopTurlari.map((x, i) => q(`stendC_narx_${i}`) ? { ...x, narx: son(`stendC_narx_${i}`) } : x);
        c.turlar = c.turlar.map((t, i) => q(`stendT_nomi_${i}`) ? {
            key: t.key,
            nomi: q(`stendT_nomi_${i}`).value.trim() || `Tur ${i + 1}`,
            materiallar: c.materiallar.filter(m => q(`stendT_mat_${i}_${m.key}`)?.checked).map(m => m.key),
            chop: c.chopTurlari.filter(x => q(`stendT_chop_${i}_${x.key}`)?.checked).map(x => x.key),
            qoshimchaNarx: son(`stendT_qosh_${i}`),
            isDefault: !!q(`stendT_def_${i}`)?.checked
        } : t);
    }

    function addStendTur() {
        collectStendFromUI();
        stendConfig.turlar.push({ key: 'stend' + Date.now().toString(36), nomi: 'Yangi stend turi', materiallar: stendConfig.materiallar.map(m => m.key), chop: stendConfig.chopTurlari.map(x => x.key), qoshimchaNarx: 0, isDefault: stendConfig.turlar.length === 0 });
        renderAdminStend();
    }

    function deleteStendTur(i) {
        collectStendFromUI();
        let t = stendConfig.turlar[i];
        if (!t || !confirm(`"${t.nomi}" turini o'chirasizmi?`)) return;
        let edi = t.isDefault;
        stendConfig.turlar.splice(i, 1);
        if (edi && stendConfig.turlar.length > 0) stendConfig.turlar[0].isDefault = true;
        renderAdminStend();
    }

    function saveStendConfig() {
        collectStendFromUI();
        let c = stendConfig;
        if (!(c.varaqEni > 0 && c.varaqBoyi > 0)) { showToast("⚠️ Material varag'ining o'lchami 0 dan katta bo'lishi kerak!"); return; }
        if (c.turlar.length === 0) { showToast("⚠️ Kamida bitta stend turini kiriting!"); return; }
        if (c.turlar.some(t => t.materiallar.length === 0 || t.chop.length === 0)) { showToast("⚠️ Har bir turga kamida bitta material va bitta chop etish turi belgilang!"); return; }
        if (!c.turlar.some(t => t.isDefault)) c.turlar[0].isDefault = true;
        localStorage.setItem('erp_stend_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Stend sozlamalari o'zgartirildi",
            `Varaq ${c.varaqEni}x${c.varaqBoyi}; materiallar: ${c.materiallar.map(m => `${m.nomi} ${m.narx}`).join(', ')}; chop: ${c.chopTurlari.map(x => `${x.nomi} ${x.narx}`).join(', ')}; turlar: ${c.turlar.map(t => t.nomi).join(', ')}`);
        renderAdminStend();
        showToast("💾 Stend sozlamalari saqlandi!");
    }

    const reklamaExtraOptionsConfig = {
        baner:         { xalqacha: true,  reyka: true,  ustanovka: true, ploter: false },
        orakal:        { xalqacha: false, reyka: false, ustanovka: true, ploter: true, mantajka: true },
        setka_orakal:  { xalqacha: false, reyka: false, ustanovka: true, ploter: false },
        tumanka:       { xalqacha: false, reyka: false, ustanovka: true, ploter: true  },
        xolst:         { xalqacha: false, reyka: true,  ustanovka: false, ploter: false }
    };
    // mantajka — Orakalni montaj plyonkasiga (mantajka) yopishtirish, so'm / kv.m
    let reklamaExtraPrices = { xalqacha: 1000, reyka: 5000, ustanovka: 50000, ploter: 3000, mantajka: 5000 };

    // ====================== MAKSIMAL CHOP ENI (stanok cheklovi) ======================
    // Stanok bir bo'lakda (ulanishsiz) shu kenglikkacha chop etadi. Mahsulotning IKKALA tomoni ham
    // shundan katta bo'lsa (ya'ni aylantirib ham sig'dirib bo'lmasa) — kalkulyatorda ogohlantirish
    // chiqadi. 0 yoki yo'q — cheklov yo'q (masalan Xolst). Admin panelda o'zgartiriladi.
    let reklamaMaxEni = { baner: 3.1, orakal: 1.5, setka_orakal: 1.5, tumanka: 1.5 };

    function reklamaEniOgohlantirishi(type, w, h) {
        let box = document.getElementById('reklamaEniOgoh');
        if (!box) return false;
        let max = parseFloat(reklamaMaxEni[type]) || 0;
        let katta = max > 0 && w > max && h > max;
        box.style.display = katta ? 'block' : 'none';
        if (katta) {
            let m = max.toLocaleString('ru-RU');
            box.innerHTML = `⚠️ <b>Siz kiritgan o'lchamni to'liqligicha chop etishning iloji yo'q.</b> Maksimal ulanishsiz ${m} m chop etiladi, `
                + `sizning o'lchamingiz ulanish bilan bo'ladi — shunga e'tiborli bo'ling. Qo'shimcha ma'lumotni mutaxassisdan oling.`;
        }
        return katta;
    }

    function renderAdminReklamaMaxEni(key) {
        let box = document.getElementById('reklamaBanAdminBox');
        if (!box) return;
        let show = reklamaBanTypes.includes(key);
        box.style.display = show ? 'block' : 'none';
        if (show) document.getElementById('reklamaMaxEniInput').value = reklamaMaxEni[key] || 0;
    }

    function saveReklamaMaxEni() {
        let key = currentManagingProduct;
        let v = parseFloat(document.getElementById('reklamaMaxEniInput').value);
        if (isNaN(v) || v < 0) { showToast("⚠️ 0 yoki undan katta son kiriting (metrda)!"); return; }
        let eski = reklamaMaxEni[key] || 0;
        reklamaMaxEni[key] = v;
        localStorage.setItem('erp_reklama_max_eni', JSON.stringify(reklamaMaxEni));
        if (typeof logAudit === 'function') logAudit("Maksimal chop eni o'zgartirildi", `${key}: ${eski} m → ${v} m`);
        showToast("💾 Maksimal chop eni saqlandi!");
    }
    function toggleReklamaExtra(name) {
        if (name === 'xalqacha') {
            let box = document.getElementById('xalqachaCountBox');
            let chk = document.getElementById('chkXalqacha');
            if (box && chk) box.style.display = chk.checked ? 'block' : 'none';
        } else if (name === 'ustanovka') {
            let box = document.getElementById('ustanovkaHeightBox');
            let chk = document.getElementById('chkUstanovka');
            if (box && chk) box.style.display = chk.checked ? 'block' : 'none';
        }
        calculate();
    }

    function syncXalqachaReykaExclusive() {
        let chkX = document.getElementById('chkXalqacha');
        let chkR = document.getElementById('chkReyka');
        if (!chkX || !chkR) return;

        if (chkX.checked) chkR.checked = false;
        if (chkR.checked) chkX.checked = false;

        chkR.disabled = chkX.checked;
        chkX.disabled = chkR.checked;

        let cardX = chkX.closest('.reklama-extra-card');
        let cardR = chkR.closest('.reklama-extra-card');
        if (cardX) cardX.classList.toggle('reklama-extra-card-disabled', chkX.disabled);
        if (cardR) cardR.classList.toggle('reklama-extra-card-disabled', chkR.disabled);

        let box = document.getElementById('xalqachaCountBox');
        if (box) box.style.display = chkX.checked ? 'block' : 'none';
    }

    function editReklamaExtraPrice(field) {
        let labels = { xalqacha: "Xalqacha narxi (so'm/dona)", reyka: "Reyka narxi (so'm/metr)", ploter: "Ploter narxi (so'm/kv.m)",
            mantajka: "Mantajka yopishtirish narxi (so'm/kv.m)", ustanovka: "Ustanovka narxi (so'm, bir martalik)" };
        let oldPrice = reklamaExtraPrices[field] || 0;
        let newPrice = prompt(`Yangi ${labels[field]} kiriting:`, oldPrice);
        if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
            reklamaExtraPrices[field] = parseFloat(newPrice);
            localStorage.setItem('erp_reklama_extra_prices', JSON.stringify(reklamaExtraPrices));
            if (typeof logAudit === 'function') logAudit("Reklama qo'shimcha narxi o'zgartirildi", `${labels[field]}: ${oldPrice.toLocaleString()} → ${parseFloat(newPrice).toLocaleString()} so'm`);
            renderAdminPensTable();
            showToast("✅ Narx yangilandi!");
        }
    }


function generateFormHtml_reklama(type) {
    let html = '';
            let opt = reklamaExtraOptionsConfig[type] || { xalqacha: false, reyka: false, ustanovka: false, ploter: false };

            let xalqachaCardHtml = opt.xalqacha ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkXalqacha" onchange="toggleReklamaExtra('xalqacha'); syncXalqachaReykaExclusive();" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            🔘 Xalqacha qo'yib berish
                        </label>
                        <div id="xalqachaCountBox" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
                            <label style="display:block; font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-bottom:6px;">Nechta xalqacha (dona):</label>
                            <input type="number" id="inpXalqachaCount" value="4" min="1" oninput="calculate()" style="width:100%; height:40px; padding:8px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:#fff; box-sizing:border-box;">
                        </div>
                    </div>` : '';

            let reykaCardHtml = opt.reyka ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkReyka" onchange="calculate(); syncXalqachaReykaExclusive();" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            📏 Reyka bilan tayyorlash
                        </label>
                    </div>` : '';

            let ploterCardHtml = opt.ploter ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkPloter" onchange="calculate()" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            ✂️ Ploter qilish
                        </label>
                    </div>` : '';

            let mantajkaCardHtml = opt.mantajka ? `
                    <div class="reklama-extra-card" style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkMantajka" onchange="calculate()" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            🧻 Mantajka yopishtirish
                        </label>
                    </div>` : '';

            let ustanovkaCardHtml = opt.ustanovka ? `
                    <div class="reklama-extra-card">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:0.88rem; color:var(--text-main);">
                            <input type="checkbox" id="chkUstanovka" onchange="toggleReklamaExtra('ustanovka')" style="width:17px; height:17px; accent-color:var(--primary); flex-shrink:0; margin:0;">
                            🛠️ Ustanovka qilish
                        </label>
                        <div id="ustanovkaHeightBox" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
                            <label style="display:block; font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-bottom:6px;">O'rnatish balandligi (metr):</label>
                            <input type="number" id="inpUstanovkaHeight" value="2" min="0.1" step="0.1" oninput="calculate()" style="width:100%; height:40px; padding:8px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:#fff; box-sizing:border-box;">
                            <div id="ustanovkaWarning" style="display:none; margin-top:10px; padding:10px 12px; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:8px; font-size:0.8rem; line-height:1.4;">
                                ⚠️ 2 metrdan balandroqqa o'rnatish uchun mutaxassis bilan kelishib oling.
                            </div>
                        </div>
                    </div>` : '';

            let extrasSectionHtml = (opt.xalqacha || opt.reyka || opt.ustanovka || opt.ploter || opt.mantajka) ? `
                <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
                    <div class="step-title" style="margin-bottom:10px;">Qo'shimcha xizmatlar:</div>
                    ${xalqachaCardHtml}
                    ${reykaCardHtml}
                    ${ploterCardHtml}
                    ${mantajkaCardHtml}
                    ${ustanovkaCardHtml}
                </div>` : '';

            html = `
                <div class="form-group" style="margin-bottom:12px; flex-direction:row; gap:10px;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                        <label>Eni (metr):</label>
                        <input type="number" id="inpWidth" value="2" min="0.1" step="0.1" oninput="calculate()">
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                        <label>Bo'yi (metr):</label>
                        <input type="number" id="inpHeight" value="1" min="0.1" step="0.1" oninput="calculate()">
                    </div>
                </div>
                ${(parseFloat(reklamaMaxEni[type]) || 0) > 0 ? `<div class="reklama-eni-hint">Ulanishsiz maksimal chop eni: <b>${reklamaMaxEni[type]} m</b></div>` : ''}
                <div id="reklamaEniOgoh" class="reklama-eni-ogoh" style="display:none;"></div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Adad (dona):</label>
                    <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
                </div>
                ${extrasSectionHtml}
            `;

    return html;
}

function calculateResult_reklama(activeProductTypeParam, qty, baseCost) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;
                let w = parseFloat(document.getElementById('inpWidth')?.value) || 0;
                let h = parseFloat(document.getElementById('inpHeight')?.value) || 0;
                let sqMetr = w * h;
                baseUnitPrice = sqMetr * baseCost;
                details = `${w}m x ${h}m (${sqMetr.toFixed(2)} kv.m)`;
                if (reklamaEniOgohlantirishi(activeProductType, w, h)) {
                    details += ` | ⚠️ ulanish bilan (maks. ${reklamaMaxEni[activeProductType]} m)`;
                }

                let extraParts = [];

                let chkXalqacha = document.getElementById('chkXalqacha');
                if (chkXalqacha && chkXalqacha.checked) {
                    let xCount = parseInt(document.getElementById('inpXalqachaCount')?.value) || 0;
                    baseUnitPrice += xCount * (reklamaExtraPrices.xalqacha || 0);
                    extraParts.push(`Xalqacha: ${xCount} dona`);
                }

                let chkReyka = document.getElementById('chkReyka');
                if (chkReyka && chkReyka.checked) {
                    baseUnitPrice += w * (reklamaExtraPrices.reyka || 0);
                    extraParts.push(`Reyka bilan tayyorlangan`);
                }

                let chkPloter = document.getElementById('chkPloter');
                if (chkPloter && chkPloter.checked) {
                    baseUnitPrice += sqMetr * (reklamaExtraPrices.ploter || 0);
                    extraParts.push(`Ploter qilingan`);
                }

                // Mantajka yopishtirish — kv.m bo'yicha (admin 1 kv.m narxini kiritadi)
                let chkMantajka = document.getElementById('chkMantajka');
                if (chkMantajka && chkMantajka.checked) {
                    baseUnitPrice += sqMetr * (reklamaExtraPrices.mantajka || 0);
                    extraParts.push(`Mantajka yopishtirilgan`);
                }

                let chkUstanovka = document.getElementById('chkUstanovka');
                let ustanovkaWarningBox = document.getElementById('ustanovkaWarning');
                if (chkUstanovka && chkUstanovka.checked) {
                    let uHeight = parseFloat(document.getElementById('inpUstanovkaHeight')?.value) || 0;
                    extraParts.push(`Ustanovka (${uHeight}m balandlik)`);
                    if (ustanovkaWarningBox) {
                        ustanovkaWarningBox.style.display = uHeight > 2 ? 'block' : 'none';
                    }
                } else if (ustanovkaWarningBox) {
                    ustanovkaWarningBox.style.display = 'none';
                }

                if (extraParts.length > 0) details += ` | ${extraParts.join(', ')}`;

    return { details, baseUnitPrice };
}

    // ====================== TABLICHKA MAHSULOTLARI (Bayroqlar kabi: admin mahsulot qo'shib boradi) ======================
    // Tablichka va Nastolniy tablichka: admin har bir mahsulot uchun nom (title), rasm, ma'lumot va
    // MIQDOR ORALIQLARINI (har biri o'z narxlari bilan) kiritadi. Chop etish turi ikkita: UF pechat va Gravirovka —
    // har oraliqda ikkalasining narxi alohida (narxi 0 bo'lgan chop turi shu mahsulotda mavjud emas).
    // Ichiga soladigan qog'oz — ixtiyoriy (mahsulot belgilasa): standart holat + qo'shimcha narx (so'm/dona).
    // Narx (dona) = tanlangan chop turining oraliq narxi (+ qog'oz narxi) × Marja (core.js).
    // Mahsulot: { id, name, info, imageUrl, tierlar: [{ from, to, uf, gravirovka }], qogozBor, qogozKerak, qogozNarxi, standart }
    // standart — kalkulyator ochilganda shu mahsulot tanlangan turadi (birortasida bo'lmasa — birinchisi).
    const tablichkaTurlar = ['tablichka', 'nastolniy_tablichka'];
    const TABLICHKA_CHOP = { uf: 'UF pechat', gravirovka: 'Gravirovka' };
    let tablichkaDatabase = { tablichka: [], nastolniy_tablichka: [] };
    let tablichkaSelectedId = null;
    let tablichkaChop = 'uf';       // mijoz tanlovi
    let tablichkaQogoz = false;     // mijoz tanlovi (mahsulot tanlanganda admin belgilagan standartga qaytadi)
    let tablichkaEditId = null;
    let tablichkaAdminTierlar = [{ from: 1, to: 0, uf: 0, gravirovka: 0 }];

    function tablichkaMi(type) { return tablichkaTurlar.includes(type); }
    function tbId() { return 'TB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
    function tbEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    function tablichkaTierlar(item) {
        return ((item && item.tierlar) || [])
            .map(t => ({
                from: Math.max(1, parseInt(t.from) || 1),
                to: Math.max(0, parseInt(t.to) || 0),
                uf: Math.max(0, parseFloat(t.uf) || 0),
                gravirovka: Math.max(0, parseFloat(t.gravirovka) || 0)
            }))
            .sort((a, b) => a.from - b.from);
    }

    // Miqdorga mos oraliq: mos kelmasa — eng kichikdan pastda birinchisi, eng kattadan yuqorida oxirgisi
    function tablichkaTierFor(item, qty) {
        let list = tablichkaTierlar(item);
        if (list.length === 0) return null;
        let n = parseInt(qty) || 1;
        for (let t of list) {
            if (n >= t.from && n <= tierUpper(t)) return t;
        }
        return n < list[0].from ? list[0] : list[list.length - 1];
    }

    // Mahsulotda qaysi chop turlari mavjud (hech bo'lmasa bitta oraliqda narxi bor)
    function tablichkaChopRuxsat(item) {
        let list = tablichkaTierlar(item);
        return Object.keys(TABLICHKA_CHOP).filter(k => list.some(t => t[k] > 0));
    }

    function tablichkaMahsulotlari(type) { return tablichkaDatabase[type] || []; }
    function tablichkaTanlangan(type) {
        let list = tablichkaMahsulotlari(type);
        return list.find(it => it.id === tablichkaSelectedId) || list.find(it => it.standart) || list[0] || null;
    }

    // Eski modellarni (reklamaStendSizeDatabase: label/rasm/razmerlar/tierPrices) yangi tuzilmaga o'tkazadi.
    // Eski narx chop turiga bo'linmagan edi — ikkala chop turiga bir xil yoziladi, admin keyin ajratadi.
    function tablichkaEskidanOtkazish() {
        tablichkaTurlar.forEach(type => {
            let tiers = reklamaStendQtyTiers[type] || [];
            tablichkaDatabase[type] = (reklamaStendSizeDatabase[type] || []).map(m => {
                let tp = Array.isArray(m.tierPrices) ? m.tierPrices : [];
                let tierlar = tiers.length > 0
                    ? tiers.map((t, i) => ({ from: t.from, to: t.to || 0, uf: tp[i] > 0 ? tp[i] : (m.price || 0), gravirovka: tp[i] > 0 ? tp[i] : (m.price || 0) }))
                    : [{ from: 1, to: 0, uf: m.price || 0, gravirovka: m.price || 0 }];
                return {
                    id: tbId(), name: m.label || 'Nomsiz', info: m.razmerlar || '', imageUrl: m.rasm || '',
                    tierlar, standart: !!m.isDefault, qogozBor: !!(m.qogozKerak || parseFloat(m.qogozNarxi) > 0), qogozKerak: !!m.qogozKerak, qogozNarxi: parseFloat(m.qogozNarxi) || 0
                };
            });
        });
    }

    function saqlaTablichka() {
        localStorage.setItem('erp_tablichka_db', JSON.stringify(tablichkaDatabase));
    }

    // ---------------- MIJOZ tomoni ----------------
    function generateFormHtml_tablichka(type) {
        let list = tablichkaMahsulotlari(type);
        let boshlang = list.find(it => it.standart) || list[0];
        tablichkaSelectedId = boshlang ? boshlang.id : null;
        tablichkaTanlovniBoshlash(type);
        if (list.length === 0) {
            return `<p style="color:var(--text-muted); font-size:0.85rem;">⚠️ Hali mahsulot kiritilmagan — Admin Panelda kiriting.</p>`;
        }
        return `
            <div class="step-title">1. Mahsulotni tanlang (${list.length} ta mavjud):</div>
            <div class="bayroq-grid" id="tablichkaGrid"></div>
            <div id="tablichkaSpecBox"></div>
            <div class="form-group" style="margin-top:10px;">
                <label>2. Adad (dona):</label>
                <input type="number" id="inpQuantity" value="1" min="1" oninput="calculate()">
            </div>
            <div id="tablichkaTierBox" style="margin-top:12px;"></div>
        `;
    }

    // Yangi mahsulot tanlanganda: standart chop turi — birinchi mavjud, qog'oz — admin belgilagan standart
    function tablichkaTanlovniBoshlash(type) {
        let item = tablichkaTanlangan(type);
        let ruxsat = item ? tablichkaChopRuxsat(item) : [];
        tablichkaChop = ruxsat.includes('uf') ? 'uf' : (ruxsat[0] || 'uf');
        tablichkaQogoz = !!(item && item.qogozBor && item.qogozKerak);
    }

    function renderTablichkaPicker(type) {
        let grid = document.getElementById('tablichkaGrid');
        if (!grid) return;
        let active = tablichkaTanlangan(type);
        grid.innerHTML = tablichkaMahsulotlari(type).map(item => `
            <div class="bayroq-card ${active && active.id === item.id ? 'active' : ''}" onclick="selectTablichka('${item.id}')">
                <img src="${item.imageUrl || placeholderImg('Rasm yo\'q', 100, 75)}" alt="${tbEsc(item.name)}" onerror="this.src='${placeholderImg('No Img', 100, 75)}'">
                <div class="bayroq-card-name" title="${tbEsc(item.name)}">${tbEsc(item.name)}</div>
            </div>
        `).join('');
    }

    function selectTablichka(id) {
        tablichkaSelectedId = id;
        tablichkaTanlovniBoshlash(activeProductType);
        renderTablichkaPicker(activeProductType);
        calculate();
    }

    function setTablichkaChop(k) { tablichkaChop = k; calculate(); }
    function setTablichkaQogoz(v) { tablichkaQogoz = !!v; calculate(); }

    // Tanlangan mahsulot ma'lumoti + chop turi + (bo'lsa) ichiga qog'oz tanlovi
    function renderTablichkaSpecBox(type, item) {
        let box = document.getElementById('tablichkaSpecBox');
        if (!box) return;
        if (!item) { box.innerHTML = ''; return; }
        let ruxsat = tablichkaChopRuxsat(item);
        let chopHtml = `
            <div class="step-title" style="margin-top:8px;">Chop etish turi</div>
            <div class="options-group">
                ${Object.keys(TABLICHKA_CHOP).map(k => {
                    let mumkin = ruxsat.includes(k);
                    return `<button type="button" class="opt-btn ${k === tablichkaChop ? 'active' : ''} ${mumkin ? '' : 'opt-btn-disabled'}" ${mumkin ? '' : 'disabled title="Bu mahsulotda mavjud emas"'} onclick="setTablichkaChop('${k}')">${TABLICHKA_CHOP[k]}</button>`;
                }).join('')}
            </div>`;
        let qogozHtml = item.qogozBor ? `
            <div class="step-title" style="margin-top:8px;">Ichiga soladigan qog'oz</div>
            <div class="options-group">
                <button type="button" class="opt-btn ${tablichkaQogoz ? 'active' : ''}" onclick="setTablichkaQogoz(true)">📄 Kerak${item.qogozNarxi > 0 ? ` (+${Number(item.qogozNarxi).toLocaleString()} so'm)` : ''}</button>
                <button type="button" class="opt-btn ${!tablichkaQogoz ? 'active' : ''}" onclick="setTablichkaQogoz(false)">Kerak emas</button>
            </div>` : '';
        let infoHtml = (item.info || '').trim() ? `<div style="white-space:pre-line; background:rgba(0,0,0,0.03); border:1px solid var(--border); border-radius:8px; padding:10px; margin:8px 0; font-size:0.78rem; color:var(--text-muted); line-height:1.5;">${tbEsc(item.info)}</div>` : '';
        box.innerHTML = infoHtml + chopHtml + qogozHtml;
    }

    // Tanlangan chop turi bo'yicha to'liq narx jadvali (qaysi oraliqda turgani ajratiladi)
    function renderTablichkaTierBox(item, qty) {
        let box = document.getElementById('tablichkaTierBox');
        if (!box) return;
        let list = tablichkaTierlar(item);
        if (!item || list.length < 2) { box.innerHTML = ''; return; }
        let aktiv = tablichkaTierFor(item, qty);
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted); margin-bottom:6px;">Ko'proq olsangiz — dona narxi arzonlashadi.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th></tr></thead>
                <tbody>${list.map(t => `
                    <tr class="${t === aktiv ? 'tier-active' : ''}">
                        <td>${tierLabel(t)}${t === aktiv ? ' ✓' : ''}</td>
                        <td style="text-align:right;">${t[tablichkaChop] > 0 ? t[tablichkaChop].toLocaleString() + " so'm" : '—'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    function calculateResult_tablichka(type, qty) {
        let typeName = reklamaStendNames[type] || type;
        let item = tablichkaTanlangan(type);
        if (!item) return { details: `${typeName} | Mahsulot kiritilmagan — Admin Panelda kiriting`, baseUnitPrice: 0 };
        let ruxsat = tablichkaChopRuxsat(item);
        if (!ruxsat.includes(tablichkaChop)) tablichkaChop = ruxsat[0] || tablichkaChop;
        renderTablichkaPicker(type);
        renderTablichkaSpecBox(type, item);
        renderTablichkaTierBox(item, qty);
        let t = tablichkaTierFor(item, qty);
        if (!t || !(t[tablichkaChop] > 0)) return { details: `${typeName} ${item.name} | Narx kiritilmagan (Admin Panel)`, baseUnitPrice: 0 };
        let unit = t[tablichkaChop];
        let details = `${typeName} ${item.name} | Chop: ${TABLICHKA_CHOP[tablichkaChop]}`;
        if (tablichkaTierlar(item).length > 1) details += ` | Oraliq: ${tierLabel(t)}`;
        if (item.qogozBor) {
            if (tablichkaQogoz) {
                let qn = parseFloat(item.qogozNarxi) || 0;
                unit += qn;
                details += ` | Ichiga qog'oz: kerak${qn > 0 ? ` (+${qn.toLocaleString()} so'm)` : ''}`;
            } else {
                details += " | Ichiga qog'oz: kerak emas";
            }
        }
        return { details, baseUnitPrice: unit };
    }

    // ---------------- ADMIN tomoni ----------------
    function renderTablichkaAdmin(type) {
        let title = document.getElementById('tablichkaAdminSarlavha');
        if (title) title.innerText = `🪧 ${reklamaStendNames[type] || type} — mahsulotlar`;
        tablichkaBekorQilish();
        renderTablichkaAdminGrid(type);
    }

    function renderTablichkaAdminGrid(type) {
        let grid = document.getElementById('tablichkaAdminGrid');
        if (!grid) return;
        let list = tablichkaMahsulotlari(type);
        let countEl = document.getElementById('tablichkaAdminCount');
        if (countEl) countEl.textContent = list.length > 0 ? `${list.length} ta mahsulot` : '';
        if (list.length === 0) {
            grid.innerHTML = `<div class="model-grid-empty">📭 Hozircha mahsulot qo'shilmagan.<br>Yuqoridagi formadan birinchisini qo'shing.</div>`;
            return;
        }
        grid.innerHTML = list.map(item => {
            let t0 = tablichkaTierlar(item)[0];
            let narx = t0 ? Math.max(t0.uf, t0.gravirovka) : 0;
            return `
            <div class="model-card">
                <div class="model-card-top">
                    <div class="model-card-thumb"><img src="${item.imageUrl || placeholderImg('No Img', 80, 80)}" onerror="this.src='${placeholderImg('No Img', 80, 80)}'"></div>
                    <div class="model-card-head"><div class="model-card-name" title="${tbEsc(item.name)}">${tbEsc(item.name)}</div></div>
                    <div class="action-btns model-card-actions">
                        <button class="btn btn-warning" title="Tahrirlash" onclick="tablichkaTahrirlash('${item.id}')">✏️</button>
                        <button class="btn btn-danger" title="O'chirish" onclick="tablichkaOchirish('${item.id}')">🗑️</button>
                    </div>
                </div>
                <div class="model-card-body"><div class="model-card-price">${narx > 0 ? narx.toLocaleString() + " so'm" + (tablichkaTierlar(item).length > 1 ? ' dan' : '') : '—'}</div></div>
            </div>`;
        }).join('');
    }

    function renderTablichkaTierRows() {
        let box = document.getElementById('tablichkaTierRows');
        if (!box) return;
        box.innerHTML = tablichkaAdminTierlar.map((t, i) => `
            <div class="bayroq-tier-row">
                <div class="form-group"><label>Dan (dona)</label><input type="number" id="tbTier_from_${i}" min="1" value="${t.from}"></div>
                <div class="form-group"><label>Gacha (0 = cheksiz)</label><input type="number" id="tbTier_to_${i}" min="0" value="${t.to}"></div>
                <div class="form-group"><label>UF pechat narxi (so'm)</label><input type="number" id="tbTier_uf_${i}" min="0" value="${t.uf}"></div>
                <div class="form-group"><label>Gravirovka narxi (so'm)</label><input type="number" id="tbTier_grav_${i}" min="0" value="${t.gravirovka}"></div>
                <button type="button" class="btn btn-danger" title="Oraliqni o'chirish" onclick="tablichkaOraliqOchir(${i})">✕</button>
            </div>
        `).join('');
        let warn = document.getElementById('tablichkaTierWarn');
        if (warn) warn.innerHTML = tierValidationMessages(tablichkaAdminTierlar).map(m => `<div>⚠️ ${m}</div>`).join('');
    }

    function tablichkaOraliqlarniOqi() {
        return tablichkaAdminTierlar.map((t, i) => {
            let q = id => document.getElementById(id);
            if (!q(`tbTier_from_${i}`)) return t;
            return {
                from: Math.max(1, parseInt(q(`tbTier_from_${i}`).value) || 1),
                to: Math.max(0, parseInt(q(`tbTier_to_${i}`).value) || 0),
                uf: Math.max(0, parseFloat(q(`tbTier_uf_${i}`).value) || 0),
                gravirovka: Math.max(0, parseFloat(q(`tbTier_grav_${i}`).value) || 0)
            };
        });
    }

    function tablichkaOraliqQosh() {
        tablichkaAdminTierlar = tablichkaOraliqlarniOqi();
        let last = tablichkaAdminTierlar[tablichkaAdminTierlar.length - 1];
        let from = last ? (last.to > 0 ? last.to + 1 : last.from + 1) : 1;
        if (last && last.to === 0) last.to = Math.max(last.from, from - 1); // oldingi cheksiz oraliqni yopamiz
        tablichkaAdminTierlar.push({ from, to: 0, uf: last ? last.uf : 0, gravirovka: last ? last.gravirovka : 0 });
        renderTablichkaTierRows();
    }

    function tablichkaOraliqOchir(i) {
        tablichkaAdminTierlar = tablichkaOraliqlarniOqi();
        if (tablichkaAdminTierlar.length <= 1) { showToast("⚠️ Kamida bitta oraliq bo'lishi kerak"); return; }
        tablichkaAdminTierlar.splice(i, 1);
        renderTablichkaTierRows();
    }

    function tablichkaQogozBorOzgardi() {
        let bor = !!document.getElementById('tablichkaQogozBor')?.checked;
        let box = document.getElementById('tablichkaQogozMaydonlar');
        if (box) box.style.display = bor ? '' : 'none';
    }

    async function tablichkaRasmTanlash(inputEl) {
        const img = document.getElementById('tablichkaImagePreview');
        const placeholder = document.getElementById('tablichkaImagePreviewPlaceholder');
        if (!img || !inputEl.files || !inputEl.files[0]) return;
        img.src = await convertBase64(inputEl.files[0]);
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    }

    function tablichkaFormaniToldir(item) {
        let q = id => document.getElementById(id);
        q('tablichkaFormTitle').innerText = item ? '✏️ Mahsulotni tahrirlash' : "➕ Yangi mahsulot qo'shish";
        q('tablichkaNameInput').value = item ? item.name : '';
        let info = q('tablichkaInfoInput');
        info.value = item ? (item.info || '') : '';
        info.style.height = 'auto';
        info.style.height = Math.max(200, info.scrollHeight) + 'px';
        q('tablichkaStandart').checked = !!(item && item.standart);
        q('tablichkaQogozBor').checked = !!(item && item.qogozBor);
        q('tablichkaQogozKerak').checked = !!(item && item.qogozKerak);
        q('tablichkaQogozNarxi').value = item ? (item.qogozNarxi || 0) : 0;
        tablichkaQogozBorOzgardi();
        tablichkaAdminTierlar = item ? tablichkaTierlar(item) : [{ from: 1, to: 0, uf: 0, gravirovka: 0 }];
        if (tablichkaAdminTierlar.length === 0) tablichkaAdminTierlar = [{ from: 1, to: 0, uf: 0, gravirovka: 0 }];
        renderTablichkaTierRows();
        let img = q('tablichkaImagePreview'), placeholder = q('tablichkaImagePreviewPlaceholder');
        if (item && item.imageUrl) { img.src = item.imageUrl; img.style.display = 'block'; placeholder.style.display = 'none'; }
        else { img.removeAttribute('src'); img.style.display = 'none'; placeholder.style.display = 'block'; }
        q('tablichkaFileInput').value = '';
        q('btnTablichkaBekor').style.display = item ? 'inline-flex' : 'none';
    }

    function tablichkaTahrirlash(id) {
        let item = tablichkaMahsulotlari(currentManagingProduct).find(it => it.id === id);
        if (!item) return;
        tablichkaEditId = id;
        tablichkaFormaniToldir(item);
        document.getElementById('tablichkaNameInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function tablichkaBekorQilish() {
        tablichkaEditId = null;
        if (document.getElementById('tablichkaNameInput')) tablichkaFormaniToldir(null);
    }

    function saveTablichkaItem() {
        let type = currentManagingProduct;
        if (!tablichkaMi(type)) return;
        let q = id => document.getElementById(id);
        let name = q('tablichkaNameInput').value.trim();
        let info = q('tablichkaInfoInput').value.trim();
        let tierlar = tablichkaOraliqlarniOqi().sort((a, b) => a.from - b.from);
        let imageUrl = q('tablichkaImagePreview').src || '';
        if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) imageUrl = '';
        if (typeof rasmManzilNisbiy === 'function') imageUrl = rasmManzilNisbiy(imageUrl);
        let standart = q('tablichkaStandart').checked;
        let qogozBor = q('tablichkaQogozBor').checked;
        let qogozKerak = qogozBor && q('tablichkaQogozKerak').checked;
        let qogozNarxi = qogozBor ? Math.max(0, parseFloat(q('tablichkaQogozNarxi').value) || 0) : 0;

        if (!name) { showToast("⚠️ Mahsulot nomini kiriting!"); return; }
        if (!tierlar.some(t => t.uf > 0 || t.gravirovka > 0)) { showToast("⚠️ Kamida bitta oraliqqa narx kiriting!"); return; }

        let list = tablichkaMahsulotlari(type);
        let item = tablichkaEditId ? list.find(it => it.id === tablichkaEditId) : null;
        if (item) {
            Object.assign(item, { name, info, tierlar, standart, qogozBor, qogozKerak, qogozNarxi });
            if (imageUrl) item.imageUrl = imageUrl;
            if (typeof logAudit === 'function') logAudit("Tablichka mahsuloti tahrirlandi", `${type}: ${name}`);
        } else {
            item = { id: tbId(), name, info, imageUrl, tierlar, standart, qogozBor, qogozKerak, qogozNarxi };
            list.push(item);
            if (typeof logAudit === 'function') logAudit("Tablichka mahsuloti qo'shildi", `${type}: ${name}`);
        }
        if (standart) list.forEach(it => { if (it !== item) it.standart = false; }); // standart bitta bo'ladi
        tablichkaDatabase[type] = list;
        saqlaTablichka();
        if (typeof narxTasdiqla === 'function') narxTasdiqla('reklama_' + type);
        tablichkaBekorQilish();
        renderTablichkaAdminGrid(type);
        showToast("✅ Saqlandi!");
    }

    function tablichkaOchirish(id) {
        let type = currentManagingProduct;
        let item = tablichkaMahsulotlari(type).find(it => it.id === id);
        if (!item || !confirm(`"${item.name}" o'chirilsinmi?`)) return;
        tablichkaDatabase[type] = tablichkaMahsulotlari(type).filter(it => it.id !== id);
        saqlaTablichka();
        if (typeof logAudit === 'function') logAudit("Tablichka mahsuloti o'chirildi", `${type}: ${item.name}`);
        if (tablichkaEditId === id) tablichkaBekorQilish();
        renderTablichkaAdminGrid(type);
        showToast("🗑️ O'chirildi!");
    }

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('reklama', {
        init: function () {
            let savedMaxEni = localStorage.getItem('erp_reklama_max_eni');
            if (savedMaxEni) {
                try {
                    reklamaMaxEni = { ...reklamaMaxEni, ...JSON.parse(savedMaxEni) };
                } catch (e) {}
            }

            let savedReklamaExtra = localStorage.getItem('erp_reklama_extra_prices');
            if (savedReklamaExtra) {
                reklamaExtraPrices = { ...reklamaExtraPrices, ...JSON.parse(savedReklamaExtra) };
            }

            let savedReklamaStendSizes = localStorage.getItem('erp_reklama_stend_sizes');
            if (savedReklamaStendSizes) {
                try {
                    reklamaStendSizeDatabase = { ...reklamaStendSizeDatabase, ...JSON.parse(savedReklamaStendSizes) };
                } catch (e) {}
            }

            let savedStend = localStorage.getItem('erp_stend_config');
            if (savedStend) {
                try {
                    let st = JSON.parse(savedStend);
                    if (st && typeof st === 'object') {
                        stendConfig = {
                            ...stendConfig, ...st,
                            materiallar: Array.isArray(st.materiallar) && st.materiallar.length ? st.materiallar : stendConfig.materiallar,
                            chopTurlari: Array.isArray(st.chopTurlari) && st.chopTurlari.length ? st.chopTurlari : stendConfig.chopTurlari,
                            turlar: Array.isArray(st.turlar) && st.turlar.length ? st.turlar : stendConfig.turlar
                        };
                    }
                } catch (e) {}
            }

            let savedReklamaStendQtyTiers = localStorage.getItem('erp_reklama_stend_qty_tiers');
            if (savedReklamaStendQtyTiers) {
                try {
                    reklamaStendQtyTiers = { ...reklamaStendQtyTiers, ...JSON.parse(savedReklamaStendQtyTiers) };
                } catch (e) {}
            }

            // Tablichka mahsulotlari (Bayroqlar kabi katalog): saqlangani bo'lmasa — eski modellardan bir martalik o'tkazish
            let savedTablichka = localStorage.getItem('erp_tablichka_db');
            let tablichkaOqildi = false;
            if (savedTablichka) {
                try {
                    let p = JSON.parse(savedTablichka);
                    if (p && typeof p === 'object') {
                        tablichkaTurlar.forEach(t => { tablichkaDatabase[t] = Array.isArray(p[t]) ? p[t] : []; });
                        tablichkaOqildi = true;
                    }
                } catch (e) {}
            }
            if (!tablichkaOqildi) {
                tablichkaEskidanOtkazish();
                saqlaTablichka();
            }
        }
    });
