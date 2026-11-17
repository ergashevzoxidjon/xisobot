// Poligrafiya bo'limi — Stiker.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== STIKER (Samokleyka, Ofset yoki Raqamli) ======================
    // Menejer o'lcham (mm) va shaklni (To'rtburchak / Yumaloq / Shakl) kiritadi. Har bir stiker
    // varaqqa BARCHA tomonidan 2 mm qoldirib joylanadi (qadam = eni+4 × bo'yi+4). Qog'oz — doim
    // Samokleyka turlari (qogozlar ro'yxati) — admin yangi tur qo'shadi; har birining Ofset (SRA3 varaq)
    // va Raqamli (varaq: qog'oz + pechat) narxi alohida (0 — shu usulda mavjud emas).
    // Kesish: Raqamli — doim Ploter (A3 varaq uchun, shaklga qarab). Ofset — Ploter YOKI Visochka
    // (Visochka = shaklning bir martalik pichoq narxi + umumiy visochka xarajati, ofsetFinishingServices).
    // Ofset faqat ofsetMinTiraj dan boshlab; kam adadda hisob avtomatik Raqamli pechatda.
    let stikerConfig = {
        ofsetMinTiraj: 5000,
        zapasVaraq: 3, // Raqamli pechatda sozlash uchun qo'shimcha varaq
        raqamliMaydon: { p_eni: 310, p_boyi: 440 }, // Raqamli varaqning pechat maydoni
        qogozlar: [
            { id: 'sk1', nomi: 'Samokleyka', ofsetNarx: 1800, raqamliNarx: 4000 }
        ],
        shakllar: [
            { key: 'tortburchak', nomi: "To'rtburchak", ploterNarxi: 3000, pichoqNarxi: 150000 },
            { key: 'yumaloq',     nomi: 'Yumaloq',       ploterNarxi: 4000, pichoqNarxi: 200000 },
            { key: 'shakl',       nomi: 'Shakl',         ploterNarxi: 6000, pichoqNarxi: 250000 }
        ]
    };
    let stikerSelected = { shakl: 'tortburchak', kesish: 'ploter', qogozId: '' };

    // Eski saqlangan sozlama (bitta Samokleyka: raqamliQogoz) → turlar ro'yxatiga bir marta ko'chiriladi
    function migrateStikerConfig(saved, def) {
        let c = { ...def, ...saved };
        if (!Array.isArray(saved.qogozlar) || saved.qogozlar.length === 0) {
            let eski = saved.raqamliQogoz || {};
            let ofsetBaza = (typeof ofsetRawPapers !== 'undefined') ? ofsetRawPapers.find(p => (p.label || '').toLowerCase() === 'samokleyka') : null;
            c.qogozlar = [{
                id: 'sk1', nomi: 'Samokleyka',
                ofsetNarx: (ofsetBaza && ofsetBaza.prices && ofsetBaza.prices.sra3) || def.qogozlar[0].ofsetNarx,
                raqamliNarx: parseFloat(eski.price1) || def.qogozlar[0].raqamliNarx
            }];
            c.raqamliMaydon = { p_eni: eski.p_eni || def.raqamliMaydon.p_eni, p_boyi: eski.p_boyi || def.raqamliMaydon.p_boyi };
        } else {
            c.raqamliMaydon = { ...def.raqamliMaydon, ...(saved.raqamliMaydon || {}) };
        }
        delete c.raqamliQogoz;
        c.shakllar = Array.isArray(saved.shakllar) && saved.shakllar.length ? saved.shakllar : def.shakllar;
        return c;
    }

    function stikerQogozi(id) {
        return stikerConfig.qogozlar.find(q => q.id === id) || stikerConfig.qogozlar[0] || null;
    }

    function stikerShakli(key) {
        return stikerConfig.shakllar.find(s => s.key === key) || stikerConfig.shakllar[0] || null;
    }

    function buildStikerForm() {
        selectedPoligrafiyaEngine = 'ofset';
        poliAvtoRaqamli = false;
        let sh = stikerConfig.shakllar[0];
        stikerSelected = { shakl: sh ? sh.key : '', kesish: 'ploter', qogozId: stikerConfig.qogozlar[0] ? stikerConfig.qogozlar[0].id : '' };
        return `
            <div class="poli-calc">
                <div class="step-title">1. Stiker shakli</div>
                <div class="options-group" id="stShaklGroup"></div>

                <div class="step-title">2. O'lchami <span class="paket-step-hint">(varaqqa barcha tomonidan 2 mm qoldirib joylanadi)</span></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label id="stEniLabel">Eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="stEni" min="1" value="50" oninput="calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group" id="stBoyiGroup">
                        <label>Bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="stBoyi" min="1" value="50" oninput="calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="stInfo" class="paket-bichish-info"></div>

                <div class="step-title">3. Samokleyka turi</div>
                <div class="options-group" id="stQogozGroup"></div>

                <div class="step-title">4. Pechat usuli</div>
                <div class="options-group" id="poligrafiyaEngineGroup">
                    <button type="button" class="opt-btn active" data-engine="ofset" onclick="selectPoligrafiyaEngine('ofset')">🖨️ Ofset Pechat</button>
                    <button type="button" class="opt-btn" data-engine="raqamli" onclick="selectPoligrafiyaEngine('raqamli')">🖥️ Raqamli Pechat</button>
                </div>
                <div id="poliOfsetMinOgoh" class="poli-ofset-min-ogoh" style="display:none;"></div>

                <div id="stKesishBox">
                    <div class="step-title">5. Kesish usuli <span class="paket-step-hint">(Ofsetda)</span></div>
                    <div class="options-group" id="stKesishGroup"></div>
                </div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderStikerOptions() {
        let g = document.getElementById('stShaklGroup');
        if (!g) return;
        g.innerHTML = stikerConfig.shakllar.map(s =>
            `<button type="button" class="opt-btn ${s.key === stikerSelected.shakl ? 'active' : ''}" onclick="selectStikerShakl('${s.key}')">${s.nomi}</button>`
        ).join('');
        let qg = document.getElementById('stQogozGroup');
        if (qg) qg.innerHTML = stikerConfig.qogozlar.length === 0
            ? `<span class="paket-xato">⚠️ Samokleyka turi kiritilmagan — Admin → Stiker.</span>`
            : stikerConfig.qogozlar.map(q => `<button type="button" class="opt-btn ${q.id === stikerSelected.qogozId ? 'active' : ''}" onclick="selectStikerQogoz('${q.id}')">${q.nomi}</button>`).join('');
        let yumaloq = stikerSelected.shakl === 'yumaloq';
        let boyi = document.getElementById('stBoyiGroup');
        if (boyi) boyi.style.display = yumaloq ? 'none' : '';
        let eniLabel = document.getElementById('stEniLabel');
        if (eniLabel) eniLabel.innerHTML = (yumaloq ? 'Diametri' : 'Eni') + ' <span class="majburiy">*</span>';
        let k = document.getElementById('stKesishGroup');
        if (k) k.innerHTML = `
            <button type="button" class="opt-btn ${stikerSelected.kesish === 'ploter' ? 'active' : ''}" onclick="selectStikerKesish('ploter')">✂️ Ploter</button>
            <button type="button" class="opt-btn ${stikerSelected.kesish === 'visochka' ? 'active' : ''}" onclick="selectStikerKesish('visochka')">🔪 Visochka (pichoq)</button>`;
    }

    function selectStikerShakl(key) {
        stikerSelected.shakl = key;
        renderStikerOptions();
        calculate();
    }

    function selectStikerQogoz(id) {
        stikerSelected.qogozId = id;
        renderStikerOptions();
        calculate();
    }

    function selectStikerKesish(key) {
        stikerSelected.kesish = key;
        renderStikerOptions();
        calculate();
    }

    function calculateStiker(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let info = html => { let el = document.getElementById('stInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = xabar => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let shakl = stikerShakli(stikerSelected.shakl);
        if (!shakl) return yaroqsiz("Stiker shakllari kiritilmagan — Admin → Stiker.");
        let yumaloq = shakl.key === 'yumaloq';
        let w = parseFloat(document.getElementById('stEni')?.value) || 0;
        let h = yumaloq ? w : (parseFloat(document.getElementById('stBoyi')?.value) || 0);
        if (!(w > 0 && h > 0)) return yaroqsiz(yumaloq ? "Diametrini kiriting." : "Eni va bo'yini kiriting — ikkalasi ham majburiy.");

        let qogoz = stikerQogozi(stikerSelected.qogozId);
        if (!qogoz) return yaroqsiz("Samokleyka turi kiritilmagan — Admin → Stiker.");

        // Ofset minimal tiraji: adad yetmasa — Raqamli pechatda hisoblanadi
        let minTiraj = parseInt(stikerConfig.ofsetMinTiraj) || 0;
        let ofsetMumkin = !(minTiraj > 0 && qty < minTiraj);
        if (!ofsetMumkin && selectedPoligrafiyaEngine === 'ofset') {
            selectedPoligrafiyaEngine = 'raqamli';
            poliAvtoRaqamli = true;
        } else if (ofsetMumkin && poliAvtoRaqamli) {
            selectedPoligrafiyaEngine = 'ofset';
            poliAvtoRaqamli = false;
        }
        poliOfsetHolatiniYangila(ofsetMumkin, minTiraj, qty);
        let ofset = selectedPoligrafiyaEngine !== 'raqamli';
        let kesishBox = document.getElementById('stKesishBox');
        if (kesishBox) kesishBox.style.display = ofset ? '' : 'none';

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        let varaqEni, varaqBoyi;
        if (ofset) {
            let ws = getOfsetWorkingSheets('SRA3')[0]; // 320x450 — Samokleyka SRA3 varag'i
            varaqEni = ws.w - 10; varaqBoyi = ws.h - 10;
            if (!(parseFloat(qogoz.ofsetNarx) > 0)) return yaroqsiz(`"${qogoz.nomi}" uchun Ofset narxi kiritilmagan — Raqamli pechatni tanlang yoki Admin → Stiker'da narxni kiriting.`);
        } else {
            varaqEni = parseFloat(stikerConfig.raqamliMaydon.p_eni) || 0;
            varaqBoyi = parseFloat(stikerConfig.raqamliMaydon.p_boyi) || 0;
            if (!(parseFloat(qogoz.raqamliNarx) > 0)) return yaroqsiz(`"${qogoz.nomi}" uchun Raqamli narx kiritilmagan — Ofset pechatni tanlang yoki Admin → Stiker'da narxni kiriting.`);
        }

        // Har tomonidan 2 mm: qadam = o'lcham + 4 (calculateOfsetGridFitting o'zi +2 qo'shadi)
        let fit = calculateOfsetGridFitting(varaqEni, varaqBoyi, w + 2, h + 2);
        if (!(fit.count > 0)) return yaroqsiz(`Stiker ${w}×${h} mm (2 mm bo'sh joy bilan) varaq pechat maydoniga (${varaqEni}×${varaqBoyi}) sig'maydi.`);
        let perSheet = fit.count;
        let varaqlar = Math.ceil(qty / perSheet); // kesiladigan toza varaqlar

        let pechatNomi, kesishNomi;
        if (ofset) {
            let narx = parseFloat(qogoz.ofsetNarx);
            let zapas = Math.ceil(100 / perSheet);
            let jamiVaraq = varaqlar + zapas;
            qosh(`Qog'oz (${qogoz.nomi}, SRA3)`, `${jamiVaraq} varaq × ${narx.toLocaleString()}`, jamiVaraq * narx);
            qosh('Forma (klishe)', `4 plastina`, 4 * ofsetMachineSettings.plateA3);
            let multiplier = Math.max(0, Math.ceil(jamiVaraq / 1000) - 1);
            qosh('Bosma (pechat)', `${jamiVaraq} ta A3 varaq`, ofsetMachineSettings.printA3Base + multiplier * ofsetMachineSettings.printA3Step);
            pechatNomi = 'Ofset Pechat';
        } else {
            let narx = parseFloat(qogoz.raqamliNarx);
            let jamiVaraq = varaqlar + (parseInt(stikerConfig.zapasVaraq) || 0);
            qosh(`${qogoz.nomi} + Raqamli pechat`, `${jamiVaraq} varaq × ${narx.toLocaleString()}`, jamiVaraq * narx);
            pechatNomi = 'Raqamli Pechat';
        }

        // Kesish
        if (ofset && stikerSelected.kesish === 'visochka') {
            let pichoq = parseFloat(shakl.pichoqNarxi) || 0;
            qosh(`Pichoq (${shakl.nomi}, bir martalik)`, '1 ta', pichoq);
            let vis = papkaTieredTotal(varaqlar, ofsetFinishingServices.visochka.a3);
            qosh('Visochka (kesish)', `${varaqlar} varaq`, vis);
            kesishNomi = 'Visochka';
        } else {
            let ploter = parseFloat(shakl.ploterNarxi) || 0;
            qosh(`Ploter kesish (${shakl.nomi}, A3 varaq)`, `${varaqlar} varaq × ${ploter.toLocaleString()}`, varaqlar * ploter);
            kesishNomi = 'Ploter';
        }

        info(`<div>📐 ${shakl.nomi} <b>${yumaloq ? '⌀' + w : w + '×' + h} mm</b> → varaqqa (${varaqEni}×${varaqBoyi}) <b>${perSheet} dona</b>${fit.isRotated ? ' (aylantirib)' : ''} · ${varaqlar} varaq</div>`);
        return {
            unitPrice: jami / qty,
            details: `Stiker ${shakl.nomi} ${yumaloq ? '⌀' + w : w + '×' + h}mm | ${qogoz.nomi} | ${pechatNomi} | ${kesishNomi}`,
            costItems
        };
    }

    // ---- Admin: Stiker ----
    function renderAdminStiker() {
        let q = id => document.getElementById(id);
        if (!q('stAdminShakllar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('stAdminMinTiraj').value = stikerConfig.ofsetMinTiraj;
        q('stAdminZapas').value = stikerConfig.zapasVaraq;
        q('stAdminRqEni').value = stikerConfig.raqamliMaydon.p_eni;
        q('stAdminRqBoyi').value = stikerConfig.raqamliMaydon.p_boyi;
        q('stAdminQogozBody').innerHTML = stikerConfig.qogozlar.length === 0
            ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">Samokleyka turi yo'q — "+ Samokleyka turi qo'shish" ni bosing.</td></tr>`
            : stikerConfig.qogozlar.map((p, i) => `
                <tr>
                    <td><input type="text" id="stQ_nomi_${i}" value="${esc(p.nomi)}" placeholder="masalan: Shaffof samokleyka"></td>
                    <td><input type="number" id="stQ_ofset_${i}" value="${p.ofsetNarx}" min="0"></td>
                    <td><input type="number" id="stQ_raqamli_${i}" value="${p.raqamliNarx}" min="0"></td>
                    <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteStikerQogoz(${i})">✕</button></td>
                </tr>`).join('');
        q('stAdminShakllar').innerHTML = stikerConfig.shakllar.map((s, i) => `
            <tr>
                <td><b>${esc(s.nomi)}</b></td>
                <td><input type="number" id="stS_ploter_${i}" value="${s.ploterNarxi}" min="0"></td>
                <td><input type="number" id="stS_pichoq_${i}" value="${s.pichoqNarxi}" min="0"></td>
            </tr>`).join('');
    }

    // Admin maydonlaridagi (saqlanmagan) qiymatlarni stikerConfig'ga o'qiydi
    function collectStikerFromUI() {
        let q = id => document.getElementById(id);
        if (!q('stAdminShakllar')) return;
        let son = id => Math.max(0, parseFloat(q(id)?.value) || 0);
        let c = stikerConfig;
        c.ofsetMinTiraj = Math.floor(son('stAdminMinTiraj'));
        c.zapasVaraq = Math.floor(son('stAdminZapas'));
        c.raqamliMaydon = { p_eni: son('stAdminRqEni'), p_boyi: son('stAdminRqBoyi') };
        c.qogozlar = c.qogozlar.map((p, i) => q(`stQ_nomi_${i}`) ? {
            id: p.id, nomi: q(`stQ_nomi_${i}`).value.trim(),
            ofsetNarx: son(`stQ_ofset_${i}`), raqamliNarx: son(`stQ_raqamli_${i}`)
        } : p);
        c.shakllar = c.shakllar.map((s, i) => q(`stS_ploter_${i}`) ? { ...s, ploterNarxi: son(`stS_ploter_${i}`), pichoqNarxi: son(`stS_pichoq_${i}`) } : s);
    }

    function addStikerQogoz() {
        collectStikerFromUI();
        stikerConfig.qogozlar.push({ id: 'sk' + Date.now().toString(36), nomi: '', ofsetNarx: 0, raqamliNarx: 0 });
        renderAdminStiker();
    }

    function deleteStikerQogoz(i) {
        collectStikerFromUI();
        let p = stikerConfig.qogozlar[i];
        if (!p || !confirm(`"${p.nomi || 'Nomsiz tur'}" ni o'chirasizmi?`)) return;
        stikerConfig.qogozlar.splice(i, 1);
        renderAdminStiker();
    }

    function saveStikerConfig() {
        if (!document.getElementById('stAdminShakllar')) return;
        collectStikerFromUI();
        let c = stikerConfig;
        if (!(c.raqamliMaydon.p_eni > 0 && c.raqamliMaydon.p_boyi > 0)) { showToast("⚠️ Raqamli varaqning pechat maydoni 0 dan katta bo'lishi kerak!"); return; }
        if (c.qogozlar.length === 0) { showToast("⚠️ Kamida bitta samokleyka turini kiriting!"); return; }
        if (c.qogozlar.some(p => !p.nomi)) { showToast("⚠️ Har bir samokleyka turining nomi bo'lishi kerak!"); return; }
        localStorage.setItem('erp_stiker_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Stiker sozlamalari o'zgartirildi",
            `Ofset min tiraj ${c.ofsetMinTiraj}; samokleyka: ${c.qogozlar.map(p => `${p.nomi} ${p.ofsetNarx}/${p.raqamliNarx}`).join(', ')}; ` + c.shakllar.map(s => `${s.nomi}: ploter ${s.ploterNarxi}, pichoq ${s.pichoqNarxi}`).join('; '));
        showToast("💾 Stiker sozlamalari saqlandi!");
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('stiker');
