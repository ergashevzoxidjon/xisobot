// Poligrafiya bo'limi — Vizitka.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== VIZITKA (turlar: qog'oz grammaji turning o'zida, chop etish turlari) ======================
    // Vizitkaning bir nechta TURI bor; har bir turda qog'oz (turi + grammaji) kiritilgan va shu turga
    // RUXSAT BERILGAN chop etish turlari belgilanadi: Sifravoy pechat, Ofset pechat, UF pechat, Tisneniya,
    // 3D lak, 3D tilla. Hozircha faqat Sifravoy va Ofset hisoblanadi (umumiy poligrafiya dvigateli — qog'oz Ofset/
    // Raqamli bazadan, ofset minimal tiraji bilan); qolgan to'rt turning hisobi keyin qo'shiladi.
    const VIZITKA_CHOP_TURLARI = {
        sifravoy: 'Sifravoy pechat', ofset: 'Ofset pechat', uf: 'UF pechat',
        tisneniya: 'Tisneniya', lak3d: '3D lak', tilla: '3D tilla'
    };
    const VIZITKA_HISOBLANADIGAN = ['sifravoy', 'ofset'];
    let vizitkaConfig = {
        turlar: [
            { key: 'vz300', nomi: 'Karton 300gr', paperType: 'Karton', gsm: 300, chopTurlari: ['sifravoy', 'ofset'], isDefault: true },
            { key: 'vz350', nomi: 'Karton 350gr', paperType: 'Karton', gsm: 350, chopTurlari: ['sifravoy', 'ofset'], isDefault: false }
        ]
    };
    let vizitkaSelected = { turIndex: 0, chop: 'sifravoy', sides: 2 };

    function vizitkaTuri() {
        return vizitkaConfig.turlar[vizitkaSelected.turIndex] || vizitkaConfig.turlar[0] || null;
    }

    function vizitkaRuxsatEtilgan(t) {
        let list = (t && Array.isArray(t.chopTurlari)) ? t.chopTurlari.filter(k => VIZITKA_CHOP_TURLARI[k]) : [];
        return list;
    }

    function buildVizitkaForm() {
        let def = vizitkaConfig.turlar.findIndex(t => t.isDefault);
        let t = vizitkaConfig.turlar[def >= 0 ? def : 0];
        let ruxsat = vizitkaRuxsatEtilgan(t);
        vizitkaSelected = { turIndex: def >= 0 ? def : 0, chop: ruxsat[0] || 'sifravoy', sides: 2 };
        selectedPoligrafiyaEngine = 'ofset';
        poliAvtoRaqamli = false;
        return `
            <div class="poli-calc">
                <div class="poli-spec-row">
                    <div class="poli-spec-icon">📐</div>
                    <div>
                        <div class="poli-spec-label">Standart o'lcham</div>
                        <div class="poli-spec-value">${poligrafiyaSizeLabels.vizitka || ''}</div>
                    </div>
                </div>
                <div class="step-title">1. Vizitka turi <span class="paket-step-hint">(qog'oz grammaji turning o'zida)</span></div>
                <div class="options-group" id="vzTurGroup"></div>
                <div id="vzInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Chop etish turi</div>
                <div class="options-group" id="vzChopGroup"></div>
                <div id="poliOfsetMinOgoh" class="poli-ofset-min-ogoh" style="display:none;"></div>

                <div class="step-title" id="vzSidesTitle">3. Bosma tomoni</div>
                <div class="options-group" id="vzSidesGroup"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderVizitkaOptions() {
        let turGroup = document.getElementById('vzTurGroup');
        if (!turGroup) return;
        let s = vizitkaSelected;
        let t = vizitkaTuri();
        turGroup.innerHTML = vizitkaConfig.turlar.length === 0
            ? `<span class="paket-xato">⚠️ Vizitka turlari kiritilmagan — Admin → Vizitka.</span>`
            : vizitkaConfig.turlar.map((x, i) => `<button type="button" class="opt-btn ${i === s.turIndex ? 'active' : ''}" onclick="selectVizitkaTur(${i})">${x.nomi}</button>`).join('');
        let info = document.getElementById('vzInfo');
        if (info && t) info.innerHTML = `<div>📄 Qog'oz: <b>${t.paperType} ${t.gsm}gr</b></div>`;

        let ruxsat = vizitkaRuxsatEtilgan(t);
        let chopGroup = document.getElementById('vzChopGroup');
        if (chopGroup) chopGroup.innerHTML = ruxsat.length === 0
            ? `<span class="paket-xato">⚠️ Bu tur uchun chop etish turi belgilanmagan — Admin → Vizitka.</span>`
            : ruxsat.map(k => {
                let nom = VIZITKA_CHOP_TURLARI[k];
                let hisoblanadi = VIZITKA_HISOBLANADIGAN.includes(k);
                return `<button type="button" class="opt-btn ${k === s.chop ? 'active' : ''}" data-vzchop="${k}" onclick="selectVizitkaChop('${k}')"${hisoblanadi ? '' : ' title="Hisobi keyinroq sozlanadi"'}>${nom}</button>`;
            }).join('');
        let tomon = document.getElementById('vzSidesGroup');
        if (tomon) tomon.innerHTML = `
            <button type="button" class="opt-btn ${s.sides === 1 ? 'active' : ''}" onclick="selectVizitkaSides(1)">Bir tomonlama (4+0)</button>
            <button type="button" class="opt-btn ${s.sides === 2 ? 'active' : ''}" onclick="selectVizitkaSides(2)">Ikki tomonlama (4+4)</button>`;
    }

    function selectVizitkaTur(i) {
        vizitkaSelected.turIndex = i;
        let ruxsat = vizitkaRuxsatEtilgan(vizitkaTuri());
        if (!ruxsat.includes(vizitkaSelected.chop)) vizitkaSelected.chop = ruxsat[0] || '';
        vizitkaSelected.avto = false;
        renderVizitkaOptions();
        calculate();
    }

    function selectVizitkaChop(k) {
        vizitkaSelected.chop = k;
        vizitkaSelected.avto = false; // menejer o'zi tanladi
        renderVizitkaOptions();
        calculate();
    }

    function selectVizitkaSides(n) {
        vizitkaSelected.sides = n;
        renderVizitkaOptions();
        calculate();
    }

    function calculateVizitka(qty, baseCost) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let s = vizitkaSelected;
        let t = vizitkaTuri();
        let yaroqsiz = xabar => ({ baseUnitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true });
        if (!t) return yaroqsiz("Vizitka turlari kiritilmagan — Admin → Vizitka.");
        let ruxsat = vizitkaRuxsatEtilgan(t);
        if (!ruxsat.includes(s.chop)) return yaroqsiz("Bu tur uchun chop etish turi tanlanmagan yoki ruxsat berilmagan.");
        let chopNomi = VIZITKA_CHOP_TURLARI[s.chop];
        if (!VIZITKA_HISOBLANADIGAN.includes(s.chop)) {
            return yaroqsiz(`${chopNomi} narxi hisobi hali sozlanmagan — mutaxassisga bog'laning.`);
        }

        // Ofset minimal tiraji: adad kam bo'lsa avtomatik Sifravoyga (agar tur ruxsat bersa), aks holda — mutaxassis.
        // Adad yana yetarli bo'lsa va tanlov avtomatik bo'lgan bo'lsa — Ofsetga qaytadi.
        let minTiraj = parseInt(poliSozlama('vizitka').ofsetMinTiraj) || 0;
        if (s.chop === 'ofset' && minTiraj > 0 && qty < minTiraj) {
            if (!ruxsat.includes('sifravoy')) return yaroqsiz(`Ofset pechat uchun kamida ${minTiraj.toLocaleString()} dona kerak — mutaxassisga bog'laning.`);
            s.chop = 'sifravoy'; s.avto = true; renderVizitkaOptions();
        } else if (s.avto && s.chop === 'sifravoy' && ruxsat.includes('ofset') && !(minTiraj > 0 && qty < minTiraj)) {
            s.chop = 'ofset'; s.avto = false; renderVizitkaOptions();
        }
        chopNomi = VIZITKA_CHOP_TURLARI[s.chop];

        // Umumiy poligrafiya dvigateli (qog'oz bazasi, ofset minimal tiraji, forma/bosma) — shu turning qog'ozi bilan
        let eskiRoyxat = poligrafiyaGsmDatabase.vizitka;
        let eskiIndeks = selectedPoligrafiyaGsmIndex;
        let res;
        try {
            poligrafiyaGsmDatabase.vizitka = [{ gsm: parseInt(t.gsm) || 0, paperType: t.paperType || 'Karton', isDefault: true }];
            selectedPoligrafiyaGsmIndex = 0;
            selectedPoligrafiyaEngine = (s.chop === 'ofset') ? 'ofset' : 'raqamli';
            poliAvtoRaqamli = false; // Ofset/Raqamli almashuvini bu yerda o'zimiz boshqaramiz
            selectedPoligrafiyaSides = (s.sides === 1) ? 1 : 2;
            res = calculateResult_poligrafiya('vizitka', qty, baseCost);
        } finally {
            poligrafiyaGsmDatabase.vizitka = eskiRoyxat;
            selectedPoligrafiyaGsmIndex = eskiIndeks;
        }

        return res;
    }

    // ---- Admin: Vizitka ----
    function renderAdminVizitka() {
        let q = id => document.getElementById(id);
        if (!q('vzAdminTurlar')) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('vzAdminMinTiraj').value = poliSozlama('vizitka').ofsetMinTiraj || 0;
        q('vzAdminTurlar').innerHTML = vizitkaConfig.turlar.length === 0
            ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha tur yo'q — "+ Yangi tur" ni bosing.</td></tr>`
            : vizitkaConfig.turlar.map((t, i) => `
            <tr>
                <td><input type="text" id="vzT_nomi_${i}" value="${esc(t.nomi)}" placeholder="masalan: Karton 300gr"></td>
                <td><select id="vzT_paper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${t.paperType === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="vzT_gsm_${i}" value="${t.gsm}" min="1"></td>
                <td>${Object.keys(VIZITKA_CHOP_TURLARI).map(k => `<label style="display:inline-flex; align-items:center; gap:4px; margin:2px 10px 2px 0; white-space:nowrap; font-size:0.82rem;"><input type="checkbox" id="vzT_chop_${i}_${k}" ${vizitkaRuxsatEtilgan(t).includes(k) ? 'checked' : ''}> ${VIZITKA_CHOP_TURLARI[k]}${VIZITKA_HISOBLANADIGAN.includes(k) ? '' : ' <span style="color:var(--text-muted);">(hisobi keyin)</span>'}</label>`).join('')}</td>
                <td style="text-align:center;"><input type="radio" name="vzTDefault" id="vzT_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteVizitkaTur(${i})">✕</button></td>
            </tr>`).join('');
    }

    function collectVizitkaTurlar() {
        let q = id => document.getElementById(id);
        return vizitkaConfig.turlar.map((t, i) => {
            if (!q(`vzT_nomi_${i}`)) return t;
            return {
                key: t.key || ('vz' + Date.now().toString(36) + i),
                nomi: q(`vzT_nomi_${i}`).value.trim() || `Tur ${i + 1}`,
                paperType: q(`vzT_paper_${i}`).value,
                gsm: Math.max(1, parseInt(q(`vzT_gsm_${i}`).value) || 300),
                chopTurlari: Object.keys(VIZITKA_CHOP_TURLARI).filter(k => q(`vzT_chop_${i}_${k}`)?.checked),
                isDefault: q(`vzT_def_${i}`).checked
            };
        });
    }

    function addVizitkaTur() {
        vizitkaConfig.turlar = collectVizitkaTurlar();
        vizitkaConfig.turlar.push({ key: 'vz' + Date.now().toString(36), nomi: 'Yangi tur', paperType: 'Karton', gsm: 300, chopTurlari: ['sifravoy', 'ofset'], isDefault: vizitkaConfig.turlar.length === 0 });
        renderAdminVizitka();
    }

    function deleteVizitkaTur(i) {
        let turlar = collectVizitkaTurlar();
        if (!turlar[i] || !confirm(`"${turlar[i].nomi}" turini o'chirasizmi?`)) return;
        let edi = turlar[i].isDefault;
        turlar.splice(i, 1);
        if (edi && turlar.length > 0) turlar[0].isDefault = true;
        vizitkaConfig.turlar = turlar;
        renderAdminVizitka();
    }

    function saveVizitkaConfig() {
        let turlar = collectVizitkaTurlar();
        if (turlar.length === 0) { showToast("⚠️ Kamida bitta vizitka turini kiriting!"); return; }
        if (turlar.some(t => t.chopTurlari.length === 0)) { showToast("⚠️ Har bir turga kamida bitta chop etish turi belgilang!"); return; }
        if (!turlar.some(t => t.isDefault)) turlar[0].isDefault = true;
        vizitkaConfig.turlar = turlar;
        localStorage.setItem('erp_vizitka_config', JSON.stringify(vizitkaConfig));
        // Ofset minimal tiraji — umumiy mahsulot sozlamasida saqlanadi (Flayer/Listovka bilan bir xil mexanizm)
        poligrafiyaMahsulotSozlama.vizitka = { ...poliSozlama('vizitka'), ofsetMinTiraj: Math.max(0, parseInt(document.getElementById('vzAdminMinTiraj').value) || 0) };
        localStorage.setItem('erp_poligrafiya_mahsulot_sozlama', JSON.stringify(poligrafiyaMahsulotSozlama));
        if (typeof logAudit === 'function') logAudit("Vizitka sozlamalari o'zgartirildi",
            turlar.map(t => `${t.nomi} (${t.paperType} ${t.gsm}gr): ${t.chopTurlari.map(k => VIZITKA_CHOP_TURLARI[k]).join(', ')}`).join('; ') + `; ofset min tiraj ${poligrafiyaMahsulotSozlama.vizitka.ofsetMinTiraj}`);
        renderAdminVizitka();
        showToast("💾 Vizitka sozlamalari saqlandi!");
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('vizitka');
