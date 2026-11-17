// ====================== SERVER XOTIRASI (localStorage o'rniga baza) ======================
// Xisobot ichida (Flask) ochilganda server sahifaga `window.XIS` ni joylaydi: rol, foydalanuvchi, CSRF belgisi va
// bazadagi barcha `erp_*` sozlamalari. Bu fayl brauzerning `localStorage` ini shu ma'lumotlar bilan almashtiradi:
//   - o'qish — xotiradan (sahifa ochilganda server bergan nusxa);
//   - yozish — xotiraga + serverga (0.5 soniya kutib, bir nechta o'zgarishni bitta so'rovda).
// Shuning uchun hisob-kitob va admin kodi o'zgarmagan: ular avvalgidek localStorage.getItem/setItem ishlatadi.
// `window.XIS` yo'q bo'lsa (masalan testlar/index.html fayldan ochilganda) — hech narsa o'zgarmaydi, oddiy localStorage.
//
// Boshqalar bilan to'qnashuv: server har kalitga versiya beradi. Boshqa foydalanuvchi shu kalitni o'zgartirgan bo'lsa,
// saqlash rad etiladi (409) va ekranda sahifani yangilash haqida ogohlantirish chiqadi — jimgina ustidan yozilmaydi.
// Yozishga ruxsati yo'q kalitlar (menejer uchun narxlar) faqat shu sahifa ochiq turguncha xotirada yashaydi.

