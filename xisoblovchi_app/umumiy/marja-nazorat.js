// ====================== MARJA UCHUN MINIMAL CHEGARA ======================
// Admin "Marja himoyasi" kartochkasida minimal marjani (%) belgilaydi (0 — cheklov yo'q). Menejer shundan past marja
// kiritsa: narx ko'rinadi, lekin "Natijani nusxalash" va "Tijoriy taklifga qo'shish" bloklanadi — admin PIN kodi bilan
// tasdiqlanishi kerak. Admin foydalanuvchiga cheklov qo'llanmaydi.
// Tasdiq faqat shu seans uchun (xotirada) va faqat tasdiqlangan marja va undan yuqorisi uchun amal qiladi; tizimdan
// chiqilganda yoki sahifa yangilanganda bekor bo'ladi. Har bir tasdiq o'zgarishlar tarixiga yoziladi.
// Eslatma: ilova brauzerda ishlaydi, shuning uchun bu — tasodifan past narx qo'yishdan saqlovchi nazorat, kuchli
// xavfsizlik to'sig'i emas (haqiqiy himoya uchun server tomonida tekshirish kerak).

const MARJA_CHEGARA_KALITI = 'erp_marja_chegarasi';
let marjaTasdiqlanganPast = null; // admin tasdiqlagan eng past marja (%)

function marjaChegarasi() {
    try { return Math.max(0, parseFloat(localStorage.getItem(MARJA_CHEGARA_KALITI)) || 0); } catch (e) { return 0; }
}

function marjaAdminmi() {
    return typeof currentUser !== 'undefined' && !!currentUser && currentUser.role === 'admin';
}

// Berilgan marja menejer uchun chegaradan pastmi (va tasdiqlanmaganmi)?
function marjaPastmi(marja) {
    let chegara = marjaChegarasi();
    if (!(chegara > 0) || marjaAdminmi()) return false;
    if (marjaTasdiqlanganPast !== null && marja >= marjaTasdiqlanganPast) return false;
    return marja < chegara;
}

function marjaTasdiqniTozala() {
    marjaTasdiqlanganPast = null;
}

// Marja maydoni tagida ogohlantirish (calculate() har safar chaqiradi)
function marjaNazoratYangila() {
    let input = document.getElementById('inpMargin');
    let karta = input ? input.closest('.margin-card') : null;
    let eski = document.getElementById('marjaNazoratBox');
    if (!karta) { if (eski) eski.remove(); return; }
    let marja = parseFloat(input.value);
    if (isNaN(marja) || !marjaPastmi(marja)) { if (eski) eski.remove(); return; }
    if (!eski) {
        eski = document.createElement('div');
        eski.id = 'marjaNazoratBox';
        eski.className = 'marja-nazorat';
        karta.appendChild(eski);
    }
    eski.innerHTML = `⚠️ Marja <b>${marja}%</b> — admin belgilagan minimal <b>${marjaChegarasi()}%</b> dan past. ` +
        `Natijani nusxalash va tijoriy taklifga qo'shish uchun admin tasdig'i kerak. ` +
        `<button type="button" class="btn btn-outline" onclick="marjaTasdiqOynasi()">🔑 Admin tasdig'i</button>`;
}

// Bloklanadigan amallar (nusxalash, taklifga qo'shish) shuni chaqiradi: true — davom etish mumkin
function marjaRuxsatBormi() {
    let marja = (typeof currentCalcResult !== 'undefined' && currentCalcResult) ? currentCalcResult.marginPercent : undefined;
    if (typeof marja !== 'number' || !marjaPastmi(marja)) return true;
    showToast(`⚠️ Marja ${marja}% minimal ${marjaChegarasi()}% dan past — admin tasdig'i kerak.`);
    marjaTasdiqOynasi();
    return false;
}

