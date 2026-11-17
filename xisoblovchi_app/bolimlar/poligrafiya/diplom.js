// Poligrafiya bo'limi — Diplom.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== DIPLOM ======================
    // Otkritka kabi Sifravoy usulida: diplomning O'Z qog'oz ro'yxati (admin kiritadi) — varaq o'lchami,
    // pechat maydoni, 1/2 tomonlama varaq narxi (qog'oz + Sifravoy pechat).
    //   Menejer o'lchamni bosadi (A5/A4/A3 — admin ro'yxati) yoki o'zi kiritadi.
    //   Hisob: diplom varaqning pechat maydoniga joylashtiriladi, varaq × (1 yoki 2 tomon narx) + zapas.
    //   + Laminatsiya (ixtiyoriy) — umumiy Pardozlash xizmatlari (SRA3 — A3, katta varaq — A2 narxi), har varaqqa.
    //   + RAMKA (ixtiyoriy) — admin kiritgan modellar katalogi (nomi, rasmi, har o'lcham uchun dona narxi).
    //     Tanlangan model narxi diplom o'lchamiga mos o'lcham bo'yicha olinadi va har bir diplomga qo'shiladi.
    //     O'z (nostandart) o'lcham kiritilsa — diplom sig'adigan eng kichik standart o'lcham narxi olinadi.
    let diplomConfig = {
        zapasVaraq: 3,
        olchamlar: [
            { key: 'a5', nomi: 'A5', eni: 148, boyi: 210 },
            { key: 'a4', nomi: 'A4', eni: 210, boyi: 297 },
            { key: 'a3', nomi: 'A3', eni: 297, boyi: 420 }
        ],
        qogozlar: [
            { id: 'dpq1', name: 'Colotech 300g', q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 4500, price2: 5500 },
            { id: 'dpq2', name: "Dizayn qog'ozi", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 8000, price2: 9500 }
        ],
        // narxlar: { <olcham key>: so'm/dona } — 0 yoki yo'q bo'lsa, model shu o'lchamda mavjud emas
        ramkalar: [
            { id: 'dpr1', nomi: 'Qora ramka', rasm: '', narxlar: { a5: 25000, a4: 35000, a3: 55000 } },
            { id: 'dpr2', nomi: 'Oltin rang ramka', rasm: '', narxlar: { a5: 40000, a4: 55000, a3: 80000 } }
        ]
    };

    let diplomSelected = { qogozId: '', ikkiTomon: false, laminatsiya: false, ramkaId: '' };

    function diplomQogozlar() { return diplomConfig.qogozlar || []; }
    function diplomRamkalar() { return diplomConfig.ramkalar || []; }
    function diplomRamka(id) { return diplomRamkalar().find(r => r.id === id) || null; }

    function diplomOlcham() {
        return { eni: parseFloat(document.getElementById('dpEni')?.value) || 0, boyi: parseFloat(document.getElementById('dpBoyi')?.value) || 0 };
    }

    // Kiritilgan o'lchamga aynan mos yoki uni sig'diradigan eng kichik standart o'lcham (ramka narxi uchun)
    function diplomStandartOlcham(eni, boyi) {
        let [a, b] = [eni, boyi].sort((x, y) => x - y);
        let mos = (diplomConfig.olchamlar || [])
            .filter(o => { let [c, d] = [o.eni, o.boyi].sort((x, y) => x - y); return a <= c && b <= d; })
            .sort((x, y) => x.eni * x.boyi - y.eni * y.boyi);
        return mos[0] || null;
    }
    function diplomOlchamAyniMi(o, eni, boyi) {
        return !!o && ((o.eni === eni && o.boyi === boyi) || (o.eni === boyi && o.boyi === eni));
    }

    function diplomRamkaNarxi(ramka, olcham) {
        if (!ramka || !olcham) return 0;
        return parseFloat((ramka.narxlar || {})[olcham.key]) || 0;
    }

    function diplomRasm(r) {
        return r && r.rasm ? r.rasm : placeholderImg(r ? r.nomi : 'Ramka', 150, 150);
    }

    function buildDiplomForm() {
        let o = (diplomConfig.olchamlar || []).find(x => x.key === 'a4') || (diplomConfig.olchamlar || [])[0];
        let q = diplomQogozlar()[0];
        diplomSelected = { qogozId: q ? q.id : '', ikkiTomon: false, laminatsiya: false, ramkaId: '' };
        return `
            <div class="poli-calc">
                <div class="step-title">1. O'lcham <span class="paket-step-hint">(bosing yoki o'zingiz kiriting)</span></div>
                <div class="options-group" id="dpOlchamGroup"></div>
                <div class="paket-olcham-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Eni <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="dpEni" min="1" value="${o ? o.eni : ''}" oninput="renderDiplomOptions(); calculate()"><span>mm</span></div>
                    </div>
                    <div class="form-group">
                        <label>Bo'yi <span class="majburiy">*</span></label>
                        <div class="input-unit"><input type="number" id="dpBoyi" min="1" value="${o ? o.boyi : ''}" oninput="renderDiplomOptions(); calculate()"><span>mm</span></div>
                    </div>
                </div>
                <div id="dpInfo" class="paket-bichish-info"></div>

                <div class="step-title">2. Qog'oz</div>
                <div class="options-group" id="dpQogozGroup"></div>

                <div class="step-title">3. Pechat <span class="paket-step-hint">(Sifravoy pechat)</span></div>
                <div class="options-group" id="dpPechatGroup"></div>

                <div class="step-title">4. Qo'shimcha xizmatlar</div>
                <div class="options-group" id="dpQoshimchaGroup"></div>
                <div id="dpRamkaTanlangan"></div>

                <div class="form-group poli-qty-group">
                    <label>Adad (dona)</label>
                    <input type="number" id="inpQuantity" value="50" min="1" oninput="calculate()">
                </div>
            </div>
        `;
    }

    function renderDiplomOptions() {
        let olchamGroup = document.getElementById('dpOlchamGroup');
        if (!olchamGroup) return;
        let s = diplomSelected;
        let { eni, boyi } = diplomOlcham();
        olchamGroup.innerHTML = (diplomConfig.olchamlar || []).map(o => `
            <button type="button" class="opt-btn ${diplomOlchamAyniMi(o, eni, boyi) ? 'active' : ''}" onclick="selectDiplomOlcham('${o.key}')">${o.nomi} <small>${o.eni}×${o.boyi}</small></button>
        `).join('') || `<span class="paket-step-hint">O'lcham kiritilmagan — qo'lda kiriting.</span>`;

        let list = diplomQogozlar();
        document.getElementById('dpQogozGroup').innerHTML = list.length === 0
            ? `<span class="paket-xato">⚠️ Diplom qog'ozlari kiritilmagan — Admin → Diplom</span>`
            : list.map(p => `<button type="button" class="opt-btn ${p.id === s.qogozId ? 'active' : ''}" onclick="selectDiplom('qogozId', '${p.id}')">${p.name}</button>`).join('');

        document.getElementById('dpPechatGroup').innerHTML = `
            <button type="button" class="opt-btn ${!s.ikkiTomon ? 'active' : ''}" onclick="selectDiplom('ikkiTomon', false)">Bir tomonlama</button>
            <button type="button" class="opt-btn ${s.ikkiTomon ? 'active' : ''}" onclick="selectDiplom('ikkiTomon', true)">Ikki tomonlama</button>`;

        let ramka = diplomRamka(s.ramkaId);
        document.getElementById('dpQoshimchaGroup').innerHTML = `
            <button type="button" class="opt-btn ${s.laminatsiya ? 'active' : ''}" onclick="selectDiplom('laminatsiya', ${!s.laminatsiya})">🧴 Laminatsiya</button>
            <button type="button" class="opt-btn ${ramka ? 'active' : ''}" onclick="toggleDiplomRamka()">🖼️ Ramka</button>
        `;

        let tanlangan = document.getElementById('dpRamkaTanlangan');
        if (ramka) {
            let st = diplomStandartOlcham(eni, boyi);
            let narx = diplomRamkaNarxi(ramka, st);
            tanlangan.innerHTML = `
                <div class="dp-ramka-tanlangan">
                    <img src="${diplomRasm(ramka)}" alt="">
                    <div class="dp-ramka-tanlangan-matn">
                        <b>${escDiplom(ramka.nomi)}</b>
                        <span>${st ? `${st.nomi}: ${narx > 0 ? narx.toLocaleString('ru-RU') + " so'm/dona" : "bu o'lchamda narx yo'q"}` : "diplom o'lchamiga mos ramka o'lchami yo'q"}</span>
                    </div>
                    <button type="button" class="btn btn-outline" onclick="openDiplomRamkaKatalog()">Almashtirish</button>
                    <button type="button" class="btn btn-outline" title="Ramkani olib tashlash" onclick="selectDiplomRamka('')">✕</button>
                </div>`;
        } else {
            tanlangan.innerHTML = '';
        }
    }

    function escDiplom(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function selectDiplomOlcham(key) {
        let o = (diplomConfig.olchamlar || []).find(x => x.key === key);
        if (!o) return;
        document.getElementById('dpEni').value = o.eni;
        document.getElementById('dpBoyi').value = o.boyi;
        renderDiplomOptions();
        calculate();
    }

    function selectDiplom(field, value) {
        diplomSelected[field] = value;
        renderDiplomOptions();
        calculate();
    }

    // Ramka tugmasi: tanlanmagan bo'lsa — katalog ochiladi, tanlangan bo'lsa — olib tashlanadi
    function toggleDiplomRamka() {
        if (diplomSelected.ramkaId) selectDiplomRamka('');
        else openDiplomRamkaKatalog();
    }

    function selectDiplomRamka(id) {
        diplomSelected.ramkaId = id;
        closeDiplomRamkaKatalog();
        renderDiplomOptions();
        calculate();
    }

    function openDiplomRamkaKatalog() {
        let overlay = document.getElementById('diplomRamkaOverlay');
        let body = document.getElementById('diplomRamkaBody');
        if (!overlay || !body) return;
        let { eni, boyi } = diplomOlcham();
        let st = diplomStandartOlcham(eni, boyi);
        let list = diplomRamkalar();
        document.getElementById('diplomRamkaSarlavha').textContent = st ? `🖼️ Ramka modellari — ${st.nomi}` : '🖼️ Ramka modellari';
        body.innerHTML = list.length === 0
            ? `<div class="poli-gsm-empty">Ramka modellari kiritilmagan — Admin → Diplom → Ramka katalogi.</div>`
            : `<div class="dp-ramka-grid">${list.map(r => {
                let narx = diplomRamkaNarxi(r, st);
                let bor = narx > 0;
                return `
                    <button type="button" class="dp-ramka-card ${r.id === diplomSelected.ramkaId ? 'active' : ''}" ${bor ? `onclick="selectDiplomRamka('${r.id}')"` : 'disabled'}>
                        <img src="${diplomRasm(r)}" alt="">
                        <div class="dp-ramka-nomi">${escDiplom(r.nomi)}</div>
                        <div class="dp-ramka-narx">${bor ? narx.toLocaleString('ru-RU') + " so'm" : (st ? `${st.nomi} o'lchamda yo'q` : "O'lcham mos emas")}</div>
                    </button>`;
            }).join('')}</div>`;
        overlay.classList.add('open');
    }

    function closeDiplomRamkaKatalog() {
        let overlay = document.getElementById('diplomRamkaOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function calculateDiplom(qty) {
        qty = Math.max(parseInt(qty) || 1, 1);
        let s = diplomSelected;
        let info = html => { let el = document.getElementById('dpInfo'); if (el) el.innerHTML = html; };
        let yaroqsiz = xabar => {
            info(`<div class="paket-xato">⚠️ ${xabar}</div>`);
            return { unitPrice: 0, details: `⚠️ ${xabar}`, costItems: [], hisobYaroqsiz: true };
        };

        let { eni, boyi } = diplomOlcham();
        if (!(eni > 0 && boyi > 0)) return yaroqsiz("Diplom eni va bo'yini kiriting — ikkalasi ham majburiy.");
        let qogoz = diplomQogozlar().find(p => p.id === s.qogozId) || diplomQogozlar()[0];
        if (!qogoz) return yaroqsiz("Diplom qog'ozlari kiritilmagan — Admin → Diplom.");
        let r = calculateDigitalPriceForPaper(qogoz, eni, boyi, qty, s.ikkiTomon ? 2 : 1);
        if (!r) return yaroqsiz(`O'lcham ${eni}×${boyi} mm "${qogoz.name}" pechat maydoniga (${qogoz.p_eni}×${qogoz.p_boyi}) sig'maydi.`);

        let costItems = [];
        let jami = 0;
        let qosh = (label, soni, summa) => { jami += summa; costItems.push({ label, qty: soni, total: Math.round(summa) }); };

        // 1) Qog'oz + Sifravoy pechat
        let varaq = r.sheetsNeeded + (parseInt(diplomConfig.zapasVaraq) || 0);
        let varaqNarx = parseFloat(s.ikkiTomon ? qogoz.price2 : qogoz.price1) || 0;
        qosh(`Sifravoy pechat (${qogoz.name}, ${s.ikkiTomon ? 'ikki' : 'bir'} tomonlama)`, `${varaq} varaq × ${varaqNarx.toLocaleString()}`, varaq * varaqNarx);

        // 2) Laminatsiya (ixtiyoriy) — umumiy narx, varaq formatiga qarab
        if (s.laminatsiya) {
            let lamKey = (Math.max(qogoz.q_eni || 0, qogoz.q_boyi || 0) > 460) ? 'a2' : 'a3';
            let lam = parseFloat(ofsetFinishingServices.laminatsiya[lamKey]) || 0;
            qosh(`Laminatsiya (${lamKey.toUpperCase()} narxi)`, `${varaq} varaq`, varaq * lam);
        }

        // 3) Ramka (ixtiyoriy) — katalogdan tanlangan model, diplom o'lchamiga mos narx, har bir diplomga
        let st = diplomStandartOlcham(eni, boyi);
        let ramka = diplomRamka(s.ramkaId);
        if (s.ramkaId && !ramka) { s.ramkaId = ''; }
        if (ramka) {
            if (!st) return yaroqsiz(`${eni}×${boyi} mm diplomga mos ramka o'lchami yo'q — boshqa o'lcham tanlang yoki ramkani olib tashlang.`);
            let narx = diplomRamkaNarxi(ramka, st);
            if (!(narx > 0)) return yaroqsiz(`"${ramka.nomi}" ramkasining ${st.nomi} o'lchamdagi narxi kiritilmagan — boshqa model tanlang.`);
            qosh(`Ramka: ${ramka.nomi} (${st.nomi})`, `${qty} dona × ${narx.toLocaleString()}`, narx * qty);
        }

        info(`<div>📐 <b>${eni}×${boyi} mm</b> → ${qogoz.q_eni}×${qogoz.q_boyi} varaqqa <b>${r.perSheet} dona</b> · ${varaq} varaq (zapas bilan)</div>`);
        let nomi = st && diplomOlchamAyniMi(st, eni, boyi) ? st.nomi : `${eni}×${boyi}mm`;
        let qismlar = [`Diplom ${nomi}`, qogoz.name, s.ikkiTomon ? 'ikki tomonlama' : 'bir tomonlama'];
        if (s.laminatsiya) qismlar.push('laminatsiya');
        if (ramka) qismlar.push(`ramka: ${ramka.nomi}`);
        return { unitPrice: jami / qty, details: qismlar.join(' | '), costItems };
    }

    // ---- Admin: Diplom ----
    function renderAdminDiplom() {
        let q = id => document.getElementById(id);
        if (!q('dpAdminOlchamBody')) return;
        let c = diplomConfig;
        q('dpAdminOlchamBody').innerHTML = c.olchamlar.map((o, i) => `
            <tr>
                <td><input type="text" id="dpO_nomi_${i}" value="${escDiplom(o.nomi)}" placeholder="masalan: A4"></td>
                <td><input type="number" id="dpO_eni_${i}" value="${o.eni}" min="1"></td>
                <td><input type="number" id="dpO_boyi_${i}" value="${o.boyi}" min="1"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteDiplomOlcham(${i})">✕</button></td>
            </tr>`).join('');

        q('dpAdminQogozBody').innerHTML = diplomQogozlar().length === 0
            ? `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha qog'oz yo'q — "+ Qog'oz qo'shish" ni bosing.</td></tr>`
            : diplomQogozlar().map((p, i) => `
            <tr>
                <td><input type="text" id="dpQ_name_${i}" value="${escDiplom(p.name)}" placeholder="masalan: Colotech 300g"></td>
                <td><input type="number" id="dpQ_qeni_${i}" value="${p.q_eni}" min="1"></td>
                <td><input type="number" id="dpQ_qboyi_${i}" value="${p.q_boyi}" min="1"></td>
                <td><input type="number" id="dpQ_peni_${i}" value="${p.p_eni}" min="1"></td>
                <td><input type="number" id="dpQ_pboyi_${i}" value="${p.p_boyi}" min="1"></td>
                <td><input type="number" id="dpQ_p1_${i}" value="${p.price1}" min="0"></td>
                <td><input type="number" id="dpQ_p2_${i}" value="${p.price2}" min="0"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteDiplomQogoz(${i})">✕</button></td>
            </tr>`).join('');

        q('dpAdminRamkalar').innerHTML = diplomRamkalar().length === 0
            ? `<div class="poli-gsm-empty">Hozircha ramka modeli yo'q — "+ Ramka modeli" ni bosing.</div>`
            : diplomRamkalar().map((r, i) => `
            <div class="dp-admin-ramka">
                <label class="dp-admin-ramka-rasm" title="Rasmni almashtirish">
                    <img src="${diplomRasm(r)}" alt="">
                    <input type="file" accept="image/*" onchange="diplomRamkaRasmi(${i}, this)">
                    <span>📷 Rasm</span>
                </label>
                <div class="dp-admin-ramka-maydon">
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="dpR_nomi_${i}" value="${escDiplom(r.nomi)}" placeholder="Model nomi" style="flex:1;">
                        <button type="button" class="btn btn-danger" style="height:36px; padding:0 10px;" title="Modelni o'chirish" onclick="deleteDiplomRamka(${i})">✕</button>
                    </div>
                    <div class="dp-admin-ramka-narxlar">
                        ${c.olchamlar.map(o => `
                            <div class="form-group">
                                <label>${escDiplom(o.nomi)} narxi</label>
                                <div class="input-unit"><input type="number" id="dpR_narx_${i}_${o.key}" value="${parseFloat((r.narxlar || {})[o.key]) || 0}" min="0"><span>so'm</span></div>
                            </div>`).join('')}
                    </div>
                </div>
            </div>`).join('');

        q('dpAdminZapas').value = c.zapasVaraq;
    }

    function collectDiplomFromUI() {
        let q = id => document.getElementById(id);
        if (!q('dpAdminOlchamBody')) return;
        let son = (id, min) => Math.max(min || 0, parseFloat(q(id)?.value) || 0);
        let c = diplomConfig;
        c.olchamlar = c.olchamlar.map((o, i) => q(`dpO_nomi_${i}`) ? {
            key: o.key, nomi: q(`dpO_nomi_${i}`).value.trim() || `O'lcham ${i + 1}`,
            eni: son(`dpO_eni_${i}`), boyi: son(`dpO_boyi_${i}`)
        } : o);
        c.qogozlar = diplomQogozlar().map((p, i) => q(`dpQ_name_${i}`) ? {
            ...p, name: q(`dpQ_name_${i}`).value.trim(),
            q_eni: son(`dpQ_qeni_${i}`), q_boyi: son(`dpQ_qboyi_${i}`),
            p_eni: son(`dpQ_peni_${i}`), p_boyi: son(`dpQ_pboyi_${i}`),
            price1: son(`dpQ_p1_${i}`), price2: son(`dpQ_p2_${i}`)
        } : p);
        c.ramkalar = diplomRamkalar().map((r, i) => {
            if (!q(`dpR_nomi_${i}`)) return r;
            let narxlar = {};
            c.olchamlar.forEach(o => { narxlar[o.key] = son(`dpR_narx_${i}_${o.key}`); });
            return { ...r, nomi: q(`dpR_nomi_${i}`).value.trim(), narxlar };
        });
        c.zapasVaraq = son('dpAdminZapas');
    }

    function addDiplomOlcham() {
        collectDiplomFromUI();
        diplomConfig.olchamlar.push({ key: 'o' + Date.now().toString(36), nomi: 'Yangi', eni: 200, boyi: 300 });
        renderAdminDiplom();
    }

    function deleteDiplomOlcham(i) {
        collectDiplomFromUI();
        let o = diplomConfig.olchamlar[i];
        if (!o || !confirm(`"${o.nomi}" o'lchamini o'chirasizmi? Ramkalarning shu o'lchamdagi narxi ham o'chadi.`)) return;
        diplomConfig.olchamlar.splice(i, 1);
        diplomRamkalar().forEach(r => { if (r.narxlar) delete r.narxlar[o.key]; });
        renderAdminDiplom();
    }

    function addDiplomQogoz() {
        collectDiplomFromUI();
        let oxirgi = diplomQogozlar().slice(-1)[0];
        diplomConfig.qogozlar = diplomQogozlar().concat([{
            id: 'dpq' + Date.now().toString(36), name: '',
            q_eni: oxirgi ? oxirgi.q_eni : 320, q_boyi: oxirgi ? oxirgi.q_boyi : 450,
            p_eni: oxirgi ? oxirgi.p_eni : 310, p_boyi: oxirgi ? oxirgi.p_boyi : 440, price1: 0, price2: 0
        }]);
        renderAdminDiplom();
    }

    function deleteDiplomQogoz(i) {
        collectDiplomFromUI();
        let p = diplomQogozlar()[i];
        if (!p || !confirm(`"${p.name || 'Nomsiz'}" qog'ozini o'chirasizmi?`)) return;
        diplomConfig.qogozlar.splice(i, 1);
        renderAdminDiplom();
    }

    function addDiplomRamka() {
        collectDiplomFromUI();
        diplomConfig.ramkalar = diplomRamkalar().concat([{ id: 'dpr' + Date.now().toString(36), nomi: '', rasm: '', narxlar: {} }]);
        renderAdminDiplom();
    }

    function deleteDiplomRamka(i) {
        collectDiplomFromUI();
        let r = diplomRamkalar()[i];
        if (!r || !confirm(`"${r.nomi || 'Nomsiz'}" ramka modelini o'chirasizmi?`)) return;
        diplomConfig.ramkalar.splice(i, 1);
        renderAdminDiplom();
    }

    async function diplomRamkaRasmi(i, inputEl) {
        if (!inputEl.files || !inputEl.files[0]) return;
        collectDiplomFromUI();
        let r = diplomRamkalar()[i];
        if (!r) return;
        r.rasm = await convertBase64(inputEl.files[0]); // convertBase64 rasmni siqadi
        renderAdminDiplom();
    }

    function saveDiplomConfig() {
        collectDiplomFromUI();
        let c = diplomConfig;
        if (c.olchamlar.length === 0) { showToast("⚠️ Kamida bitta diplom o'lchamini kiriting!"); return; }
        if (c.olchamlar.some(o => !(o.eni > 0 && o.boyi > 0))) { showToast("⚠️ Har bir o'lchamning eni va bo'yi 0 dan katta bo'lishi kerak!"); return; }
        if (c.qogozlar.length === 0) { showToast("⚠️ Kamida bitta diplom qog'ozini kiriting!"); return; }
        if (c.qogozlar.some(p => !p.name || !(p.q_eni > 0 && p.q_boyi > 0 && p.p_eni > 0 && p.p_boyi > 0))) {
            showToast("⚠️ Har bir qog'ozning nomi, varaq va pechat maydoni o'lchami bo'lishi kerak!");
            return;
        }
        if (c.ramkalar.some(r => !r.nomi)) { showToast("⚠️ Har bir ramka modelining nomi bo'lishi kerak!"); return; }
        localStorage.setItem('erp_diplom_config', JSON.stringify(c));
        if (typeof logAudit === 'function') logAudit("Diplom sozlamalari o'zgartirildi",
            `Qog'ozlar: ${c.qogozlar.map(p => `${p.name} ${p.price1}/${p.price2}`).join(', ')}; ramkalar: `
            + c.ramkalar.map(r => `${r.nomi} (${c.olchamlar.map(o => `${o.nomi} ${(r.narxlar || {})[o.key] || 0}`).join(', ')})`).join('; '));
        renderAdminDiplom();
        showToast("💾 Diplom sozlamalari saqlandi!");
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('diplom');
