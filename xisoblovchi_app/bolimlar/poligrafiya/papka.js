// Poligrafiya bo'limi — Papka.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    // ====================== PAPKA (poligrafiya, FAQAT ofset, Karton) ======================
    // 4 ta tayyor tur, har biri o'z YOYILGAN (pona qirqilgandan keyingi) o'lchamiga va QAT'IY
    // ofset mashinasiga ega (1,2,3-turlar A3da, 4-tur A2da hisoblanadi — mashina tanlab
    // ko'rilmaydi). Karton grammajini endi menejer o'zi tanlaydi (Ofset bo'limidagi Karton
    // narx bazasidan). Laminatsiya va Visochka — BARCHA turlarga har doim avtomatik qo'shiladi,
    // mijoz/menejerga umuman ko'rsatilmaydi (faqat admin narxini kiritadi, A3/A2 uchun alohida).
    // Visochka narxi tiered: birinchi 1000 donagacha qat'iy summa, undan oshgan har bir donaga
    // qo'shimcha narx. LAK ham xuddi shunday tiered, lekin — Tisneniya kabi — ixtiyoriy va
    // mijoz/menejer tanlaydi (ikkalasi ham bir vaqtda tanlanishi mumkin). "Karmashkali" turida
    // qo'shimcha "karmashka+yig'ish" narxi ham (hiddenFee) mijozga ko'rsatilmasdan avtomatik
    // qo'shiladi. Eng kam buyurtma 100 dona — kam kiritilsa avtomatik 100ga ko'tariladi.
    let papkaConfig = {
        variants: [
            { key: 'a4_karmashkasiz', name: "A4 Karmashkasiz", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 0, isDefault: true },
            { key: 'a4_karmashkalik', name: "A4 Karmashkali", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 1500 },
            { key: 'a4_visochkalik', name: "A4 Visochkali", flatW: 308, flatH: 440, machine: 'A3', hiddenFee: 0 },
            { key: 'a3_visochkalik', name: "A3 Visochkali", flatW: 460, flatH: 680, machine: 'A2', hiddenFee: 0 }
        ],
        paperGsmOptions: [250, 300, 350],
        defaultGsm: 250,
        // Narxi endi "Ofset pechat kalkulyatori" admin bo'limidagi umumiy
        // Visochka/Laminatsiya sozlamasidan (ofsetFinishingServices) olinadi — bu yerda
        // faqat Papka shu xizmatlardan foydalanadimi-yo'qmi belgilanadi.
        laminatsiyaEnabled: true,
        visochkaEnabled: true,
        // Lak va Tisneniya (ixtiyoriy, mijoz/menejer tanlaydi) — narxi umumiy
        // ofsetFinishingServices.lak / .tisneniya dan (Ofset admin → Pardozlash xizmatlari).
        minQty: 100,
        infoText: "Papka Karton qog'ozidan, faqat ofset usulida tayyorlanadi."
    };

    let papkaSelected = { variantIndex: 0, gsm: 250, lak: false, tisneniya: false };

    // Bloknot/Kalendar'dagi bir martalik-to'lov naqshiga o'xshash, lekin "tiered total" shaklida:
    // birinchi `firstQty` donagacha qat'iy `firstPrice`, undan oshgan HAR BIR qo'shimcha donaga
    // `nextPrice` qo'shiladi. Visochka va LAK ikkalasi ham shu formuladan foydalanadi.
    function papkaTieredTotal(qty, tier) {
        if (!tier) return 0;
        let extra = Math.max(0, qty - (tier.firstQty || 0));
        return (tier.firstPrice || 0) + extra * (tier.nextPrice || 0);
    }

    function papkaMachineKey(v) {
        return (v && v.machine === 'A2') ? 'a2' : 'a3';
    }

    function buildPapkaForm() {
        let defIdx = papkaConfig.variants.findIndex(v => v.isDefault);
        papkaSelected = { variantIndex: defIdx >= 0 ? defIdx : 0, gsm: papkaConfig.defaultGsm || papkaConfig.paperGsmOptions[0], lak: false, tisneniya: false };

        return `
            <div class="step-title">Papka turi:</div>
            <div class="options-group" id="papkaVariantGroup"></div>

            <div class="step-title" style="margin-top:16px;">Karton grammaji:</div>
            <div class="options-group" id="papkaGsmGroup"></div>

            <div class="step-title" style="margin-top:16px;">Qo'shimcha ishlov:</div>
            <div class="options-group" id="papkaExtraGroup"></div>

            <div class="form-group" style="margin-top:16px;">
                <label>Adad (dona) — eng kami ${papkaConfig.minQty}:</label>
                <input type="number" id="inpQuantity" value="${papkaConfig.minQty}" min="1" oninput="calculate()">
            </div>
        `;
    }

    function renderPapkaOptions() {
        const variantGroup = document.getElementById('papkaVariantGroup');
        if (!variantGroup) return;

        variantGroup.innerHTML = papkaConfig.variants.map((v, idx) => `
            <button class="opt-btn ${idx === papkaSelected.variantIndex ? 'active' : ''}"
                    onclick="selectPapkaVariant(${idx})">${v.name}</button>
        `).join('');

        const gsmGroup = document.getElementById('papkaGsmGroup');
        if (gsmGroup) {
            gsmGroup.innerHTML = papkaConfig.paperGsmOptions.map(g => `
                <button class="opt-btn ${papkaSelected.gsm === g ? 'active' : ''}" onclick="selectPapkaGsm(${g})">${g}gr</button>
            `).join('');
        }

        // LAK va Tisneniya mustaqil — ikkalasi ham birga tanlanishi mumkin (bloknotdan farqli).
        // Laminatsiya/Visochka/Karmashka+Yig'ish bu yerda umuman ko'rsatilmaydi — ular admin
        // narxi bilan avtomatik qo'shiladi (calculatePapka() ichida).
        document.getElementById('papkaExtraGroup').innerHTML = `
            <button class="opt-btn ${papkaSelected.lak ? 'active' : ''}" onclick="togglePapkaExtra('lak')">✨ LAK</button>
            <button class="opt-btn ${papkaSelected.tisneniya ? 'active' : ''}" onclick="togglePapkaExtra('tisneniya')">🔨 Tisneniya</button>
        `;

        updatePapkaInfo();
    }

    function updatePapkaInfo() {
        const box = document.getElementById('papkaInfoText');
        if (!box) return;
        let v = papkaConfig.variants[papkaSelected.variantIndex] || papkaConfig.variants[0];
        let gsm = papkaSelected.gsm || papkaConfig.defaultGsm;
        let machineKey = papkaMachineKey(v);
        let qatorlar = [];
        if (papkaConfig.infoText) qatorlar.push(papkaConfig.infoText);
        qatorlar.push(`<b>${v.name}</b> yoyilgan o'lchami: ${v.flatW}×${v.flatH} mm`);
        qatorlar.push(`Material: <b>Karton ${gsm}gr</b> | Mashina: <b>${v.machine}</b> | Pechat: <b>faqat Ofset</b>`);
        if (papkaSelected.tisneniya && ofsetFinishingServices.tisneniya[machineKey].klishePrice > 0) {
            qatorlar.push(`Tisneniya klishesi: <b>${ofsetFinishingServices.tisneniya[machineKey].klishePrice.toLocaleString('ru-RU')} so'm</b> (bir martalik, adadga bo'linadi)`);
        }
        let qty = parseInt(document.getElementById('inpQuantity')?.value) || 0;
        if (qty > 0 && qty < papkaConfig.minQty) {
            qatorlar.push(`<span style="color:#dc2626;">⚠️ Eng kam buyurtma — ${papkaConfig.minQty} dona. Narx ${papkaConfig.minQty} dona uchun hisoblanmoqda.</span>`);
        }
        box.innerHTML = qatorlar.join('<br>');
    }

    function selectPapkaVariant(idx) {
        papkaSelected.variantIndex = idx;
        renderPapkaOptions();
        calculate();
    }

    function selectPapkaGsm(g) {
        papkaSelected.gsm = g;
        renderPapkaOptions();
        calculate();
    }

    function togglePapkaExtra(kind) {
        papkaSelected[kind] = !papkaSelected[kind];
        renderPapkaOptions();
        calculate();
    }

    // Real ofset hisobi: yoyilgan o'lcham, tanlangan Karton grammaji bilan, turga QAT'IY
    // biriktirilgan mashinada (A3 yoki A2) hisoblanadi — endi barcha mashinalar sinalmaydi.
    function calculatePapka(qty) {
        let v = papkaConfig.variants[papkaSelected.variantIndex] || papkaConfig.variants[0];
        let effectiveQty = Math.max(parseInt(qty) || 1, papkaConfig.minQty || 1);
        let gsm = papkaSelected.gsm || papkaConfig.defaultGsm;
        let machineKey = papkaMachineKey(v);

        let result = calculateOfsetForMachine(v.machine, v.flatW, v.flatH, effectiveQty, 1, 'Karton', gsm);

        let unit = 0;
        let ofsetInfo = '';
        // To'liq hisob-kitob modali uchun — ushbu buyurtmada NIMA va NECHTA ishlatilgani,
        // hamda har birining tannarxi (marjasiz) alohida-alohida ko'rsatiladi.
        let costItems = [];
        if (result) {
            unit = result.perPieceCostRaw;
            ofsetInfo = ` (${result.machine} mashina, ${result.itemsPerSheet} dona/varoq)`;
            costItems.push({ label: `Qog'oz (${result.paperName} ${result.paperGsm}gr, ${result.rawName})`, qty: `${result.totalSheets} xom varoq`, total: Math.round(result.totalPaperCost) });
            costItems.push({ label: 'Forma (klishe)', qty: `${result.totalPlates} plastina`, total: Math.round(result.totalPlateCost) });
            costItems.push({ label: 'Bosma (pechat)', qty: `${result.totalWorkingSheets} ta ${result.machine} varoq`, total: Math.round(result.totalPrintCost) });
        } else {
            showToast(`⚠️ Karton ${gsm}gr uchun ${v.machine} ofset bazasi topilmadi — admin panelda tekshiring.`);
        }

        // --- Barcha turlarga avtomatik, mijozga ko'rsatilmaydigan xizmatlar — narxi
        // umumiy ofsetFinishingServices'dan (Ofset admin bo'limi) olinadi. ---
        if (papkaConfig.laminatsiyaEnabled) {
            let laminatsiyaPerUnit = ofsetFinishingServices.laminatsiya[machineKey] || 0;
            if (laminatsiyaPerUnit > 0) {
                unit += laminatsiyaPerUnit;
                costItems.push({ label: 'Laminatsiya', qty: `${effectiveQty} dona`, total: Math.round(laminatsiyaPerUnit * effectiveQty) });
            }
        }
        if (papkaConfig.visochkaEnabled) {
            let visochkaTotal = papkaTieredTotal(effectiveQty, ofsetFinishingServices.visochka[machineKey]);
            if (visochkaTotal > 0) {
                unit += visochkaTotal / effectiveQty;
                costItems.push({ label: 'Visochka', qty: `${effectiveQty} dona`, total: Math.round(visochkaTotal) });
            }
        }
        if (v.hiddenFee > 0) {
            unit += v.hiddenFee;
            costItems.push({ label: "Karmashka+Yig'ish", qty: `${effectiveQty} dona`, total: Math.round(v.hiddenFee * effectiveQty) });
        }

        // --- Ixtiyoriy, mijoz/menejer tanlaydigan xizmatlar ---
        if (papkaSelected.lak) {
            let lakTotal = papkaTieredTotal(effectiveQty, ofsetFinishingServices.lak[machineKey]);
            unit += lakTotal / effectiveQty;
            costItems.push({ label: 'LAK', qty: `${effectiveQty} dona`, total: Math.round(lakTotal) });
        }
        if (papkaSelected.tisneniya) {
            let tis = ofsetFinishingServices.tisneniya[machineKey];
            unit += (tis.pricePerUnit || 0);
            if (tis.pricePerUnit > 0) costItems.push({ label: 'Tisneniya', qty: `${effectiveQty} dona`, total: Math.round(tis.pricePerUnit * effectiveQty) });
            if (tis.klishePrice > 0) {
                unit += (tis.klishePrice / effectiveQty);
                costItems.push({ label: 'Tisneniya klishesi (bir martalik)', qty: '1 marta', total: Math.round(tis.klishePrice) });
            }
        }

        let qismlar = [`Papka ${v.name} (${v.flatW}×${v.flatH}mm, Karton ${gsm}gr)${ofsetInfo}`];
        if (papkaSelected.lak) qismlar.push('LAK');
        if (papkaSelected.tisneniya) qismlar.push('Tisneniya + klishe');
        if (effectiveQty !== (parseInt(qty) || 1)) qismlar.push(`eng kam ${papkaConfig.minQty} donaga ko'tarildi`);

        updatePapkaInfo();
        return { unitPrice: unit, details: qismlar.join(' | '), effectiveQty, costItems };
    }

    // --- Papka admin muharriri ---

    function renderAdminPapkaTable() {
        let tbody = document.getElementById('adminPapkaVariantTableBody');
        if (tbody) {
            tbody.innerHTML = papkaConfig.variants.map((v, idx) => `
                <tr>
                    <td>${v.name}</td>
                    <td><input type="number" min="1" value="${v.flatW}" onchange="updatePapkaVariantField(${idx}, 'flatW', this.value)"></td>
                    <td><input type="number" min="1" value="${v.flatH}" onchange="updatePapkaVariantField(${idx}, 'flatH', this.value)"></td>
                    <td style="text-align:center; font-weight:700;">${v.machine}</td>
                    <td><input type="number" min="0" value="${v.hiddenFee || 0}" onchange="updatePapkaVariantField(${idx}, 'hiddenFee', this.value)"></td>
                </tr>
            `).join('');
        }
        let q = id => document.getElementById(id);
        if (q('papkaLaminatsiyaEnabled')) q('papkaLaminatsiyaEnabled').checked = !!papkaConfig.laminatsiyaEnabled;
        if (q('papkaVisochkaEnabled')) q('papkaVisochkaEnabled').checked = !!papkaConfig.visochkaEnabled;
        if (q('papkaMinQty')) q('papkaMinQty').value = papkaConfig.minQty;
    }

    function updatePapkaVariantField(idx, field, value) {
        if (!papkaConfig.variants[idx]) return;
        papkaConfig.variants[idx][field] = parseFloat(value) || 0;
    }

    function savePapkaConfig() {
        let son = (id, fallback) => {
            let el = document.getElementById(id);
            let v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fallback : v;
        };
        let laminatsiyaChk = document.getElementById('papkaLaminatsiyaEnabled');
        let visochkaChk = document.getElementById('papkaVisochkaEnabled');
        papkaConfig.laminatsiyaEnabled = laminatsiyaChk ? laminatsiyaChk.checked : papkaConfig.laminatsiyaEnabled;
        papkaConfig.visochkaEnabled = visochkaChk ? visochkaChk.checked : papkaConfig.visochkaEnabled;
        papkaConfig.minQty = Math.max(1, son('papkaMinQty', 100));
        localStorage.setItem('erp_papka_config', JSON.stringify(papkaConfig));
        if (typeof logAudit === 'function') {
            logAudit("Papka sozlamalari o'zgartirildi", `MOQ: ${papkaConfig.minQty}`);
        }
        showToast("💾 Papka sozlamalari saqlandi!");
    }

    // Eski (yangi A3/A2 + tiered strukturadan OLDINGI) saqlangan papkaConfig'ni yangi shaklga
    // moslashtiradi — eski `lak: {pricePerUnit}` / `tisneniya: {pricePerUnit,klishePrice}` kabi
    // "yassi" obyektlarni yangi standart (a3/a2 ichki kalitli) qiymatlar bilan almashtiradi,
    // aks holda eski saqlangan qiymatlar yangi strukturani "spread" orqali buzib qo'yardi.
    function migratePapkaConfig(saved, defaults) {
        let cfg = JSON.parse(JSON.stringify(defaults));
        if (!saved || typeof saved !== 'object') return cfg;

        if (Array.isArray(saved.variants)) {
            cfg.variants = defaults.variants.map(defV => {
                let sv = saved.variants.find(v => v.key === defV.key);
                if (!sv) return defV;
                return {
                    ...defV,
                    flatW: sv.flatW ?? defV.flatW,
                    flatH: sv.flatH ?? defV.flatH,
                    hiddenFee: (sv.hiddenFee !== undefined) ? sv.hiddenFee : (sv.extraFee !== undefined ? sv.extraFee : defV.hiddenFee)
                };
            });
        }
        if (Array.isArray(saved.paperGsmOptions) && saved.paperGsmOptions.length > 0) cfg.paperGsmOptions = saved.paperGsmOptions;
        if (typeof saved.defaultGsm === 'number') cfg.defaultGsm = saved.defaultGsm;
        // Eski saqlangan ma'lumotda laminatsiya/visochka narxlari alohida bo'lgan bo'lishi
        // mumkin edi — endi ular umumiy ofsetFinishingServices'dan olinadi, shuning uchun
        // bu yerda faqat yoqilgan/o'chirilgan bayrog'i o'qiladi (mavjud bo'lmasa — standart true,
        // ya'ni avvalgi "har doim yoqilgan" xatti-harakat saqlanadi).
        if (typeof saved.laminatsiyaEnabled === 'boolean') cfg.laminatsiyaEnabled = saved.laminatsiyaEnabled;
        if (typeof saved.visochkaEnabled === 'boolean') cfg.visochkaEnabled = saved.visochkaEnabled;
        // Lak/Tisneniya narxlari endi umumiy (ofsetFinishingServices) — eski saqlangan qiymatlar
        // init() da bir marta o'sha yerga ko'chiriladi, bu yerda o'qilmaydi.
        if (typeof saved.minQty === 'number') cfg.minQty = saved.minQty;
        if (typeof saved.infoText === 'string') cfg.infoText = saved.infoText;
        return cfg;
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('papka');
