// ====================== MAHSULOT RASMLARI VA MA'LUMOTI (barcha mahsulotlar uchun) ======================
// Har qanday mahsulot (Poligrafiya, Tekstil, Suvenir, Reklama...) uchun admin asosiy rasm, qo'shimcha rasmlar (12 tagacha) va
// menejerga ko'rsatiladigan ma'lumot matnini kiritadi. Menejer kalkulyator tepasida "ℹ️ Mahsulot haqida" blokida ko'radi.
// Modelli mahsulotlarning (Suvenir, Tablichka) o'z model rasmlari bundan mustaqil — bu umumiy mahsulot kartochkasi.
// Rasmlar yuklanganda convertBase64 orqali siqiladi; server yoqilgan bo'lsa serverda saqlanadi (rasm-ombori.js).

const MAHSULOT_MALUMOTI_KALITI = 'erp_mahsulot_malumoti';
const MAHSULOT_QOSHIMCHA_RASM_MAX = 12;
const MAHSULOT_ADMIN_BLOK_YASHIRIN = true;
let mahsulotMalumoti = {};
let mahsulotAdminHolati = null; // admin formasida tahrirlanayotgan nusxa: { kalit, rasm, rasmlar, matn }

function mahsulotMalumotiYukla() {
    try {
        let saqlangan = JSON.parse(localStorage.getItem(MAHSULOT_MALUMOTI_KALITI) || '{}');
        mahsulotMalumoti = (saqlangan && typeof saqlangan === 'object' && !Array.isArray(saqlangan)) ? saqlangan : {};
    } catch (e) { mahsulotMalumoti = {}; }
}
mahsulotMalumotiYukla();

function mahsulotRasmlari(m) {
    return [m && m.rasm, ...((m && Array.isArray(m.rasmlar)) ? m.rasmlar : [])].filter(Boolean);
}

function mahsulotMalumotiBormi(m) {
    return !!(m && (mahsulotRasmlari(m).length || (m.matn || '').trim()));
}

// ---------- Menejer: kalkulyator tepasida ----------
function mahsulotMalumotiKorsat(type) {
    let box = document.getElementById('mahsulotMalumotiBox');
    if (!box) return;
    let m = mahsulotMalumoti[type];
    if (!mahsulotMalumotiBormi(m)) { box.innerHTML = ''; box.style.display = 'none'; return; }
    let rasmlar = mahsulotRasmlari(m);
    let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    box.style.display = '';
    box.innerHTML = `
        <details class="mahsulot-malumot">
            <summary>ℹ️ Mahsulot haqida</summary>
            <div class="mahsulot-malumot-ichki">
                ${rasmlar.length ? `
                <div class="pen-gallery" style="display:flex;">
                    <img class="pen-gallery-main" id="mahsulotGalleryMain" src="${rasmlar[0]}" alt="" onclick="if (typeof openPenGalleryZoom === 'function') openPenGalleryZoom(this.src)">
                    ${rasmlar.length > 1 ? `<div class="pen-gallery-thumbs">${rasmlar.map((s, i) => `<img class="${i === 0 ? 'active' : ''}" src="${s}" alt="" onclick="mahsulotGalereyaRasmi(${i})">`).join('')}</div>` : ''}
                </div>` : ''}
                ${(m.matn || '').trim() ? `<div class="mahsulot-malumot-matn">${esc(m.matn)}</div>` : ''}
            </div>
        </details>`;
}

function mahsulotGalereyaRasmi(i) {
    let m = mahsulotMalumoti[activeProductType];
    let rasmlar = mahsulotRasmlari(m);
    let asosiy = document.getElementById('mahsulotGalleryMain');
    if (!asosiy || !rasmlar[i]) return;
    asosiy.src = rasmlar[i];
    document.querySelectorAll('#mahsulotMalumotiBox .pen-gallery-thumbs img').forEach((el, k) => el.classList.toggle('active', k === i));
}

// ---------- Admin: har bir mahsulot sahifasi tepasida ----------
function mahsulotMalumotiAdminChiz(kalit) {
    let box = document.getElementById('mahsulotMalumotiAdminBox');
    if (!box) return;
    // Admin sahifalarida umumiy "Mahsulot rasmlari va ma'lumoti" bloki ko'rsatilmaydi (talab bo'yicha olib tashlangan).
    // Rasm/ma'lumot mahsulotning o'z formasida (Bayroq, Tablichka...) kiritiladi. Quyidagi tahrirlash kodi saqlab qo'yilgan:
    // blokni qaytarish uchun MAHSULOT_ADMIN_BLOK_YASHIRIN ni false qiling.
    if (MAHSULOT_ADMIN_BLOK_YASHIRIN) { box.innerHTML = ''; mahsulotAdminHolati = null; return; }
    let m = mahsulotMalumoti[kalit] || {};
    mahsulotAdminHolati = { kalit, rasm: m.rasm || '', rasmlar: Array.isArray(m.rasmlar) ? m.rasmlar.slice() : [], matn: m.matn || '' };
    mahsulotAdminQayta();
}

