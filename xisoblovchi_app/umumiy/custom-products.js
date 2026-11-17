// ====================== MAXSUS (CUSTOM) MAHSULOTLAR ======================
// Admin panel orqali, kod yozmasdan yangi mahsulot turi qo'shish imkoniyati.
// Qamrov ongli ravishda cheklangan: faqat "oddiy" narxlash (miqdor oralig'i +
// chop etish turi bo'yicha jadval, ixtiyoriy bir martalik to'lov, ixtiyoriy
// o'lcham/tomonlik). Poligrafiya grammaji, tekstil rulon-DTF, reklama-stend
// o'lcham-variant kabi tubdan farqli hisoblash mexanizmlari BU YERGA kirmaydi —
// ular hali ham dasturchi tomonidan qo'shiladi. Mavjud ~50 mahsulot turiga
// (allCategories, index.html statik grid) BU FAYL HECH QANDAY TA'SIR QILMAYDI —
// ular butunlay o'z holicha ishlashda davom etadi.

// VAQTINCHA O'CHIRILGAN: admin paneldagi "➕ Yangi mahsulot qo'shish" tugmasi yashirilgan.
// Kod to'liq saqlangan — qayta yoqish uchun true qiling (keyin takomillashtiriladi).
// Avval qo'shilgan maxsus mahsulotlar (agar bo'lsa) odatdagidek ishlashda davom etadi.
const MAXSUS_MAHSULOT_QOSHISH_YOQILGAN = false;

let customProductsDb = [];
let customTierState = []; // {from, to, prices:{uv,dtf,gravirovka}} — forma tahrirlanayotgan holat
let editingCustomProductKey = null; // null = yangi qo'shish, aks holda tahrirlanayotgan mahsulot key'i
let selectedCustomSides = 1;

