// Sinov yurgizuvchi: ilovani har bir holat uchun alohida, xotirada saqlanadigan (localStorage'siz) holda yuklaydi.
(function () {
    const YOZISH = new URLSearchParams(location.search).has('yozib');
    const kut = ms => new Promise(r => setTimeout(r, ms));

    // localStorage o'rniga xotiradagi nusxa — sinov foydalanuvchining haqiqiy ma'lumotlariga tegmaydi
    const SHIM = `<script>(function(){var d={};var S={getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;},setItem:function(k,v){d[k]=String(v);},removeItem:function(k){delete d[k];},clear:function(){d={};},key:function(i){return Object.keys(d)[i]||null;}};Object.defineProperty(S,'length',{get:function(){return Object.keys(d).length;}});Object.defineProperty(window,'localStorage',{value:S,configurable:true});Object.defineProperty(window,'sessionStorage',{value:S,configurable:true});})();<\/script>`;

    let asosiyHtml = null;

    async function ilovaOch() {
        if (!asosiyHtml) {
            const r = await fetch('../index.html', { cache: 'no-store' });
            asosiyHtml = await r.text();
        }
        const baza = new URL('../', location.href).href;
        const html = asosiyHtml.replace(/<head[^>]*>/i, m => `${m}<base href="${baza}">${SHIM}`);
        const eski = document.getElementById('sinov');
        const yangi = document.createElement('iframe');
        yangi.id = 'sinov';
        yangi.title = 'sinov';
        eski.replaceWith(yangi);
        await new Promise(res => { yangi.onload = res; yangi.srcdoc = html; });
        const w = yangi.contentWindow;
        for (let i = 0; i < 40 && !(typeof w.calculate === 'function' && typeof w.openCalc === 'function'); i++) await kut(50);
        await kut(250); // init() tugashi uchun
        return w;
    }

    async function holatniBajar(h) {
        const w = await ilovaOch();
        try {
            w.openCalc(h.tur, h.tur);
            await kut(60);
            if (h.sozlash) h.sozlash(w);
            const q = w.document.getElementById('inpQuantity');
            if (q) q.value = h.adad;
            w.calculate();
            const r = w.eval('currentCalcResult') || {};
            return { jami: Math.round(r.totalPrice || 0), dona: Math.round(r.unitPrice || 0), tafsilot: r.details || '' };
        } catch (e) {
            return { xato: String(e && e.message || e) };
        }
    }

    function qatorChiz(h, n, kutilgan) {
        const tr = document.createElement('tr');
        let holat, yaxshi;
        if (n.xato) { holat = '⚠️ XATO: ' + n.xato; yaxshi = false; }
        else if (YOZISH) { holat = '—'; yaxshi = true; }
        else if (!kutilgan) { holat = '❔ kutilgan qiymat yo\'q'; yaxshi = false; }
        else { yaxshi = kutilgan.jami === n.jami && kutilgan.dona === n.dona; holat = yaxshi ? '✅ to\'g\'ri' : '❌ o\'zgargan'; }
        if (!yaxshi) tr.className = 'xato';
        const son = v => (v == null ? '—' : Number(v).toLocaleString('ru-RU'));
        tr.innerHTML = `<td>${h.id}</td><td class="son">${son(h.adad)}</td><td class="son">${kutilgan ? son(kutilgan.jami) : '—'}</td><td class="son">${n.xato ? '—' : son(n.jami)}</td><td class="son">${n.xato ? '—' : son(n.dona)}</td><td>${holat}</td>`;
        document.querySelector('#jadval tbody').appendChild(tr);
        return yaxshi;
    }

    async function hammasiniYurgiz() {
        document.querySelector('#jadval tbody').innerHTML = '';
        document.getElementById('yozibBox').style.display = 'none';
        const xul = document.getElementById('xulosa');
        const natijalar = {};
        let togri = 0;
        for (let i = 0; i < HOLATLAR.length; i++) {
            const h = HOLATLAR[i];
            xul.textContent = `Bajarilmoqda… ${i + 1}/${HOLATLAR.length}`;
            const n = await holatniBajar(h);
            natijalar[h.id] = n;
            if (qatorChiz(h, n, (window.KUTILGAN || {})[h.id])) togri++;
        }
        const jami = HOLATLAR.length;
        if (YOZISH) {
            xul.innerHTML = `Namuna olish rejimi: ${jami} ta holat hisoblandi.`;
            const chiqish = {};
            Object.keys(natijalar).forEach(id => { if (!natijalar[id].xato) chiqish[id] = { jami: natijalar[id].jami, dona: natijalar[id].dona }; });
            document.getElementById('yozibMatn').textContent = 'window.KUTILGAN = ' + JSON.stringify(chiqish, null, 4) + ';';
            document.getElementById('yozibBox').style.display = 'block';
        } else {
            const ok = togri === jami;
            xul.innerHTML = `<span class="${ok ? 'yaxshi' : 'yomon'}">${ok ? '✅' : '❌'} ${togri} / ${jami} ta holat to'g'ri</span>`;
        }
        window.NATIJA = { jami, togri, natijalar, tugadi: true };
    }

    document.getElementById('qayta').onclick = hammasiniYurgiz;
    hammasiniYurgiz();
})();
