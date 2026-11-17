// ====================== RASMLAR OMBORI (serverda saqlash) ======================
// Rasmlar odatda brauzer xotirasida (localStorage, ~5 MB) base64 matn sifatida turadi — rasm ko'paysa xotira to'ladi va
// ular faqat shu brauzerda ko'rinadi. Admin server kalitini kiritsa, yangi yuklangan rasmlar serverga (uploads/) yuboriladi va
// faqat qisqa manzil ("uploads/....webp") saqlanadi: xotira bo'shaydi, rasm barcha qurilmalarda ko'rinadi.
// Server tomoni — passenger_wsgi.py (POST /api/rasm, kalit: serverdagi ../.xisoblovchi_token fayli).
// Server ishlamasa / kalit noto'g'ri bo'lsa — rasm avvalgidek brauzer xotirasiga saqlanadi (yo'qolmaydi).

const SERVER_KALIT_KALITI = 'erp_server_token';
let rasmOmboriXabarKorsatildi = false;

// Xisobot ichida kalit kerak emas: yuklash Xisobot sessiyasi bilan (faqat admin rejimi), rasmlar serverdagi papkada.
function serverKaliti() {
    if (window.XIS) return window.XIS.rol === 'admin' ? 'sessiya' : '';
    try { return localStorage.getItem(SERVER_KALIT_KALITI) || ''; } catch (e) { return ''; }
}

function serverKalitiniSaqla(kalit) {
    try {
        if (kalit) localStorage.setItem(SERVER_KALIT_KALITI, kalit);
        else localStorage.removeItem(SERVER_KALIT_KALITI);
    } catch (e) { /* xotira bo'lmasa — jimgina */ }
}

function rasmOmboriMumkinmi() {
    return !!serverKaliti() && /^https?:$/.test(location.protocol);
}

// data-URL rasmni serverga yuboradi. Muvaffaqiyatli bo'lsa — qisqa manzil, aks holda — asl data-URL (hech narsa yo'qolmaydi).
async function rasmniServergaYuklash(dataUrl) {
    if (!rasmOmboriMumkinmi() || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return dataUrl;
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const javob = await fetch('api/rasm', {
            method: 'POST',
            credentials: 'same-origin',
            headers: Object.assign({ 'X-Token': serverKaliti(), 'Content-Type': blob.type || 'application/octet-stream' },
                                   window.XIS ? { 'X-CSRFToken': window.XIS.csrf } : {}),
            body: blob
        });
        const json = await javob.json().catch(() => ({}));
        if (!javob.ok || !json.url) throw new Error(json.xato || ('server javobi ' + javob.status));
        return json.url;
    } catch (e) {
        if (!rasmOmboriXabarKorsatildi && typeof showToast === 'function') {
            rasmOmboriXabarKorsatildi = true;
            showToast("⚠️ Rasm serverga yuklanmadi — brauzer xotirasida saqlandi (" + (e && e.message || e) + ")");
        }
        return dataUrl;
    }
}

// Saqlangan rasm manzilini ko'chma (nisbiy) shaklga keltiradi: <img>.src mutlaq manzil qaytaradi, lekin
// saqlashda "uploads/x.webp" ko'rinishida qolishi kerak (sayt manzili o'zgarsa ham rasm ko'rinsin).
function rasmManzilNisbiy(url) {
    if (typeof url !== 'string') return url;
    let asos = location.origin + location.pathname.replace(/[^/]*$/, '');
    return url.startsWith(asos + 'uploads/') ? url.slice(asos.length) : url;
}

async function rasmOmboriTekshir(kalit) {
    const javob = await fetch('api/holat', { headers: { 'X-Token': kalit } });
    const json = await javob.json().catch(() => ({}));
    if (!javob.ok) throw new Error(json.xato || ('server javobi ' + javob.status));
    return json;
}

async function rasmOmboriSaqlash() {
    const input = document.getElementById('rasmOmboriKalit');
    const kalit = (input ? input.value : '').trim();
    if (!kalit) {
        serverKalitiniSaqla('');
        showToast("📦 Rasmlar endi brauzer xotirasida saqlanadi.");
        rasmOmboriChiz();
        return;
    }
    if (!/^https?:$/.test(location.protocol)) { showToast("⚠️ Server rasmlari faqat sayt (http/https) orqali ishlaydi, fayldan ochilganda emas."); return; }
    try {
        const h = await rasmOmboriTekshir(kalit);
        serverKalitiniSaqla(kalit);
        showToast(`☁️ Server ulandi (${h.rasmlar} ta rasm). Endi yangi rasmlar serverda saqlanadi.`);
    } catch (e) {
        showToast("⚠️ Serverga ulanib bo'lmadi: " + (e && e.message || e));
    }
    rasmOmboriChiz();
}

function rasmOmboriChiz() {
    const box = document.getElementById('rasmOmboriBox');
    if (!box) return;
    if (window.XIS) {
        box.innerHTML = `<details class="narx-tek narx-tek-malumot"><summary>☁️ Rasmlar serverda saqlanadi: <b>yoqilgan</b></summary>
            <p class="admin-hint" style="margin:10px 0;">Xisobot ichida yangi yuklangan rasmlar avtomatik serverga saqlanadi (kalit kerak emas) va barcha qurilmalarda ko'rinadi.</p></details>`;
        return;
    }
    const yoqilgan = !!serverKaliti();
    box.innerHTML = `
        <details class="narx-tek narx-tek-malumot">
            <summary>☁️ Rasmlarni serverda saqlash: <b>${yoqilgan ? 'yoqilgan' : "o'chiq (brauzer xotirasida)"}</b></summary>
            <p class="admin-hint" style="margin:10px 0;">
                Yoqilganda yangi yuklangan rasmlar serverga yuboriladi: brauzer xotirasi to'lmaydi va rasm barcha qurilmalarda ko'rinadi.
                Kalit — serverdagi <code>/home/mylogo/.xisoblovchi_token</code> faylidagi matn. Kalit faqat shu qurilmada saqlanadi.
                Ilgari yuklangan rasmlar brauzerda qoladi.
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                <div class="form-group" style="flex:1; min-width:240px; margin:0;">
                    <label>Server kaliti:</label>
                    <input type="password" id="rasmOmboriKalit" autocomplete="off" placeholder="${yoqilgan ? '•••••••• (saqlangan)' : 'kalitni kiriting'}">
                </div>
                <button type="button" class="btn btn-success" onclick="rasmOmboriSaqlash()">💾 Tekshirish va saqlash</button>
            </div>
            <p class="admin-hint" style="margin-top:8px;">Maydonni bo'sh qoldirib saqlasangiz — server o'chiriladi (rasmlar yana brauzerda saqlanadi).</p>
        </details>`;
}
