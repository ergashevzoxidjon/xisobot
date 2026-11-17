// Poligrafiya bo'limi — Konvert va Otkritka (varaqli mahsulotlar — umumiy dvigatel).
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== KONVERT VA OTKRITKA (varaqli mahsulotlar — umumiy dvigatel) ======================
    // Ikkalasi bir xil hisoblanadi, farqi faqat sozlamada:
    //   1) Tur (admin kiritgan tayyor o'lcham) tanlanadi yoki menejer eni × bo'yini o'zi kiritadi.
    //      Tayyor turning bichish (yoyilgan) o'lchami admin tomonidan aniq kiritiladi; o'z o'lchamida
    //      bichish = (eni + qoshEni) × (bo'yi × boyiKarra + qoshBoyi) va (Konvertda) bir martalik pichoq.
    //   2) Qog'oz — Qog'oz bo'limidagi ro'yxatdan (varaq formati + narxi). Bichim varaqqa joylashtiriladi
    //      (aylantirib ham), varaq soni = ceil(adad / varaqdagi dona) + zapas.
    //   3) Pechat (Sifravoy yoki UF) — turning tiraj oraliqlari bo'yicha dona narxi (admin kiritadi).
    //   4) Konvert: Tisneniya (ixtiyoriy) — umumiy Pardozlash xizmatlari (A3 qatori): dona + klishe.
    //      Otkritka: pardozlash — Oddiy / 3D lak / 3D Tilla-Kumush folga (dona narxi), ikki tomonlama pechat.
    const VARAQLI_TURLAR = ['konvert']; // Otkritka — alohida modul (otkritkaConfig)
    const VARAQLI_PECHAT_NOMI = { sifravoy: 'Sifravoy pechat', uf: 'UF pechat', yoq: 'Pechatsiz' };

    let varaqliConfig = {
        konvert: {
            pichoqNarxi: 500000,   // o'z (nostandart) o'lcham uchun bir martalik pichoq
            zapasVaraq: 10,        // tirajga bir marta qo'shiladigan zapas varaq
            formula: { qoshEni: 30, boyiKarra: 2, qoshBoyi: 50 },
            pechatTurlari: ['sifravoy', 'uf'], // menejer bittasini tanlaydi
            pechatsizMumkin: true, // faqat tisneniya bo'lishi mumkin
            tisneniya: true,
            ikkiTomon: false,
            pardozlar: [],
            turlar: [
                { key: 'evro', nomi: 'Evro', eni: 220, boyi: 110, bichishEni: 230, bichishBoyi: 330,
                  tierlar: [{ dan: 1, sifravoy: 1500, uf: 2500 }, { dan: 100, sifravoy: 1000, uf: 1800 }, { dan: 500, sifravoy: 700, uf: 1300 }, { dan: 1000, sifravoy: 500, uf: 1000 }] },
                { key: 'c6', nomi: 'C6', eni: 162, boyi: 114, bichishEni: 180, bichishBoyi: 260,
                  tierlar: [{ dan: 1, sifravoy: 1300, uf: 2200 }, { dan: 100, sifravoy: 900, uf: 1600 }, { dan: 500, sifravoy: 600, uf: 1100 }, { dan: 1000, sifravoy: 450, uf: 900 }] },
                { key: 'c5', nomi: 'C5', eni: 229, boyi: 162, bichishEni: 250, bichishBoyi: 370,
                  tierlar: [{ dan: 1, sifravoy: 1800, uf: 2800 }, { dan: 100, sifravoy: 1200, uf: 2000 }, { dan: 500, sifravoy: 850, uf: 1500 }, { dan: 1000, sifravoy: 650, uf: 1200 }] },
                { key: 'c4', nomi: 'C4', eni: 324, boyi: 229, bichishEni: 350, bichishBoyi: 500,
                  tierlar: [{ dan: 1, sifravoy: 2500, uf: 3500 }, { dan: 100, sifravoy: 1700, uf: 2600 }, { dan: 500, sifravoy: 1200, uf: 2000 }, { dan: 1000, sifravoy: 950, uf: 1600 }] }
            ]
        }
    };

    let varaqliSelected = { tur: '', qogozId: '', pechat: 'sifravoy', tisneniya: false, pardoz: 'oddiy', ikkiTomon: false };

    function varaqliCfg(type) { return varaqliConfig[type]; }
    function varaqliTuri(type, key) {
        let c = varaqliCfg(type);
        return (c.turlar || []).find(t => t.key === key) || (c.turlar || [])[0] || null;
    }
    function varaqliQogozlar(type) {
        // Qog'oz bo'limi ishlamasa ham kalkulyator yiqilmasin — bo'sh ro'yxat qaytadi
        return xavfsizOl(() => qogozRoyxati(type), []);
    }
    function varaqliOlcham() {
        let v = id => parseFloat(document.getElementById(id)?.value) || 0;
        return { eni: v('vmEni'), boyi: v('vmBoyi') };
    }

    function buildVaraqliForm(type) {
        let c = varaqliCfg(type);
        let t = (c.turlar || [])[0];
        let qog = varaqliQogozlar(type)[0];
        let pechatTurlari = c.pechatTurlari || ['sifravoy', 'uf'];
        varaqliSelected = { tur: t ? t.key : '', qogozId: qog ? qog.id : '', pechat: pechatTurlari[0], tisneniya: false, pardoz: 'oddiy', ikkiTomon: false };
        return `
            <div class="poli-calc">
                <div class="step-title">1. Turi <span class="paket-step-hint">(bosing — o'lcham avtomatik qo'yiladi; boshqa o'lcham kerak bo'lsa o'zingiz kiriting)</span></div>
                <div class="options-group" id="vmTurGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="vmEni" min="1" value="${t ? t.eni : ''}" oninput="renderVaraqliTurChips('${type}'); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="vmBoyi" min="1" value="${t ? t.boyi : ''}" oninput="renderVaraqliTurChips('${type}'); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="vmInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Qog'oz</div>
                <div class="options-group" id="vmQogozGroup"></div>

                <div class="step-title">3. Pechat${pechatTurlari.length === 1 ? ` <span class="paket-step-hint">(${VARAQLI_PECHAT_NOMI[pechatTurlari[0]]})</span>` : ''}</div>
                <div class="options-group" id="vmPechatGroup"></div>

                <div class="step-title">4. Qo'shimcha</div>
                <div class="options-group" id="vmQoshimchaGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="500" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderVaraqliTurChips(type) {
        let group = document.getElementById('vmTurGroup');
        if (!group) return;
        let { eni, boyi } = varaqliOlcham();
        group.innerHTML = (varaqliCfg(type).turlar || []).map(t => {
            let mos = t.key === varaqliSelected.tur && t.eni === eni && t.boyi === boyi;
            return `<button type="button" class="opt-btn ${mos ? 'active' : ''}" onclick="selectVaraqliTur('${type}', '${t.key}')">${t.nomi}</button>`;
        }).join('') || `<span class="paket-step-hint">Tur kiritilmagan — o'lchamni qo'lda kiriting.</span>`;
    }

    function renderVaraqliOptions(type) {
        let c = varaqliCfg(type);
        renderVaraqliTurChips(type);
        let qogozlar = varaqliQogozlar(type);
        document.getElementById('vmQogozGroup').innerHTML = qogozlar.length === 0
            ? `<span class="paket-xato">⚠️ Qog'oz kiritilmagan — Admin panel → Qog'oz bo'limi</span>`
            : qogozlar.map(q => `
                <button type="button" class="opt-btn ${q.id === varaqliSelected.qogozId ? 'active' : ''}" onclick="selectVaraqli('qogozId', '${q.id}', '${type}')">${q.nomi} · ${q.format}</button>
            `).join('');
        // Pechat turi faqat bir nechta bo'lsa tanlanadi (Otkritka — faqat Sifravoy, tanlovsiz);
        // bir/ikki tomonlama ham shu "Pechat" qadamida.
        let pechatlar = (c.pechatTurlari || ['sifravoy', 'uf']).concat(c.pechatsizMumkin ? ['yoq'] : []);
        if (!pechatlar.includes(varaqliSelected.pechat)) varaqliSelected.pechat = pechatlar[0];
        let pechatHtml = pechatlar.length > 1 ? pechatlar.map(p => `
            <button type="button" class="opt-btn ${varaqliSelected.pechat === p ? 'active' : ''}" onclick="selectVaraqli('pechat', '${p}', '${type}')">${VARAQLI_PECHAT_NOMI[p]}</button>
        `).join('') : '';
        if (c.ikkiTomon) {
            pechatHtml += `<button type="button" class="opt-btn ${!varaqliSelected.ikkiTomon ? 'active' : ''}" onclick="selectVaraqli('ikkiTomon', false, '${type}')">Bir tomonlama</button>`
                + `<button type="button" class="opt-btn ${varaqliSelected.ikkiTomon ? 'active' : ''}" onclick="selectVaraqli('ikkiTomon', true, '${type}')">Ikki tomonlama</button>`;
        }
        document.getElementById('vmPechatGroup').innerHTML = pechatHtml;
        let qosh = [];
        if (c.tisneniya) {
            qosh.push(`<button type="button" class="opt-btn ${varaqliSelected.tisneniya ? 'active' : ''}" onclick="selectVaraqli('tisneniya', ${!varaqliSelected.tisneniya}, '${type}')">🔨 Tisneniya</button>`);
        }
        let pardozHtml = (c.pardozlar || []).length ? `
            <div class="vm-pardoz-group">${c.pardozlar.map(p => `
                <button type="button" class="opt-btn ${varaqliSelected.pardoz === p.key ? 'active' : ''}" onclick="selectVaraqli('pardoz', '${p.key}', '${type}')">${p.nomi}</button>`).join('')}
            </div>` : '';
        document.getElementById('vmQoshimchaGroup').innerHTML = qosh.join('') + pardozHtml;
    }

    function selectVaraqliTur(type, key) {
        let t = varaqliTuri(type, key);
        if (!t) return;
        varaqliSelected.tur = t.key;
        // Tanlangan qog'ozga bu turning bichimi sig'masa — birinchi sig'adigan qog'ozga o'tamiz
        let sigadi = q => q && calculateOfsetGridFitting((q.eni || 0) - 10, (q.boyi || 0) - 10, t.bichishEni, t.bichishBoyi).count > 0;
        let qogozlar = varaqliQogozlar(type);
        if (!sigadi(qogozlar.find(q => q.id === varaqliSelected.qogozId))) {
            let mos = qogozlar.find(sigadi);
            if (mos) varaqliSelected.qogozId = mos.id;
        }
        document.getElementById('vmEni').value = t.eni;
        document.getElementById('vmBoyi').value = t.boyi;
        renderVaraqliOptions(type);
        calculate();
    }

    function selectVaraqli(field, value, type) {
        varaqliSelected[field] = value;
        renderVaraqliOptions(type);
        calculate();
    }

    // Tiraj bo'yicha dona narxi: adaddan kichik yoki teng eng katta "dan" qatori
    function varaqliTierNarxi(tur, qty, pechat) {
        let list = (tur.tierlar || []).slice().sort((a, b) => a.dan - b.dan);
        if (list.length === 0) return 0;
        let mos = list[0];
        list.forEach(t => { if (qty >= t.dan) mos = t; });
        return parseFloat(mos[pechat]) || 0;
    }

    function calculateVaraqli(type, qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let c = varaqliCfg(type);
        let nomi = type === 'konvert' ? 'Konvert' : 'Otkritka';
        let info = html => { let el = document.getElementById('vmInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = (xabar) => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let tur = varaqliTuri(type, varaqliSelected.tur);
        let { eni, boyi } = varaqliOlcham();
        if (!(eni > 0 && boyi > 0)) return yaroqsiz("Eni va bo'yini kiriting — ikkalasi ham majburiy.");

        // Bichish o'lchami: tayyor turga aynan mos bo'lsa — admin kiritgan, aks holda formula
        let tayyor = tur && tur.eni === eni && tur.boyi === boyi;
        let f = c.formula || { qoshEni: 0, boyiKarra: 1, qoshBoyi: 0 };
        let bEni = tayyor ? tur.bichishEni : eni + (parseFloat(f.qoshEni) || 0);
        let bBoyi = tayyor ? tur.bichishBoyi : boyi * (parseFloat(f.boyiKarra) || 1) + (parseFloat(f.qoshBoyi) || 0);
        let pichoq = (!tayyor && (parseFloat(c.pichoqNarxi) || 0) > 0) ? parseFloat(c.pichoqNarxi) : 0;
        // Narx oraliqlari: tanlangan (yoki eng yaqin) turdan
        let narxTuri = tur || (c.turlar || [])[0];
        if (!narxTuri) return yaroqsiz("Admin panelda birorta tur kiritilmagan.");

        let qogoz = varaqliQogozlar(type).find(q => q.id === varaqliSelected.qogozId) || varaqliQogozlar(type)[0];
        if (!qogoz) return yaroqsiz("Qog'oz kiritilmagan — Admin panel → Qog'oz bo'limi.");

        let fit = calculateOfsetGridFitting((qogoz.eni || 0) - 10, (qogoz.boyi || 0) - 10, bEni, bBoyi);
        if (!fit || fit.count <= 0) return yaroqsiz(`Bichim ${bEni}×${bBoyi} mm "${qogoz.nomi} ${qogoz.format}" (${qogoz.eni}×${qogoz.boyi}) varag'iga sig'maydi — boshqa qog'oz tanlang.`);

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        // 1) Qog'oz
        let varaq = Math.ceil(qty / fit.count) + (parseInt(c.zapasVaraq) || 0);
        qosh(`Qog'oz (${qogoz.nomi}, ${qogoz.format} ${qogoz.eni}×${qogoz.boyi})`, `${varaq} varaq (1 varaqda ${fit.count} dona)`, varaq * (parseFloat(qogoz.narx) || 0));

        // 2) Pechat — tiraj bo'yicha dona narxi
        let pechat = varaqliSelected.pechat;
        if (pechat !== 'yoq') {
            let tomon = (c.ikkiTomon && varaqliSelected.ikkiTomon) ? 2 : 1;
            let dona = varaqliTierNarxi(narxTuri, qty, pechat);
            qosh(`${VARAQLI_PECHAT_NOMI[pechat]}${tomon === 2 ? ' (ikki tomonlama)' : ''}`, `${qty} dona × ${dona.toLocaleString()}${tomon === 2 ? ' × 2' : ''}`, dona * qty * tomon);
        }

        // 3) Konvert: Tisneniya — umumiy Pardozlash xizmatlari (A3)
        if (c.tisneniya && varaqliSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya.a3 || {};
            qosh('Tisneniya', `${qty} dona`, (parseFloat(tis.pricePerUnit) || 0) * qty);
            qosh('Tisneniya klishesi (bir martalik)', '1 marta', parseFloat(tis.klishePrice) || 0);
        }

        // 4) Otkritka: pardozlash (Oddiy / 3D lak / folga)
        let pardoz = (c.pardozlar || []).find(p => p.key === varaqliSelected.pardoz);
        if (pardoz && (parseFloat(pardoz.narx) || 0) > 0) qosh(pardoz.nomi, `${qty} dona`, (parseFloat(pardoz.narx) || 0) * qty);

        // 5) Nostandart o'lcham — bir martalik pichoq
        if (pichoq > 0) qosh(`Pichoq yasatish (bir martalik)`, '1 marta', pichoq);

        info(`
            <div>📐 Bichim: <b>${bEni}×${bBoyi} mm</b> → ${qogoz.format} varaqqa <b>${fit.count} dona</b> · ${varaq} varaq (zapas bilan)</div>
            ${tayyor ? `<div class="paket-pichoq-bor">✓ Tayyor tur: ${tur.nomi}</div>`
                : (pichoq > 0 ? `<div class="paket-pichoq">✂️ Nostandart o'lcham — bir martalik pichoq: <b>${pichoq.toLocaleString()} so'm</b> qo'shildi (narx oraliqlari: ${narxTuri.nomi})</div>`
                              : `<div class="paket-step-hint">O'z o'lchami (narx oraliqlari: ${narxTuri.nomi})</div>`)}
        `);

        let qismlar = [`${nomi} ${tayyor ? tur.nomi + ' ' : ''}${eni}×${boyi}mm (bichim ${bEni}×${bBoyi})`, qogoz.nomi, VARAQLI_PECHAT_NOMI[pechat]];
        if (c.ikkiTomon && varaqliSelected.ikkiTomon && pechat !== 'yoq') qismlar.push('ikki tomonlama');
        if (c.tisneniya && varaqliSelected.tisneniya) qismlar.push('tisneniya');
        if (pardoz && pardoz.key !== 'oddiy') qismlar.push(pardoz.nomi);
        if (pichoq > 0) qismlar.push('pichoq (bir martalik)');
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Konvert / Otkritka (bitta umumiy blok, currentManagingProduct bo'yicha) ----
    function renderAdminVaraqli() {
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        let q = id => document.getElementById(id);
        if (!c || !q('vmAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('vmAdminSarlavha').textContent = type === 'konvert' ? '✉️ Konvert turlari va pechat narxlari' : '💌 Otkritka turlari va pechat narxlari';
        let ufBor = (c.pechatTurlari || ['sifravoy', 'uf']).includes('uf'); // Otkritka — faqat Sifravoy

        q('vmAdminTurlar').innerHTML = (c.turlar || []).map((t, ti) => `
            <div class="vm-admin-tur">
                <div class="vm-admin-tur-head">
                    <input type="text" id="vmT_nomi_${ti}" value="${esc(t.nomi)}" placeholder="Tur nomi" class="vm-admin-tur-nomi">
                    <button type="button" class="btn btn-danger" style="height:32px; padding:0 10px;" title="Turni o'chirish" onclick="deleteVaraqliTur(${ti})">✕</button>
                </div>
                <div class="vm-admin-olcham">
                    <label>Tayyor o'lcham</label>
                    <div class="input-unit"><input type="number" id="vmT_eni_${ti}" value="${t.eni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="vmT_boyi_${ti}" value="${t.boyi}" min="1"><span>bo'yi</span></div>
                    <label>Bichim (yoyilgan)</label>
                    <div class="input-unit"><input type="number" id="vmT_beni_${ti}" value="${t.bichishEni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="vmT_bboyi_${ti}" value="${t.bichishBoyi}" min="1"><span>bo'yi</span></div>
                </div>
                <table class="admin-table vm-tier-table">
                    <thead><tr><th>Adad (dan)</th><th>Sifravoy (so'm/dona)</th>${ufBor ? `<th>UF (so'm/dona)</th>` : ''}<th></th></tr></thead>
                    <tbody>${(t.tierlar || []).map((r, ri) => `
                        <tr>
                            <td><input type="number" id="vmT_${ti}_dan_${ri}" value="${r.dan}" min="1"></td>
                            <td><input type="number" id="vmT_${ti}_sif_${ri}" value="${r.sifravoy}" min="0"></td>
                            ${ufBor ? `<td><input type="number" id="vmT_${ti}_uf_${ri}" value="${r.uf}" min="0"></td>` : ''}
                            <td style="text-align:right;"><button type="button" class="btn btn-outline" style="height:30px; padding:0 8px;" title="Qatorni o'chirish" onclick="deleteVaraqliTier(${ti}, ${ri})">✕</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <button type="button" class="btn btn-outline" style="height:32px; font-size:0.78rem; margin-top:6px;" onclick="addVaraqliTier(${ti})">+ Tiraj oralig'i</button>
            </div>
        `).join('');

        q('vmAdminPichoqGroup').style.display = type === 'konvert' ? '' : 'none';
        q('vmAdminPichoq').value = c.pichoqNarxi || 0;
        q('vmAdminZapas').value = c.zapasVaraq || 0;
        q('vmAdminQoshEni').value = c.formula.qoshEni;
        q('vmAdminBoyiKarra').value = c.formula.boyiKarra;
        q('vmAdminQoshBoyi').value = c.formula.qoshBoyi;
        q('vmAdminPardozCard').style.display = (c.pardozlar || []).length ? '' : 'none';
        q('vmAdminPardozlar').innerHTML = (c.pardozlar || []).map((p, pi) => `
            <div class="form-group">
                <label>${esc(p.nomi)}</label>
                <div class="input-unit"><input type="number" id="vmP_${pi}" value="${p.narx || 0}" min="0" ${p.key === 'oddiy' ? 'disabled' : ''}><span>so'm/dona</span></div>
            </div>
        `).join('');
        q('vmAdminTisIzoh').style.display = c.tisneniya ? '' : 'none';
    }

    function collectVaraqliFromUI() {
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        let q = id => document.getElementById(id);
        if (!c || !q('vmAdminTurlar')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        c.turlar = (c.turlar || []).map((t, ti) => q(`vmT_nomi_${ti}`) ? {
            key: t.key,
            nomi: q(`vmT_nomi_${ti}`).value.trim() || `Tur ${ti + 1}`,
            eni: son(`vmT_eni_${ti}`), boyi: son(`vmT_boyi_${ti}`),
            bichishEni: son(`vmT_beni_${ti}`), bichishBoyi: son(`vmT_bboyi_${ti}`),
            tierlar: (t.tierlar || []).map((r, ri) => q(`vmT_${ti}_dan_${ri}`) ? {
                dan: son(`vmT_${ti}_dan_${ri}`, 1), sifravoy: son(`vmT_${ti}_sif_${ri}`),
                uf: q(`vmT_${ti}_uf_${ri}`) ? son(`vmT_${ti}_uf_${ri}`) : (r.uf || 0)
            } : r)
        } : t);
        c.pichoqNarxi = son('vmAdminPichoq');
        c.zapasVaraq = son('vmAdminZapas');
        c.formula = { qoshEni: son('vmAdminQoshEni'), boyiKarra: son('vmAdminBoyiKarra', 1) || 1, qoshBoyi: son('vmAdminQoshBoyi') };
        (c.pardozlar || []).forEach((p, pi) => { if (q(`vmP_${pi}`) && p.key !== 'oddiy') p.narx = son(`vmP_${pi}`); });
    }

    function addVaraqliTur() {
        collectVaraqliFromUI();
        let c = varaqliCfg(currentManagingProduct);
        let oxirgi = c.turlar.slice(-1)[0];
        c.turlar.push({ key: 't' + Date.now().toString(36), nomi: 'Yangi tur', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150,
            tierlar: oxirgi ? JSON.parse(JSON.stringify(oxirgi.tierlar)) : [{ dan: 1, sifravoy: 0, uf: 0 }] });
        renderAdminVaraqli();
    }

    function deleteVaraqliTur(ti) {
        collectVaraqliFromUI();
        let c = varaqliCfg(currentManagingProduct);
        if (!c.turlar[ti] || !confirm(`"${c.turlar[ti].nomi}" turini o'chirasizmi?`)) return;
        c.turlar.splice(ti, 1);
        renderAdminVaraqli();
    }

    function addVaraqliTier(ti) {
        collectVaraqliFromUI();
        let t = varaqliCfg(currentManagingProduct).turlar[ti];
        if (!t) return;
        let oxirgi = (t.tierlar || []).slice(-1)[0] || { dan: 0, sifravoy: 0, uf: 0 };
        t.tierlar = (t.tierlar || []).concat([{ dan: (oxirgi.dan || 0) * 2 || 1, sifravoy: oxirgi.sifravoy, uf: oxirgi.uf }]);
        renderAdminVaraqli();
    }

    function deleteVaraqliTier(ti, ri) {
        collectVaraqliFromUI();
        let t = varaqliCfg(currentManagingProduct).turlar[ti];
        if (!t || t.tierlar.length <= 1) { showToast("⚠️ Kamida bitta tiraj oralig'i qolishi kerak."); return; }
        t.tierlar.splice(ri, 1);
        renderAdminVaraqli();
    }

    function saveVaraqliConfig() {
        collectVaraqliFromUI();
        let type = currentManagingProduct;
        let c = varaqliCfg(type);
        if (!c) return;
        if (c.turlar.some(t => !(t.eni > 0 && t.boyi > 0 && t.bichishEni > 0 && t.bichishBoyi > 0))) {
            showToast("⚠️ Har bir turning o'lchami va bichimi 0 dan katta bo'lishi kerak!");
            return;
        }
        c.turlar.forEach(t => { t.tierlar.sort((a, b) => a.dan - b.dan); });
        localStorage.setItem('erp_varaqli_config', JSON.stringify(varaqliConfig));
        if (typeof logAudit === 'function') logAudit(`${type === 'konvert' ? 'Konvert' : 'Otkritka'} sozlamalari o'zgartirildi`,
            c.turlar.map(t => `${t.nomi} ${t.eni}×${t.boyi} (${t.tierlar.length} oraliq)`).join('; '));
        renderAdminVaraqli();
        showToast("💾 Sozlamalar saqlandi!");
    }

    function migrateVaraqliConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        VARAQLI_TURLAR.forEach(type => {
            let s = saved[type];
            if (!s || typeof s !== 'object') return;
            let d = cfg[type];
            if (Array.isArray(s.turlar)) d.turlar = s.turlar;
            ['pichoqNarxi', 'zapasVaraq'].forEach(k => { if (typeof s[k] === 'number') d[k] = s[k]; });
            if (s.formula && typeof s.formula === 'object') d.formula = { ...d.formula, ...s.formula };
            if (Array.isArray(s.pardozlar)) d.pardozlar = d.pardozlar.map(p => {
                let sp = s.pardozlar.find(x => x && x.key === p.key);
                return sp ? { ...p, narx: typeof sp.narx === 'number' ? sp.narx : p.narx } : p;
            });
        });
        return cfg;
    }

    // ====================== OTKRITKA ======================
    // Menejer YOYILGAN (bichim) o'lchamni kiritadi yoki turni bosadi (turning yoyilgan o'lchami qo'yiladi).
    // Otkritkaning O'Z qog'oz ro'yxati bor (Sifravoy pechat qog'ozlaridan alohida, admin kiritadi):
    //   varaq o'lchami, pechat maydoni, 1 tomonlama / 2 tomonlama varaq narxi (qog'oz + Sifravoy pechat).
    //   • ODDIY — shu ro'yxatdagi qog'ozlardan biri (Colotech / Lyon / Kvarts...).
    //   • 3D LAK / 3D TILLA-KUMUSH FOLGA — faqat Colotech 300gr, A2 Sifravoy (680×480) — `lakQogoz`,
    //     + lak/folga ishi — admin kiritgan tiraj oraliqlari bo'yicha, har varaqqa.
    //   Hisob (Sifravoy usuli): bichim varaqning pechat maydoniga joylashtiriladi, varaq × (1 yoki 2 tomon narx).
    //   + Laminatsiya (ixtiyoriy) — umumiy Pardozlash xizmatlari: SRA3 — A3, A2 varaq — A2 narxi, har varaqqa.
    //   + Turning qo'shimcha xizmati (admin kiritadi, so'm/dona) — har bir otkritkaga.
    const OTKRITKA_PARDOZ_NOMI = { oddiy: 'Oddiy', lak3d: '3D lak', folga: '3D Tilla-Kumush folga' };

    let otkritkaConfig = {
        zapasVaraq: 5,
        // Oddiy otkritka qog'ozlari — narx: bitta varaq, qog'oz + Sifravoy pechat
        qogozlar: [
            { id: 'okq1', name: 'Colotech 300g', q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 4500, price2: 5500 },
            { id: 'okq2', name: 'Lyon',          q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 8000, price2: 9500 },
            { id: 'okq3', name: 'Kvarts',        q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 8000, price2: 9500 }
        ],
        // 3D lak / folga qog'ozi — Colotech 300gr, A2 Sifravoy
        lakQogoz: { name: 'Colotech 300g A2', q_eni: 680, q_boyi: 480, p_eni: 670, p_boyi: 470, price1: 12000, price2: 15000 },
        // Faqat lak/folga ishi, so'm / A2 varaq; "dan" — varaq sonidan boshlab
        lakTierlar: [
            { dan: 1,   lak3d: 15000, folga: 20000 },
            { dan: 50,  lak3d: 11000, folga: 15000 },
            { dan: 200, lak3d: 8000,  folga: 11000 },
            { dan: 500, lak3d: 6000,  folga: 9000 }
        ],
        // eni/boyi — tayyor (buklangan) o'lcham, faqat ko'rsatish uchun; bichishEni/Boyi — yoyilgan o'lcham (hisob shu bo'yicha)
        turlar: [
            { key: 'o100', nomi: '100×150', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'a6', nomi: 'A6 (105×148)', eni: 105, boyi: 148, bichishEni: 105, bichishBoyi: 148, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'evro', nomi: 'Evro (99×210)', eni: 99, boyi: 210, bichishEni: 99, bichishBoyi: 210, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 },
            { key: 'a5buk', nomi: 'A5 buklet (148×210)', eni: 148, boyi: 210, bichishEni: 296, bichishBoyi: 210, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 }
        ]
    };

    let otkritkaSelected = { tur: '', pardoz: 'oddiy', qogozId: '', ikkiTomon: false, laminatsiya: false };

    function otkritkaTuri(key) {
        return otkritkaConfig.turlar.find(t => t.key === key) || otkritkaConfig.turlar[0] || null;
    }
    function otkritkaOddiyQogozlar() { return otkritkaConfig.qogozlar || []; }
    function otkritkaLakQogozi() { return otkritkaConfig.lakQogoz || null; }

    function buildOtkritkaForm() {
        let t = otkritkaConfig.turlar[0];
        let q = otkritkaOddiyQogozlar()[0];
        otkritkaSelected = { tur: t ? t.key : '', pardoz: 'oddiy', qogozId: q ? q.id : '', ikkiTomon: false, laminatsiya: false };
        return `
            <div class="poli-calc">
                <div class="step-title">1. Turi <span class="paket-step-hint">(bosing — yoyilgan o'lchami qo'yiladi; boshqa o'lcham kerak bo'lsa o'zingiz kiriting)</span></div>
                <div class="options-group" id="okTurGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Yoyilgan eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="okEni" min="1" value="${t ? t.bichishEni : ''}" oninput="renderOtkritkaOptions(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Yoyilgan bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="okBoyi" min="1" value="${t ? t.bichishBoyi : ''}" oninput="renderOtkritkaOptions(); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="okInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Pardozlash</div>
                <div class="options-group" id="okPardozGroup"></div>

                <div class="step-title" id="okQogozSarlavha">3. Qog'oz</div>
                <div class="options-group" id="okQogozGroup"></div>

                <div class="step-title">4. Pechat <span class="paket-step-hint">(Sifravoy pechat)</span></div>
                <div class="options-group" id="okPechatGroup"></div>

                <div class="step-title">5. Qo'shimcha</div>
                <div class="options-group" id="okQoshimchaGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="300" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function otkritkaOlcham() {
        return { eni: parseFloat(document.getElementById('okEni')?.value) || 0, boyi: parseFloat(document.getElementById('okBoyi')?.value) || 0 };
    }

    function renderOtkritkaOptions() {
        let turGroup = document.getElementById('okTurGroup');
        if (!turGroup) return;
        let s = otkritkaSelected;
        let { eni, boyi } = otkritkaOlcham();
        turGroup.innerHTML = otkritkaConfig.turlar.map(t => `
            <button type="button" class="opt-btn ${t.key === s.tur && t.bichishEni === eni && t.bichishBoyi === boyi ? 'active' : ''}" onclick="selectOtkritkaTur('${t.key}')">${t.nomi}</button>
        `).join('') || `<span class="paket-step-hint">Tur kiritilmagan — yoyilgan o'lchamni qo'lda kiriting.</span>`;

        document.getElementById('okPardozGroup').innerHTML = Object.keys(OTKRITKA_PARDOZ_NOMI).map(k => `
            <button type="button" class="opt-btn ${s.pardoz === k ? 'active' : ''}" onclick="selectOtkritka('pardoz', '${k}')">${OTKRITKA_PARDOZ_NOMI[k]}</button>
        `).join('');

        let oddiy = s.pardoz === 'oddiy';
        document.getElementById('okQogozSarlavha').innerHTML = oddiy
            ? `3. Qog'oz`
            : `3. Qog'oz <span class="paket-step-hint">(3D lak va folga faqat Colotech 300gr, A2 Sifravoy pechatda)</span>`;
        if (oddiy) {
            let list = otkritkaOddiyQogozlar();
            document.getElementById('okQogozGroup').innerHTML = list.length === 0
                ? `<span class="paket-xato">⚠️ Otkritka qog'ozlari kiritilmagan — Admin → Otkritka</span>`
                : list.map(p => `<button type="button" class="opt-btn ${p.id === s.qogozId ? 'active' : ''}" onclick="selectOtkritka('qogozId', '${p.id}')">${p.name}</button>`).join('');
        } else {
            let lq = otkritkaLakQogozi();
            document.getElementById('okQogozGroup').innerHTML = lq
                ? `<button type="button" class="opt-btn active" style="pointer-events:none;">${lq.name} · ${lq.q_eni}×${lq.q_boyi}</button>`
                : `<span class="paket-xato">⚠️ Lak/folga qog'ozi kiritilmagan — Admin → Otkritka</span>`;
        }

        document.getElementById('okPechatGroup').innerHTML = `
            <button type="button" class="opt-btn ${!s.ikkiTomon ? 'active' : ''}" onclick="selectOtkritka('ikkiTomon', false)">Bir tomonlama</button>
            <button type="button" class="opt-btn ${s.ikkiTomon ? 'active' : ''}" onclick="selectOtkritka('ikkiTomon', true)">Ikki tomonlama</button>`;

        document.getElementById('okQoshimchaGroup').innerHTML = `
            <button type="button" class="opt-btn ${s.laminatsiya ? 'active' : ''}" onclick="selectOtkritka('laminatsiya', ${!s.laminatsiya})">🧴 Laminatsiya</button>
        `;
    }

    function selectOtkritkaTur(key) {
        let t = otkritkaTuri(key);
        if (!t) return;
        otkritkaSelected.tur = t.key;
        document.getElementById('okEni').value = t.bichishEni;
        document.getElementById('okBoyi').value = t.bichishBoyi;
        renderOtkritkaOptions();
        calculate();
    }

    function selectOtkritka(field, value) {
        otkritkaSelected[field] = value;
        renderOtkritkaOptions();
        calculate();
    }

    function otkritkaLakTierNarxi(varaq, pardoz) {
        let list = (otkritkaConfig.lakTierlar || []).slice().sort((a, b) => a.dan - b.dan);
        if (list.length === 0) return 0;
        let mos = list[0];
        list.forEach(t => { if (varaq >= t.dan) mos = t; });
        return parseFloat(mos[pardoz]) || 0;
    }

    function calculateOtkritka(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let s = otkritkaSelected;
        let info = html => { let el = document.getElementById('okInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = xabar => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let tur = otkritkaTuri(s.tur);
        let { eni: bEni, boyi: bBoyi } = otkritkaOlcham(); // menejer kiritgani — yoyilgan o'lcham
        if (!(bEni > 0 && bBoyi > 0)) return yaroqsiz("Yoyilgan eni va bo'yini kiriting — ikkalasi ham majburiy.");
        let tayyor = tur && tur.bichishEni === bEni && tur.bichishBoyi === bBoyi;
        let zapas = parseInt(otkritkaConfig.zapasVaraq) || 0;

        let oddiy = s.pardoz === 'oddiy';
        let qogoz = oddiy ? (otkritkaOddiyQogozlar().find(p => p.id === s.qogozId) || otkritkaOddiyQogozlar()[0]) : otkritkaLakQogozi();
        if (!qogoz) return yaroqsiz(oddiy ? "Otkritka qog'ozlari kiritilmagan — Admin → Otkritka." : "Lak/folga qog'ozi kiritilmagan — Admin → Otkritka.");
        let r = calculateDigitalPriceForPaper(qogoz, bEni, bBoyi, qty, s.ikkiTomon ? 2 : 1);
        if (!r) return yaroqsiz(`Yoyilgan o'lcham ${bEni}×${bBoyi} mm "${qogoz.name}" pechat maydoniga (${qogoz.p_eni}×${qogoz.p_boyi}) sig'maydi.`);

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        // 1) Qog'oz + Sifravoy pechat — varaq narxi (1 / 2 tomonlama)
        let varaq = r.sheetsNeeded + zapas;
        let varaqNarx = parseFloat(s.ikkiTomon ? qogoz.price2 : qogoz.price1) || 0;
        qosh(`Sifravoy pechat (${qogoz.name}, ${s.ikkiTomon ? 'ikki' : 'bir'} tomonlama)`, `${varaq} varaq × ${varaqNarx.toLocaleString()}`, varaq * varaqNarx);

        // 2) 3D lak / folga ishi — tiraj oraliqlari bo'yicha, har varaqqa
        if (!oddiy) {
            let tier = otkritkaLakTierNarxi(varaq, s.pardoz);
            qosh(`${OTKRITKA_PARDOZ_NOMI[s.pardoz]} (A2)`, `${varaq} varaq × ${tier.toLocaleString()}`, varaq * tier);
        }

        // 3) Laminatsiya (ixtiyoriy) — umumiy narx, varaq formatiga qarab
        let lamKey = (Math.max(qogoz.q_eni || 0, qogoz.q_boyi || 0) > 460) ? 'a2' : 'a3';
        if (s.laminatsiya) {
            let lam = parseFloat(ofsetFinishingServices.laminatsiya[lamKey]) || 0;
            qosh(`Laminatsiya (${lamKey.toUpperCase()} narxi)`, `${varaq} varaq`, varaq * lam);
        }

        // 4) Turning qo'shimcha xizmati — har bir otkritkaga (o'z o'lchamida — tanlangan tur bo'yicha)
        let xizmatTuri = tur || otkritkaConfig.turlar[0];
        if (xizmatTuri) {
            let x = parseFloat(xizmatTuri.xizmatNarxi) || 0;
            qosh(xizmatTuri.xizmatNomi || "Qo'shimcha xizmat", `${qty} dona × ${x.toLocaleString()}`, x * qty);
        }

        info(`
            <div>📐 Yoyilgan: <b>${bEni}×${bBoyi} mm</b> → ${qogoz.q_eni}×${qogoz.q_boyi} varaqqa <b>${r.perSheet} dona</b> · ${varaq} varaq (zapas bilan)</div>
            <div class="${tayyor ? 'paket-pichoq-bor' : 'paket-step-hint'}">${tayyor ? `✓ Tur: ${tur.nomi} (tayyor holati ${tur.eni}×${tur.boyi} mm)` : `O'z o'lchami (qo'shimcha xizmat: ${xizmatTuri ? xizmatTuri.nomi : '—'})`}</div>
        `);
        let qismlar = [`Otkritka ${tayyor ? tur.nomi + ' ' : ''}(yoyilgan ${bEni}×${bBoyi}mm)`, OTKRITKA_PARDOZ_NOMI[s.pardoz], qogoz.name,
            s.ikkiTomon ? 'ikki tomonlama' : 'bir tomonlama'];
        if (s.laminatsiya) qismlar.push('laminatsiya');
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Otkritka ----
    function otkritkaQogozQatori(p, prefix, i, ochirish) {
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        return `
            <tr>
                <td><input type="text" id="${prefix}_name_${i}" value="${esc(p.name)}" placeholder="masalan: Colotech 250g"></td>
                <td><input type="number" id="${prefix}_qeni_${i}" value="${p.q_eni}" min="1"></td>
                <td><input type="number" id="${prefix}_qboyi_${i}" value="${p.q_boyi}" min="1"></td>
                <td><input type="number" id="${prefix}_peni_${i}" value="${p.p_eni}" min="1"></td>
                <td><input type="number" id="${prefix}_pboyi_${i}" value="${p.p_boyi}" min="1"></td>
                <td><input type="number" id="${prefix}_p1_${i}" value="${p.price1}" min="0"></td>
                <td><input type="number" id="${prefix}_p2_${i}" value="${p.price2}" min="0"></td>
                <td style="text-align:right;">${ochirish ? `<button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteOtkritkaQogoz(${i})">✕</button>` : ''}</td>
            </tr>`;
    }

    function otkritkaQogozniOqi(prefix, i, eski) {
        let q = id => document.getElementById(id);
        if (!q(`${prefix}_name_${i}`)) return eski;
        let son = id => Math.max(0, parseFloat(q(id).value) || 0);
        return {
            ...(eski || {}),
            name: q(`${prefix}_name_${i}`).value.trim(),
            q_eni: son(`${prefix}_qeni_${i}`), q_boyi: son(`${prefix}_qboyi_${i}`),
            p_eni: son(`${prefix}_peni_${i}`), p_boyi: son(`${prefix}_pboyi_${i}`),
            price1: son(`${prefix}_p1_${i}`), price2: son(`${prefix}_p2_${i}`)
        };
    }

    function renderAdminOtkritka() {
        let q = id => document.getElementById(id);
        if (!q('okAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('okAdminTurlar').innerHTML = otkritkaConfig.turlar.map((t, ti) => `
            <div class="vm-admin-tur">
                <div class="vm-admin-tur-head">
                    <input type="text" id="okT_nomi_${ti}" value="${esc(t.nomi)}" placeholder="Tur nomi" class="vm-admin-tur-nomi">
                    <button type="button" class="btn btn-danger" style="height:32px; padding:0 10px;" title="Turni o'chirish" onclick="deleteOtkritkaTur(${ti})">✕</button>
                </div>
                <div class="vm-admin-olcham">
                    <label>Yoyilgan (hisob)</label>
                    <div class="input-unit"><input type="number" id="okT_beni_${ti}" value="${t.bichishEni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="okT_bboyi_${ti}" value="${t.bichishBoyi}" min="1"><span>bo'yi</span></div>
                    <label>Tayyor holati</label>
                    <div class="input-unit"><input type="number" id="okT_eni_${ti}" value="${t.eni}" min="1"><span>eni</span></div>
                    <div class="input-unit"><input type="number" id="okT_boyi_${ti}" value="${t.boyi}" min="1"><span>bo'yi</span></div>
                </div>
                <div class="ok-admin-xizmat">
                    <input type="text" id="okT_xnomi_${ti}" value="${esc(t.xizmatNomi)}" placeholder="Qo'shimcha xizmat nomi">
                    <div class="input-unit"><input type="number" id="okT_xnarx_${ti}" value="${t.xizmatNarxi || 0}" min="0"><span>so'm/dona</span></div>
                </div>
            </div>
        `).join('');

        q('okAdminQogozBody').innerHTML = otkritkaOddiyQogozlar().length === 0
            ? `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha qog'oz yo'q — "+ Qog'oz qo'shish" ni bosing.</td></tr>`
            : otkritkaOddiyQogozlar().map((p, i) => otkritkaQogozQatori(p, 'okQ', i, true)).join('');
        let lq = otkritkaLakQogozi() || { name: 'Colotech 300g A2', q_eni: 680, q_boyi: 480, p_eni: 670, p_boyi: 470, price1: 0, price2: 0 };
        q('okAdminLakQogozBody').innerHTML = otkritkaQogozQatori(lq, 'okLQ', 0, false);

        q('okAdminLakBody').innerHTML = otkritkaConfig.lakTierlar.map((r, ri) => `
            <tr>
                <td><input type="number" id="okL_dan_${ri}" value="${r.dan}" min="1"></td>
                <td><input type="number" id="okL_lak_${ri}" value="${r.lak3d}" min="0"></td>
                <td><input type="number" id="okL_folga_${ri}" value="${r.folga}" min="0"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-outline" style="height:30px; padding:0 8px;" title="Qatorni o'chirish" onclick="deleteOtkritkaLakTier(${ri})">✕</button></td>
            </tr>
        `).join('');
        q('okAdminZapas').value = otkritkaConfig.zapasVaraq;
    }

    function collectOtkritkaFromUI() {
        let q = id => document.getElementById(id);
        if (!q('okAdminTurlar')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        otkritkaConfig.turlar = otkritkaConfig.turlar.map((t, ti) => q(`okT_nomi_${ti}`) ? {
            key: t.key,
            nomi: q(`okT_nomi_${ti}`).value.trim() || `Tur ${ti + 1}`,
            eni: son(`okT_eni_${ti}`), boyi: son(`okT_boyi_${ti}`),
            bichishEni: son(`okT_beni_${ti}`), bichishBoyi: son(`okT_bboyi_${ti}`),
            xizmatNomi: q(`okT_xnomi_${ti}`).value.trim() || "Qo'shimcha xizmat",
            xizmatNarxi: son(`okT_xnarx_${ti}`)
        } : t);
        otkritkaConfig.qogozlar = otkritkaOddiyQogozlar().map((p, i) => otkritkaQogozniOqi('okQ', i, p));
        otkritkaConfig.lakQogoz = otkritkaQogozniOqi('okLQ', 0, otkritkaConfig.lakQogoz);
        otkritkaConfig.lakTierlar = otkritkaConfig.lakTierlar.map((r, ri) => q(`okL_dan_${ri}`) ? {
            dan: son(`okL_dan_${ri}`, 1), lak3d: son(`okL_lak_${ri}`), folga: son(`okL_folga_${ri}`)
        } : r);
        otkritkaConfig.zapasVaraq = son('okAdminZapas');
    }

    function addOtkritkaTur() {
        collectOtkritkaFromUI();
        otkritkaConfig.turlar.push({ key: 't' + Date.now().toString(36), nomi: 'Yangi tur', eni: 100, boyi: 150, bichishEni: 100, bichishBoyi: 150, xizmatNomi: "Qo'shimcha xizmat", xizmatNarxi: 0 });
        renderAdminOtkritka();
    }

    function deleteOtkritkaTur(ti) {
        collectOtkritkaFromUI();
        let t = otkritkaConfig.turlar[ti];
        if (!t || !confirm(`"${t.nomi}" turini o'chirasizmi?`)) return;
        otkritkaConfig.turlar.splice(ti, 1);
        renderAdminOtkritka();
    }

    function addOtkritkaQogoz() {
        collectOtkritkaFromUI();
        let oxirgi = otkritkaOddiyQogozlar().slice(-1)[0];
        otkritkaConfig.qogozlar = otkritkaOddiyQogozlar().concat([{
            id: 'okq' + Date.now().toString(36), name: '',
            q_eni: oxirgi ? oxirgi.q_eni : 320, q_boyi: oxirgi ? oxirgi.q_boyi : 450,
            p_eni: oxirgi ? oxirgi.p_eni : 310, p_boyi: oxirgi ? oxirgi.p_boyi : 440, price1: 0, price2: 0
        }]);
        renderAdminOtkritka();
    }

    function deleteOtkritkaQogoz(i) {
        collectOtkritkaFromUI();
        let p = otkritkaOddiyQogozlar()[i];
        if (!p || !confirm(`"${p.name || 'Nomsiz'}" qog'ozini o'chirasizmi?`)) return;
        otkritkaConfig.qogozlar.splice(i, 1);
        renderAdminOtkritka();
    }

    function addOtkritkaLakTier() {
        collectOtkritkaFromUI();
        let oxirgi = otkritkaConfig.lakTierlar.slice(-1)[0] || { dan: 0, lak3d: 0, folga: 0 };
        otkritkaConfig.lakTierlar.push({ dan: (oxirgi.dan || 0) * 2 || 1, lak3d: oxirgi.lak3d, folga: oxirgi.folga });
        renderAdminOtkritka();
    }

    function deleteOtkritkaLakTier(ri) {
        collectOtkritkaFromUI();
        if (otkritkaConfig.lakTierlar.length <= 1) { showToast("⚠️ Kamida bitta tiraj oralig'i qolishi kerak."); return; }
        otkritkaConfig.lakTierlar.splice(ri, 1);
        renderAdminOtkritka();
    }

    function saveOtkritkaConfig() {
        collectOtkritkaFromUI();
        let c = otkritkaConfig;
        let xatoQogoz = [...c.qogozlar, c.lakQogoz].find(p => !p || !p.name || !(p.q_eni > 0 && p.q_boyi > 0 && p.p_eni > 0 && p.p_boyi > 0));
        if (c.qogozlar.length === 0) { showToast("⚠️ Kamida bitta otkritka qog'ozini kiriting!"); return; }
        if (xatoQogoz) { showToast("⚠️ Har bir qog'ozning nomi, varaq va pechat maydoni o'lchami bo'lishi kerak!"); return; }
        if (c.turlar.some(t => !(t.eni > 0 && t.boyi > 0 && t.bichishEni > 0 && t.bichishBoyi > 0))) {
            showToast("⚠️ Har bir turning yoyilgan va tayyor o'lchami 0 dan katta bo'lishi kerak!");
            return;
        }
        c.lakTierlar.sort((a, b) => a.dan - b.dan);
        localStorage.setItem('erp_otkritka_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Otkritka sozlamalari o'zgartirildi",
            `Qog'ozlar: ${c.qogozlar.map(p => `${p.name} ${p.price1}/${p.price2}`).join(', ')}; lak qog'ozi ${c.lakQogoz.name} ${c.lakQogoz.price1}/${c.lakQogoz.price2}; `
            + c.turlar.map(t => `${t.nomi}: ${t.xizmatNomi} ${t.xizmatNarxi}`).join('; '));
        renderAdminOtkritka();
        showToast("💾 Otkritka sozlamalari saqlandi!");
    }

    // Eski sxemalar: qog'ozlar Sifravoy bazasidan olinardi (oddiyQogozNomlari / oddiyQogozlar prefikslari,
    // lakQogoz — nom). Endi otkritkaning o'z ro'yxati — o'sha qog'ozlar narxi bilan birga bir marta ko'chiriladi.
    function migrateOtkritkaConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;
        if (Array.isArray(saved.turlar)) cfg.turlar = saved.turlar;
        if (typeof saved.zapasVaraq === 'number') cfg.zapasVaraq = saved.zapasVaraq;
        let sifravoy = xavfsizOl(() => digitalPapersDatabase, []) || [];
        let nusxa = (p, id) => ({ id, name: p.name, q_eni: p.q_eni, q_boyi: p.q_boyi, p_eni: p.p_eni, p_boyi: p.p_boyi, price1: p.price1, price2: p.price2 });

        if (Array.isArray(saved.qogozlar)) {
            cfg.qogozlar = saved.qogozlar;
        } else {
            let lakNomi = String(typeof saved.lakQogoz === 'string' ? saved.lakQogoz : 'Colotech 300g A2').toLowerCase().trim();
            let tanlangan;
            if (Array.isArray(saved.oddiyQogozNomlari)) {
                tanlangan = sifravoy.filter(p => saved.oddiyQogozNomlari.includes(p.name));
            } else {
                let prefikslar = (Array.isArray(saved.oddiyQogozlar) ? saved.oddiyQogozlar : ['Colotech', 'Lyon', 'Kvarts']).map(x => String(x).toLowerCase().trim());
                tanlangan = sifravoy.filter(p => prefikslar.some(pr => (p.name || '').toLowerCase().startsWith(pr)) && (p.name || '').toLowerCase().trim() !== lakNomi);
            }
            if (tanlangan.length) cfg.qogozlar = tanlangan.map((p, i) => nusxa(p, 'okq' + (i + 1)));
        }

        if (saved.lakQogoz && typeof saved.lakQogoz === 'object') {
            cfg.lakQogoz = saved.lakQogoz;
        } else if (typeof saved.lakQogoz === 'string') {
            let lp = sifravoy.find(p => (p.name || '').toLowerCase().trim() === saved.lakQogoz.toLowerCase().trim());
            if (lp) cfg.lakQogoz = nusxa(lp, 'oklq');
        }
        // lakTierlar faqat yangi (lak/folga ishi) sxemada saqlangan bo'lsa olinadi
        if (saved.lakQogoz && Array.isArray(saved.lakTierlar) && saved.lakTierlar.length) cfg.lakTierlar = saved.lakTierlar;
        return cfg;
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('varaqli');
