// Poligrafiya bo'limi — Paket.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== PAKET (poligrafiya — Ofset bazasidan, eng murakkab hisob) ======================
    // Menejer paket turini (A5/A4/A3/A2) tanlaydi → admin kiritgan tayyor o'lchamlardan birini bosadi
    // (bo'yi/eni/kengligi avtomatik to'ldiriladi) yoki o'zi kiritadi. Uchala o'lcham ham MAJBURIY.
    //   Bo'yi = X, Eni = Y, Kengligi = Z (mm). Bitta tomonning bichish o'lchami: (X+Z+3) × (Y+Z+3).
    //   Paketning 2 tomoni bor:
    //     • ikki tomoni BIR XIL dizayn  → Ofsetga 2 × adad bo'lak yuboriladi (zapasni Ofset o'zi qo'shadi:
    //       200 paket → 400 + 100 = 500 varoq).
    //     • ikki tomoni HAR XIL dizayn  → Ofsetga adad bo'lak (200 + 100 = 300), va qog'oz, forma, pechat
    //       xarajati ×2 (har tomon uchun alohida).
    //   Laminatsiya, Visochka (majburiy), Lak, Tisneniya (ixtiyoriy) — 2 × adad bo'lak uchun, hisob qaysi
    //   ofset mashinasida (A3/A2/A1) chiqsa, o'sha mashina narxi bilan. Barchasining narxi — Ofset admin
    //   bo'limidagi umumiy "Pardozlash xizmatlari" (ofsetFinishingServices) dan; Lenta — shu yerdan.
    //   + Yig'ish (paket turi bo'yicha, so'm/paket), + Lenta (ixtiyoriy, so'm/paket).
    //   O'lcham tanlangan turning tayyor o'lchamlariga mos kelmasa — shu tur uchun bir martalik pichoq narxi.
    let paketConfig = {
        turlar: [
            // standartGsm — shu turdagi paket uchun avtomatik tanlanadigan karton (qalinroq/yupqaroq
            // kerak bo'lsa menejer ro'yxatdan boshqasini tanlaydi)
            { key: 'a5', name: 'A5', pichoqNarxi: 500000,  yigishNarxi: 1500, standartGsm: 190,
              olchamlar: [{ x: 240, y: 180, z: 80 }, { x: 220, y: 160, z: 70 }] },
            { key: 'a4', name: 'A4', pichoqNarxi: 1000000, yigishNarxi: 2000, standartGsm: 210, isDefault: true,
              olchamlar: [{ x: 330, y: 250, z: 100 }, { x: 320, y: 240, z: 90 }] },
            { key: 'a3', name: 'A3', pichoqNarxi: 1300000, yigishNarxi: 2500, standartGsm: 230,
              olchamlar: [{ x: 450, y: 330, z: 120 }, { x: 420, y: 300, z: 100 }] },
            { key: 'a2', name: 'A2', pichoqNarxi: 1700000, yigishNarxi: 3500, standartGsm: 250,
              olchamlar: [{ x: 600, y: 450, z: 150 }, { x: 550, y: 400, z: 120 }] }
        ],
        // Paket FAQAT Kartondan — menejer tanlay oladigan karton grammajlari (narxi Ofset bo'limidagi
        // Karton bazasidan). Har turning standart kartoni ham shu ro'yxatda bo'lishi kerak.
        qogozlar: [
            { paperType: 'Karton', gsm: 190 },
            { paperType: 'Karton', gsm: 210 },
            { paperType: 'Karton', gsm: 230 },
            { paperType: 'Karton', gsm: 250 },
            { paperType: 'Karton', gsm: 300 },
            { paperType: 'Karton', gsm: 350 }
        ],
        lentaNarxi: 5000 // lentali paket — har bir paketga qo'shimcha xizmat (so'm)
        // Laminatsiya, Visochka, Lak, Tisneniya narxlari — umumiy ofsetFinishingServices dan
        // (Ofset admin → Pardozlash xizmatlari), mashina bo'yicha.
    };

    let paketSelected = { tur: 'a4', gsm: 210, dizayn: 'bir', lenta: false, lak: false, tisneniya: false };

    // Turning standart kartoni (ro'yxatda bo'lmasa — ro'yxatdagi eng yaqini)
    function paketStandartGsm(tur) {
        let list = paketConfig.qogozlar.map(g => g.gsm);
        if (list.length === 0) return 0;
        let s = parseInt(tur && tur.standartGsm) || list[0];
        return list.reduce((eng, g) => Math.abs(g - s) < Math.abs(eng - s) ? g : eng, list[0]);
    }

    function paketTuri(key) {
        return paketConfig.turlar.find(t => t.key === key) || paketConfig.turlar[0] || null;
    }

    function paketOlchamlari() {
        let v = id => parseFloat(document.getElementById(id)?.value) || 0;
        return { x: v('paketX'), y: v('paketY'), z: v('paketZ') };
    }

    // Kiritilgan o'lcham tanlangan turning tayyor o'lchamlaridan biriga aynan mosmi (pichoq bor)?
    function paketTayyorOlchamIndeksi(tur, x, y, z) {
        return (tur && tur.olchamlar || []).findIndex(o => o.x === x && o.y === y && o.z === z);
    }

    function buildPaketForm() {
        let def = paketConfig.turlar.find(t => t.isDefault) || paketConfig.turlar[0];
        paketSelected = { tur: def ? def.key : 'a4', gsm: paketStandartGsm(def), dizayn: 'bir', lenta: false, lak: false, tisneniya: false };
        let o = (def && def.olchamlar && def.olchamlar[0]) || { x: '', y: '', z: '' };
        return `
            <div class="poli-calc paket-calc">
                <div class="step-title">1. Paket turi</div>
                <div class="options-group" id="paketTurGroup"></div>

                <div class="step-title">2. Tayyor o'lchamlar <span class="paket-step-hint">(bosing — o'lchamlar avtomatik qo'yiladi)</span></div>
                <div class="options-group" id="paketOlchamGroup"></div>

                <div class="paket-olcham-row">
                    <div class="form-group">
                        <label>Bo'yi (X) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketX" min="1" value="${o.x}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Eni (Y) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketY" min="1" value="${o.y}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Kengligi (Z) <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="paketZ" min="1" value="${o.z}" oninput="renderPaketOlchamChips(); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="paketBichishInfo" class="paket-bichish-info"></div>

                <div class="step-title">3. Karton grammaji <span class="paket-step-hint">(★ — shu tur uchun standart; qalinroq/yupqaroq kerak bo'lsa boshqasini tanlang)</span></div>
                <div class="options-group" id="paketQogozGroup"></div>

                <div class="step-title">4. Ikki tomonining dizayni</div>
                <div class="options-group" id="paketDizaynGroup"></div>

                <div class="step-title">5. Qo'shimcha</div>
                <div class="options-group" id="paketExtraGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (paket soni)</label>
                    <input type="number" id="inpQuantity" value="500" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderPaketOlchamChips() {
        let group = document.getElementById('paketOlchamGroup');
        if (!group) return;
        let tur = paketTuri(paketSelected.tur);
        let { x, y, z } = paketOlchamlari();
        let faol = paketTayyorOlchamIndeksi(tur, x, y, z);
        let list = (tur && tur.olchamlar) || [];
        group.innerHTML = list.length === 0
            ? `<span class="paket-step-hint">Bu tur uchun tayyor o'lcham kiritilmagan — o'lchamni qo'lda kiriting.</span>`
            : list.map((o, i) => `
                <button type="button" class="opt-btn ${i === faol ? 'active' : ''}" onclick="selectPaketOlcham(${i})">${o.x}×${o.y}×${o.z}</button>
            `).join('');
    }

    function renderPaketOptions() {
        let turGroup = document.getElementById('paketTurGroup');
        if (!turGroup) return;
        turGroup.innerHTML = paketConfig.turlar.map(t => `
            <button type="button" class="opt-btn ${t.key === paketSelected.tur ? 'active' : ''}" onclick="selectPaketTur('${t.key}')">${t.name}</button>
        `).join('');
        renderPaketOlchamChips();
        let standart = paketStandartGsm(paketTuri(paketSelected.tur));
        document.getElementById('paketQogozGroup').innerHTML = paketConfig.qogozlar.map(q => `
            <button type="button" class="opt-btn ${q.gsm === paketSelected.gsm ? 'active' : ''}" onclick="selectPaketQogoz(${q.gsm})">${q.gsm === standart ? '★ ' : ''}${q.gsm}gr</button>
        `).join('');
        document.getElementById('paketDizaynGroup').innerHTML = `
            <button type="button" class="opt-btn ${paketSelected.dizayn === 'bir' ? 'active' : ''}" onclick="selectPaketDizayn('bir')">Bir xil</button>
            <button type="button" class="opt-btn ${paketSelected.dizayn === 'har' ? 'active' : ''}" onclick="selectPaketDizayn('har')">Har xil</button>
        `;
        document.getElementById('paketExtraGroup').innerHTML = `
            <button type="button" class="opt-btn ${paketSelected.lenta ? 'active' : ''}" onclick="togglePaketExtra('lenta')">🎀 Lenta</button>
            <button type="button" class="opt-btn ${paketSelected.lak ? 'active' : ''}" onclick="togglePaketExtra('lak')">✨ Lak</button>
            <button type="button" class="opt-btn ${paketSelected.tisneniya ? 'active' : ''}" onclick="togglePaketExtra('tisneniya')">🔨 Tisneniya</button>
        `;
    }

    function selectPaketTur(key) {
        paketSelected.tur = key;
        paketSelected.gsm = paketStandartGsm(paketTuri(key)); // turga mos standart karton
        let o = (paketTuri(key).olchamlar || [])[0];
        if (o) paketOlchamniQoy(o);
        renderPaketOptions();
        calculate();
    }

    function paketOlchamniQoy(o) {
        document.getElementById('paketX').value = o.x;
        document.getElementById('paketY').value = o.y;
        document.getElementById('paketZ').value = o.z;
    }

    function selectPaketOlcham(i) {
        let o = (paketTuri(paketSelected.tur).olchamlar || [])[i];
        if (!o) return;
        paketOlchamniQoy(o);
        renderPaketOlchamChips();
        calculate();
    }

    function selectPaketQogoz(gsm) { paketSelected.gsm = gsm; renderPaketOptions(); calculate(); }
    function selectPaketDizayn(d) { paketSelected.dizayn = d; renderPaketOptions(); calculate(); }
    function togglePaketExtra(name) { paketSelected[name] = !paketSelected[name]; renderPaketOptions(); calculate(); }

    function paketInfo(html) {
        let el = document.getElementById('paketBichishInfo');
        if (el) el.innerHTML = html;
    }

    function calculatePaket(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let tur = paketTuri(paketSelected.tur);
        let { x, y, z } = paketOlchamlari();
        if (!tur || !(x > 0 && y > 0 && z > 0)) {
            paketInfo(`<div class="paket-xato">⚠️ Bo'yi, eni va kengligini kiriting — uchalasi ham majburiy.</div>`);
            return { unitPrice: 0, details: "⚠️ Paket o'lchamlari to'liq kiritilmagan (bo'yi, eni, kengligi majburiy)", costItems: [], hisobYaroqsiz: true };
        }

        // Bitta tomonning bichish (yoyilgan) o'lchami
        let w = x + z + 3, h = y + z + 3;
        let gsm = paketSelected.gsm || paketStandartGsm(tur);
        if (!gsm) {
            return { unitPrice: 0, details: "⚠️ Paket uchun karton grammaji kiritilmagan — Admin panelda kiriting.", costItems: [], hisobYaroqsiz: true };
        }
        let qogoz = { paperType: 'Karton', gsm }; // paket faqat Kartondan
        let harXil = paketSelected.dizayn === 'har';
        let k = harXil ? 2 : 1;                     // qog'oz/forma/pechat necha marta hisoblanadi
        let ofsetTiraj = harXil ? qty : qty * 2;    // Ofsetga yuboriladigan bo'lak (zapasni Ofset o'zi qo'shadi)
        let bolaklar = qty * 2;                     // pardozlash (laminatsiya, visochka, lak, tisneniya) uchun

        let natijalar = ['A3', 'A2', 'A1']
            .map(m => calculateOfsetForMachine(m, w, h, ofsetTiraj, 1, qogoz.paperType, qogoz.gsm))
            .filter(Boolean)
            .sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
        let r = natijalar[0];
        let tayyorIdx = paketTayyorOlchamIndeksi(tur, x, y, z);
        let pichoqKerak = tayyorIdx < 0;

        if (!r) {
            let narxBor = ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === qogoz.gsm && Object.values(p.prices || {}).some(v => v > 0));
            paketInfo(`<div class="paket-xato">⚠️ ${narxBor
                ? `Bichish o'lchami ${w}×${h} mm hech bir ofset mashinasiga (A3/A2/A1) sig'madi.`
                : `Karton ${qogoz.gsm}gr narxi Ofset bo'limida kiritilmagan — admin <b>Ofset pechat → Karton qog'ozi</b> jadvalida narxini kiritishi kerak.`}</div>`);
            return { unitPrice: 0, details: `⚠️ ${w}×${h} mm bichish o'lchami ofset mashinalariga sig'madi yoki ${qogoz.paperType} ${qogoz.gsm}gr narxi yo'q`, costItems: [], hisobYaroqsiz: true };
        }

        let mKey = r.machine.toLowerCase(); // 'a3' | 'a2' | 'a1'
        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };
        let izohlar = [];

        // 1) Ofset: qog'oz, forma, pechat (har xil dizaynda ×2)
        // Har xil dizaynda: har tomon uchun son × 2 tomon (masalan "300 × 2 tomon" = jami 600)
        let tomon = harXil ? ' × 2 tomon' : '';
        qosh(`Qog'oz (${r.paperName} ${r.paperGsm}gr, ${r.rawName})`, `${r.totalSheets}${tomon} xom varoq`, r.totalPaperCost * k);
        qosh('Forma (klishe)', `${r.totalPlates}${tomon} plastina`, r.totalPlateCost * k);
        qosh('Bosma (pechat)', `${r.totalWorkingSheets}${tomon} ${r.machine} varoq`, r.totalPrintCost * k);

        // 2) Laminatsiya va Visochka — majburiy, 2 × adad bo'lak, mashina narxi bo'yicha
        let lamNarx = parseFloat(ofsetFinishingServices.laminatsiya[mKey]) || 0;
        qosh(`Laminatsiya (${r.machine})`, `${bolaklar} bo'lak`, lamNarx * bolaklar);
        let visTier = ofsetFinishingServices.visochka[mKey];
        let visJami = papkaTieredTotal(bolaklar, visTier);
        qosh(`Visochka (${r.machine})`, `${bolaklar} bo'lak`, visJami);
        if (lamNarx <= 0) izohlar.push(`⚠️ ${r.machine} uchun laminatsiya narxi kiritilmagan`);
        if (visJami <= 0) izohlar.push(`⚠️ ${r.machine} uchun visochka narxi kiritilmagan`);

        // 3) Yig'ish (har bir paket)
        qosh(`Yig'ish (${tur.name})`, `${qty} paket`, (parseFloat(tur.yigishNarxi) || 0) * qty);

        // 4) Ixtiyoriy: lenta, lak, tisneniya
        if (paketSelected.lenta) qosh('Lenta', `${qty} paket`, (parseFloat(paketConfig.lentaNarxi) || 0) * qty);
        if (paketSelected.lak) qosh(`Lak (${r.machine})`, `${bolaklar} bo'lak`, papkaTieredTotal(bolaklar, ofsetFinishingServices.lak[mKey]));
        if (paketSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya[mKey] || {};
            qosh(`Tisneniya (${r.machine})`, `${bolaklar} bo'lak`, (parseFloat(tis.pricePerUnit) || 0) * bolaklar);
            qosh('Tisneniya klishesi (bir martalik)', `${k} ta`, (parseFloat(tis.klishePrice) || 0) * k);
        }

        // 5) Nostandart o'lcham — bir martalik pichoq
        let pichoq = pichoqKerak ? (parseFloat(tur.pichoqNarxi) || 0) : 0;
        if (pichoqKerak) qosh(`Pichoq yasatish (${tur.name}, bir martalik)`, '1 marta', pichoq);

        paketInfo(`
            <div>📐 Bichish (1 tomon): <b>${w}×${h} mm</b> → <b>${r.machine}</b> ofset, 1 varoqqa ${r.itemsPerSheet} dona ·
                Ofsetga ${ofsetTiraj} bo'lak${harXil ? ' × 2 tomon' : ''} (+zapas)</div>
            ${pichoqKerak
                ? `<div class="paket-pichoq">✂️ Nostandart o'lcham — ${tur.name} uchun bir martalik pichoq: <b>${pichoq.toLocaleString()} so'm</b> qo'shildi</div>`
                : `<div class="paket-pichoq-bor">✓ Tayyor pichoq bor — pichoq narxi qo'shilmaydi</div>`}
        `);

        let qismlar = [`Paket ${tur.name} ${x}×${y}×${z}mm (bichish ${w}×${h})`, `${qogoz.paperType} ${qogoz.gsm}gr`,
            `${r.machine} ofset`, harXil ? 'ikki tomoni har xil' : 'ikki tomoni bir xil'];
        if (paketSelected.lenta) qismlar.push('lenta');
        if (paketSelected.lak) qismlar.push('lak');
        if (paketSelected.tisneniya) qismlar.push('tisneniya');
        if (pichoqKerak) qismlar.push('pichoq (bir martalik)');
        qismlar = qismlar.concat(izohlar);

        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Paket ----
    function renderAdminPaket() {
        let q = id => document.getElementById(id);
        if (!q('paketTurlarBody')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

        q('paketTurlarBody').innerHTML = paketConfig.turlar.map((t, i) => `
            <tr>
                <td style="font-weight:700;">${esc(t.name)}</td>
                <td><input type="number" id="pkTur_pichoq_${i}" value="${t.pichoqNarxi || 0}" min="0"></td>
                <td><input type="number" id="pkTur_yigish_${i}" value="${t.yigishNarxi || 0}" min="0"></td>
                <td><select id="pkTur_gsm_${i}">${paketConfig.qogozlar.map(g => `<option value="${g.gsm}" ${g.gsm === paketStandartGsm(t) ? 'selected' : ''}>Karton ${g.gsm}gr</option>`).join('')}</select></td>
                <td style="text-align:center;"><input type="radio" name="pkTurDefault" id="pkTur_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
            </tr>
        `).join('');

        q('paketOlchamlarBody').innerHTML = paketConfig.turlar.map((t, ti) => `
            <div class="paket-admin-olcham-tur">
                <div class="paket-admin-olcham-head">
                    <b>${esc(t.name)}</b>
                    <button type="button" class="btn btn-outline" style="height:30px; padding:0 10px; font-size:0.78rem;" onclick="addPaketOlcham(${ti})">+ O'lcham</button>
                </div>
                ${(t.olchamlar || []).length === 0 ? `<div class="paket-step-hint">Tayyor o'lcham yo'q — bu turda har doim pichoq narxi qo'shiladi.</div>` : ''}
                ${(t.olchamlar || []).map((o, oi) => `
                    <div class="paket-admin-olcham-row">
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_x" value="${o.x}" min="1" title="Bo'yi (X)"><span>X</span></div>
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_y" value="${o.y}" min="1" title="Eni (Y)"><span>Y</span></div>
                        <div class="input-unit"><input type="number" id="pkOl_${ti}_${oi}_z" value="${o.z}" min="1" title="Kengligi (Z)"><span>Z</span></div>
                        <button type="button" class="btn btn-danger" style="height:34px; padding:0 10px;" title="O'chirish" onclick="deletePaketOlcham(${ti}, ${oi})">✕</button>
                    </div>
                `).join('')}
            </div>
        `).join('');

        q('paketQogozlarBody').innerHTML = paketConfig.qogozlar.map((g, i) => `
            <tr>
                <td style="font-weight:600;">Karton</td>
                <td><div class="input-unit"><input type="number" id="pkQ_gsm_${i}" value="${g.gsm}" min="1"><span>gr</span></div></td>
                <td>${paketConfig.turlar.filter(t => paketStandartGsm(t) === g.gsm).map(t => `<span class="paket-std-badge">${t.name} standarti</span>`).join(' ')}</td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deletePaketQogoz(${i})">✕</button></td>
            </tr>
        `).join('');

        q('paketLentaNarxi').value = paketConfig.lentaNarxi || 0;
    }

    // Formadagi (hali saqlanmagan) qiymatlarni paketConfig ga o'qib oladi
    function collectPaketFromUI() {
        let q = id => document.getElementById(id);
        if (!q('paketTurlarBody')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        paketConfig.turlar = paketConfig.turlar.map((t, i) => ({
            ...t,
            pichoqNarxi: son(`pkTur_pichoq_${i}`),
            yigishNarxi: son(`pkTur_yigish_${i}`),
            standartGsm: q(`pkTur_gsm_${i}`) ? (parseInt(q(`pkTur_gsm_${i}`).value) || t.standartGsm) : t.standartGsm,
            isDefault: !!q(`pkTur_def_${i}`)?.checked,
            olchamlar: (t.olchamlar || []).map((o, oi) => q(`pkOl_${i}_${oi}_x`) ? {
                x: son(`pkOl_${i}_${oi}_x`), y: son(`pkOl_${i}_${oi}_y`), z: son(`pkOl_${i}_${oi}_z`)
            } : o)
        }));
        paketConfig.qogozlar = paketConfig.qogozlar.map((g, i) => q(`pkQ_gsm_${i}`) ? {
            paperType: 'Karton', gsm: son(`pkQ_gsm_${i}`, 1)
        } : g);
        paketConfig.lentaNarxi = son('paketLentaNarxi');
    }

    function addPaketOlcham(ti) {
        collectPaketFromUI();
        let t = paketConfig.turlar[ti];
        if (!t) return;
        let oxirgi = (t.olchamlar || [])[t.olchamlar.length - 1] || { x: 300, y: 250, z: 100 };
        t.olchamlar = (t.olchamlar || []).concat([{ ...oxirgi }]);
        renderAdminPaket();
    }

    function deletePaketOlcham(ti, oi) {
        collectPaketFromUI();
        let t = paketConfig.turlar[ti];
        if (!t || !confirm(`${t.name}: ${t.olchamlar[oi].x}×${t.olchamlar[oi].y}×${t.olchamlar[oi].z} o'lchamini o'chirasizmi?`)) return;
        t.olchamlar.splice(oi, 1);
        renderAdminPaket();
    }

    function addPaketQogoz() {
        collectPaketFromUI();
        let oxirgi = paketConfig.qogozlar.length ? paketConfig.qogozlar[paketConfig.qogozlar.length - 1].gsm : 250;
        paketConfig.qogozlar.push({ paperType: 'Karton', gsm: oxirgi + 20 });
        renderAdminPaket();
    }

    function deletePaketQogoz(i) {
        collectPaketFromUI();
        let g = paketConfig.qogozlar[i];
        let foydalanadi = paketConfig.turlar.filter(t => paketStandartGsm(t) === g.gsm).map(t => t.name);
        if (foydalanadi.length) { showToast(`⚠️ Karton ${g.gsm}gr — ${foydalanadi.join(', ')} turining standarti. Avval turning standart kartonini o'zgartiring.`); return; }
        if (!confirm(`Karton ${g.gsm}gr ni o'chirasizmi?`)) return;
        paketConfig.qogozlar.splice(i, 1);
        renderAdminPaket();
    }

    function savePaketConfig() {
        collectPaketFromUI();
        let xato = paketConfig.turlar.some(t => (t.olchamlar || []).some(o => !(o.x > 0 && o.y > 0 && o.z > 0)));
        if (xato) { showToast("⚠️ Tayyor o'lchamlarda X, Y, Z 0 dan katta bo'lishi kerak!"); return; }
        if (paketConfig.qogozlar.length === 0) { showToast("⚠️ Kamida bitta karton grammajini kiriting!"); return; }
        // takroriy grammajlarni olib tashlab, o'sish tartibida saqlaymiz
        paketConfig.qogozlar = [...new Map(paketConfig.qogozlar.map(g => [g.gsm, g])).values()].sort((a, b) => a.gsm - b.gsm);
        if (!paketConfig.turlar.some(t => t.isDefault)) paketConfig.turlar[0].isDefault = true;
        localStorage.setItem('erp_paket_config', JSON.stringify(paketConfig));
        if (typeof logAudit === 'function') logAudit("Paket sozlamalari o'zgartirildi",
            paketConfig.turlar.map(t => `${t.name}: karton ${t.standartGsm}gr, pichoq ${t.pichoqNarxi}, yig'ish ${t.yigishNarxi}, ${t.olchamlar.length} o'lcham`).join('; ') + `; lenta ${paketConfig.lentaNarxi}`);
        renderAdminPaket();
        showToast("💾 Paket sozlamalari saqlandi!");
    }

    // Saqlangan sozlamani standart tuzilma ustiga xavfsiz qo'yadi (yangi maydonlar qo'shilsa ham buzilmaydi)
    function migratePaketConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        if (Array.isArray(saved.turlar)) {
            cfg.turlar = defaults.turlar.map(d => {
                let s = saved.turlar.find(x => x && x.key === d.key);
                return s ? { ...d, ...s, olchamlar: Array.isArray(s.olchamlar) ? s.olchamlar : d.olchamlar } : d;
            });
        }
        // Paket faqat Kartondan: eski saqlangan Melovka va boshqa qatorlar tashlab yuboriladi
        let kartonlar = Array.isArray(saved.qogozlar) ? saved.qogozlar.filter(g => g && g.paperType === 'Karton' && g.gsm > 0) : [];
        let eskiFormat = Array.isArray(saved.turlar) && !saved.turlar.some(t => t && t.standartGsm);
        if (eskiFormat) kartonlar = kartonlar.concat(defaults.qogozlar); // turlarning standart kartonlari ro'yxatda bo'lsin
        if (kartonlar.length > 0) {
            cfg.qogozlar = [...new Map(kartonlar.map(g => [g.gsm, { paperType: 'Karton', gsm: g.gsm }])).values()].sort((x, y) => x.gsm - y.gsm);
        }
        if (typeof saved.lentaNarxi === 'number') cfg.lentaNarxi = saved.lentaNarxi;
        // Eski saqlangan lak/tisneniya maydonlari e'tiborga olinmaydi — narx umumiy joydan.
        return cfg;
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('paket');
