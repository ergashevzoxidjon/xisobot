// Poligrafiya bo'limi — Kubarik.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== KUBARIK (poligrafiya, Bloknot kabi — Ofset qog'oz bazasidan) ======================
    // Kubarik — kvadrat varaqlardan yig'ilgan blok (standart 90x90mm, balandligi 90mm). Turlari qog'oz/yelim
    // bo'yicha farqlanadi (Oq, Rangli, Kleyli, Pechatli) — har birini admin tahrirlaydi. Hisob:
    //   A3 varoqlar = ceil(adad × varaqSoni / a3dagiBolak) + zapasVaraq (tirajga bir marta)
    //   Qog'oz narxi — Ofset bo'limi bazasidan (turning qog'oz turi/grammaji, A3 ofset).
    //   Pechatli tur — qo'shimcha forma + bosma (1+0, A3 ofset).
    //   + turning qo'shimcha narxi (rangli qog'oz ustamasi, yelim...) + yig'ish — so'm/dona, marjasiz.
    let kubarikConfig = {
        versiya: 3,
        olcham: '90x90mm',
        a3dagiBolak: 12,   // zaxira: ichkiA3 kiritilmagan turda A3 soni = varaqSoni ÷ shu
        zapasVaraq: 100,   // ichki qog'ozga tirajga bir marta qo'shiladigan zapas A3 varaq
        minAdad: 50,       // shundan kam adadga narx chiqarilmaydi — "Mutaxassis bilan bog'laning"
        idishZapas: 100,  // quti varag'iga tirajga bir marta qo'shiladigan zapas (quti formatidagi varaq)
        // Laminatsiya turlari: asosiy narx — Ofset → Pardozlash xizmatlari (A3/A2/A1); har turning ustamasi
        // (so'm / 1 varaq) shu narxga qo'shiladi. Foydalanuvchi kalkulyatorda turini tanlaydi.
        laminatsiyaTurlari: [
            { key: 'glyanets', name: 'Glyanets', ustama: 0 },
            { key: 'matt',     name: 'Matt',     ustama: 0 },
            { key: 'softtach', name: 'Soft-touch', ustama: 0 }
        ],
        // Har bir tur: olcham (matn); ichki qog'oz (paperType/gsm, ichkiA3 — 1 kubarikka kerak A3 varaq soni,
        // varaqSoni — faqat ma'lumot); QUTI (idish — quti bormi, idishPaperType/idishGsm, idishMashina — A3/A2/A1,
        // idishBolak — 1 varaqqa nechta quti). Quti uchun laminatsiya (turini foydalanuvchi tanlaydi) va visochka
        // MAJBURIY, yig'ish xarajati har kubarikka qo'shiladi.
        turlar: [
            { key: 'idish_90x90',     name: 'Idishlik 90x90mm (400-500 list)',  olcham: '90x90mm',  varaqSoni: 500, ichkiA3: 42, paperType: 'Ofset', gsm: 80, idish: true,  idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 1, pechatli: true , qoshimchaNomi: '', qoshimchaNarx: 0, yigishNarxi: 3000, isDefault: true },
            { key: 'idish_90x130',    name: 'Idishlik 90x130mm (100-120 list)', olcham: '90x130mm', varaqSoni: 120, ichkiA3: 13, paperType: 'Ofset', gsm: 80, idish: true,  idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 2, pechatli: true , qoshimchaNomi: '', qoshimchaNarx: 0, yigishNarxi: 3000, isDefault: false },
            { key: 'termokley_90x90', name: 'Termokleylik 90x90mm (100 list)',  olcham: '90x90mm',  varaqSoni: 100, ichkiA3: 9,  paperType: 'Ofset', gsm: 80, idish: false, idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 1, pechatli: true , qoshimchaNomi: '', qoshimchaNarx: 0, yigishNarxi: 3000, isDefault: false }
        ]
    };
    let kubarikSelected = { turIndex: 0, lamKey: 'glyanets' };

    function kubarikIchkiA3(t) {
        let v = parseFloat(t.ichkiA3);
        if (v > 0) return v;
        return (parseInt(t.varaqSoni) || 0) / Math.max(1, parseInt(t.a3dagiBolak) || parseInt(kubarikConfig.a3dagiBolak) || 1);
    }

    function kubarikTuri() {
        return kubarikConfig.turlar[kubarikSelected.turIndex] || kubarikConfig.turlar[0] || null;
    }

    function kubarikRasm(t) {
        return t && t.rasm ? t.rasm : placeholderImg(t ? (t.olcham || t.name) : 'Kubarik', 300, 200);
    }

    function buildKubarikForm() {
        let def = kubarikConfig.turlar.findIndex(t => t.isDefault);
        kubarikSelected = { turIndex: def >= 0 ? def : 0, lamKey: ((kubarikConfig.laminatsiyaTurlari || [])[0] || {}).key || '' };
        return `
            <div class="poli-calc">
                <div class="poli-spec-row">
                    <div class="poli-spec-icon">📐</div>
                    <div>
                        <div class="poli-spec-label">O'lcham</div>
                        <div class="poli-spec-value" id="kubarikOlchamText">${kubarikConfig.olcham}</div>
                    </div>
                </div>
                <div class="step-title">Kubarik turi</div>
                <div class="options-group" id="kubarikTurGroup"></div>
                <div class="kub-rasm"><img id="kubarikTurRasm" alt=""></div>
                <div id="kubarikInfoText" class="kubarik-info"></div>
                <div id="kubarikLamBox">
                    <div class="step-title">Quti laminatsiyasi</div>
                    <div class="options-group" id="kubarikLamGroup"></div>
                </div>
                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="100" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderKubarikOptions() {
        let group = document.getElementById('kubarikTurGroup');
        if (!group) return;
        if (kubarikConfig.turlar.length === 0) {
            group.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">⚠️ Kubarik turlari kiritilmagan — Admin panelda kiriting.</p>`;
            return;
        }
        group.innerHTML = kubarikConfig.turlar.map((t, i) => `
            <button type="button" class="opt-btn ${i === kubarikSelected.turIndex ? 'active' : ''}" onclick="selectKubarikTur(${i})">${t.name}</button>
        `).join('');
        renderKubarikLam();
        let t = kubarikTuri();
        let rasmEl = document.getElementById('kubarikTurRasm');
        if (rasmEl && t) {
            rasmEl.src = kubarikRasm(t);
            rasmEl.alt = t.name;
        }
        let info = document.getElementById('kubarikInfoText');
        if (info && t) {
            info.innerText = `${t.varaqSoni} varaq · ${t.paperType} ${t.gsm}gr`
                + (t.idish ? ` · quti: ${t.idishPaperType} ${t.idishGsm}gr` : ' · qutisiz')
                + (t.pechatli ? ' · har bir varaqqa pechat (1+0)' : '')
                + (t.qoshimchaNomi ? ` · ${t.qoshimchaNomi}` : '');
        }
    }

    function renderKubarikLam() {
        let t = kubarikTuri();
        let box = document.getElementById('kubarikLamBox');
        let group = document.getElementById('kubarikLamGroup');
        let ol = document.getElementById('kubarikOlchamText');
        if (ol && t) ol.innerText = t.olcham || kubarikConfig.olcham;
        if (!box || !group) return;
        let turlar = kubarikConfig.laminatsiyaTurlari || [];
        box.style.display = (t && t.idish && turlar.length > 0) ? '' : 'none';
        group.innerHTML = turlar.map(l => `
            <button type="button" class="opt-btn ${l.key === kubarikSelected.lamKey ? 'active' : ''}" onclick="selectKubarikLam('${l.key}')">${l.name}</button>
        `).join('');
    }

    function selectKubarikLam(key) {
        kubarikSelected.lamKey = key;
        renderKubarikLam();
        calculate();
    }

    function selectKubarikTur(i) {
        kubarikSelected.turIndex = i;
        renderKubarikOptions();
        calculate();
    }

    function calculateKubarik(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let minAdad = Math.max(1, parseInt(kubarikConfig.minAdad) || 50);
        if (qty < minAdad) {
            return { unitPrice: 0, details: `⚠️ Kubarik kamida ${minAdad} dona buyurtma qilinadi. Mutaxassis bilan bog'laning.`, costItems: [], hisobYaroqsiz: true };
        }
        let t = kubarikTuri();
        if (!t) return { unitPrice: 0, details: "⚠️ Kubarik turlari kiritilmagan — Admin panelda kiriting.", costItems: [] };

        let unit = 0;
        let costItems = [];
        let qismlar = [`Kubarik ${t.name} (${t.olcham || kubarikConfig.olcham})`, `${t.varaqSoni} varaq`];

        // 1) Qog'oz (+ pechatli turda forma va bosma) — Ofset A3; 1 kubarikka kerak A3 soni admin kiritgan
        let a3 = Math.ceil(qty * kubarikIchkiA3(t)) + (parseInt(kubarikConfig.zapasVaraq) || 0);
        // Ichi — faqat tayyor A3 (297x420) varaq, bazadagi "A3" (sra3) narxi bilan; boshqa format yo'q. SRA3 mashinasi A3 forma/bosma narxini ishlatadi.
        let r = calculateOfsetJobFixedSheets('SRA3', qty, 1, t.paperType, parseInt(t.gsm) || 0, a3, false, 'sra3');
        if (r) {
            unit += r.totalPaperCost / qty;
            costItems.push({ label: `Qog'oz (${t.paperType} ${t.gsm}gr, A3 297x420)`, qty: `${a3} A3 varaq`, total: Math.round(r.totalPaperCost) });
            if (t.pechatli) {
                unit += (r.totalPlateCost + r.totalPrintCost) / qty;
                costItems.push({ label: 'Forma (klishe)', qty: `${r.totalPlates} plastina`, total: Math.round(r.totalPlateCost) });
                costItems.push({ label: 'Bosma (pechat 1+0)', qty: `${r.totalWorkingSheets} ta A3 varoq`, total: Math.round(r.totalPrintCost) });
                qismlar.push('pechat 1+0');
            }
        } else {
            qismlar.push(`⚠️ ${t.paperType} ${t.gsm}gr uchun Ofset A3 bazasida narx topilmadi — admin panelda tekshiring`);
        }

        // 1b) Quti (idish): admin kiritgan qog'oz va format (A3/A2/A1), 1 varaqqa sig'adigan quti soni;
        // pechat — Ofset (1+0), zapas qo'shiladi. Faqat idishli turlarda (t.idish). Laminatsiya (foydalanuvchi tanlagan
        // tur) va visochka — MAJBURIY, umumiy pardozlash narxlaridan.
        if (t.idish) {
        let mashina = ['A3', 'A2', 'A1'].includes(t.idishMashina) ? t.idishMashina : 'A3';
        let mKey = mashina.toLowerCase();
        let qutiPaper = t.idishPaperType || 'Karton';
        let qutiGsm = parseInt(t.idishGsm) || 300;
        let qutiBolak = Math.max(1, parseFloat(t.idishBolak) || 1);
        let qutiSof = Math.ceil(qty / qutiBolak); // laminatsiya va visochka — zapassiz, sof varaq
        let qutiVaraq = qutiSof + (parseInt(kubarikConfig.idishZapas) || 0); // qog'oz va pechat — zapas bilan
        let rq = calculateOfsetJobFixedSheets(mashina, qty, 1, qutiPaper, qutiGsm, qutiVaraq, false, mashina === 'A3' ? '700x1000' : '');
        if (rq) {
            unit += (rq.totalPaperCost + rq.totalPlateCost + rq.totalPrintCost) / qty;
            costItems.push({ label: `Quti qog'ozi (${qutiPaper} ${qutiGsm}gr, ${rq.rawName})`, qty: `${rq.totalSheets} xom varoq (${qutiVaraq} ${mashina})`, total: Math.round(rq.totalPaperCost) });
            costItems.push({ label: 'Quti formasi (klishe)', qty: `${rq.totalPlates} plastina`, total: Math.round(rq.totalPlateCost) });
            costItems.push({ label: `Quti bosmasi (pechat 1+0, ${mashina})`, qty: `${rq.totalWorkingSheets} ta ${mashina} varoq`, total: Math.round(rq.totalPrintCost) });
            qismlar.push(`quti: ${qutiPaper} ${qutiGsm}gr (${mashina})`);
        } else {
            qismlar.push(`⚠️ Quti uchun ${qutiPaper} ${qutiGsm}gr Ofset ${mashina} bazasida narx topilmadi — admin panelda tekshiring`);
        }
        let lamTurlar = kubarikConfig.laminatsiyaTurlari || [];
        let lam = lamTurlar.find(l => l.key === kubarikSelected.lamKey) || lamTurlar[0];
        let lamNarx = (parseFloat(ofsetFinishingServices.laminatsiya[mKey]) || 0) + (lam ? parseFloat(lam.ustama) || 0 : 0);
        if (lamNarx > 0) {
            unit += (qutiSof * lamNarx) / qty;
            costItems.push({ label: `Quti laminatsiyasi${lam ? ' — ' + lam.name : ''} (${mashina})`, qty: `${qutiSof} varaq`, total: Math.round(qutiSof * lamNarx) });
        }
        let visTotal = papkaTieredTotal(qutiSof, ofsetFinishingServices.visochka[mKey]);
        if (visTotal > 0) {
            unit += visTotal / qty;
            costItems.push({ label: `Quti visochkasi (${mashina})`, qty: `${qutiSof} varaq`, total: Math.round(visTotal) });
        }
        qismlar.push('laminatsiya' + (lam ? ` (${lam.name})` : '') + ' + visochka');
        }

        // 2) Turning qo'shimcha narxi (rangli qog'oz ustamasi, yelim...)
        let qoshimcha = parseFloat(t.qoshimchaNarx) || 0;
        if (qoshimcha > 0) {
            unit += qoshimcha;
            costItems.push({ label: t.qoshimchaNomi || "Qo'shimcha", qty: `${qty} dona`, total: Math.round(qoshimcha * qty) });
            if (t.qoshimchaNomi) qismlar.push(t.qoshimchaNomi.toLowerCase());
        }

        // 3) Yig'ish
        let yigish = parseFloat(t.yigishNarxi) || 0;
        unit += yigish;
        costItems.push({ label: "Yig'ish", qty: `${qty} dona`, total: Math.round(yigish * qty) });

        return { unitPrice: unit, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Kubarik ----
    function renderAdminKubarik() {
        let q = id => document.getElementById(id);
        if (!q('kubarikTurlarBody')) return;
        q('kubarikOlcham').value = kubarikConfig.olcham;
        q('kubarikA3Bolak').value = kubarikConfig.a3dagiBolak;
        q('kubarikZapas').value = kubarikConfig.zapasVaraq;
        q('kubarikMinAdad').value = kubarikConfig.minAdad;
        q('kubarikIdishZapas').value = kubarikConfig.idishZapas;
        q('kubarikLamTurlari').value = (kubarikConfig.laminatsiyaTurlari || []).map(l => l.name + ' = ' + (l.ustama || 0)).join('\n');
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        q('kubarikTurlarBody').innerHTML = kubarikConfig.turlar.length === 0
            ? `<tr><td colspan="18" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha tur yo'q — "+ Yangi tur" tugmasini bosing.</td></tr>`
            : kubarikConfig.turlar.map((t, i) => `
            <tr>
                <td>
                    <label class="kub-admin-rasm" title="Rasmni almashtirish">
                        <img src="${kubarikRasm(t)}" alt="">
                        <input type="file" accept="image/*" onchange="kubarikTurRasmi(${i}, this)">
                        <span>📷 Rasm</span>
                    </label>
                    ${t.rasm ? `<button type="button" class="btn btn-danger" style="height:24px; padding:0 8px; margin-top:4px; font-size:0.7rem;" onclick="kubarikTurRasmiOchir(${i})">Rasmni olib tashlash</button>` : ''}
                </td>
                <td><input type="text" id="kubTur_name_${i}" value="${esc(t.name)}"></td>
                <td><input type="text" id="kubTur_olcham_${i}" value="${esc(t.olcham || kubarikConfig.olcham)}"></td>
                <td><select id="kubTur_paper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${t.paperType === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_gsm_${i}" value="${t.gsm}" min="1"></td>
                <td><input type="number" id="kubTur_varaq_${i}" value="${t.varaqSoni}" min="1"></td>
                <td><input type="number" id="kubTur_ia3_${i}" value="${kubarikIchkiA3(t)}" min="0.1" step="any"></td>
                <td style="text-align:center;"><input type="checkbox" id="kubTur_idish_${i}" ${t.idish ? 'checked' : ''}></td>
                <td><select id="kubTur_ipaper_${i}">${POLIGRAFIYA_PAPER_TYPES.map(p => `<option value="${p}" ${(t.idishPaperType || 'Karton') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_igsm_${i}" value="${t.idishGsm || 300}" min="1"></td>
                <td><select id="kubTur_imash_${i}">${['A3', 'A2', 'A1'].map(m => `<option value="${m}" ${(t.idishMashina || 'A3') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></td>
                <td><input type="number" id="kubTur_ibolak_${i}" value="${t.idishBolak || 1}" min="0.5" step="any"></td>
                <td style="text-align:center;"><input type="checkbox" id="kubTur_pechat_${i}" ${t.pechatli ? 'checked' : ''}></td>
                <td><input type="text" id="kubTur_qnomi_${i}" value="${esc(t.qoshimchaNomi)}" placeholder="masalan: Yelim"></td>
                <td><input type="number" id="kubTur_qnarx_${i}" value="${t.qoshimchaNarx || 0}" min="0"></td>
                <td><input type="number" id="kubTur_yigish_${i}" value="${t.yigishNarxi || 0}" min="0"></td>
                <td style="text-align:center;"><input type="radio" name="kubTurDefault" id="kubTur_def_${i}" ${t.isDefault ? 'checked' : ''}></td>
                <td style="text-align:right;"><button class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteKubarikTur(${i})">✕</button></td>
            </tr>
        `).join('');
    }

    // Jadvaldagi (hali saqlanmagan) qiymatlarni o'qib oladi — qator qo'shish/o'chirishda ular yo'qolmasligi uchun
    function collectKubarikTurlarFromUI() {
        return kubarikConfig.turlar.map((t, i) => {
            let q = id => document.getElementById(id);
            if (!q(`kubTur_name_${i}`)) return t;
            return {
                key: t.key || ('kub_' + Date.now().toString(36) + i),
                rasm: t.rasm || '',
                name: q(`kubTur_name_${i}`).value.trim() || `Tur ${i + 1}`,
                paperType: q(`kubTur_paper_${i}`).value,
                gsm: Math.max(1, parseInt(q(`kubTur_gsm_${i}`).value) || 80),
                varaqSoni: Math.max(1, parseInt(q(`kubTur_varaq_${i}`).value) || 1),
                olcham: q(`kubTur_olcham_${i}`).value.trim(),
                ichkiA3: Math.max(0.1, parseFloat(q(`kubTur_ia3_${i}`).value) || 1),
                idish: q(`kubTur_idish_${i}`).checked,
                idishPaperType: q(`kubTur_ipaper_${i}`).value,
                idishGsm: Math.max(1, parseInt(q(`kubTur_igsm_${i}`).value) || 300),
                idishMashina: q(`kubTur_imash_${i}`).value,
                idishBolak: Math.max(0.5, parseFloat(q(`kubTur_ibolak_${i}`).value) || 1),
                pechatli: q(`kubTur_pechat_${i}`).checked,
                qoshimchaNomi: q(`kubTur_qnomi_${i}`).value.trim(),
                qoshimchaNarx: Math.max(0, parseFloat(q(`kubTur_qnarx_${i}`).value) || 0),
                yigishNarxi: Math.max(0, parseFloat(q(`kubTur_yigish_${i}`).value) || 0),
                isDefault: q(`kubTur_def_${i}`).checked
            };
        });
    }

    // Rasm yuklash — jadvaldagi saqlanmagan qiymatlar yo'qolmasin; rasm "Saqlash" bosilganda saqlanadi
    async function kubarikTurRasmi(i, inputEl) {
        if (!inputEl.files || !inputEl.files[0]) return;
        let turlar = collectKubarikTurlarFromUI();
        if (!turlar[i]) return;
        try {
            turlar[i].rasm = await convertBase64(inputEl.files[0]); // rasmni siqadi (va serverga yuboradi)
        } catch (e) {
            showToast("⚠️ Rasmni o'qib bo'lmadi");
            return;
        }
        kubarikConfig.turlar = turlar;
        renderAdminKubarik();
        showToast("📷 Rasm tanlandi — «Kubarik sozlamalarini saqlash» tugmasini bosing");
    }

    function kubarikTurRasmiOchir(i) {
        let turlar = collectKubarikTurlarFromUI();
        if (!turlar[i]) return;
        turlar[i].rasm = '';
        kubarikConfig.turlar = turlar;
        renderAdminKubarik();
    }

    function addKubarikTur() {
        kubarikConfig.turlar = collectKubarikTurlarFromUI();
        kubarikConfig.turlar.push({ key: 'kub_' + Date.now().toString(36), name: 'Yangi tur', paperType: 'Ofset', gsm: 80, varaqSoni: 500, olcham: kubarikConfig.olcham, ichkiA3: 42, idish: true, idishPaperType: 'Karton', idishGsm: 300, idishMashina: 'A3', idishBolak: 1,
            pechatli: true, qoshimchaNomi: '', qoshimchaNarx: 0, yigishNarxi: 3000, isDefault: kubarikConfig.turlar.length === 0 });
        renderAdminKubarik();
    }

    function deleteKubarikTur(i) {
        let turlar = collectKubarikTurlarFromUI();
        if (!turlar[i] || !confirm(`"${turlar[i].name}" turini o'chirmoqchimisiz?`)) return;
        let wasDefault = turlar[i].isDefault;
        turlar.splice(i, 1);
        if (wasDefault && turlar.length > 0) turlar[0].isDefault = true;
        kubarikConfig.turlar = turlar;
        renderAdminKubarik();
    }

    function saveKubarikConfig() {
        let q = id => document.getElementById(id);
        let olcham = q('kubarikOlcham').value.trim();
        if (!olcham) { showToast("⚠️ O'lchamni kiriting!"); return; }
        let turlar = collectKubarikTurlarFromUI();
        if (turlar.length > 0 && !turlar.some(t => t.isDefault)) turlar[0].isDefault = true;
        let lamTurlari = q('kubarikLamTurlari').value.split('\n').map(x => x.trim()).filter(Boolean).map((x, i) => {
            let [nom, ust] = x.split('=');
            nom = (nom || '').trim() || ('Tur ' + (i + 1));
            return { key: 'lam_' + i + '_' + nom.toLowerCase().replace(/[^a-z0-9]+/g, ''), name: nom, ustama: Math.max(0, parseFloat(ust) || 0) };
        });
        kubarikConfig = {
            versiya: 3,
            olcham,
            minAdad: Math.max(1, parseInt(q('kubarikMinAdad').value) || 50),
            idishZapas: Math.max(0, parseInt(q('kubarikIdishZapas').value) || 0),
            laminatsiyaTurlari: lamTurlari,
            a3dagiBolak: Math.max(1, parseInt(q('kubarikA3Bolak').value) || 1),
            zapasVaraq: Math.max(0, parseInt(q('kubarikZapas').value) || 0),
            turlar
        };
        localStorage.setItem('erp_kubarik_config', JSON.stringify(kubarikConfig));
        if (typeof logAudit === 'function') logAudit("Kubarik sozlamalari o'zgartirildi", `${turlar.length} ta tur: ${turlar.map(t => t.name).join(', ')}`);
        renderAdminKubarik();
        showToast("💾 Kubarik sozlamalari saqlandi!");
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('kubarik');