function marjaTasdiqOynasi() {
    if (document.getElementById('marjaTasdiqOverlay')) return;
    let ov = document.createElement('div');
    ov.id = 'marjaTasdiqOverlay';
    ov.className = 'marja-tasdiq-overlay';
    ov.innerHTML = `
        <div class="marja-tasdiq-oyna">
            <h3 style="margin:0 0 6px;">🔑 Admin tasdig'i</h3>
            <p style="margin:0 0 12px; font-size:0.86rem; color:var(--text-muted);">Past marjani tasdiqlash uchun admin PIN kodini kiriting.</p>
            <input type="password" id="marjaTasdiqPin" inputmode="numeric" autocomplete="off" placeholder="Admin paroli" style="width:100%;">
            <div id="marjaTasdiqXato" style="display:none; color:#dc2626; font-size:0.84rem; margin-top:6px;">Parol noto'g'ri.</div>
            <div style="display:flex; gap:8px; margin-top:14px; justify-content:flex-end;">
                <button type="button" class="btn btn-outline" onclick="marjaTasdiqYop()">Bekor qilish</button>
                <button type="button" class="btn btn-success" onclick="marjaTasdiqla()">Tasdiqlash</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    let pin = document.getElementById('marjaTasdiqPin');
    pin.addEventListener('keydown', e => { if (e.key === 'Enter') marjaTasdiqla(); if (e.key === 'Escape') marjaTasdiqYop(); });
    setTimeout(() => pin.focus(), 30);
}

function marjaTasdiqYop() {
    let ov = document.getElementById('marjaTasdiqOverlay');
    if (ov) ov.remove();
}

async function marjaTasdiqla() {
    let pin = (document.getElementById('marjaTasdiqPin') || {}).value || '';
    // Xisobot ichida: admin akkauntining paroli serverda tekshiriladi; mustaqil rejimda — eski PIN
    let admin = null;
    if (window.XIS) {
        let t = await adminTasdiq(pin);
        if (t.ok) admin = { name: t.nom };
        else {
            let xato = document.getElementById('marjaTasdiqXato');
            if (xato) { xato.innerText = t.xato || "Parol noto'g'ri."; xato.style.display = 'block'; }
            return;
        }
    } else {
        admin = Array.isArray(usersDb) ? usersDb.find(u => u.role === 'admin' && u.pin === pin) : null;
    }
    if (!admin) {
        let xato = document.getElementById('marjaTasdiqXato');
        if (xato) xato.style.display = 'block';
        return;
    }
    let marja = parseFloat((currentCalcResult || {}).marginPercent);
    if (isNaN(marja)) marja = parseFloat((document.getElementById('inpMargin') || {}).value) || 0;
    marjaTasdiqlanganPast = marja;
    if (typeof logAudit === 'function') logAudit("Past marja admin tomonidan tasdiqlandi", `${marja}% (minimal ${marjaChegarasi()}%), tasdiqladi: ${admin.name}`);
    marjaTasdiqYop();
    showToast(`✅ ${marja}% marja tasdiqlandi.`);
    marjaNazoratYangila();
}

// ---------- Admin: chegarani belgilash (admin bosh ekranida) ----------
function marjaChegaraChiz() {
    let box = document.getElementById('marjaChegaraBox');
    if (!box) return;
    let chegara = marjaChegarasi();
    box.innerHTML = `
        <details class="narx-tek narx-tek-malumot">
            <summary>💹 Marja himoyasi: <b>${chegara > 0 ? 'minimal ' + chegara + '%' : "o'chiq (cheklov yo'q)"}</b></summary>
            <p class="admin-hint" style="margin:10px 0;">
                Menejer shu foizdan past marja kiritsa, narx ko'rinadi, lekin natijani nusxalash va tijoriy taklifga qo'shish
                admin PIN kodi bilan tasdiqlanmaguncha bloklanadi. Adminga cheklov qo'llanmaydi. 0 — cheklov yo'q.
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                <div class="form-group" style="margin:0; min-width:220px;">
                    <label>Menejer uchun minimal marja (%):</label>
                    <input type="number" id="marjaChegaraInput" min="0" max="500" step="1" value="${chegara}">
                </div>
                <button type="button" class="btn btn-success" onclick="saveMarjaChegarasi()">💾 Saqlash</button>
            </div>
        </details>`;
}

function saveMarjaChegarasi() {
    let v = parseFloat((document.getElementById('marjaChegaraInput') || {}).value);
    if (isNaN(v) || v < 0 || v > 500) { showToast("⚠️ Marja 0 dan 500 gacha bo'lishi kerak!"); return; }
    try { localStorage.setItem(MARJA_CHEGARA_KALITI, String(v)); } catch (e) { showToast("⚠️ Saqlab bo'lmadi (brauzer xotirasi)."); return; }
    if (typeof logAudit === 'function') logAudit("Minimal marja chegarasi o'zgartirildi", `${v}%`);
    showToast(v > 0 ? `💾 Minimal marja ${v}% qilib belgilandi.` : "💾 Marja cheklovi o'chirildi.");
    marjaChegaraChiz();
}