(function () {
    const X = window.XIS;
    if (!X) return;

    const xotira = new Map(Object.entries(X.kv || {}));
    const versiya = Object.assign({}, X.v || {});
    const kutmoqda = new Map();          // kalit -> qiymat (yoki null = o'chirish)
    const bloklangan = new Set(X.blocked || []);
    const menejerYozadi = new Set(X.yozish || []);
    let taymer = null;
    let yuborilmoqda = false;
    let urinish = 0;
    let holat = 'tayyor';                // tayyor | saqlanmoqda | xato | toqnashuv
    let toqnashganlar = [];

    function yozishMumkin(k) {
        if (bloklangan.has(k)) return false;
        return X.rol === 'admin' ? true : menejerYozadi.has(k);
    }

    const shim = {
        getItem(k) { k = String(k); return xotira.has(k) ? xotira.get(k) : null; },
        setItem(k, v) {
            k = String(k); v = String(v);
            xotira.set(k, v);
            if (yozishMumkin(k)) navbat(k, v);
        },
        removeItem(k) {
            k = String(k);
            if (!xotira.has(k)) return;
            xotira.delete(k);
            if (yozishMumkin(k)) navbat(k, null);
        },
        clear() { Array.from(xotira.keys()).forEach(k => shim.removeItem(k)); },
        key(i) { const a = Array.from(xotira.keys()); return i >= 0 && i < a.length ? a[i] : null; },
        get length() { return xotira.size; }
    };
    try {
        Object.defineProperty(window, 'localStorage', { configurable: true, get() { return shim; } });
    } catch (e) {
        console.error("[Xisoblovchi] localStorage almashtirilmadi — sozlamalar bazaga saqlanmaydi:", e);
    }

    function navbat(k, v) {
        kutmoqda.set(k, v);
        holatYangila('saqlanmoqda');
        clearTimeout(taymer);
        taymer = setTimeout(yubor, 500);
    }

    async function yubor() {
        if (yuborilmoqda) { taymer = setTimeout(yubor, 400); return; }
        if (!kutmoqda.size) return;
        const paket = Array.from(kutmoqda);
        kutmoqda.clear();
        yuborilmoqda = true;
        const items = paket.map(([k, v]) => ({ key: k, value: v, v: versiya[k] || 0 }));
        const tana = JSON.stringify({ items });
        try {
            const r = await fetch(new URL('api/kv', location.href), {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': X.csrf },
                body: tana, keepalive: tana.length < 60000
            });
            if (r.redirected || !(r.headers.get('content-type') || '').includes('json')) throw new Error('Sessiya tugagan — Xisobotga qayta kiring');
            if (!r.ok) throw new Error('Server javobi ' + r.status);
            const j = await r.json();
            urinish = 0;
            (j.results || []).forEach(res => {
                if (res.error) {
                    if (res.v !== undefined) versiya[res.key] = res.v;
                    if (res.code === 409) { toqnashganlar.push(res.key); }
                    else console.warn('[Xisoblovchi] saqlanmadi:', res.key, res.error);
                } else {
                    versiya[res.key] = res.v;
                    if (res.value !== undefined) xotira.set(res.key, res.value);
                }
            });
            holatYangila(toqnashganlar.length ? 'toqnashuv' : (kutmoqda.size ? 'saqlanmoqda' : 'tayyor'));
        } catch (e) {
            // Tarmoq xatosi: o'zgarishlarni qaytarib navbatga qo'yamiz (yangisi bo'lsa, u ustun), keyinroq qayta uriniladi
            paket.forEach(([k, v]) => { if (!kutmoqda.has(k)) kutmoqda.set(k, v); });
            urinish++;
            holatYangila('xato', e && e.message);
            clearTimeout(taymer);
            taymer = setTimeout(yubor, Math.min(30000, 1500 * urinish * urinish));
        } finally {
            yuborilmoqda = false;
            if (kutmoqda.size && holat !== 'xato') { clearTimeout(taymer); taymer = setTimeout(yubor, 500); }
        }
    }

    // ---- sahifadan chiqishda: saqlanmagan o'zgarish bo'lsa ogohlantirish va oxirgi urinish ----
    window.addEventListener('beforeunload', e => {
        if (kutmoqda.size || yuborilmoqda) { e.preventDefault(); e.returnValue = ''; }
    });
    window.addEventListener('pagehide', () => { if (kutmoqda.size) { clearTimeout(taymer); yubor(); } });

    // ---- admin tasdig'i (eski "admin PIN" o'rniga admin akkauntining paroli) ----
    // Saqlash hali tugamaganmi (Excel yuklangach sahifani qayta yuklashdan oldin tekshiriladi)
    window.xisSaqlashKutilmoqda = function () { return kutmoqda.size > 0 || yuborilmoqda; };

    window.adminTasdiq = async function (parol) {
        try {
            const r = await fetch(new URL('api/admin-tasdiq', location.href), {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': X.csrf },
                body: JSON.stringify({ parol })
            });
            const j = await r.json().catch(() => ({}));
            return { ok: !!(r.ok && j.ok), nom: j.nom || '', xato: j.xato || '' };
        } catch (e) {
            return { ok: false, nom: '', xato: 'Serverga ulanib bo‘lmadi' };
        }
    };

    // ---- ekrandagi kichik panel: Xisobotga qaytish, zaxira, saqlash holati ----
    let panel = null, holatEl = null;
    function holatYangila(h, xabar) {
        holat = h;
        if (!holatEl) return;
        const m = {
            tayyor: ['✓ Saqlangan', '#16a34a'],
            saqlanmoqda: ['⏳ Saqlanmoqda…', '#d97706'],
            xato: ['⚠️ Saqlanmadi, qayta uriniladi' + (xabar ? ' (' + xabar + ')' : ''), '#dc2626'],
            toqnashuv: ['⚠️ Boshqa foydalanuvchi o‘zgartirgan — sahifani yangilang (sizning o‘zgarishingiz saqlanmadi)', '#dc2626']
        }[h];
        holatEl.textContent = m[0];
        holatEl.style.color = m[1];
        holatEl.style.display = (h === 'tayyor' && !holatEl.dataset.korsat) ? 'none' : 'inline';
        if (h === 'toqnashuv') {
            holatEl.style.cursor = 'pointer';
            holatEl.title = 'Sahifani yangilash uchun bosing';
            holatEl.onclick = () => location.reload();
        }
    }
    function panelYasa() {
        panel = document.createElement('div');
        panel.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9000;display:flex;gap:8px;align-items:center;' +
            'font:600 12px/1 Inter,system-ui,sans-serif;background:rgba(255,255,255,.95);border:1px solid #e2e8f0;' +
            'border-radius:10px;padding:7px 10px;box-shadow:0 2px 10px rgba(0,0,0,.12);max-width:calc(100vw - 20px);flex-wrap:wrap;';
        const orqaga = document.createElement('a');
        orqaga.href = X.chiqish; orqaga.textContent = '← Xisobot'; orqaga.style.cssText = 'color:#2563eb;text-decoration:none;';
        panel.appendChild(orqaga);
        if (X.zaxira) {
            const z = document.createElement('a');
            z.href = X.zaxira; z.textContent = '💾 Zaxira'; z.style.cssText = 'color:#475569;text-decoration:none;';
            panel.appendChild(z);
        }
        holatEl = document.createElement('span');
        holatEl.style.display = 'none';
        panel.appendChild(holatEl);
        document.body.appendChild(panel);
        holatYangila(holat);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', panelYasa);
    else panelYasa();
})();