const customProductCatMeta = {
    poligrafiya: { title: 'Poligrafiya mahsulotlari', gridId: 'grid-poligrafiya' },
    textile:     { title: 'Tekstil mahsulotlari',     gridId: 'grid-textile' },
    souvenir:    { title: 'Suvenir mahsulotlari',      gridId: 'grid-souvenir' },
    reklama:     { title: 'Reklama mahsulotlari',      gridId: 'grid-reklama' }
};
const customPrintTypeLabels = { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' };

// ---- Yuklash / saqlash ----
function loadCustomProducts() {
    let saved = null;
    try { saved = localStorage.getItem('erp_custom_products_v1'); } catch (e) {}
    try {
        customProductsDb = saved ? JSON.parse(saved) : [];
    } catch (e) {
        customProductsDb = [];
    }
    // Klishe (bir martalik to'lov) tanlagan custom mahsulotlarni umumiy tizimga
    // ro'yxatdan o'tkazamiz — core.js calculate() shu ikki global massivni o'qiydi
    // (klisheFeeProductTypes / klisheOneTimePrices), boshqa hech narsani o'zgartirish shart emas.
    customProductsDb.forEach(p => {
        if (p.hasKlisheFee && typeof klisheFeeProductTypes !== 'undefined') {
            if (!klisheFeeProductTypes.includes(p.key)) klisheFeeProductTypes.push(p.key);
            klisheOneTimePrices[p.key] = p.klisheFee || 0;
        }
    });
}

function saveCustomProductsDb() {
    localStorage.setItem('erp_custom_products_v1', JSON.stringify(customProductsDb));
}

function getCustomProduct(key) {
    return customProductsDb.find(p => p.key === key);
}
function isCustomProductKey(key) {
    return !!getCustomProduct(key);
}

// ---- Menejer/mijoz ekrani: dinamik kartalar ----
function renderCustomProductCards() {
    Object.keys(customProductCatMeta).forEach(catKey => {
        let grid = document.getElementById(customProductCatMeta[catKey].gridId);
        if (!grid) return;
        grid.querySelectorAll('.product-card[data-custom-card="1"]').forEach(el => el.remove());
        customProductsDb.filter(p => p.category === catKey).forEach(p => {
            let card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-custom-card', '1');
            card.onclick = function () { openCalc(p.key, p.name); };
            card.innerHTML = '<div class="icon">' + (p.icon || '🆕') + '</div><h3>' + p.name + '</h3>';
            grid.appendChild(card);
        });
    });
}

// ---- Admin ekrani: ro'yxat va boshqaruv ----
function renderCustomProductsAdminSection() {
    let container = document.getElementById('customProductsSection');
    if (!container) return;
    if (customProductsDb.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <div class="admin-cat-section admin-cat-accent-violet" data-cat-section="custom">
            <div class="admin-cat-section-head">
                <span class="admin-cat-section-badge">🆕</span>
                <span class="admin-cat-section-title">Maxsus mahsulotlar (qo'lda qo'shilgan)</span>
                <span class="admin-cat-section-count">${customProductsDb.length} ta</span>
            </div>
            <div class="admin-cat-grid">
                ${customProductsDb.map(p => `
                    <div class="admin-cat-card" onclick="openEditCustomProduct('${p.key}')">
                        <span class="admin-cat-icon-badge">${p.icon || '🆕'}</span>
                        <span class="admin-cat-name">${p.name}</span>
                        <button type="button" onclick="deleteCustomProduct('${p.key}', event)" title="O'chirish" style="background:none;border:none;color:var(--magenta);font-size:1rem;cursor:pointer;padding:2px 6px;">🗑️</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ---- Forma ochish/yopish ----
function openAddCustomProduct() {
    if (!MAXSUS_MAHSULOT_QOSHISH_YOQILGAN) return;
    editingCustomProductKey = null;
    customTierState = [{ from: 1, to: 0, prices: { uv: 0, dtf: 0, gravirovka: 0 } }];
    document.getElementById('customProductFormTitle').innerText = "➕ Yangi mahsulot qo'shish";
    document.getElementById('cpName').value = '';
    document.getElementById('cpIcon').value = '🆕';
    document.getElementById('cpCategory').value = 'souvenir';
    document.getElementById('cpPrint_uv').checked = true;
    document.getElementById('cpPrint_dtf').checked = false;
    document.getElementById('cpPrint_gravirovka').checked = false;
    document.getElementById('cpHasSize').checked = false;
    document.getElementById('cpHasSides').checked = false;
    document.getElementById('cpHasKlishe').checked = false;
    document.getElementById('cpKlisheFee').value = 0;
    document.getElementById('cpKlisheFeeRow').style.display = 'none';
    renderCustomTierEditor();
    document.getElementById('customProductFormBox').style.display = 'block';
    document.getElementById('customProductFormBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openEditCustomProduct(key) {
    let p = getCustomProduct(key);
    if (!p) return;
    editingCustomProductKey = key;
    customTierState = (p.tiers || []).map(t => ({ from: t.from, to: t.to, prices: Object.assign({}, t.prices) }));
    document.getElementById('customProductFormTitle').innerText = "✎ Mahsulotni tahrirlash: " + p.name;
    document.getElementById('cpName').value = p.name;
    document.getElementById('cpIcon').value = p.icon || '🆕';
    document.getElementById('cpCategory').value = p.category;
    document.getElementById('cpPrint_uv').checked = (p.printTypes || []).includes('uv');
    document.getElementById('cpPrint_dtf').checked = (p.printTypes || []).includes('dtf');
    document.getElementById('cpPrint_gravirovka').checked = (p.printTypes || []).includes('gravirovka');
    document.getElementById('cpHasSize').checked = !!p.hasSize;
    document.getElementById('cpHasSides').checked = !!p.hasSides;
    document.getElementById('cpHasKlishe').checked = !!p.hasKlisheFee;
    document.getElementById('cpKlisheFee').value = p.klisheFee || 0;
    document.getElementById('cpKlisheFeeRow').style.display = p.hasKlisheFee ? 'flex' : 'none';
    renderCustomTierEditor();
    document.getElementById('customProductFormBox').style.display = 'block';
    document.getElementById('customProductFormBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCustomProductForm() {
    document.getElementById('customProductFormBox').style.display = 'none';
}

function toggleCustomKlisheRow() {
    let checked = document.getElementById('cpHasKlishe').checked;
    document.getElementById('cpKlisheFeeRow').style.display = checked ? 'flex' : 'none';
}

// ---- Narx jadvali (tier) muharriri ----
function selectedCustomPrintTypesInForm() {
    let out = [];
    if (document.getElementById('cpPrint_uv') && document.getElementById('cpPrint_uv').checked) out.push('uv');
    if (document.getElementById('cpPrint_dtf') && document.getElementById('cpPrint_dtf').checked) out.push('dtf');
    if (document.getElementById('cpPrint_gravirovka') && document.getElementById('cpPrint_gravirovka').checked) out.push('gravirovka');
    return out.length ? out : ['uv'];
}

function renderCustomTierEditor() {
    let selectedTypes = selectedCustomPrintTypesInForm();
    const head = document.getElementById('cpTierHead');
    const body = document.getElementById('cpTierBody');
    if (!head || !body) return;

    head.innerHTML = '<th style="width:90px;">Dan (dona)</th><th style="width:90px;">Gacha</th>' +
        selectedTypes.map(k => '<th style="width:130px;">' + customPrintTypeLabels[k] + ' narxi</th>').join('') +
        '<th style="width:60px;"></th>';

    if (customTierState.length === 0) {
        body.innerHTML = '<tr><td colspan="' + (selectedTypes.length + 3) + '" style="padding:12px; color:#b45309; font-size:0.82rem;">Hali oraliq yo\'q — "+ Oraliq qo\'shish" tugmasini bosing.</td></tr>';
        return;
    }

    body.innerHTML = customTierState.map((t, i) => `
        <tr>
            <td><input type="number" min="1" value="${t.from || 1}" oninput="updateCustomTier(${i}, 'from', this.value)"></td>
            <td><input type="number" min="0" value="${t.to || 0}" placeholder="∞" oninput="updateCustomTier(${i}, 'to', this.value)"></td>
            ${selectedTypes.map(k => `<td><input type="number" min="0" value="${(t.prices && t.prices[k]) || 0}" oninput="updateCustomTierPrice(${i}, '${k}', this.value)"></td>`).join('')}
            <td><button type="button" class="tier-remove" onclick="removeCustomTierRow(${i})">✕</button></td>
        </tr>
    `).join('');
}

function onCustomPrintTypeToggle() {
    renderCustomTierEditor();
}

function addCustomTierRow() {
    let last = customTierState[customTierState.length - 1];
    let nextFrom = last ? (last.to ? (parseInt(last.to) + 1) : (parseInt(last.from) + 1)) : 1;
    customTierState.push({
        from: nextFrom, to: 0,
        prices: last ? Object.assign({}, last.prices) : { uv: 0, dtf: 0, gravirovka: 0 }
    });
    renderCustomTierEditor();
}

function removeCustomTierRow(i) {
    customTierState.splice(i, 1);
    renderCustomTierEditor();
}

function updateCustomTier(i, field, value) {
    if (!customTierState[i]) return;
    customTierState[i][field] = parseInt(value) || 0;
}

function updateCustomTierPrice(i, key, value) {
    if (!customTierState[i]) return;
    if (!customTierState[i].prices) customTierState[i].prices = {};
    customTierState[i].prices[key] = parseFloat(value) || 0;
}

// ---- Saqlash / o'chirish ----
function saveCustomProduct() {
    let name = (document.getElementById('cpName').value || '').trim();
    let icon = (document.getElementById('cpIcon').value || '🆕').trim() || '🆕';
    let category = document.getElementById('cpCategory').value;
    let printTypes = selectedCustomPrintTypesInForm().filter(k => document.getElementById('cpPrint_' + k).checked);
    let hasSize = document.getElementById('cpHasSize').checked;
    let hasSides = document.getElementById('cpHasSides').checked;
    let hasKlisheFee = document.getElementById('cpHasKlishe').checked;
    let klisheFee = parseFloat(document.getElementById('cpKlisheFee').value) || 0;

    if (!name) { showToast("⚠️ Mahsulot nomini kiriting!"); return; }
    if (printTypes.length === 0) { showToast("⚠️ Kamida bitta chop etish turini tanlang!"); return; }
    if (customTierState.length === 0) { showToast("⚠️ Kamida bitta narx oralig'i kerak!"); return; }

    let tiers = customTierState.map(t => ({
        from: parseInt(t.from) || 1,
        to: parseInt(t.to) || 0,
        prices: Object.assign({}, t.prices)
    }));

    let key = editingCustomProductKey || ('custom_' + Date.now());
    let entry = {
        key, name, icon, category, printTypes, hasSize, hasSides, hasKlisheFee, klisheFee, tiers,
        createdAt: new Date().toISOString()
    };

    if (editingCustomProductKey) {
        let idx = customProductsDb.findIndex(p => p.key === editingCustomProductKey);
        if (idx >= 0) customProductsDb[idx] = entry;
    } else {
        customProductsDb.push(entry);
    }

    klisheFeeProductTypes = klisheFeeProductTypes.filter(k => k !== key);
    if (hasKlisheFee) {
        klisheFeeProductTypes.push(key);
        klisheOneTimePrices[key] = klisheFee;
    } else {
        delete klisheOneTimePrices[key];
    }
    localStorage.setItem('erp_klishe_prices', JSON.stringify(klisheOneTimePrices));

    saveCustomProductsDb();
    renderCustomProductsAdminSection();
    renderCustomProductCards();
    closeCustomProductForm();
    showToast("✅ Mahsulot saqlandi!");
    if (typeof logAudit === 'function') logAudit("Mahsulot qo'shildi/tahrirlandi", name);
}

function deleteCustomProduct(key, evt) {
    if (evt) evt.stopPropagation();
    let p = getCustomProduct(key);
    if (!p) return;
    if (!confirm('"' + p.name + '" mahsulotini butunlay o\'chirmoqchimisiz?')) return;
    customProductsDb = customProductsDb.filter(x => x.key !== key);
    klisheFeeProductTypes = klisheFeeProductTypes.filter(k => k !== key);
    delete klisheOneTimePrices[key];
    saveCustomProductsDb();
    localStorage.setItem('erp_klishe_prices', JSON.stringify(klisheOneTimePrices));
    renderCustomProductsAdminSection();
    renderCustomProductCards();
    showToast("🗑️ Mahsulot o'chirildi.");
}

// ---- Menejer tomonidagi hisoblash formasi ----
function generateFormHtml_custom(type) {
    let p = getCustomProduct(type);
    if (!p) return '<p>Mahsulot topilmadi.</p>';

    selectedPrintType = p.printTypes[0];
    selectedCustomSides = 1;

    let html = `<div class="form-group"><label>Miqdor (dona):</label><input type="number" id="inpQuantity" min="1" value="10" oninput="calculate()"></div>`;

    if (p.printTypes.length > 1) {
        html += `<div class="form-group"><label>Chop etish turi:</label><div class="options-group" id="customPrintTypeGroup">
            ${p.printTypes.map(k => `<button type="button" class="opt-btn ${k === selectedPrintType ? 'active' : ''}" data-ptype="${k}" onclick="selectCustomPrintType('${k}')">${customPrintTypeLabels[k]}</button>`).join('')}
        </div></div>`;
    }

    if (p.hasSides) {
        html += `<div class="form-group"><label>Bosma tomonligi:</label><div class="options-group" id="customSidesGroup">
            <button type="button" class="opt-btn active" data-sides="1" onclick="selectCustomSides(1)">Bir tomonlama</button>
            <button type="button" class="opt-btn" data-sides="2" onclick="selectCustomSides(2)">Ikki tomonlama</button>
        </div></div>`;
    }

    if (p.hasSize) {
        html += `<div class="form-group" style="display:flex; gap:10px;">
            <div style="flex:1;"><label>Kengligi (mm):</label><input type="number" id="inpCustomWidth" min="0" value="0" oninput="calculate()"></div>
            <div style="flex:1;"><label>Balandligi (mm):</label><input type="number" id="inpCustomHeight" min="0" value="0" oninput="calculate()"></div>
        </div>`;
    }

    return html;
}

function selectCustomPrintType(type) {
    selectedPrintType = type;
    document.querySelectorAll('#customPrintTypeGroup .opt-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.ptype === type);
    });
    calculate();
}

function selectCustomSides(sides) {
    selectedCustomSides = sides;
    document.querySelectorAll('#customSidesGroup .opt-btn').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.sides) === sides);
    });
    calculate();
}

function calculateResult_custom(type, qty) {
    let p = getCustomProduct(type);
    if (!p) return { details: "Mahsulot topilmadi", baseUnitPrice: 0 };

    let tiers = (p.tiers || []).slice().sort((a, b) => (a.from || 0) - (b.from || 0));
    let tier = tiers.find(t => qty >= (t.from || 1) && (!t.to || qty <= t.to));
    if (!tier) tier = tiers[tiers.length - 1];

    let baseUnitPrice = tier && tier.prices ? (tier.prices[selectedPrintType] || 0) : 0;
    if (p.hasSides && selectedCustomSides === 2) baseUnitPrice *= 2;

    let details = p.name;
    if (p.printTypes.length > 1) details += ' | ' + customPrintTypeLabels[selectedPrintType];
    if (p.hasSides) details += ' | ' + (selectedCustomSides === 1 ? 'Bir tomonlama' : 'Ikki tomonlama');
    if (p.hasSize) {
        let wEl = document.getElementById('inpCustomWidth');
        let hEl = document.getElementById('inpCustomHeight');
        let w = wEl ? (parseFloat(wEl.value) || 0) : 0;
        let h = hEl ? (parseFloat(hEl.value) || 0) : 0;
        if (w > 0 && h > 0) details += ` | O'lcham: ${w}x${h}mm`;
    }

    return { details, baseUnitPrice };
}

loadCustomProducts();
renderCustomProductCards();
renderCustomProductsAdminSection();

if (!MAXSUS_MAHSULOT_QOSHISH_YOQILGAN) {
    let addBtn = document.getElementById('addCustomProductBtn');
    if (addBtn) addBtn.style.display = 'none';
}