function mahsulotAdminQayta() {
    let box = document.getElementById('mahsulotMalumotiAdminBox');
    let h = mahsulotAdminHolati;
    if (!box || !h) return;
    let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    box.innerHTML = `
        <div class="add-pen-card" style="margin-bottom:16px;">
            <div class="add-pen-card-title">🖼️ Mahsulot rasmlari va ma'lumoti</div>
            <p class="admin-hint">Menejer kalkulyator tepasida "ℹ️ Mahsulot haqida" blokida ko'radi: asosiy rasm, qo'shimcha rasmlar (${MAHSULOT_QOSHIMCHA_RASM_MAX} tagacha) va matn
                (masalan: qog'oz turlari, tayyorlash muddati, eslatma). Hammasi ixtiyoriy.</p>
            <div class="form-group">
                <label>Asosiy rasm:</label>
                <div class="pen-extra-list" style="margin:0 0 6px;">
                    ${h.rasm ? `<div class="pen-extra-item"><img src="${h.rasm}" alt=""><button type="button" title="O'chirish" onclick="mahsulotAsosiyRasmniOchir()">✕</button></div>` : '<span style="color:var(--text-muted); font-size:0.8rem;">rasm yo\'q</span>'}
                </div>
                <input type="file" accept="image/*" onchange="mahsulotAsosiyRasm(this)">
            </div>
            <div class="form-group">
                <label>Qo'shimcha rasmlar (${h.rasmlar.length} / ${MAHSULOT_QOSHIMCHA_RASM_MAX}):</label>
                <div class="pen-extra-list">
                    ${h.rasmlar.map((s, i) => `<div class="pen-extra-item"><img src="${s}" alt=""><button type="button" title="O'chirish" onclick="mahsulotQoshimchaRasmniOchir(${i})">✕</button></div>`).join('')}
                </div>
                <input type="file" accept="image/*" multiple onchange="mahsulotQoshimchaRasmlar(this)">
            </div>
            <div class="form-group">
                <label>Menejerga ko'rsatiladigan ma'lumot:</label>
                <textarea id="mahsulotMatnInput" rows="4" style="width:100%;" placeholder="masalan: Tayyorlash muddati 2–3 kun. Maket mijozdan PDF shaklida olinadi.">${esc(h.matn)}</textarea>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-success" onclick="saveMahsulotMalumoti()">💾 Rasm va ma'lumotni saqlash</button>
            </div>
        </div>`;
}

function mahsulotMatnniOqi() {
    let t = document.getElementById('mahsulotMatnInput');
    if (t && mahsulotAdminHolati) mahsulotAdminHolati.matn = t.value;
}

async function mahsulotAsosiyRasm(inputEl) {
    if (!mahsulotAdminHolati || !inputEl.files || !inputEl.files[0]) return;
    mahsulotMatnniOqi();
    try { mahsulotAdminHolati.rasm = await convertBase64(inputEl.files[0]); } catch (e) { showToast("⚠️ Rasmni o'qib bo'lmadi."); }
    mahsulotAdminQayta();
}

function mahsulotAsosiyRasmniOchir() {
    if (!mahsulotAdminHolati) return;
    mahsulotMatnniOqi();
    mahsulotAdminHolati.rasm = '';
    mahsulotAdminQayta();
}

async function mahsulotQoshimchaRasmlar(inputEl) {
    let h = mahsulotAdminHolati;
    if (!h) return;
    mahsulotMatnniOqi();
    for (const f of Array.from(inputEl.files || [])) {
        if (h.rasmlar.length >= MAHSULOT_QOSHIMCHA_RASM_MAX) { showToast(`⚠️ Qo'shimcha rasm ${MAHSULOT_QOSHIMCHA_RASM_MAX} tadan oshmasin.`); break; }
        try { h.rasmlar.push(await convertBase64(f)); } catch (e) { /* o'qilmagan rasm o'tkazib yuboriladi */ }
    }
    mahsulotAdminQayta();
}

function mahsulotQoshimchaRasmniOchir(i) {
    if (!mahsulotAdminHolati) return;
    mahsulotMatnniOqi();
    mahsulotAdminHolati.rasmlar.splice(i, 1);
    mahsulotAdminQayta();
}

function saveMahsulotMalumoti() {
    let h = mahsulotAdminHolati;
    if (!h) return;
    mahsulotMatnniOqi();
    let yozuv = { rasm: h.rasm, rasmlar: h.rasmlar.slice(0, MAHSULOT_QOSHIMCHA_RASM_MAX), matn: (h.matn || '').trim() };
    if (mahsulotMalumotiBormi(yozuv)) mahsulotMalumoti[h.kalit] = yozuv;
    else delete mahsulotMalumoti[h.kalit];
    try {
        localStorage.setItem(MAHSULOT_MALUMOTI_KALITI, JSON.stringify(mahsulotMalumoti));
    } catch (e) {
        showToast("⚠️ Brauzer xotirasi to'ldi — rasm saqlanmadi. Server rasmlarini yoqing yoki rasm sonini kamaytiring.");
        return;
    }
    if (typeof logAudit === 'function') logAudit("Mahsulot rasmi/ma'lumoti o'zgartirildi", `${h.kalit}: ${mahsulotRasmlari(yozuv).length} ta rasm, matn ${yozuv.matn.length} belgi`);
    showToast("💾 Mahsulot rasmi va ma'lumoti saqlandi!");
}
