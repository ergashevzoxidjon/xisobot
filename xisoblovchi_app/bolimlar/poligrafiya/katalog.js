// Poligrafiya bo'limi — Katalog.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== KATALOG ======================
    // Menejer kiritadi: o'lcham (tayyor, yopiq holati — standart tugmalar yoki qo'lda), SAHIFA SONI
    // (abloshka bilan birga: 4 sahifa abloshka + qolgani ichki blok), mahkamlash usuli, abloshka va
    // ichki blok qog'ozi (alohida-alohida), abloshka laminatsiyasi (MAJBURIY: Glyans yoki Matoviy),
    // ixtiyoriy 3D lak / Tisneniya.
    // Mahkamlash usuliga qarab bosiladigan bo'laklar:
    //   • Stepler   — ichki blok yoyilmalar (2×eni × bo'yi, 1 yoyilma = 4 sahifa); abloshka — 1 yoyilma.
    //                 Sahifa soni 4 ga karrali bo'lishi shart.
    //   • Prujina   — ichki blok alohida varaqlar (eni × bo'yi, 1 varaq = 2 sahifa); abloshka — old va
    //                 orqa, 2 ta alohida varaq.
    //   • Termokley — ichki blok alohida varaqlar; abloshka — bitta o'ram: (2×eni + qirra) × bo'yi,
    //                 qirra qalinligi = ichki varaqlar soni × gramm × qalinlikKoef.
    // Pechat: adad `ofsetMinTiraj` dan kam bo'lsa — Sifravoy (majburiy), aks holda menejer tanlaydi.
    //   Ofset: har bir bo'lak (abloshka/ichki blok) uchun A3/A2/A1 dan eng arzoni. Ishchi varaqqa
    //   `sig'im` ta bo'lak sig'adi; bitta nusxada U ta turli bo'lak bo'lsa — forma soni ceil(U / sig'im)
    //   (U ≤ sig'im bo'lsa bitta formada bir nechta nusxa). Har forma: 2 tomonlama — 8 plastina va 2 bosma
    //   (CHUJOY), 1 tomonlama — 4 plastina, 1 bosma; har formaga `ofsetZapas` ishchi varaq zapas.
    //   Sifravoy: Sifravoy qog'oz bazasidan shu tur/grammdagi qog'oz, varaq × (1/2 tomon narx) + zapas.
    // Laminatsiya narxi — A3 varaq ekvivalenti bo'yicha, 3D lak — dona + bir martalik klishe (katalogning
    // o'z sozlamasi), Tisneniya — umumiy Pardozlash xizmatlaridan (abloshka A3 dan katta bo'lsa A2 narxi).
    const KATALOG_LAM_NOMI = { glyans: 'Glyans', matoviy: 'Matoviy' };

    let katalogConfig = {
        ofsetMinTiraj: 300,
        ofsetZapas: 50,       // har bir ofset formaga — ishchi varaq
        sifravoyZapas: 3,     // Sifravoy — har bir bo'lakka (abloshka / ichki blok) varaq
        qalinlikKoef: 0.001,  // bitta varaq qalinligi (mm) = gramm × koef (termokley qirrasi uchun)
        olchamlar: [
            { key: 'a5', nomi: 'A5', eni: 148, boyi: 210 },
            { key: 'a4', nomi: 'A4', eni: 210, boyi: 297 },
            { key: 'a4alb', nomi: 'A4 albom', eni: 297, boyi: 210 },
            { key: 'kv', nomi: 'Kvadrat', eni: 210, boyi: 210 }
        ],
        abloshkaQogozlari: [
            { paperType: 'Melovka', gsm: 250 },
            { paperType: 'Melovka', gsm: 300 },
            { paperType: 'Melovka', gsm: 350 }
        ],
        ichkiQogozlari: [
            { paperType: 'Ofset', gsm: 80 },
            { paperType: 'Melovka', gsm: 115 },
            { paperType: 'Melovka', gsm: 130 },
            { paperType: 'Melovka', gsm: 150 },
            { paperType: 'Melovka', gsm: 170 }
        ],
        // narx — so'm / dona (bitta katalogga); karrali — sahifa soni shu songa bo'linishi shart
        mahkamlash: [
            { key: 'stepler', nomi: 'Stepler', narx: 500, minSahifa: 8, maxSahifa: 64, karrali: 4 },
            { key: 'prujina', nomi: 'Prujina', narx: 3000, minSahifa: 8, maxSahifa: 300, karrali: 2 },
            { key: 'termokley', nomi: 'Termokley', narx: 4000, minSahifa: 32, maxSahifa: 600, karrali: 2 }
        ],
        laminatsiya: { glyans: 600, matoviy: 800 },   // so'm / A3 varaq
        lak3d: { pricePerUnit: 1000, klishePrice: 100000 }
    };

    let katalogSelected = { mahkamlash: 'stepler', abloshka: 0, ichki: 0, abloshkaTomon: 1, laminatsiya: 'glyans', lak3d: false, tisneniya: false, engine: 'ofset' };

    function katalogMahkamlash(key) {
        return katalogConfig.mahkamlash.find(m => m.key === key) || katalogConfig.mahkamlash[0];
    }
    function katalogQogozNomi(q) { return q ? `${q.paperType} ${q.gsm}gr` : '—'; }

    function katalogOlcham() {
        return { eni: parseFloat(document.getElementById('ktEni')?.value) || 0, boyi: parseFloat(document.getElementById('ktBoyi')?.value) || 0 };
    }
    function katalogSahifa() { return parseInt(document.getElementById('ktSahifa')?.value) || 0; }

    function buildKatalogForm() {
        let o = katalogConfig.olchamlar.find(x => x.key === 'a4') || katalogConfig.olchamlar[0];
        katalogSelected = {
            mahkamlash: (katalogConfig.mahkamlash[0] || {}).key || 'stepler',
            abloshka: Math.min(1, katalogConfig.abloshkaQogozlari.length - 1),
            ichki: Math.min(2, katalogConfig.ichkiQogozlari.length - 1),
            abloshkaTomon: 1, laminatsiya: 'glyans', lak3d: false, tisneniya: false, engine: 'ofset'
        };
        return `
            <div class="poli-calc">
                <div class="step-title">1. O'lcham <span class="paket-step-hint">(tayyor holati — standartni bosing yoki o'zingiz kiriting)</span></div>
                <div class="options-group" id="ktOlchamGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="form-group">
                        <label>Eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="ktEni" min="1" value="${o ? o.eni : ''}" oninput="renderKatalogOptions(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="ktBoyi" min="1" value="${o ? o.boyi : ''}" oninput="renderKatalogOptions(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Sahifa soni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="ktSahifa" min="4" step="4" value="24" oninput="renderKatalogOptions(); calculate()"><span>bet</span></div>
                    </div>
                </div>
                <div id="ktInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Mahkamlash usuli</div>
                <div class="options-group" id="ktMahkamlashGroup"></div>

                <div class="step-title">3. Abloshka qog'ozi</div>
                <div class="options-group" id="ktAbloshkaGroup"></div>
                <div class="options-group" id="ktAbloshkaTomonGroup"></div>

                <div class="step-title">4. Ichki blok qog'ozi <span class="paket-step-hint">(ikki tomonlama pechat)</span></div>
                <div class="options-group" id="ktIchkiGroup"></div>

                <div class="step-title">5. Abloshka laminatsiyasi <span class="paket-step-hint">(majburiy)</span></div>
                <div class="options-group" id="ktLamGroup"></div>

                <div class="step-title">6. Abloshkaga qo'shimcha xizmatlar</div>
                <div class="options-group" id="ktQoshimchaGroup"></div>

                <div class="step-title">7. Pechat usuli</div>
                <div class="options-group" id="ktEngineGroup"></div>
                <div id="ktEngineOgoh" class="paket-step-hint" style="margin:-6px 0 12px;"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="500" min="1" oninput="renderKatalogOptions(); calculate()">
                </div>
            </div>
        `;
    }

    function renderKatalogOptions() {
        let olchamGroup = document.getElementById('ktOlchamGroup');
        if (!olchamGroup) return;
        let s = katalogSelected;
        let { eni, boyi } = katalogOlcham();
        olchamGroup.innerHTML = katalogConfig.olchamlar.map(o => `
            <button type="button" class="opt-btn ${o.eni === eni && o.boyi === boyi ? 'active' : ''}" onclick="selectKatalogOlcham('${o.key}')">${escDiplom(o.nomi)} <small>${o.eni}×${o.boyi}</small></button>
        `).join('') || `<span class="paket-step-hint">Standart o'lcham kiritilmagan — qo'lda kiriting.</span>`;

        let m = katalogMahkamlash(s.mahkamlash);
        document.getElementById('ktMahkamlashGroup').innerHTML = katalogConfig.mahkamlash.map(x => `
            <button type="button" class="opt-btn ${x.key === s.mahkamlash ? 'active' : ''}" onclick="selectKatalog('mahkamlash', '${x.key}')">${escDiplom(x.nomi)} <small>${x.minSahifa}–${x.maxSahifa} bet</small></button>
        `).join('');
        let sahifaInp = document.getElementById('ktSahifa');
        if (sahifaInp && m) sahifaInp.step = m.karrali || 2;

        let qogozTugmalari = (list, field) => list.length === 0
            ? `<span class="paket-xato">⚠️ Qog'oz kiritilmagan — Admin → Katalog</span>`
            : list.map((q, i) => `<button type="button" class="opt-btn ${i === s[field] ? 'active' : ''}" onclick="selectKatalog('${field}', ${i})">${katalogQogozNomi(q)}</button>`).join('');
        document.getElementById('ktAbloshkaGroup').innerHTML = qogozTugmalari(katalogConfig.abloshkaQogozlari, 'abloshka');
        document.getElementById('ktIchkiGroup').innerHTML = qogozTugmalari(katalogConfig.ichkiQogozlari, 'ichki');
        document.getElementById('ktAbloshkaTomonGroup').innerHTML = `
            <button type="button" class="opt-btn ${s.abloshkaTomon === 1 ? 'active' : ''}" onclick="selectKatalog('abloshkaTomon', 1)">Abloshka 4+0 <small>(faqat tashqi)</small></button>
            <button type="button" class="opt-btn ${s.abloshkaTomon === 2 ? 'active' : ''}" onclick="selectKatalog('abloshkaTomon', 2)">Abloshka 4+4 <small>(ichi ham)</small></button>`;

        document.getElementById('ktLamGroup').innerHTML = Object.keys(KATALOG_LAM_NOMI).map(k => `
            <button type="button" class="opt-btn ${s.laminatsiya === k ? 'active' : ''}" onclick="selectKatalog('laminatsiya', '${k}')">🧴 ${KATALOG_LAM_NOMI[k]}</button>
        `).join('');

        document.getElementById('ktQoshimchaGroup').innerHTML = `
            <button type="button" class="opt-btn ${s.lak3d ? 'active' : ''}" onclick="selectKatalog('lak3d', ${!s.lak3d})">✨ 3D lak</button>
            <button type="button" class="opt-btn ${s.tisneniya ? 'active' : ''}" onclick="selectKatalog('tisneniya', ${!s.tisneniya})">🔨 Tisneniya</button>`;

        let qty = Math.max(parseInt(document.getElementById('inpQuantity')?.value) || 1, 1);
        let minT = parseInt(katalogConfig.ofsetMinTiraj) || 0;
        let ofsetMumkin = qty >= minT;
        let engine = ofsetMumkin ? s.engine : 'sifravoy';
        document.getElementById('ktEngineGroup').innerHTML = `
            <button type="button" class="opt-btn ${engine === 'ofset' ? 'active' : ''} ${ofsetMumkin ? '' : 'opt-btn-disabled'}" ${ofsetMumkin ? `onclick="selectKatalog('engine', 'ofset')"` : 'disabled'} title="${ofsetMumkin ? '' : `Ofset uchun kamida ${minT.toLocaleString()} dona`}">🏭 Ofset</button>
            <button type="button" class="opt-btn ${engine === 'sifravoy' ? 'active' : ''}" onclick="selectKatalog('engine', 'sifravoy')">🖨️ Sifravoy</button>`;
        document.getElementById('ktEngineOgoh').innerHTML = ofsetMumkin ? ''
            : `⚠️ Ofset pechat uchun eng kam adad — <b>${minT.toLocaleString()} dona</b>, shuning uchun Sifravoy pechatda hisoblanadi.`;
    }

    function selectKatalogOlcham(key) {
        let o = katalogConfig.olchamlar.find(x => x.key === key);
        if (!o) return;
        document.getElementById('ktEni').value = o.eni;
        document.getElementById('ktBoyi').value = o.boyi;
        renderKatalogOptions();
        calculate();
    }

    function selectKatalog(field, value) {
        katalogSelected[field] = value;
        renderKatalogOptions();
        calculate();
    }

    // Ofsetda bitta bo'lak (abloshka yoki ichki blok) narxi — eng arzon mashina/varaq varianti.
    // U — bitta nusxadagi TURLI bo'laklar soni (masalan 6 ta yoyilma), sides — 1 yoki 2.
    function katalogOfsetQism(w, h, U, tiraj, sides, paperType, gsm) {
        let eng = null;
        let papers = ofsetRawPapers.filter(p => p.name === paperType && p.gsm === gsm);
        let zapas = parseInt(katalogConfig.ofsetZapas) || 0;
        ['A3', 'A2', 'A1'].forEach(mash => {
            let plitaNarx = { A3: ofsetMachineSettings.plateA3, A2: ofsetMachineSettings.plateA2, A1: ofsetMachineSettings.plateA1 }[mash] || 0;
            let bazaNarx = ofsetMachineSettings[`print${mash}Base`] || 0;
            let qadamNarx = ofsetMachineSettings[`print${mash}Step`] || 0;
            papers.forEach(paper => {
                getOfsetWorkingSheets(mash).forEach(ws => {
                    let narx = paper.prices[ws.rawKey];
                    if (!narx || narx <= 0) return;
                    let fit = calculateOfsetGridFitting(ws.w - 10, ws.h - 10, w, h);
                    if (fit.count <= 0) return;
                    let forma, bosmaVaraq;
                    if (fit.count >= U) { forma = 1; bosmaVaraq = Math.ceil(tiraj / Math.floor(fit.count / U)); }
                    else { forma = Math.ceil(U / fit.count); bosmaVaraq = tiraj; }
                    let formaVaraq = bosmaVaraq + zapas;
                    let ishchiVaraq = forma * formaVaraq;
                    let xomVaraq = Math.ceil(ishchiVaraq / ws.divisor);
                    let qogozNarx = xomVaraq * narx;
                    let bittaOtish = bazaNarx + Math.max(0, Math.ceil(formaVaraq / 1000) - 1) * qadamNarx;
                    let bosmaNarx = forma * bittaOtish * (sides === 2 ? 2 : 1);
                    let plita = forma * (sides === 2 ? 8 : 4);
                    let plitaJami = plita * plitaNarx;
                    let jami = qogozNarx + plitaJami + bosmaNarx;
                    if (!eng || jami < eng.jami) {
                        eng = { jami, mash, ws, fit: fit.count, forma, ishchiVaraq, xomVaraq, qogozNarx, plita, plitaJami, bosmaNarx,
                                rawName: `${ws.rawKey} mm → ${mash} ${ws.w}×${ws.h}` };
                    }
                });
            });
        });
        return eng;
    }

    // Sifravoy: shu tur va grammdagi qog'ozni Sifravoy bazasidan topadi
    function katalogSifravoyQogozi(q) {
        let baza = xavfsizOl(() => digitalPapersDatabase, []) || [];
        let grammi = p => { let m = /(\d+)\s*g/i.exec(p.name || ''); return m ? parseInt(m[1]) : 0; };
        return baza.find(p => grammi(p) === q.gsm && (p.name || '').toLowerCase().includes(q.paperType.toLowerCase()))
            || baza.find(p => grammi(p) === q.gsm) || null;
    }

    function calculateKatalog(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let s = katalogSelected;
        let c = katalogConfig;
        let info = html => { let el = document.getElementById('ktInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = xabar => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let { eni, boyi } = katalogOlcham();
        if (!(eni > 0 && boyi > 0)) return yaroqsiz("Katalog eni va bo'yini kiriting — ikkalasi ham majburiy.");
        let sahifa = katalogSahifa();
        let m = katalogMahkamlash(s.mahkamlash);
        if (!m) return yaroqsiz("Mahkamlash usullari kiritilmagan — Admin → Katalog.");
        let karrali = parseInt(m.karrali) || 2;
        if (!(sahifa > 4)) return yaroqsiz("Sahifa sonini kiriting (abloshka bilan birga, 4 dan ko'p).");
        if (sahifa % karrali !== 0) return yaroqsiz(`${m.nomi} uchun sahifa soni ${karrali} ga karrali bo'lishi kerak (masalan ${Math.ceil(sahifa / karrali) * karrali}).`);
        if (sahifa < m.minSahifa || sahifa > m.maxSahifa) return yaroqsiz(`${m.nomi} bilan ${m.minSahifa}–${m.maxSahifa} sahifali katalog tayyorlanadi (siz ${sahifa} kiritdingiz).`);

        let abQ = c.abloshkaQogozlari[s.abloshka] || c.abloshkaQogozlari[0];
        let ichQ = c.ichkiQogozlari[s.ichki] || c.ichkiQogozlari[0];
        if (!abQ || !ichQ) return yaroqsiz("Abloshka yoki ichki blok qog'ozi kiritilmagan — Admin → Katalog.");

        // Bo'laklar geometriyasi
        let ichkiSahifa = sahifa - 4;
        let ichkiVaraq = ichkiSahifa / 2; // katalogdagi ichki varaqlar (barglar) soni
        let ich, ab;
        if (m.key === 'stepler') {
            ich = { w: eni * 2, h: boyi, U: ichkiSahifa / 4, nomi: 'yoyilma' };
            ab = { w: eni * 2, h: boyi, U: 1, nomi: 'yoyilma' };
        } else if (m.key === 'termokley') {
            let qirra = Math.max(1, Math.round(ichkiVaraq * ichQ.gsm * (parseFloat(c.qalinlikKoef) || 0.001)));
            ich = { w: eni, h: boyi, U: ichkiVaraq, nomi: 'varaq' };
            ab = { w: eni * 2 + qirra, h: boyi, U: 1, nomi: `o'ram (qirra ${qirra} mm)` };
        } else {
            ich = { w: eni, h: boyi, U: ichkiVaraq, nomi: 'varaq' };
            ab = { w: eni, h: boyi, U: 2, nomi: 'old + orqa' };
        }

        let minT = parseInt(c.ofsetMinTiraj) || 0;
        let engine = qty >= minT ? s.engine : 'sifravoy';

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };
        let infoQatorlar = [];

        let qismHisobla = (nomi, g, q, sides) => {
            if (engine === 'ofset') {
                let r = katalogOfsetQism(g.w, g.h, g.U, qty, sides, q.paperType, q.gsm);
                if (!r) return `${nomi}: ${katalogQogozNomi(q)} uchun Ofset qog'oz bazasida mos narx topilmadi (yoki ${g.w}×${g.h} mm varaqqa sig'maydi) — Admin → Ofset qog'oz bazasi.`;
                qosh(`${nomi} qog'ozi (${katalogQogozNomi(q)}, ${r.rawName})`, `${r.xomVaraq} xom varoq`, r.qogozNarx);
                qosh(`${nomi} forma (klishe)`, `${r.plita} plastina (${r.forma} forma)`, r.plitaJami);
                qosh(`${nomi} bosma (${sides === 2 ? '4+4' : '4+0'})`, `${r.ishchiVaraq} ta ${r.mash} varoq`, r.bosmaNarx);
                infoQatorlar.push(`${nomi}: ${g.U} ta ${g.nomi} ${g.w}×${g.h} mm → ${r.mash} varoqqa ${r.fit} ta · ${r.forma} forma · ${r.ishchiVaraq} varoq`);
            } else {
                let paper = katalogSifravoyQogozi(q);
                if (!paper) return `${nomi}: Sifravoy qog'oz bazasida ${katalogQogozNomi(q)} yo'q — Admin → Sifravoy pechat.`;
                let r = calculateDigitalPriceForPaper(paper, g.w, g.h, qty * g.U, sides);
                if (!r) return `${nomi}: ${g.w}×${g.h} mm "${paper.name}" pechat maydoniga (${paper.p_eni}×${paper.p_boyi}) sig'maydi.`;
                let varaq = r.sheetsNeeded + (parseInt(c.sifravoyZapas) || 0);
                let narx = parseFloat(sides === 2 ? paper.price2 : paper.price1) || 0;
                qosh(`${nomi} — Sifravoy (${paper.name}, ${sides === 2 ? '4+4' : '4+0'})`, `${varaq} varaq × ${narx.toLocaleString()}`, varaq * narx);
                infoQatorlar.push(`${nomi}: ${g.U} ta ${g.nomi} ${g.w}×${g.h} mm → varaqqa ${r.perSheet} ta · ${varaq} varaq`);
            }
            return null;
        };

        let xato = qismHisobla('Abloshka', ab, abQ, s.abloshkaTomon === 2 ? 2 : 1)
            || qismHisobla('Ichki blok', ich, ichQ, 2);
        if (xato) return yaroqsiz(xato);

        // Laminatsiya (majburiy) — abloshka, A3 varaq ekvivalenti bo'yicha
        let a3Fit = calculateOfsetGridFitting(297, 420, ab.w, ab.h).count;
        let a3Ulush = a3Fit > 0 ? 1 / a3Fit : Math.ceil((ab.w * ab.h) / (297 * 420));
        let lamA3 = Math.ceil(qty * ab.U * a3Ulush);
        let lamNarx = parseFloat(c.laminatsiya[s.laminatsiya]) || 0;
        qosh(`Abloshka laminatsiyasi (${KATALOG_LAM_NOMI[s.laminatsiya]})`, `${lamA3} A3 varaq × ${lamNarx.toLocaleString()}`, lamA3 * lamNarx);

        // Mahkamlash
        let mNarx = parseFloat(m.narx) || 0;
        qosh(`Mahkamlash (${m.nomi})`, `${qty} dona × ${mNarx.toLocaleString()}`, mNarx * qty);

        // 3D lak (ixtiyoriy) — dona + bir martalik klishe
        if (s.lak3d) {
            let l = c.lak3d || {};
            qosh('3D lak (abloshka)', `${qty} dona × ${(l.pricePerUnit || 0).toLocaleString()}`, (l.pricePerUnit || 0) * qty);
            if (l.klishePrice > 0) qosh('3D lak klishesi (bir martalik)', '1 marta', l.klishePrice);
        }
        // Tisneniya (ixtiyoriy) — umumiy Pardozlash xizmatlaridan
        if (s.tisneniya) {
            let fk = a3Fit > 0 ? 'a3' : 'a2';
            let t = (ofsetFinishingServices.tisneniya || {})[fk] || {};
            qosh(`Tisneniya (abloshka, ${fk.toUpperCase()} narxi)`, `${qty} dona × ${(t.pricePerUnit || 0).toLocaleString()}`, (t.pricePerUnit || 0) * qty);
            if (t.klishePrice > 0) qosh('Tisneniya klishesi (bir martalik)', '1 marta', t.klishePrice);
        }

        info(`<div>📖 ${sahifa} sahifa = 4 abloshka + ${ichkiSahifa} ichki (${ichkiVaraq} varaq) · ${engine === 'ofset' ? 'Ofset' : 'Sifravoy'} pechat</div>`
            + infoQatorlar.map(q => `<div class="paket-step-hint">${q}</div>`).join(''));

        let olcham = c.olchamlar.find(o => o.eni === eni && o.boyi === boyi);
        let qismlar = [`Katalog ${olcham ? olcham.nomi + ' ' : ''}${eni}×${boyi}mm, ${sahifa} sahifa`, m.nomi,
            `abloshka ${katalogQogozNomi(abQ)} ${s.abloshkaTomon === 2 ? '4+4' : '4+0'}, ${KATALOG_LAM_NOMI[s.laminatsiya].toLowerCase()} laminatsiya`,
            `ichki ${katalogQogozNomi(ichQ)}`, engine === 'ofset' ? 'Ofset' : 'Sifravoy'];
        if (s.lak3d) qismlar.push('3D lak');
        if (s.tisneniya) qismlar.push('tisneniya');
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Katalog ----
    function katalogQogozAdminQatori(q, prefix, i, ochir) {
        return `
            <tr>
                <td><select id="${prefix}_tur_${i}" class="poli-gsm-type-select" data-ptype="${escDiplom(q.paperType)}">
                    ${POLIGRAFIYA_PAPER_TYPES.map(t => `<option value="${escDiplom(t)}" ${t === q.paperType ? 'selected' : ''}>${escDiplom(t)}</option>`).join('')}
                </select></td>
                <td><input type="number" id="${prefix}_gsm_${i}" value="${q.gsm}" min="1"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="${ochir}(${i})">✕</button></td>
            </tr>`;
    }

    function renderAdminKatalog() {
        let q = id => document.getElementById(id);
        if (!q('ktAdminOlchamBody')) return;
        let c = katalogConfig;
        q('ktAdminOlchamBody').innerHTML = c.olchamlar.map((o, i) => `
            <tr>
                <td><input type="text" id="ktO_nomi_${i}" value="${escDiplom(o.nomi)}" placeholder="masalan: A4"></td>
                <td><input type="number" id="ktO_eni_${i}" value="${o.eni}" min="1"></td>
                <td><input type="number" id="ktO_boyi_${i}" value="${o.boyi}" min="1"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteKatalogOlcham(${i})">✕</button></td>
            </tr>`).join('');
        let bosh = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:14px;">Hozircha qog'oz yo'q.</td></tr>`;
        q('ktAdminAbloshkaBody').innerHTML = c.abloshkaQogozlari.map((x, i) => katalogQogozAdminQatori(x, 'ktA', i, 'deleteKatalogAbloshka')).join('') || bosh;
        q('ktAdminIchkiBody').innerHTML = c.ichkiQogozlari.map((x, i) => katalogQogozAdminQatori(x, 'ktI', i, 'deleteKatalogIchki')).join('') || bosh;
        q('ktAdminMahkamlashBody').innerHTML = c.mahkamlash.map((x, i) => `
            <tr>
                <td><b>${escDiplom(x.nomi)}</b></td>
                <td><input type="number" id="ktM_narx_${i}" value="${x.narx}" min="0"></td>
                <td><input type="number" id="ktM_min_${i}" value="${x.minSahifa}" min="4"></td>
                <td><input type="number" id="ktM_max_${i}" value="${x.maxSahifa}" min="4"></td>
                <td><input type="number" id="ktM_karra_${i}" value="${x.karrali}" min="1"></td>
            </tr>`).join('');
        q('ktAdminLamGlyans').value = c.laminatsiya.glyans;
        q('ktAdminLamMatoviy').value = c.laminatsiya.matoviy;
        q('ktAdminLakNarx').value = c.lak3d.pricePerUnit;
        q('ktAdminLakKlishe').value = c.lak3d.klishePrice;
        q('ktAdminOfsetMin').value = c.ofsetMinTiraj;
        q('ktAdminOfsetZapas').value = c.ofsetZapas;
        q('ktAdminSifravoyZapas').value = c.sifravoyZapas;
    }

    function collectKatalogFromUI() {
        let q = id => document.getElementById(id);
        if (!q('ktAdminOlchamBody')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        let c = katalogConfig;
        c.olchamlar = c.olchamlar.map((o, i) => q(`ktO_nomi_${i}`) ? {
            key: o.key, nomi: q(`ktO_nomi_${i}`).value.trim() || `O'lcham ${i + 1}`, eni: son(`ktO_eni_${i}`), boyi: son(`ktO_boyi_${i}`)
        } : o);
        let qogozOqi = (list, prefix) => list.map((x, i) => q(`${prefix}_tur_${i}`) ? { paperType: q(`${prefix}_tur_${i}`).value, gsm: son(`${prefix}_gsm_${i}`) } : x);
        c.abloshkaQogozlari = qogozOqi(c.abloshkaQogozlari, 'ktA');
        c.ichkiQogozlari = qogozOqi(c.ichkiQogozlari, 'ktI');
        c.mahkamlash = c.mahkamlash.map((x, i) => q(`ktM_narx_${i}`) ? {
            ...x, narx: son(`ktM_narx_${i}`), minSahifa: son(`ktM_min_${i}`, 4), maxSahifa: son(`ktM_max_${i}`, 4), karrali: son(`ktM_karra_${i}`, 1)
        } : x);
        c.laminatsiya = { glyans: son('ktAdminLamGlyans'), matoviy: son('ktAdminLamMatoviy') };
        c.lak3d = { pricePerUnit: son('ktAdminLakNarx'), klishePrice: son('ktAdminLakKlishe') };
        c.ofsetMinTiraj = son('ktAdminOfsetMin');
        c.ofsetZapas = son('ktAdminOfsetZapas');
        c.sifravoyZapas = son('ktAdminSifravoyZapas');
    }

    function addKatalogOlcham() {
        collectKatalogFromUI();
        katalogConfig.olchamlar.push({ key: 'o' + Date.now().toString(36), nomi: 'Yangi', eni: 200, boyi: 280 });
        renderAdminKatalog();
    }
    function deleteKatalogOlcham(i) {
        collectKatalogFromUI();
        let o = katalogConfig.olchamlar[i];
        if (!o || !confirm(`"${o.nomi}" o'lchamini o'chirasizmi?`)) return;
        katalogConfig.olchamlar.splice(i, 1);
        renderAdminKatalog();
    }
    function addKatalogAbloshka() {
        collectKatalogFromUI();
        katalogConfig.abloshkaQogozlari.push({ paperType: 'Melovka', gsm: 300 });
        renderAdminKatalog();
    }
    function deleteKatalogAbloshka(i) {
        collectKatalogFromUI();
        katalogConfig.abloshkaQogozlari.splice(i, 1);
        renderAdminKatalog();
    }
    function addKatalogIchki() {
        collectKatalogFromUI();
        katalogConfig.ichkiQogozlari.push({ paperType: 'Melovka', gsm: 130 });
        renderAdminKatalog();
    }
    function deleteKatalogIchki(i) {
        collectKatalogFromUI();
        katalogConfig.ichkiQogozlari.splice(i, 1);
        renderAdminKatalog();
    }

    function saveKatalogConfig() {
        collectKatalogFromUI();
        let c = katalogConfig;
        if (c.olchamlar.some(o => !(o.eni > 0 && o.boyi > 0))) { showToast("⚠️ Har bir o'lchamning eni va bo'yi 0 dan katta bo'lishi kerak!"); return; }
        if (c.abloshkaQogozlari.length === 0 || c.ichkiQogozlari.length === 0) { showToast("⚠️ Abloshka va ichki blok uchun kamida bitta qog'oz kiriting!"); return; }
        if ([...c.abloshkaQogozlari, ...c.ichkiQogozlari].some(x => !(x.gsm > 0))) { showToast("⚠️ Qog'oz grammi 0 dan katta bo'lishi kerak!"); return; }
        if (c.mahkamlash.some(x => x.minSahifa > x.maxSahifa)) { showToast("⚠️ Mahkamlashda eng kam sahifa eng ko'pdan katta bo'lmasin!"); return; }
        localStorage.setItem('erp_katalog_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Katalog sozlamalari o'zgartirildi",
            `Mahkamlash: ${c.mahkamlash.map(x => `${x.nomi} ${x.narx}`).join(', ')}; laminatsiya ${c.laminatsiya.glyans}/${c.laminatsiya.matoviy}; `
            + `3D lak ${c.lak3d.pricePerUnit}+${c.lak3d.klishePrice}; ofset min ${c.ofsetMinTiraj}`);
        renderAdminKatalog();
        showToast("💾 Katalog sozlamalari saqlandi!");
    }

    function migrateKatalogConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        ['ofsetMinTiraj', 'ofsetZapas', 'sifravoyZapas', 'qalinlikKoef'].forEach(k => { if (typeof saved[k] === 'number') cfg[k] = saved[k]; });
        ['olchamlar', 'abloshkaQogozlari', 'ichkiQogozlari'].forEach(k => { if (Array.isArray(saved[k])) cfg[k] = saved[k]; });
        if (Array.isArray(saved.mahkamlash)) {
            cfg.mahkamlash = cfg.mahkamlash.map(d => ({ ...d, ...(saved.mahkamlash.find(x => x && x.key === d.key) || {}) }));
        }
        if (saved.laminatsiya && typeof saved.laminatsiya === 'object') cfg.laminatsiya = { ...cfg.laminatsiya, ...saved.laminatsiya };
        if (saved.lak3d && typeof saved.lak3d === 'object') cfg.lak3d = { ...cfg.lak3d, ...saved.lak3d };
        return cfg;
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('katalog');
