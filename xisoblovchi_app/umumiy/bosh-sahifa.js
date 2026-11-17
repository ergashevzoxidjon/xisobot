// ====================== BOSH SAHIFA (mahsulot tanlash ekrani) ======================
// Mavjud bo'lim kartochkalari (.product-card) va gridlar (#grid-*) o'z joyida qoladi —
// bu fayl ularni yangicha ko'rinishga o'raydi: sarlavha, bo'lim chiplari, qidiruv,
// "oxirgi ishlatilganlar". Xato bo'lsa eski ko'rinish saqlanib qoladi.
(function () {
    const SAQLASH_KALITI = 'erp_bosh_oxirgilar';
    // "Oxirgilar" qatori hozircha o'chirilgan — qayta yoqish uchun true qiling (tanlovlar baribir eslab qolinadi)
    const OXIRGILARNI_KORSAT = false;
    const BOLIMLAR = [
        { id: 'poligrafiya', grids: ['grid-poligrafiya'], nom: 'Poligrafiya', belgi: '🖨️', rang: 'cyan' },
        { id: 'textile',     grids: ['grid-textile'],     nom: 'Tekstil',     belgi: '👕', rang: 'magenta' },
        { id: 'suvenir',     grids: ['grid-souvenir'],    nom: 'Suvenir',     belgi: '🎁', rang: 'yellow' },
        { id: 'reklama',     grids: ['grid-reklama'],     nom: 'Reklama',     belgi: '🖼️', rang: 'ink' },
        { id: 'pechat',      grids: ['grid-ofset', 'grid-sifravoy'], nom: 'Pechat kalkulyatorlari', qisqa: 'Pechat', belgi: '⚙️', rang: 'green' }
    ];
    let faolBolim = 'hammasi';
    let oxirgilar = [];

    function oxirgilarniOl() {
        try { let a = JSON.parse(localStorage.getItem(SAQLASH_KALITI) || '[]'); return Array.isArray(a) ? a : []; }
        catch (e) { return []; }
    }
    function oxirgilarniSaqla() {
        try { localStorage.setItem(SAQLASH_KALITI, JSON.stringify(oxirgilar)); } catch (e) {}
    }

    function qur() {
        let ekran = document.getElementById('selectionScreen');
        if (!ekran || ekran.dataset.boshQurilgan) return;
        let qidiruv = ekran.querySelector('.search-box');
        if (!qidiruv) return;
        ekran.dataset.boshQurilgan = '1';
        ekran.classList.add('home');

        // 1) Sarlavha
        let hero = document.createElement('div');
        hero.className = 'home-hero';
        hero.innerHTML = `
            <div>
                <div class="home-hero-kicker" id="homeSana"></div>
                <h2 class="home-hero-title">Nimani hisoblaymiz?</h2>
                <p class="home-hero-sub" id="homeJami"></p>
            </div>`;
        ekran.insertBefore(hero, qidiruv);

        // 2) Qidiruv maydoni
        qidiruv.classList.add('home-search');
        let inp = document.getElementById('searchInput');
        if (inp) {
            inp.placeholder = 'Mahsulot nomini yozing…';
            inp.autocomplete = 'off';
            qidiruv.insertAdjacentHTML('afterbegin', '<span class="home-search-icon" aria-hidden="true">🔍</span>');
            qidiruv.insertAdjacentHTML('beforeend', '<kbd class="home-search-kbd" title="Qidiruvga o\'tish">/</kbd>');
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    let birinchi = Array.from(ekran.querySelectorAll('.product-card')).find(c => c.style.display !== 'none' && c.offsetParent !== null);
                    if (birinchi) birinchi.click();
                } else if (e.key === 'Escape') {
                    inp.value = '';
                    filtrla();
                    inp.blur();
                }
            });
            document.addEventListener('keydown', e => {
                if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
                let t = document.activeElement;
                if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
                if (ekran.style.display === 'none' || ekran.offsetParent === null) return;
                e.preventDefault();
                inp.focus();
                inp.select();
            });
        }

        // 3) Bo'lim chiplari
        let chiplar = document.createElement('div');
        chiplar.className = 'home-chips';
        chiplar.id = 'homeChips';
        qidiruv.insertAdjacentElement('afterend', chiplar);

        // 4) Oxirgi ishlatilganlar
        let ox = document.createElement('div');
        ox.className = 'home-recent';
        ox.id = 'homeRecent';
        ox.style.display = 'none';
        chiplar.insertAdjacentElement('afterend', ox);

        // 5) Bo'limlarni o'rash (sarlavha + grid → bitta panel)
        BOLIMLAR.forEach(b => {
            let gridlar = b.grids.map(id => document.getElementById(id)).filter(Boolean);
            if (!gridlar.length) return;
            let sec = document.createElement('section');
            sec.className = 'home-sec home-sec-' + b.rang;
            sec.dataset.sec = b.id;
            sec.innerHTML = `<div class="home-sec-head"><span class="home-sec-badge">${b.belgi}</span><h3 class="home-sec-title">${b.nom}</h3><span class="home-sec-count"></span></div>`;
            let birinchi = gridlar[0];
            let t0 = birinchi.previousElementSibling;
            birinchi.parentNode.insertBefore(sec, (t0 && t0.classList.contains('section-title')) ? t0 : birinchi);
            gridlar.forEach(g => {
                let t = g.previousElementSibling;
                if (t && t.classList.contains('section-title')) t.remove();
                sec.appendChild(g);
            });
        });

        // 6) Bosilganda "oxirgilar"ga yozish
        ekran.addEventListener('click', e => {
            let card = e.target.closest('.product-card');
            if (!card) return;
            let oc = card.getAttribute('onclick');
            if (!oc) return;
            oxirgilar = [oc].concat(oxirgilar.filter(x => x !== oc)).slice(0, 5);
            oxirgilarniSaqla();
        }, true);

        // Maxsus mahsulotlar qo'shilganda/o'chirilganda hisoblarni yangilash
        try {
            let obs = new MutationObserver(() => yangila());
            ekran.querySelectorAll('.product-grid').forEach(g => obs.observe(g, { childList: true }));
        } catch (e) {}

        oxirgilar = oxirgilarniOl();
        yangila();
    }

    function yangila() {
        let ekran = document.getElementById('selectionScreen');
        if (!ekran || !ekran.dataset.boshQurilgan) return;
        let jami = 0, bolimSoni = 0, chipHTML = '';
        ekran.querySelectorAll('.home-sec').forEach(sec => {
            let n = sec.querySelectorAll('.product-card').length;
            sec.dataset.jami = n;
            if (n) { jami += n; bolimSoni++; }
            let b = BOLIMLAR.find(x => x.id === sec.dataset.sec);
            chipHTML += `<button type="button" class="home-chip${faolBolim === b.id ? ' faol' : ''}" data-sec="${b.id}">${b.belgi} ${b.qisqa || b.nom}<span>${n}</span></button>`;
        });
        let chips = document.getElementById('homeChips');
        if (chips) {
            chips.innerHTML = `<button type="button" class="home-chip${faolBolim === 'hammasi' ? ' faol' : ''}" data-sec="hammasi">Hammasi<span>${jami}</span></button>` + chipHTML;
            chips.querySelectorAll('.home-chip').forEach(btn => btn.onclick = () => { faolBolim = btn.dataset.sec; yangila(); });
        }
        let jamiEl = document.getElementById('homeJami');
        if (jamiEl) jamiEl.textContent = `${jami} ta mahsulot va kalkulyator · ${bolimSoni} ta bo'lim`;
        let sana = document.getElementById('homeSana');
        if (sana) {
            let d = new Date();
            const oylar = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
            const kunlar = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
            sana.textContent = `${kunlar[d.getDay()]}, ${d.getDate()}-${oylar[d.getMonth()]}`;
        }
        oxirgilarniChiz();
        filtrla();
    }

    function oxirgilarniChiz() {
        let box = document.getElementById('homeRecent');
        if (!box) return;
        if (!OXIRGILARNI_KORSAT) { box.innerHTML = ''; box.style.display = 'none'; return; }
        let kartalar = Array.from(document.querySelectorAll('#selectionScreen .product-card'));
        let topilgan = oxirgilar.map(oc => kartalar.find(c => c.getAttribute('onclick') === oc)).filter(Boolean);
        if (!topilgan.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
        box.innerHTML = '<span class="home-recent-label">Oxirgilar</span>';
        topilgan.forEach(c => {
            let b = document.createElement('button');
            b.type = 'button';
            b.className = 'home-recent-btn';
            let ikon = c.querySelector('.icon'), nom = c.querySelector('h3');
            b.innerHTML = `<span>${ikon ? ikon.innerHTML : ''}</span>${nom ? nom.innerHTML : ''}`;
            b.onclick = () => c.click();
            box.appendChild(b);
        });
        box.style.display = '';
    }

    // Qidiruv matni va tanlangan bo'lim bo'yicha ko'rsatish
    function filtrla() {
        let ekran = document.getElementById('selectionScreen');
        if (!ekran || !ekran.dataset.boshQurilgan) return false;
        let inp = document.getElementById('searchInput');
        let q = (inp ? inp.value : '').toLowerCase().trim();
        let hechNima = true;
        ekran.querySelectorAll('.home-sec').forEach(sec => {
            let bolimOchiq = faolBolim === 'hammasi' || faolBolim === sec.dataset.sec;
            let korinadi = 0;
            sec.querySelectorAll('.product-card').forEach(card => {
                let ok = bolimOchiq && (!q || card.innerText.toLowerCase().includes(q));
                card.style.display = ok ? 'flex' : 'none';
                if (ok) korinadi++;
            });
            let hisob = sec.querySelector('.home-sec-count');
            if (hisob) hisob.textContent = (q && bolimOchiq) ? `${korinadi} / ${sec.dataset.jami}` : sec.dataset.jami;
            sec.style.display = korinadi ? '' : 'none';
            if (korinadi) hechNima = false;
        });
        let bosh = document.getElementById('homeEmpty');
        if (!bosh) {
            bosh = document.createElement('div');
            bosh.id = 'homeEmpty';
            bosh.className = 'home-empty';
            bosh.innerHTML = '<div>🔍</div><b>Hech narsa topilmadi</b><span>Boshqa nom bilan qidirib ko\'ring yoki "Hammasi" bo\'limini tanlang.</span>';
            ekran.appendChild(bosh);
        }
        bosh.style.display = hechNima ? '' : 'none';
        let oxBox = document.getElementById('homeRecent');
        if (oxBox && oxBox.innerHTML) oxBox.style.display = q ? 'none' : '';
        return true;
    }

    window.boshSahifaFiltr = filtrla;
    try { qur(); } catch (e) { console.error('[Bosh sahifa] yangi ko\'rinishni qurishda xato (eski ko\'rinish saqlanadi):', e); }
})();
