    // "sra3" (320x450mm) — kichik-format mahsulotlar (Flayer va h.k.) uchun alohida kesilgan
    // varoq narxi. 0 bo'lsa, o'sha qog'oz SRA3 hisob-kitobida hisobga olinmaydi. Dizayn qog'ozi
    // qatorlari real hayotda gsm-raqam emas, balki NOMLANGAN mahsulot (masalan "Colotech-200gr",
    // "Lyon") — shuning uchun ular uchun `label` (matn) maydoni bor, `gsm` faqat eski/ichki
    // moslik uchun saqlanadi (hech qanday hisoblash yo'lida ishlatilmaydi).
    let ofsetRawPapers = [
        { name: "Ofset", gsm: 80, prices: { "sra3": 200, "620x880": 200, "620x940": 0, "700x1000": 0 }, isDefaultOffset: true },
        { name: "Melovka", gsm: 105, prices: { "sra3": 0, "620x880": 915, "620x940": 980, "700x1000": 1175 } },
        { name: "Melovka", gsm: 115, prices: { "sra3": 0, "620x880": 995, "620x940": 1065, "700x1000": 1275 } },
        { name: "Melovka", gsm: 130, prices: { "sra3": 0, "620x880": 1105, "620x940": 1180, "700x1000": 1420 } },
        { name: "Melovka", gsm: 150, prices: { "sra3": 0, "620x880": 1300, "620x940": 1385, "700x1000": 1660 } },
        { name: "Melovka", gsm: 170, prices: { "sra3": 0, "620x880": 1500, "620x940": 1600, "700x1000": 1920 } },
        { name: "Melovka", gsm: 200, prices: { "sra3": 0, "620x880": 1760, "620x940": 1880, "700x1000": 2260 } },
        { name: "Melovka", gsm: 250, prices: { "sra3": 0, "620x880": 2200, "620x940": 2350, "700x1000": 2825 } },
        { name: "Melovka", gsm: 300, prices: { "sra3": 0, "620x880": 2640, "620x940": 2825, "700x1000": 3390 } },
        { name: "Melovka", gsm: 350, prices: { "sra3": 0, "620x880": 3150, "620x940": 3365, "700x1000": 4040 } },
        { name: "Karton", gsm: 190, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 2415 } },
        { name: "Karton", gsm: 210, prices: { "sra3": 0, "620x880": 0, "620x940": 2265, "700x1000": 2625 } },
        { name: "Karton", gsm: 250, prices: { "sra3": 0, "620x880": 0, "620x940": 2590, "700x1000": 3025 } },
        { name: "Karton", gsm: 300, prices: { "sra3": 0, "620x880": 0, "620x940": 3150, "700x1000": 3875 } },
        { name: "Karton", gsm: 325, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 3925 } },
        { name: "Karton", gsm: 350, prices: { "sra3": 0, "620x880": 0, "620x940": 3660, "700x1000": 4225 } },
        { name: "Dizayn qog'ozi", gsm: 120, label: "Colotech-120gr", prices: { "sra3": 1520, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 160, label: "Colotech-160gr", prices: { "sra3": 1945, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 200, label: "Colotech-200gr", prices: { "sra3": 2480, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 250, label: "Colotech-250gr", prices: { "sra3": 3047, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 300, label: "Colotech-300gr", prices: { "sra3": 3840, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 350, label: "Colotech-350gr", prices: { "sra3": 4680, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 0, label: "Lyon", prices: { "sra3": 6000, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 0, label: "Kvarts", prices: { "sra3": 6000, "620x880": 0, "620x940": 0, "700x1000": 0 } },
        { name: "Dizayn qog'ozi", gsm: 0, label: "Samokleyka", prices: { "sra3": 1800, "620x880": 0, "620x940": 0, "700x1000": 0 } }
    ];

    let ofsetMachineSettings = {
        plateA3: 22000, plateA2: 44000, plateA1: 88000,
        printA3Base: 170000, printA3Step: 70000,
        printA2Base: 350000, printA2Step: 80000,
        printA1Base: 1000000, printA1Step: 150000
    };

    // Visochka (osish uchun teshik) va Laminatsiya — Poligrafiya bo'limidagi ko'plab
    // mahsulotlarda (Papka, Doorhanger, Kalendar va h.k.) takrorlanadigan xizmatlar.
    // Narxi endi har bir mahsulotda ALOHIDA kiritilmaydi — bitta umumiy joyda (mashina
    // formati bo'yicha: A3/A2/A1) admin tomonidan kiritiladi, har bir mahsulot esa
    // faqat "yoqilgan/o'chirilgan" belgisiga ega — yoqilgan bo'lsa, shu umumiy narx
    // (mos mashina formatiga qarab) avtomatik hisoblanadi.
    let ofsetFinishingServices = {
        visochka: {
            a3: { firstQty: 1000, firstPrice: 120000, nextPrice: 120 },
            a2: { firstQty: 1000, firstPrice: 200000, nextPrice: 200 },
            a1: { firstQty: 1000, firstPrice: 0, nextPrice: 0 }
        },
        laminatsiya: { a3: 550, a2: 1100, a1: 0 },
        // Lak — pog'onali: birinchi firstQty donagacha qat'iy summa, keyin har donaga (Papka, Paket)
        lak: {
            a3: { firstQty: 1000, firstPrice: 500000, nextPrice: 500 },
            a2: { firstQty: 1000, firstPrice: 750000, nextPrice: 750 },
            a1: { firstQty: 1000, firstPrice: 1000000, nextPrice: 1000 }
        },
        // Tisneniya — har donaga narx + bir martalik klishe (Papka, Paket)
        tisneniya: {
            a3: { pricePerUnit: 1000, klishePrice: 500000 },
            a2: { pricePerUnit: 2000, klishePrice: 1000000 },
            a1: { pricePerUnit: 2000, klishePrice: 1000000 }
        }
    };
    // Lak/Tisneniya umumiy narxlari localStorage'da allaqachon saqlanganmi? (yo'q bo'lsa — Papka'ning
    // eski alohida narxlaridan bir marta ko'chiriladi, poligrafiya.js init() ga qarang)
    let ofsetLakTisSaqlangan = false;

    function renderOfsetFinishingServicesAdmin() {
        let q = id => document.getElementById(id);
        let f = ofsetFinishingServices;
        if (q('finVisochkaA3First')) q('finVisochkaA3First').value = f.visochka.a3.firstPrice;
        if (q('finVisochkaA3Next')) q('finVisochkaA3Next').value = f.visochka.a3.nextPrice;
        if (q('finVisochkaA2First')) q('finVisochkaA2First').value = f.visochka.a2.firstPrice;
        if (q('finVisochkaA2Next')) q('finVisochkaA2Next').value = f.visochka.a2.nextPrice;
        if (q('finVisochkaA1First')) q('finVisochkaA1First').value = f.visochka.a1.firstPrice;
        if (q('finVisochkaA1Next')) q('finVisochkaA1Next').value = f.visochka.a1.nextPrice;
        if (q('finLaminatsiyaA3')) q('finLaminatsiyaA3').value = f.laminatsiya.a3;
        if (q('finLaminatsiyaA2')) q('finLaminatsiyaA2').value = f.laminatsiya.a2;
        if (q('finLaminatsiyaA1')) q('finLaminatsiyaA1').value = f.laminatsiya.a1;
        ['a3', 'a2', 'a1'].forEach(m => {
            let M = m.toUpperCase();
            if (q(`finLak${M}First`)) q(`finLak${M}First`).value = f.lak[m].firstPrice;
            if (q(`finLak${M}Next`)) q(`finLak${M}Next`).value = f.lak[m].nextPrice;
            if (q(`finTis${M}Unit`)) q(`finTis${M}Unit`).value = f.tisneniya[m].pricePerUnit;
            if (q(`finTis${M}Klishe`)) q(`finTis${M}Klishe`).value = f.tisneniya[m].klishePrice;
        });
    }

    function saveOfsetFinishingServices() {
        let son = (id, fallback) => {
            let el = document.getElementById(id);
            let v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fallback : v;
        };
        ofsetFinishingServices.visochka.a3.firstPrice = son('finVisochkaA3First', 0);
        ofsetFinishingServices.visochka.a3.nextPrice = son('finVisochkaA3Next', 0);
        ofsetFinishingServices.visochka.a2.firstPrice = son('finVisochkaA2First', 0);
        ofsetFinishingServices.visochka.a2.nextPrice = son('finVisochkaA2Next', 0);
        ofsetFinishingServices.visochka.a1.firstPrice = son('finVisochkaA1First', 0);
        ofsetFinishingServices.visochka.a1.nextPrice = son('finVisochkaA1Next', 0);
        ofsetFinishingServices.laminatsiya.a3 = son('finLaminatsiyaA3', 0);
        ofsetFinishingServices.laminatsiya.a2 = son('finLaminatsiyaA2', 0);
        ofsetFinishingServices.laminatsiya.a1 = son('finLaminatsiyaA1', 0);
        ['a3', 'a2', 'a1'].forEach(m => {
            let M = m.toUpperCase();
            ofsetFinishingServices.lak[m].firstPrice = son(`finLak${M}First`, 0);
            ofsetFinishingServices.lak[m].nextPrice = son(`finLak${M}Next`, 0);
            ofsetFinishingServices.tisneniya[m].pricePerUnit = son(`finTis${M}Unit`, 0);
            ofsetFinishingServices.tisneniya[m].klishePrice = son(`finTis${M}Klishe`, 0);
        });
        ofsetLakTisSaqlangan = true;
        localStorage.setItem('erp_ofset_finishing_services', JSON.stringify(ofsetFinishingServices));
        if (typeof logAudit === 'function') logAudit("Pardozlash (umumiy) narxlari o'zgartirildi", 'Visochka, Laminatsiya, Lak, Tisneniya');
        showToast("💾 Pardozlash xizmatlari narxlari saqlandi!");
    }

    let selectedOfsetPaperType = 'Ofset';
    let selectedOfsetGsm = 80;
    let selectedOfsetMachine = 'AUTO';
    let printSidesOfset = 1;
    let lastOfsetCalc = null;

    function loadOfsetMachineSettingsToUI() {
        document.getElementById('setPlateA3').value = ofsetMachineSettings.plateA3;
        document.getElementById('setPlateA2').value = ofsetMachineSettings.plateA2;
        document.getElementById('setPlateA1').value = ofsetMachineSettings.plateA1;
        document.getElementById('setPrintA3Base').value = ofsetMachineSettings.printA3Base;
        document.getElementById('setPrintA3Step').value = ofsetMachineSettings.printA3Step;
        document.getElementById('setPrintA2Base').value = ofsetMachineSettings.printA2Base;
        document.getElementById('setPrintA2Step').value = ofsetMachineSettings.printA2Step;
        document.getElementById('setPrintA1Base').value = ofsetMachineSettings.printA1Base;
        document.getElementById('setPrintA1Step').value = ofsetMachineSettings.printA1Step;
    }

    // Admin panelda 4 alohida bo'lim/jadval sifatida ko'rsatiladi (Ofset/Melovka/Karton/Dizayn
    // qog'ozi), lekin ichkarida `ofsetRawPapers` bitta umumiy massiv bo'lib qolaveradi (hisoblash
    // mexanizmi — calculateOfsetForMachine — o'zgarishsiz shu massivdan o'qiydi). Har bir input
    // elementi massivdagi GLOBAL indeksi bilan nomlanadi, shuning uchun qator qaysi bo'lim
    // jadvaliga chizilganidan qat'iy nazar saqlashda to'g'ri elementga mos keladi.
    function renderAdminOfsetPapersMatrix() {
        let sectionBoxes = {
            'Melovka': document.getElementById('adminMelovkaPaperTableBody'),
            'Karton': document.getElementById('adminKartonPaperTableBody'),
            "Dizayn qog'ozi": document.getElementById('adminDizaynPaperTableBody')
        };
        let rowsByType = { Melovka: [], Karton: [], "Dizayn qog'ozi": [] };

        // Melovka/Karton yetkazib beruvchilarida SRA3 (320x450mm) o'lchamli xom varoq umuman
        // sotilmaydi — shu sababli bu ustun faqat Dizayn qog'ozi jadvalida ko'rsatiladi.
        ofsetRawPapers.forEach((item, index) => {
            if (item.name === 'Ofset') return;
            if (!rowsByType[item.name]) rowsByType[item.name] = [];
            let hasSra3Column = (item.name === "Dizayn qog'ozi");
            // Dizayn qog'ozi haqiqiy hayotda gsm-raqam emas, nomlangan mahsulot (masalan
            // "Colotech-200gr", "Lyon") — shu sabab birinchi ustun matn (label), raqam emas.
            let firstCellHtml = hasSra3Column
                ? `<input type="text" id="ofset_mtx_label_${index}" value="${(item.label || '').replace(/"/g, '&quot;')}" placeholder="Nomi">`
                : `<input type="number" id="ofset_mtx_gsm_${index}" value="${item.gsm}">`;
            rowsByType[item.name].push(`
                <tr>
                    <td>${firstCellHtml}</td>
                    ${hasSra3Column ? `<td><input type="number" id="ofset_mtx_psra3_${index}" value="${item.prices['sra3'] || 0}"></td>` : ''}
                    <td><input type="number" id="ofset_mtx_p880_${index}" value="${item.prices['620x880'] || 0}"></td>
                    <td><input type="number" id="ofset_mtx_p940_${index}" value="${item.prices['620x940'] || 0}"></td>
                    <td><input type="number" id="ofset_mtx_p1000_${index}" value="${item.prices['700x1000'] || 0}"></td>
                    <td style="text-align: right;">
                        <div class="action-btns" style="justify-content: flex-end;">
                            <button class="btn btn-danger" title="O'chirish" onclick="deleteOfsetPaperRow(${index})">🗑️</button>
                        </div>
                    </td>
                </tr>
            `);
        });

        Object.keys(sectionBoxes).forEach(type => {
            if (sectionBoxes[type]) sectionBoxes[type].innerHTML = (rowsByType[type] || []).join('');
        });

        let offsetItem = ofsetRawPapers.find(p => p.name === 'Ofset');
        let singlePriceInput = document.getElementById('ofsetSinglePrice');
        if (singlePriceInput && offsetItem) {
            singlePriceInput.value = offsetItem.prices['620x880'] || offsetItem.prices['sra3'] || 0;
        }
    }

    function addOfsetPaperRow(type) {
        let defaults = {
            'Melovka': { gsm: 200, prices: { "sra3": 0, "620x880": 1760, "620x940": 1880, "700x1000": 2260 } },
            'Karton': { gsm: 250, prices: { "sra3": 0, "620x880": 0, "620x940": 2590, "700x1000": 3025 } },
            "Dizayn qog'ozi": { gsm: 0, label: "Yangi qog'oz", prices: { "sra3": 2000, "620x880": 0, "620x940": 0, "700x1000": 0 } }
        };
        let d = defaults[type] || defaults['Melovka'];
        readOfsetQogozNarxlariUI(); // jadvaldagi saqlanmagan o'zgarishlar qator qo'shilganda yo'qolmasin
        let newItem = { name: type, gsm: d.gsm, prices: { ...d.prices } };
        if (d.label !== undefined) newItem.label = d.label;
        ofsetRawPapers.push(newItem);
        renderAdminOfsetPapersMatrix();
    }

    function deleteOfsetPaperRow(index) {
        if (!ofsetRawPapers[index] || ofsetRawPapers[index].name === "Ofset") {
            showToast("⚠️ 'Ofset' qatorini o'chirib bo'lmaydi!");
            return;
        }
        if (confirm("Ushbu qog'oz qatorini o'chirmoqchimisiz?")) {
            readOfsetQogozNarxlariUI();
            ofsetRawPapers.splice(index, 1);
            renderAdminOfsetPapersMatrix();
        }
    }

    // Qog'oz narxlari (Qog'oz bo'limi → "Ofset qog'ozlari"). Mashina sozlamalariga TEGMAYDI —
    // aks holda boshqa ekranda ko'rinmay turgan forma/bosma maydonlari ham saqlanib ketardi.
    // Jadvaldagi (hali saqlanmagan) qiymatlarni ofsetRawPapers ga o'qiydi — saqlash, qator qo'shish va o'chirishda ishlatiladi
    function readOfsetQogozNarxlariUI() {
        ofsetRawPapers.forEach((item, index) => {
            if (item.name === 'Ofset') return;
            let isDizayn = (item.name === "Dizayn qog'ozi");
            // Dizayn qog'ozi qatorida gsm o'rniga matn (Nomi) inputi bor.
            let idField = isDizayn ? document.getElementById(`ofset_mtx_label_${index}`) : document.getElementById(`ofset_mtx_gsm_${index}`);
            if (!idField) return;
            if (isDizayn) item.label = idField.value || item.label || '';
            else item.gsm = parseInt(idField.value) || item.gsm;

            // Melovka/Karton jadvalida SRA3 ustuni yo'q (bu turlarda bunday xom varoq
            // kiritilmaydi) — shu input mavjud bo'lmasa, avvalgi (odatda 0) qiymat saqlanadi.
            let psra3Input = document.getElementById(`ofset_mtx_psra3_${index}`);
            let p880Input = document.getElementById(`ofset_mtx_p880_${index}`);
            let p940Input = document.getElementById(`ofset_mtx_p940_${index}`);
            let p1000Input = document.getElementById(`ofset_mtx_p1000_${index}`);
            item.prices = {
                "sra3": psra3Input ? (parseFloat(psra3Input.value) || 0) : (item.prices['sra3'] || 0),
                "620x880": parseFloat(p880Input.value) || 0,
                "620x940": parseFloat(p940Input.value) || 0,
                "700x1000": parseFloat(p1000Input.value) || 0
            };
        });
    }

    function saveOfsetQogozNarxlari() {
        readOfsetQogozNarxlariUI();

        let offsetItem = ofsetRawPapers.find(p => p.name === 'Ofset');
        let singlePriceInput = document.getElementById('ofsetSinglePrice');
        let singlePrice = singlePriceInput ? (parseFloat(singlePriceInput.value) || 0) : 0;
        if (offsetItem) {
            // Bitta admin narxi ichkarida ikkita eski kalitga (sra3 va 620x880) bir xil qiymat
            // bilan ko'chiriladi — shu orqali hisoblash mexanizmi qaysi xom-varoq formatini
            // so'rasa ham (kichik-format SRA3 yoki A3/A2 uchun 620x880) narx topiladi.
            offsetItem.prices['sra3'] = singlePrice;
            offsetItem.prices['620x880'] = singlePrice;
        } else {
            ofsetRawPapers.unshift({ name: "Ofset", gsm: 80, prices: { "sra3": singlePrice, "620x880": singlePrice, "620x940": 0, "700x1000": 0 }, isDefaultOffset: true });
        }

        localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
        if (typeof logAudit === 'function') logAudit("Ofset qog'oz narxlari o'zgartirildi", `${ofsetRawPapers.length} ta qog'oz qatori`);
        renderAdminOfsetPapersMatrix();
        showToast("💾 Qog'oz narxlari saqlandi!");
    }

    // Ofset mashina sozlamalari (forma va bosma narxi) — Ofset pechat admin bo'limi
    function saveOfsetMashinaSozlamalari() {
        ofsetMachineSettings = {
            plateA3: parseFloat(document.getElementById('setPlateA3').value) || 0,
            plateA2: parseFloat(document.getElementById('setPlateA2').value) || 0,
            plateA1: parseFloat(document.getElementById('setPlateA1').value) || 0,
            printA3Base: parseFloat(document.getElementById('setPrintA3Base').value) || 0,
            printA3Step: parseFloat(document.getElementById('setPrintA3Step').value) || 0,
            printA2Base: parseFloat(document.getElementById('setPrintA2Base').value) || 0,
            printA2Step: parseFloat(document.getElementById('setPrintA2Step').value) || 0,
            printA1Base: parseFloat(document.getElementById('setPrintA1Base').value) || 0,
            printA1Step: parseFloat(document.getElementById('setPrintA1Step').value) || 0
        };
        localStorage.setItem('erp_ofset_machine_settings', JSON.stringify(ofsetMachineSettings));
        if (typeof logAudit === 'function') logAudit("Ofset forma/bosma narxlari o'zgartirildi", '');
        loadOfsetMachineSettingsToUI();
        showToast("💾 Forma va bosma narxlari saqlandi!");
    }

    function renderOfsetPublicTable() {
        let tbody = document.getElementById('ofsetPublicTableBody');
        if (!tbody) return;
        tbody.innerHTML = ofsetRawPapers.map(item => `
            <tr>
                <td style="font-weight:600;">${item.name} ${item.gsm}g</td>
                <td>${(item.prices['sra3'] || 0).toLocaleString()} so'm</td>
                <td>${(item.prices['620x880'] || 0).toLocaleString()} so'm</td>
                <td>${(item.prices['620x940'] || 0).toLocaleString()} so'm</td>
                <td>${(item.prices['700x1000'] || 0).toLocaleString()} so'm</td>
            </tr>
        `).join('');
    }

    function renderOfsetPaperTypeChips() {
        let group = document.getElementById('ofsetPaperTypeGroup');
        if (!group) return;
        let uniqueTypes = ["Ofset", ...new Set(ofsetRawPapers.filter(p => p.name !== "Ofset").map(p => p.name))];
        group.innerHTML = uniqueTypes.map(typeName => `
            <button class="opt-btn ${typeName === selectedOfsetPaperType ? 'active' : ''}" onclick="setOfsetPaperType('${typeName}')">${typeName}</button>
        `).join('');
    }

    function renderOfsetGsmChips() {
        let group = document.getElementById('ofsetGsmGroup');
        if (!group) return;
        let filtered = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
        let uniqueGsms = [...new Set(filtered.map(p => p.gsm))].sort((a, b) => a - b);
        group.innerHTML = uniqueGsms.map(gsm => `
            <button class="opt-btn ${gsm === selectedOfsetGsm ? 'active' : ''}" onclick="setOfsetGsm(${gsm})">${gsm}g</button>
        `).join('');
    }

    function setOfsetPaperType(typeName) {
        selectedOfsetPaperType = typeName;
        let filtered = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
        if (filtered.length > 0) selectedOfsetGsm = filtered[0].gsm;
        renderOfsetPaperTypeChips();
        renderOfsetGsmChips();
        calculate();
    }

    function setOfsetGsm(gsm) {
        selectedOfsetGsm = gsm;
        renderOfsetGsmChips();
        calculate();
    }

    function setOfsetMachineMode(mode, btnEl) {
        selectedOfsetMachine = mode;
        document.querySelectorAll('#ofsetMachineGroup button').forEach(btn => btn.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        calculate();
    }

    function onOfsetCustomSize() {
        document.querySelectorAll('#standardOfsetSizeGroup button').forEach(btn => btn.classList.remove('active'));
        calculate();
    }

    function setOfsetSize(w, h, btnId) {
        document.getElementById('ofsetWidthX').value = w;
        document.getElementById('ofsetHeightY').value = h;
        
        let sizeBtns = document.querySelectorAll('#standardOfsetSizeGroup button');
        sizeBtns.forEach(btn => {
            if (btn.id === btnId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function setPrintTypeOfset(sides) {
        printSidesOfset = sides;
        let btns = document.querySelectorAll('#printTypeGroupOfset button');
        btns.forEach((btn, idx) => {
            if ((idx + 1) === sides) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function updatePreviewOfset(cols, rows) {
        const previewBox = document.getElementById('previewOfsetBox');
        if (!previewBox) return;
        previewBox.innerHTML = '';
        
        previewBox.style.display = 'grid';
        previewBox.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        previewBox.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        previewBox.style.gap = '3px';
        previewBox.style.padding = '6px';
        previewBox.style.boxSizing = 'border-box';
        
        previewBox.style.width = '100%';
        previewBox.style.maxWidth = '310px';
        previewBox.style.height = '440px';
        previewBox.style.margin = '0 auto';
        previewBox.style.border = '2px dashed #05966e';
        previewBox.style.backgroundColor = '#ecfdf5';
        previewBox.style.borderRadius = '6px';

        let totalItems = cols * rows;
        for (let i = 0; i < totalItems; i++) {
            let div = document.createElement('div');
            div.className = 'preview-item';
            div.textContent = i + 1;
            div.style.background = '#10b981';
            div.style.border = '1px solid #05966e';
            div.style.borderRadius = '3px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.fontSize = '12px';
            div.style.fontWeight = '900';
            div.style.color = '#fff';
            previewBox.appendChild(div);
        }
    }

    function getOfsetWorkingSheets(machName) {
        if (machName === 'SRA3') {
            // Kichik-format, allaqachon kesilgan tayyor varoq — katta bazaviy varoqdan bo'linmaydi.
            return [
                { w: 320, h: 450, rawKey: "sra3", divisor: 1 }
            ];
        } else if (machName === 'A3') {
            return [
                { w: 297, h: 420, rawKey: "620x880", divisor: 4 },
                { w: 310, h: 440, rawKey: "620x880", divisor: 4 },
                { w: 310, h: 470, rawKey: "620x940", divisor: 4 },
                { w: 350, h: 500, rawKey: "700x1000", divisor: 4 }
            ];
        } else if (machName === 'A2') {
            return [
                { w: 620, h: 440, rawKey: "620x880", divisor: 2 },
                { w: 620, h: 470, rawKey: "620x940", divisor: 2 },
                { w: 500, h: 700, rawKey: "700x1000", divisor: 2 }
            ];
        } else if (machName === 'A1') {
            return [
                { w: 620, h: 880, rawKey: "620x880", divisor: 1 },
                { w: 620, h: 940, rawKey: "620x940", divisor: 1 },
                { w: 700, h: 1000, rawKey: "700x1000", divisor: 1 }
            ];
        }
        return [];
    }

    function calculateOfsetGridFitting(usableW, usableH, reqW, reqH) {
        const EPS = 1e-6;
        let effectiveW = reqW + 2;
        let effectiveH = reqH + 2;

        let cols1 = Math.floor((usableW + 2) / effectiveW + EPS);
        let rows1 = Math.floor((usableH + 2) / effectiveH + EPS);
        let count1 = (cols1 > 0 && rows1 > 0) ? (cols1 * rows1) : 0;

        let cols2 = Math.floor((usableW + 2) / (reqH + 2) + EPS);
        let rows2 = Math.floor((usableH + 2) / (reqW + 2) + EPS);
        let count2 = (cols2 > 0 && rows2 > 0) ? (cols2 * rows2) : 0;

        if (count2 > count1) {
            return { cols: cols2, rows: rows2, count: count2, itemW: reqH, itemH: reqW, isRotated: true };
        } else {
            return { cols: cols1, rows: rows1, count: count1, itemW: reqW, itemH: reqH, isRotated: false };
        }
    }

    function calculateOfsetForMachine(machName, w, h, tiraj, side, paperType, gsm, forceChujoy) {
        let bestVariant = null;
        let minPerPieceCost = Infinity;

        let availablePapersForSelection = ofsetRawPapers.filter(p => p.name === paperType && p.gsm === gsm);
        let isOffsetType = (paperType === "Ofset");
        let workingSheets = getOfsetWorkingSheets(machName);

        // SRA3 alohida forma/bosma narxiga ega emas — o'lchami A3ga yaqin bo'lgani uchun
        // A3 mashinasining forma/bosma sozlamalaridan foydalanadi.
        let platePrices = { 'SRA3': ofsetMachineSettings.plateA3, 'A3': ofsetMachineSettings.plateA3, 'A2': ofsetMachineSettings.plateA2, 'A1': ofsetMachineSettings.plateA1 };

        for (let paperObj of availablePapersForSelection) {
            for (let ws of workingSheets) {
                let price = paperObj.prices[ws.rawKey];
                if (!price || price <= 0) continue;

                let usableW = ws.w - 10;
                let usableH = ws.h - 10;

                let fit = calculateOfsetGridFitting(usableW, usableH, w, h);
                if (fit.count <= 0) continue;

                let itemsPerSheet = fit.count;
                let totalItemsPerFullBase = itemsPerSheet * ws.divisor;

                let baseSheets = Math.ceil(tiraj / totalItemsPerFullBase);
                // Zaxira (mashina sozlash/kalibrlash uchun ketadigan qog'oz) — doimiy DONA sonini
                // ifodalaydi (masalan 100-200 dona), sahifa emas. 1 varoqqa ko'p mahsulot
                // sig'adigan mayda mahsulotlarda (masalan flayer) bu ozgina qo'shimcha varoq
                // bo'ladi; 1 varoqqa 1 mahsulot sig'adigan yirik mahsulotlarda (masalan A1 banner)
                // eski hisobga teng qoladi.
                let reserveItems = (side === 2) ? 200 : 100;
                let reserveSheets = Math.ceil(reserveItems / totalItemsPerFullBase);
                let totalBaseSheets = baseSheets + reserveSheets;
                let totalPaperCost = totalBaseSheets * price;

                let basePrintCost = 0, stepPrintCost = 0;
                if (machName === 'SRA3' || machName === 'A3') { basePrintCost = ofsetMachineSettings.printA3Base; stepPrintCost = ofsetMachineSettings.printA3Step; }
                else if (machName === 'A2') { basePrintCost = ofsetMachineSettings.printA2Base; stepPrintCost = ofsetMachineSettings.printA2Step; }
                else if (machName === 'A1') { basePrintCost = ofsetMachineSettings.printA1Base; stepPrintCost = ofsetMachineSettings.printA1Step; }

                let oborotType = "STANDART";
                let totalPlates = 4;
                let totalPrintCost = 0;
                // Bosma narxi RAW (xom) varoq soniga emas, mashinaga (A3/A2/A1) yuklanadigan
                // haqiqiy ish varag'i soniga bog'liq — chunki 1 xom varoq bosishdan OLDIN
                // kesilib, `divisor` dona alohida mashina-o'lchamdagi varoqqa aylanadi, va har
                // biri PRESSDAN ALOHIDA o'tadi. Zaxira varoqlar ham shu hisobga kiradi.
                let totalWorkingSheets = totalBaseSheets * ws.divisor;

                if (side === 1) {
                    oborotType = "1_SIDE";
                    totalPlates = 4;
                    let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                    let multiplier = Math.max(0, thousandsUnits - 1);
                    totalPrintCost = basePrintCost + (multiplier * stepPrintCost);
                } else {
                    // forceChujoy — ba'zi mahsulotlarda (masalan Doorhanger, kesim/teshik
                    // joylashuvi tufayli) juft son sig'sa ham, varoqni "aylantirib" (SVOY)
                    // bosib bo'lmaydi — ikkala tomon uchun har doim ALOHIDA forma/bosma
                    // (CHUJOY) kerak bo'ladi. Bu holatda juftlik tekshiruvi o'tkazib yuboriladi.
                    if (!forceChujoy && fit.count >= 2 && fit.count % 2 === 0) {
                        oborotType = "SVOY";
                        totalPlates = 4;
                        let totalImpressions = totalWorkingSheets * 2;
                        let thousandsUnits = Math.ceil(totalImpressions / 1000);
                        let multiplier = Math.max(0, thousandsUnits - 1);
                        totalPrintCost = basePrintCost + (multiplier * stepPrintCost);
                    } else {
                        oborotType = "CHUJOY";
                        totalPlates = 8;
                        let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                        let multiplier = Math.max(0, thousandsUnits - 1);
                        let singlePassCost = basePrintCost + (multiplier * stepPrintCost);
                        totalPrintCost = singlePassCost * 2;
                    }
                }

                let totalPlateCost = totalPlates * platePrices[machName];
                let baseTotalCost = totalPaperCost + totalPlateCost + totalPrintCost;
                let perPieceCostRaw = tiraj > 0 ? (baseTotalCost / tiraj) : 0;

                if (perPieceCostRaw < minPerPieceCost) {
                    minPerPieceCost = perPieceCostRaw;
                    bestVariant = {
                        machine: machName,
                        rawName: isOffsetType ? `${w}x${h} mm (Ofset)` : `${ws.rawKey} mm (${paperObj.name} ${gsm}g) - ${ws.w}x${ws.h}`,
                        workW: ws.w, workH: ws.h,
                        itemsPerSheet, totalSheets: totalBaseSheets,
                        baseTotalCost, perPieceCostRaw,
                        fitData: fit, oborotType, totalPlates,
                        // To'liq hisob-kitob modali uchun — qog'oz/forma/bosma xarajatlarini
                        // alohida-alohida ko'rsatish imkonini beradi. MUHIM: totalSheets — XOM
                        // (katta) varoq soni (shundan qog'oz narxi hisoblanadi), totalWorkingSheets
                        // esa bosishga tayyor, HAQIQIY mashina-o'lchamidagi (A3/A2/A1) varoq soni
                        // (shundan bosma narxi hisoblanadi) — bittasi ikkinchisidan `divisor` marta
                        // katta bo'ladi, ikkalasini bir-biriga aralashtirib bo'lmaydi.
                        paperName: paperObj.name, paperGsm: gsm, pricePerRawSheet: price,
                        totalPaperCost, totalPlateCost, totalPrintCost, totalWorkingSheets
                    };
                }
            }
        }

        return bestVariant;
    }

    // calculateOfsetForMachine — nechta mahsulot bitta ishchi varoqqa sig'ishini GRID
    // (kenglik/balandlik) bo'yicha o'zi hisoblab topadi. Bloknot uchun bu ishlamaydi: usti/osti
    // (Karton) va ichki varoqlar (Ofset 80gr) soni oddiy geometrik joylashtirish emas, balki
    // qat'iy BUKLAMA/TO'PLAM nisbati bilan berilgan (masalan 1 ta A3 list buklanib 8 ta A6
    // ichki bargga aylanadi — bu A3ga necha dona A6 SIG'ISHI emas). Shu sabab, kerakli ISHCHI
    // (A3) varoq soni tashqaridan `workingSheetsNeeded` sifatida hisoblab beriladi, bu funksiya
    // esa faqat qaysi xom (yetkazib beriladigan) qog'oz variantini tanlash va real qog'oz/forma/
    // bosma narxini calculateOfsetForMachine bilan bir xil formulalar asosida hisoblaydi.
    function calculateOfsetJobFixedSheets(machName, tiraj, side, paperType, gsm, workingSheetsNeeded, forceChujoy, faqatXomKey) {
        if (!workingSheetsNeeded || workingSheetsNeeded <= 0) return null;
        let bestVariant = null;
        let minPerPieceCost = Infinity;

        let availablePapersForSelection = ofsetRawPapers.filter(p => p.name === paperType && p.gsm === gsm);
        let workingSheets = getOfsetWorkingSheets(machName);
        if (faqatXomKey) workingSheets = workingSheets.filter(ws => ws.rawKey === faqatXomKey); // masalan Kubarik qutisi: faqat 700x1000 xom varoq (35x50)
        let platePrices = { 'SRA3': ofsetMachineSettings.plateA3, 'A3': ofsetMachineSettings.plateA3, 'A2': ofsetMachineSettings.plateA2, 'A1': ofsetMachineSettings.plateA1 };

        for (let paperObj of availablePapersForSelection) {
            for (let ws of workingSheets) {
                let price = paperObj.prices[ws.rawKey];
                if (!price || price <= 0) continue;

                let totalBaseSheets = Math.ceil(workingSheetsNeeded / ws.divisor);
                let totalWorkingSheets = totalBaseSheets * ws.divisor;
                let totalPaperCost = totalBaseSheets * price;

                let basePrintCost = 0, stepPrintCost = 0;
                if (machName === 'SRA3' || machName === 'A3') { basePrintCost = ofsetMachineSettings.printA3Base; stepPrintCost = ofsetMachineSettings.printA3Step; }
                else if (machName === 'A2') { basePrintCost = ofsetMachineSettings.printA2Base; stepPrintCost = ofsetMachineSettings.printA2Step; }
                else if (machName === 'A1') { basePrintCost = ofsetMachineSettings.printA1Base; stepPrintCost = ofsetMachineSettings.printA1Step; }

                let oborotType, totalPlates, totalPrintCost;
                if (side === 1) {
                    oborotType = "1_SIDE";
                    totalPlates = 4;
                    let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                    let multiplier = Math.max(0, thousandsUnits - 1);
                    totalPrintCost = basePrintCost + (multiplier * stepPrintCost);
                } else {
                    // Old/orqa tomon (yoki usti/osti) matni har xil bo'lgani uchun har doim
                    // CHUJOY (alohida forma/bosma) — forceChujoy shu yerda majburiy qo'llanadi.
                    oborotType = "CHUJOY";
                    totalPlates = 8;
                    let thousandsUnits = Math.ceil(totalWorkingSheets / 1000);
                    let multiplier = Math.max(0, thousandsUnits - 1);
                    let singlePassCost = basePrintCost + (multiplier * stepPrintCost);
                    totalPrintCost = singlePassCost * 2;
                }

                let totalPlateCost = totalPlates * platePrices[machName];
                let baseTotalCost = totalPaperCost + totalPlateCost + totalPrintCost;
                let perPieceCostRaw = tiraj > 0 ? (baseTotalCost / tiraj) : 0;

                if (perPieceCostRaw < minPerPieceCost) {
                    minPerPieceCost = perPieceCostRaw;
                    bestVariant = {
                        machine: machName,
                        rawName: `${ws.rawKey} mm (${paperObj.name} ${gsm}g) - ${ws.w}x${ws.h}`,
                        itemsPerSheet: null, totalSheets: totalBaseSheets,
                        baseTotalCost, perPieceCostRaw,
                        oborotType, totalPlates,
                        paperName: paperObj.name, paperGsm: gsm, pricePerRawSheet: price,
                        totalPaperCost, totalPlateCost, totalPrintCost, totalWorkingSheets
                    };
                }
            }
        }

        return bestVariant;
    }


function generateForm_ofset(type, form, rightCol) {
            form.className = "";
            let parentGrid = document.querySelector('.calc-grid');
            parentGrid.classList.add('calc-grid-teng');

            printSidesOfset = 1;
            selectedOfsetMachine = 'AUTO';

            if (!ofsetRawPapers.some(p => p.name === selectedOfsetPaperType)) {
                selectedOfsetPaperType = ofsetRawPapers.length > 0 ? ofsetRawPapers[0].name : 'Ofset';
            }
            let gsmOptionsInit = ofsetRawPapers.filter(p => p.name === selectedOfsetPaperType);
            if (gsmOptionsInit.length > 0 && !gsmOptionsInit.some(p => p.gsm === selectedOfsetGsm)) {
                selectedOfsetGsm = gsmOptionsInit[0].gsm;
            }

            form.innerHTML = `
                <div class="step-title">Ofset qog'oz turi:</div>
                <div class="options-group" id="ofsetPaperTypeGroup"></div>

                <div class="step-title">Qog'oz zichligi (g/m²):</div>
                <div class="options-group" id="ofsetGsmGroup"></div>

                <div class="step-title">Standart formatlar (tezkor tanlash):</div>
                <div class="options-group" id="standardOfsetSizeGroup">
                    <button class="opt-btn" id="btnOfsetA1" onclick="setOfsetSize(594, 841, 'btnOfsetA1')">A1</button>
                    <button class="opt-btn" id="btnOfsetA2" onclick="setOfsetSize(420, 594, 'btnOfsetA2')">A2</button>
                    <button class="opt-btn active" id="btnOfsetA3" onclick="setOfsetSize(297, 420, 'btnOfsetA3')">A3</button>
                    <button class="opt-btn" id="btnOfsetA4" onclick="setOfsetSize(210, 297, 'btnOfsetA4')">A4</button>
                    <button class="opt-btn" id="btnOfsetA5" onclick="setOfsetSize(148, 210, 'btnOfsetA5')">A5</button>
                    <button class="opt-btn" id="btnOfsetA6" onclick="setOfsetSize(105, 148, 'btnOfsetA6')">A6</button>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Mahsulot eni X (mm):</label>
                        <input type="number" id="ofsetWidthX" value="297" oninput="onOfsetCustomSize()">
                    </div>
                    <div class="form-group">
                        <label>Mahsulot bo'yi Y (mm):</label>
                        <input type="number" id="ofsetHeightY" value="420" oninput="onOfsetCustomSize()">
                    </div>
                </div>

                <div class="step-title">Bosma turi (tomonlari):</div>
                <div class="options-group" id="printTypeGroupOfset" style="display:flex;">
                    <button class="opt-btn active" onclick="setPrintTypeOfset(1)" style="flex:1;">Bir tomonlama</button>
                    <button class="opt-btn" onclick="setPrintTypeOfset(2)" style="flex:1;">Ikki tomonlama</button>
                </div>

                <div class="step-title">Mashina tanlash rejimi:</div>
                <div class="options-group" id="ofsetMachineGroup">
                    <button class="opt-btn active" onclick="setOfsetMachineMode('AUTO', this)">🤖 Avtomatik (Eng arzoni)</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A3', this)">A3 Ofset</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A2', this)">A2 Ofset</button>
                    <button class="opt-btn" onclick="setOfsetMachineMode('A1', this)">A1 Ofset</button>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Tiraj (Miqdori - dona):</label>
                        <input type="number" id="inpQuantity" value="1000" min="1" oninput="calculate()">
                    </div>
                    <div class="form-group">
                        <label>Kompaniya ustama foizi (Marja %):</label>
                        <input type="number" id="ofsetMargin" value="${marjaQiymati('ofsetMargin', 30)}" min="0" oninput="calculate()">
                    </div>
                </div>

                <div id="ofsetRecommendationBanner" style="display:none; background:#eef2ff; border:1.5px solid #c7d2fe; color:#3730a3; padding:12px 14px; border-radius:10px; margin-bottom:16px; font-size:0.82rem; font-weight:600;">
                    <div id="ofsetRecommendationText"></div>
                    <div id="ofsetOborotAlert" style="margin-top:6px;"></div>
                </div>

                <div class="result-box" style="margin-top: 16px;">
                    <div>
                        <h3 style="margin-bottom: 8px; color: var(--text-main); font-size: 0.95rem;">Ofset hisob-kitob natijasi:</h3>
                        <div style="font-size: 0.88rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px;">
                            <div id="resOfsetMachine">Tanlangan ofset: -</div>
                            <div id="resOfsetRawFormat">Qog'oz formati: -</div>
                            <div id="resOfsetSheetInfo">1 ta bosma qog'ozga sig'adigan mahsulot: 0 dona</div>
                            <div id="resOfsetTotalSheets">Jami kerakli qog'oz: 0 ta</div>
                            <div id="resOfsetFormsCount">Forma (Klishe/Plastina) soni: 0 ta</div>
                            <div id="resOfsetBaseCost">Asosiy tannarx: 0 so'm</div>
                            <div id="resOfsetTotal" style="font-weight: 700; color: var(--primary); margin-top: 4px;">Umumiy narx: 0 so'm</div>
                        </div>
                        <div class="table-card" style="margin-top: 12px; padding: 10px; background: var(--bg-main);">
                            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Mashinalar bo'yicha 1 dona narxi:</div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A3 Ofset:</span><strong id="compOfsetA3">-</strong></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A2 Ofset:</span><strong id="compOfsetA2">-</strong></div>
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>A1 Ofset:</span><strong id="compOfsetA1">-</strong></div>
                        </div>
                    </div>
                    <div style="margin-top: 14px;">
                        <button class="btn" style="width: 100%; height: 36px; font-size: 0.82rem;" onclick="copyResult()">📋 Natijani nusxalash</button>
                    </div>
                </div>
            `;

            rightCol.className = "";
            rightCol.style.display = "block";
            rightCol.innerHTML = `
                <div class="step-title" style="margin-top:0;">Qog'ozdagi joylashuvi (5mm otstup, 2mm oraliq):</div>
                <div id="previewOfsetBox" style="width: 100%; height: 350px; border: 2px dashed #05966e; background: #ecfdf5; border-radius: 8px; display: grid; gap: 4px; padding: 6px; box-sizing: border-box; overflow: hidden;"></div>
            `;

            let tableContainerId = document.getElementById('ofsetTableContainer');
            if (!tableContainerId) {
                let tableDiv = document.createElement('div');
                tableDiv.id = 'ofsetTableContainer';
                tableDiv.style.marginTop = "30px";
                tableDiv.innerHTML = `
                    <div class="section-title">Ofset xom ashyo (qog'oz) narxlar matrixi</div>
                    <div class="table-card">
                        <div class="table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Qog'oz turi / Grammi</th>
                                    <th style="width: 150px;">SRA3 320x450</th>
                                    <th style="width: 150px;">620x880</th>
                                    <th style="width: 150px;">620x940</th>
                                    <th style="width: 150px;">700x1000</th>
                                </tr>
                            </thead>
                            <tbody id="ofsetPublicTableBody"></tbody>
                        </table>
                        </div>
                    </div>
                `;
                document.getElementById('calcScreen').appendChild(tableDiv);
            } else {
                tableContainerId.style.display = 'block';
            }
            renderOfsetPublicTable();
            renderOfsetPaperTypeChips();
            renderOfsetGsmChips();

            calculate();
            return;
}

function calculate_ofset() {
    let qty = parseInt(document.getElementById('inpQuantity')?.value) || 1;
            let w = parseFloat(document.getElementById('ofsetWidthX')?.value) || 0;
            let h = parseFloat(document.getElementById('ofsetHeightY')?.value) || 0;
            let tiraj = qty;
            let marginPercent = marjaOl('ofsetMargin', 30);

            if (w <= 0 || h <= 0) return;

            let resA3 = calculateOfsetForMachine('A3', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);
            let resA2 = calculateOfsetForMachine('A2', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);
            let resA1 = calculateOfsetForMachine('A1', w, h, tiraj, printSidesOfset, selectedOfsetPaperType, selectedOfsetGsm);

            let compA3El = document.getElementById('compOfsetA3');
            let compA2El = document.getElementById('compOfsetA2');
            let compA1El = document.getElementById('compOfsetA1');
            if (compA3El) compA3El.innerHTML = resA3 ? (Math.round(resA3.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';
            if (compA2El) compA2El.innerHTML = resA2 ? (Math.round(resA2.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';
            if (compA1El) compA1El.innerHTML = resA1 ? (Math.round(resA1.perPieceCostRaw * (1 + marginPercent / 100)).toLocaleString() + " so'm") : '<span style="color:#e31c79;">Sig\'maydi</span>';

            let validResults = [resA3, resA2, resA1].filter(Boolean);
            let activeRes = null;
            let banner = document.getElementById('ofsetRecommendationBanner');
            let recText = document.getElementById('ofsetRecommendationText');
            let oborotAlert = document.getElementById('ofsetOborotAlert');

            if (selectedOfsetMachine === 'AUTO') {
                if (validResults.length > 0) {
                    validResults.sort((a, b) => a.perPieceCostRaw - b.perPieceCostRaw);
                    activeRes = validResults[0];
                    if (recText) recText.innerText = `💡 Eng tejamkor: [${activeRes.machine} Ofset (${activeRes.workW}x${activeRes.workH})] formatidagi qog'ozga chop etish tavsiya etiladi.`;
                }
            } else {
                if (selectedOfsetMachine === 'A3') activeRes = resA3;
                if (selectedOfsetMachine === 'A2') activeRes = resA2;
                if (selectedOfsetMachine === 'A1') activeRes = resA1;
                if (recText) recText.innerText = `Tanlangan rejim: [${selectedOfsetMachine} Ofset]`;
            }

            if (!activeRes) {
                if (banner) banner.style.display = 'block';
                if (recText) recText.innerText = "⚠️ Bu mahsulot o'lchami tanlangan mashinaga sig'maydi yoki bu gramajda mos xom ashyo topilmadi!";
                if (oborotAlert) oborotAlert.innerHTML = '';
                document.getElementById('resOfsetMachine').innerText = `Tanlangan ofset: -`;
                document.getElementById('resOfsetRawFormat').innerText = `Qog'oz formati: -`;
                document.getElementById('resOfsetSheetInfo').innerText = `1 ta bosma qog'ozga sig'adigan mahsulot: 0 dona`;
                document.getElementById('resOfsetTotalSheets').innerText = `Jami kerakli qog'oz: 0 ta`;
                document.getElementById('resOfsetFormsCount').innerText = `Forma (Klishe/Plastina) soni: 0 ta`;
                document.getElementById('resOfsetBaseCost').innerText = `Asosiy tannarx: 0 so'm`;
                document.getElementById('resOfsetTotal').innerText = `Umumiy narx: 0 so'm`;
                let previewBox = document.getElementById('previewOfsetBox');
                if (previewBox) previewBox.innerHTML = '<span style="color:#e31c79; font-weight:700; font-size:0.8rem; text-align:center; padding: 20px;">Bu o\'lcham tanlangan mashinaga sig\'maydi!</span>';
                currentCalcResult = { details: "Sig'maydi", qty, unitPrice: 0, totalPrice: 0, name: "Ofset Pechat", imageUrl: '' };
                return;
            }

            if (banner) banner.style.display = 'block';

            if (printSidesOfset === 2) {
                if (activeRes.oborotType === "SVOY") {
                    oborotAlert.innerHTML = `<div style="background:#dcfce7; color:#14532d; border:1px solid #86efac; padding:6px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;">⚠️ Ikki tomonlama <strong>SVOY OBOROT</strong> holatida chop etiladi (1 komplekt forma).</div>`;
                } else {
                    oborotAlert.innerHTML = `<div style="background:#fef2f2; color:#991b1b; border:1px solid #fca5a5; padding:6px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;">⚠️ Ikki tomonlama <strong>CHUJOY OBOROT</strong> holatida chop etiladi (2 komplekt forma).</div>`;
                }
            } else {
                oborotAlert.innerHTML = `<div style="font-size:0.76rem; color:var(--text-muted);">ℹ️ Bir tomonlama standart chop etish rejimi.</div>`;
            }

            // Umumiy Taxi (umumiy/yordamchi.js) — buyurtmaga bir marta, marja bilan
            let grandTotal = Math.round(activeRes.baseTotalCost * (1 + marginPercent / 100)) + taxiMarjaBilan(marginPercent);
            let unitPrice = tiraj > 0 ? Math.round(grandTotal / tiraj) : 0;

            details = `${activeRes.rawName} | (${w}x${h}mm) | ${printSidesOfset === 1 ? 'Bir tomonlama' : 'Ikki tomonlama'} [${activeRes.machine}]`;
            if (taxiNarxi > 0) details += ` | Taxi (bir martalik): ${taxiNarxi.toLocaleString()} so'm`;
            previewNameText = "Ofset Pechat";

            updatePreviewOfset(activeRes.fitData.cols, activeRes.fitData.rows);

            document.getElementById('resOfsetMachine').innerText = `Tanlangan ofset: ${activeRes.machine} (${activeRes.workW}x${activeRes.workH})`;
            document.getElementById('resOfsetRawFormat').innerText = `Qog'oz formati: ${activeRes.rawName}`;
            document.getElementById('resOfsetSheetInfo').innerText = `1 ta bosma qog'ozga sig'adigan mahsulot: ${activeRes.itemsPerSheet} dona`;
            document.getElementById('resOfsetTotalSheets').innerText = `Jami kerakli qog'oz: ${activeRes.totalSheets} ta`;
            document.getElementById('resOfsetFormsCount').innerText = `Forma (Klishe/Plastina) soni: ${activeRes.totalPlates} ta (${activeRes.totalPlates / 4} kamplekt)`;
            document.getElementById('resOfsetBaseCost').innerText = `Asosiy tannarx: ${Math.round(activeRes.baseTotalCost).toLocaleString()} so'm`;
            document.getElementById('resOfsetTotal').innerText = `Umumiy narx: ${grandTotal.toLocaleString()} so'm` + (taxiNarxi > 0 ? ' (taxi bilan)' : '');

            currentCalcResult = { details, qty, unitPrice, totalPrice: grandTotal, name: previewNameText, imageUrl: '', marginPercent };
            return;
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('ofset', {
        init: function () {
            // Bir martalik migratsiya: kod ichidagi standart (v2, real narxlar bilan to'ldirilgan)
            // ofsetRawPapers ro'yxatini oldin saqlab qo'yamiz — pastda, agar admin hali bu yangi
            // bazani ko'rmagan bo'lsa (localStorage'da eski/bo'sh ma'lumot bo'lsa), shu bilan
            // to'liq almashtiramiz. Bitta marta ishlaydigan bayroq bilan himoyalangan — shundan
            // keyin admin kiritgan har qanday o'zgarish doim ustun turadi.
            let ofsetRawPapersDefaultsV2 = ofsetRawPapers;

            let savedOfsetRawPapers = localStorage.getItem('erp_ofset_raw_papers');
            if (savedOfsetRawPapers) {
                ofsetRawPapers = JSON.parse(savedOfsetRawPapers);
            }
            if (!localStorage.getItem('erp_ofset_papers_v2_seeded')) {
                ofsetRawPapers = ofsetRawPapersDefaultsV2;
                localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
                localStorage.setItem('erp_ofset_papers_v2_seeded', '1');
            }

            let savedOfsetMachineSettings = localStorage.getItem('erp_ofset_machine_settings');
            if (savedOfsetMachineSettings) {
                ofsetMachineSettings = { ...ofsetMachineSettings, ...JSON.parse(savedOfsetMachineSettings) };
            }

            let savedFinishingServices = localStorage.getItem('erp_ofset_finishing_services');
            if (savedFinishingServices) {
                try {
                    let parsed = JSON.parse(savedFinishingServices);
                    if (parsed.visochka) {
                        ['a3', 'a2', 'a1'].forEach(m => {
                            if (parsed.visochka[m]) ofsetFinishingServices.visochka[m] = { ...ofsetFinishingServices.visochka[m], ...parsed.visochka[m] };
                        });
                    }
                    if (parsed.laminatsiya) ofsetFinishingServices.laminatsiya = { ...ofsetFinishingServices.laminatsiya, ...parsed.laminatsiya };
                    ['lak', 'tisneniya'].forEach(xizmat => {
                        if (!parsed[xizmat]) return;
                        ofsetLakTisSaqlangan = true;
                        ['a3', 'a2', 'a1'].forEach(m => {
                            if (parsed[xizmat][m]) ofsetFinishingServices[xizmat][m] = { ...ofsetFinishingServices[xizmat][m], ...parsed[xizmat][m] };
                        });
                    });
                } catch (e) {
                    console.warn('Visochka/Laminatsiya sozlamalarini o\'qishda xato:', e);
                }
            }
        }
    });
