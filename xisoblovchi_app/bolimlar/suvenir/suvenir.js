    // Chop etish turi menejer tomonidan tanlanmaydigan (faqat ma'lumot sifatida ko'rsatiladigan) turlar
    const printTypeInfoOnly = ['soat'];

    const printTypeSchemes = {
        // UF Pechat / UF DTF Pechat / Gravirovka — har birining narxi alohida, Sifravoy pechat yo'q.
        // Bu sxema quyidagi suvenir turlarida bir xil ishlaydi: Ruchka, Termos, Brelok, Bakal,
        // Suv idishlar, Powerbanklar, Fleshka, Statuetka, Kardxolder.
        statuetka: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        // Plagetkalar — Sifravoy pechat yo'q: faqat UF, UF DTF va Gravirovka
        plagetkalar: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        // Soat — chop etish turi tanlanmaydi, menejerga faqat ma'lumot sifatida ko'rsatiladi
        soat: { uv: 'UF Pechat' },
        zontik: { dtf: 'DTF', gravirovka: 'Vinil pechat' },
        fleshka: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        kardxolder: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        ruchka: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        termos: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        brelok: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        bakal: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        suv_idishlar: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        powerbanklar: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Gravirovka' },
        // Yejidnevnikda uchinchi chop turi "Tisneniya" nomi bilan (ichki kalit sifatida umumiy
        // "gravirovka" ishlatiladi — narxi va bir martalik Klishe to'lovi mustaqil hisoblanadi)
        yejidnevnik: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Tisneniya' },
        // Koja papka va Guvohnoma — Yejidnevnik kabi: Tisneniya tanlansa bir martalik klishe qo'shiladi
        koja_papka: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Tisneniya' },
        guvohnoma: { uv: 'UF Pechat', dtf: 'UF DTF Pechat', gravirovka: 'Tisneniya' }
    };

    // Har bir reklama turi uchun qaysi qo'shimcha xizmatlar tegishli ekanligi
    let pensDatabase = {};
    let selectedPen = null;
    let selectedNaborPrintType = 'uv'; // Naborlar uchun: 'uv' | 'dtf' | 'laser' — tarkibdagi barcha detallar shu turga mos narxni oladi
    let selectedPrintSize = 'small';
    let selectedSide = 1;
    let selectedColor = null;
    let colorChipsState = []; // admin formasida tahrirlanayotgan { name, hex } ranglar ro'yxati
    let selectedLenta = null; // kalkulyatorda tanlangan lenta id
    let lentaChipsState = []; // admin formasida tahrirlanayotgan { id, name, price, image } lentalar ro'yxati (faqat Beyjik uchun)
    let detailsChipsState = []; // admin formasida tahrirlanayotgan nabor tarkibidagi detallar ro'yxati (matn, faqat Naborlar uchun)
    let tierChipsState = []; // admin formasida tahrirlanayotgan miqdor oraliqlari: { from, to, basePrice, printPrices:{uv,sifravoy,dtf,gravirovka} }
    // Joriy boshqarilayotgan mahsulot turida qaysi chop ustunlari ko'rinishini eslab turamiz (oraliq jadvali shu bo'yicha ustun chiqaradi)
    function getDefaultPensDatabase() {
        // Test/namuna maqsadida har bir souvenir bo'limiga 5tadan namuna mahsulot.
        // Narxlar va nomlar shartli (test uchun) — real ishlatishdan oldin admin panelda tahrirlang.
        const samplePalette = [
            { name: "Qora", hex: "#000000" },
            { name: "Oq", hex: "#ffffff" },
            { name: "Qizil", hex: "#e11d48" },
            { name: "Ko'k", hex: "#2563eb" },
            { name: "Yashil", hex: "#16a34a" },
            { name: "Kumush", hex: "#c0c0c0" },
            { name: "Oltin", hex: "#d4af37" }
        ];
        const naborDetailPrintPrices = {
            'Ruchka': { uv: 3000, dtf: 3500, laser: 4000 },
            'Bloknot': { uv: 4000, dtf: 4500, laser: 5000 },
            'Fleshka': { uv: 6000, dtf: 6500, laser: 7000 },
            'Termos': { uv: 5000, dtf: 5500, laser: 6000 },
            'Karxolder': { uv: 2500, dtf: 3000, laser: 3500 },
            'Powerbank': { uv: 7000, dtf: 7500, laser: 8000 }
        };
        const naborDetailSets = [
            ['Ruchka', 'Bloknot', 'Fleshka'],
            ['Ruchka', 'Bloknot', 'Fleshka', 'Termos', 'Karxolder'],
            ['Ruchka', 'Termos'],
            ['Bloknot', 'Fleshka', 'Karxolder'],
            ['Ruchka', 'Bloknot', 'Termos', 'Powerbank']
        ].map(set => set.map(n => ({ name: n, printPrices: naborDetailPrintPrices[n] || { uv: 3000, dtf: 3500, laser: 4000 } })));
        const db = {};
        souvenirKeys.forEach((key, catIdx) => {
            const hasSizes = hasSizesTypes.includes(key);
            const catInfo = allCategories.souvenir.find(c => c.key === key);
            const catName = catInfo ? catInfo.name : key;
            db[key] = [];
            for (let i = 1; i <= 5; i++) {
                let colorCount = 2 + (i % 3); // 2-4 ta rang, namuna uchun
                let colors = [];
                for (let c = 0; c < colorCount; c++) {
                    colors.push({ ...samplePalette[(i + c + catIdx) % samplePalette.length] });
                }
                let sampleBase = 4000 + (i * 1500) + (catIdx * 300);
                // Namuna miqdor oraliqlari: tiraj oshgani sari dona narxi pasayadi.
                // Admin bularni istalgancha o'zgartiradi.
                let sampleTiers = [
                    { from: 1,   to: 10,  mul: 1.00, pMul: 1.00 },
                    { from: 11,  to: 50,  mul: 0.92, pMul: 0.90 },
                    { from: 51,  to: 100, mul: 0.85, pMul: 0.80 },
                    { from: 101, to: 200, mul: 0.79, pMul: 0.72 },
                    { from: 201, to: 500, mul: 0.74, pMul: 0.65 },
                    { from: 501, to: 0,   mul: 0.70, pMul: 0.60 }
                ].map(r => ({
                    from: r.from,
                    to: r.to,
                    basePrice: Math.round(sampleBase * r.mul / 100) * 100,
                    printPrices: {
                        uv: Math.round(5000 * r.pMul / 100) * 100,
                        sifravoy: Math.round(4000 * r.pMul / 100) * 100,
                        dtf: Math.round(5500 * r.pMul / 100) * 100,
                        gravirovka: Math.round(6000 * r.pMul / 100) * 100
                    }
                }));
                db[key].push({
                    id: `${key.toUpperCase()}-00${i}`,
                    name: `${catName} Model ${i}`,
                    basePrice: sampleBase,
                    tiers: sampleTiers,
                    image: placeholderImg(`${catName} ${i}`, 150, 150),
                    allowUv: true,
                    allowSifravoy: key !== 'naborlar',
                    allowDtf: true,
                    allowGravirovka: true,
                    printPrices: { uv: 5000, sifravoy: 4000, dtf: 5500, gravirovka: 6000 },
                    sizes: hasSizes
                        ? { small: 2000 + i * 200, medium: 3500 + i * 300, large: 5000 + i * 400 }
                        : { small: 0, medium: 0, large: 0 },
                    colors: colors,
                    details: key === 'naborlar' ? naborDetailSets[i - 1] : []
                });
            }
        });
        return db;
    }

    function renderAdminPensTable() {
        let tbody = document.getElementById('adminPensTable');
        let tableWrap = document.getElementById('adminPensTableWrap');
        let cardGrid = document.getElementById('adminPensCardGrid');
        let searchWrap = document.getElementById('modelListSearchWrap');
        let countEl = document.getElementById('modelListCount');
        let searchInput = document.getElementById('adminPensSearchInput');
        let isSouvenir = souvenirKeys.includes(currentManagingProduct);
        let currentList = pensDatabase[currentManagingProduct] || [];

        if (!isSouvenir) {
            if (tableWrap) tableWrap.style.display = 'block';
            if (cardGrid) { cardGrid.style.display = 'none'; cardGrid.innerHTML = ''; }
            if (searchWrap) searchWrap.style.display = 'none';
            if (countEl) countEl.textContent = '';
            let basePrice = defaultPrices[currentManagingProduct] || 0;
            let rows = `
                <tr>
                    <td>-</td>
                    <td><strong>STANDART</strong></td>
                    <td style="font-weight:600;">Asosiy Mahsulot Tan Narxi</td>
                    <td style="font-weight:700; color:var(--primary);">${basePrice.toLocaleString()} so'm</td>
                    <td><span class="badge badge-uv">Standart Kalkulyatsiya</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-warning" style="height:32px; padding:0 12px; font-size:0.78rem;" onclick="editBasePrice()">✏️ Narxni O'zgartirish</button>
                        </div>
                    </td>
                </tr>
            `;

            if (reklamaBanTypes.includes(currentManagingProduct)) {
                const extraRows = [
                    { field: 'xalqacha', label: "Xalqacha (dona narxi)" },
                    { field: 'reyka', label: "Reyka (metr narxi)" },
                    { field: 'ploter', label: "Ploter qilish (kv.m narxi)" },
                    { field: 'mantajka', label: "Mantajka yopishtirish (kv.m narxi)", faqat: 'orakal' },
                    { field: 'ustanovka', label: "Ustanovka (bir martalik xizmat narxi)" }
                ].filter(r => !r.faqat || r.faqat === currentManagingProduct);
                rows += extraRows.map(r => `
                    <tr>
                        <td>-</td>
                        <td><strong>QO'SHIMCHA</strong></td>
                        <td style="font-weight:600;">${r.label}</td>
                        <td style="font-weight:700; color:var(--primary);">${(reklamaExtraPrices[r.field] || 0).toLocaleString()} so'm</td>
                        <td><span class="badge badge-uv">Qo'shimcha xizmat</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn btn-warning" style="height:32px; padding:0 12px; font-size:0.78rem;" onclick="editReklamaExtraPrice('${r.field}')">✏️ Narxni O'zgartirish</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }

            tbody.innerHTML = rows;
            return;
        }

        // Suvenir turlari uchun jadval o'rniga kartochka ko'rinishi ishlatiladi — rasm,
        // narx va chop turlari bir qarashda ko'rinadi, ustunlarga siqilmaydi.
        if (tableWrap) tableWrap.style.display = 'none';
        if (cardGrid) cardGrid.style.display = 'grid';

        if (currentList.length === 0) {
            if (searchWrap) searchWrap.style.display = 'none';
            if (countEl) countEl.textContent = '';
            if (cardGrid) cardGrid.innerHTML = `<div class="model-grid-empty">📭 Hozircha ushbu mahsulot bazasiga hech qanday model qo'shilmagan.<br>Yuqoridagi formadan birinchi modelni qo'shing.</div>`;
            return;
        }

        if (searchWrap) searchWrap.style.display = 'flex';
        if (countEl) countEl.textContent = `${currentList.length} ta model`;
        if (searchInput) searchInput.value = '';

        cardGrid.innerHTML = currentList.map((p, idx) => {
            let tl = normalizeTierList(p.tiers);
            let priceHtml;
            if (tl.length === 0) {
                priceHtml = `<div class="model-card-price">${(p.basePrice || 0).toLocaleString()} so'm</div>`;
            } else {
                let min = Math.min(...tl.map(t => t.basePrice > 0 ? t.basePrice : (p.basePrice || 0)));
                let max = Math.max(...tl.map(t => t.basePrice > 0 ? t.basePrice : (p.basePrice || 0)));
                priceHtml = `
                    <div class="model-card-price-row">
                        <div class="model-card-price">${min === max ? min.toLocaleString() : `${max.toLocaleString()} → ${min.toLocaleString()}`} so'm</div>
                        <span class="model-tier-badge">📊 ${tl.length} ta oraliq</span>
                    </div>
                    <div class="model-tier-chips">${tl.map(t => `<span class="model-tier-chip">${tierLabel(t)}</span>`).join('')}</div>
                `;
            }

            let printBadgesHtml;
            if (currentManagingProduct === 'naborlar') {
                printBadgesHtml = `
                    <div class="badge-container">
                        ${p.allowUv !== false ? `<span class="badge badge-uv">UF Pechat</span>` : ''}
                        ${p.allowDtf !== false ? `<span class="badge badge-uv">UF DTF</span>` : ''}
                        ${p.allowGravirovka !== false ? `<span class="badge badge-uv">Gravirovka</span>` : ''}
                    </div>
                `;
            } else {
                // Har bir chop turining narxi mahsulotning o'z sxemasiga (printTypeSchemes) qarab
                // to'g'ri belgi (badge) va nom bilan chiqadi — masalan Ruchkada endi Sifravoy o'rniga
                // UF DTF Pechat va Gravirovka, har birining narxi alohida ko'rsatiladi.
                let scheme = printTypeSchemes[currentManagingProduct];
                let badgeParts = [];
                if (scheme) {
                    if (scheme.uv && p.allowUv) badgeParts.push(`<span class="badge badge-uv">${scheme.uv}: ${tierPriceRangeText(p, 'uv')}</span>`);
                    if (scheme.dtf && p.allowDtf) badgeParts.push(`<span class="badge badge-dtf">${scheme.dtf}: ${tierPriceRangeText(p, 'dtf')}</span>`);
                    if (scheme.gravirovka && p.allowGravirovka) badgeParts.push(`<span class="badge badge-grav">${scheme.gravirovka}: ${tierPriceRangeText(p, 'gravirovka')}</span>`);
                } else {
                    if (p.allowUv) badgeParts.push(`<span class="badge badge-uv">UF: ${tierPriceRangeText(p, 'uv')}</span>`);
                    if (p.allowSifravoy) badgeParts.push(`<span class="badge badge-sifravoy">Sifravoy: ${tierPriceRangeText(p, 'sifravoy')}</span>`);
                }
                printBadgesHtml = `<div class="badge-container">${badgeParts.join('')}</div>`;
            }

            let colorDotsHtml = (p.colors && p.colors.length > 0) ? `
                <div class="model-color-dots">
                    ${p.colors.slice(0, 8).map(c => `<span class="model-color-dot" style="background:${c.hex || '#94a3b8'};" title="${(c.name || '').replace(/"/g, '&quot;')}"></span>`).join('')}
                    ${p.colors.length > 8 ? `<span class="model-color-more">+${p.colors.length - 8}</span>` : ''}
                </div>
            ` : '';

            let detailsHtml = (p.details && p.details.length > 0) ? `
                <div class="detail-tag-list" style="margin-top:6px;">
                    ${p.details.map(d => {
                        let dd = normalizeNaborDetail(d);
                        return `<span class="detail-tag" title="UF Pechat: ${dd.printPrices.uv.toLocaleString()} | UF DTF: ${dd.printPrices.dtf.toLocaleString()} | Gravirovka: ${dd.printPrices.laser.toLocaleString()}">${dd.name}</span>`;
                    }).join('')}
                </div>
            ` : '';

            let searchKey = `${p.id || ''} ${p.name || ''}`.toLowerCase().replace(/"/g, '&quot;');

            return `
                <div class="model-card" data-search="${searchKey}">
                    <div class="model-card-top">
                        <div class="model-card-thumb">
                            <img src="${p.image}" onerror="this.src='${placeholderImg('No Img', 80, 80)}'">
                        </div>
                        <div class="model-card-head">
                            <div class="model-card-name" title="${(p.name || '').replace(/"/g, '&quot;')}">${p.name}</div>
                            <div class="model-card-id">${p.id}</div>
                        </div>
                        <div class="action-btns model-card-actions">
                            <button class="btn btn-warning" title="Tahrirlash" onclick="editPen(${idx})">✏️</button>
                            <button class="btn btn-danger" title="O'chirish" onclick="deletePen(${idx})">🗑️</button>
                        </div>
                    </div>
                    <div class="model-card-body">
                        ${priceHtml}
                        ${printBadgesHtml}
                        ${colorDotsHtml}
                        ${detailsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Model ro'yxatini ID/nomi bo'yicha tez qidirish (faqat kartochka ko'rinishida ishlaydi)
    function filterAdminPensCards() {
        let input = document.getElementById('adminPensSearchInput');
        let cardGrid = document.getElementById('adminPensCardGrid');
        if (!input || !cardGrid) return;
        let q = input.value.trim().toLowerCase();
        let cards = cardGrid.querySelectorAll('.model-card');
        let visibleCount = 0;
        cards.forEach(card => {
            let match = !q || (card.dataset.search || '').includes(q);
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });
        let emptyEl = cardGrid.querySelector('.model-grid-search-empty');
        if (visibleCount === 0 && cards.length > 0) {
            if (!emptyEl) {
                emptyEl = document.createElement('div');
                emptyEl.className = 'model-grid-empty model-grid-search-empty';
                emptyEl.textContent = "🔍 Qidiruvga mos model topilmadi.";
                cardGrid.appendChild(emptyEl);
            }
        } else if (emptyEl) {
            emptyEl.remove();
        }
    }

    // Fayl tanlanganida rasm ko'rinishini (preview) darhol ko'rsatadi
    async function previewPenImage(inputEl) {
        const img = document.getElementById('newPenImagePreview');
        const placeholder = document.getElementById('newPenImagePreviewPlaceholder');
        if (!img || !inputEl.files || !inputEl.files[0]) return;
        let dataUrl = await convertBase64(inputEl.files[0]);
        img.src = dataUrl;
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    }

    // Modelning qo'shimcha rasmlari (asosiy rasmdan tashqari, 12 tagacha) — admin tahrirlash holati
    const PEN_QOSHIMCHA_RASM_MAX = 12;
    let penExtraImagesState = [];

    function renderPenExtraImages() {
        const box = document.getElementById('penExtraImagesList');
        if (!box) return;
        box.innerHTML = penExtraImagesState.map((src, i) => `
            <div class="pen-extra-item">
                <img src="${src}" alt="">
                <button type="button" title="O'chirish" onclick="removePenExtraImage(${i})">✕</button>
            </div>
        `).join('');
    }

    async function addPenExtraImages(inputEl) {
        const files = Array.from(inputEl.files || []);
        for (const f of files) {
            if (penExtraImagesState.length >= PEN_QOSHIMCHA_RASM_MAX) {
                showToast(`⚠️ Qo'shimcha rasm ${PEN_QOSHIMCHA_RASM_MAX} tadan oshmasin.`);
                break;
            }
            try { penExtraImagesState.push(await convertBase64(f)); } catch (e) { /* o'qilmagan rasm o'tkazib yuboriladi */ }
        }
        inputEl.value = '';
        renderPenExtraImages();
    }

    function removePenExtraImage(i) {
        penExtraImagesState.splice(i, 1);
        renderPenExtraImages();
    }

    // Menejer uchun: tanlangan modelning barcha rasmlari (asosiy + qo'shimcha)
    function penGalleryImages(pen) {
        if (!pen) return [];
        const list = [pen.image, ...(Array.isArray(pen.images) ? pen.images : [])].filter(Boolean);
        return list;
    }

    function renderPenGallery() {
        const box = document.getElementById('penGalleryGroup');
        if (!box) return;
        const list = penGalleryImages(selectedPen);
        if (!selectedPen || list.length < 2) { box.style.display = 'none'; box.innerHTML = ''; return; }
        box.style.display = 'flex';
        box.innerHTML = `
            <img class="pen-gallery-main" id="penGalleryMain" src="${list[0]}" alt="${selectedPen.name}" onclick="openPenGalleryZoom(this.src)">
            <div class="pen-gallery-thumbs">
                ${list.map((src, i) => `<img class="${i === 0 ? 'active' : ''}" src="${src}" alt="" onclick="showPenGalleryImage(${i})">`).join('')}
            </div>
        `;
    }

    function showPenGalleryImage(i) {
        const list = penGalleryImages(selectedPen);
        const main = document.getElementById('penGalleryMain');
        if (!main || !list[i]) return;
        main.src = list[i];
        document.querySelectorAll('#penGalleryGroup .pen-gallery-thumbs img').forEach((el, k) => el.classList.toggle('active', k === i));
    }

    function openPenGalleryZoom(src) {
        const ov = document.createElement('div');
        ov.className = 'pen-zoom-overlay';
        ov.onclick = () => ov.remove();
        ov.innerHTML = `<img src="${src}" alt="">`;
        document.body.appendChild(ov);
    }

    function colorNameToHex(name) {
        const map = {
            "qora": "#000000", "oq": "#ffffff", "qizil": "#e11d48", "ko'k": "#2563eb", "kok": "#2563eb",
            "yashil": "#16a34a", "sariq": "#f59e0b", "kumush": "#c0c0c0", "oltin": "#d4af37",
            "pushti": "#ec4899", "binafsha": "#7c3aed", "kulrang": "#6b7280", "jigarrang": "#78350f"
        };
        return map[(name || '').toLowerCase().trim()] || '#94a3b8';
    }

    function normalizeColorEntry(c) {
        if (typeof c === 'string') {
            return { name: c, hex: colorNameToHex(c) };
        }
        return { name: c.name || '', hex: c.hex || '#94a3b8' };
    }

    function normalizeNaborDetail(d) {
        // Eski ma'lumot shakllarini (matn yoki bitta narx) yangi { name, printPrices:{uv,dtf,laser} } shakliga o'giradi
        if (typeof d === 'string') {
            return { name: d, printPrices: { uv: 0, dtf: 0, laser: 0 } };
        }
        if (d && d.printPrices) {
            return { name: d.name || '', printPrices: { uv: d.printPrices.uv || 0, dtf: d.printPrices.dtf || 0, laser: d.printPrices.laser || 0 } };
        }
        // eski { name, price } shakli — narxni UF Pechatga o'tkazamiz
        return { name: (d && d.name) || '', printPrices: { uv: (d && d.price) || 0, dtf: 0, laser: 0 } };
    }

    function renderColorChipsEditor() {
        const container = document.getElementById('colorChipsEditor');
        if (!container) return;
        container.innerHTML = colorChipsState.length > 0
            ? colorChipsState.map((c, idx) => `
                <div class="color-chip-row">
                    <input type="color" value="${c.hex}" oninput="updateColorChip(${idx}, 'hex', this.value)">
                    <input type="text" value="${(c.name || '').replace(/"/g, '&quot;')}" placeholder="Rang nomi" oninput="updateColorChip(${idx}, 'name', this.value)">
                    <button type="button" class="color-chip-remove" onclick="removeColorChip(${idx})" title="O'chirish">×</button>
                </div>
            `).join('')
            : `<span style="color:var(--text-muted); font-size:0.82rem;">Hali rang qo'shilmagan. "+ Rang qo'shish" tugmasini bosing.</span>`;
    }

    function addColorChipRow() {
        const palette = ['#000000', '#ffffff', '#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#c0c0c0'];
        let hex = palette[colorChipsState.length % palette.length];
        colorChipsState.push({ name: '', hex });
        renderColorChipsEditor();
    }

    function updateColorChip(idx, field, value) {
        if (!colorChipsState[idx]) return;
        colorChipsState[idx][field] = value;
    }

    function removeColorChip(idx) {
        colorChipsState.splice(idx, 1);
        renderColorChipsEditor();
    }

    function renderLentaChipsEditor() {
        const container = document.getElementById('lentaChipsEditor');
        if (!container) return;
        container.innerHTML = lentaChipsState.length > 0
            ? lentaChipsState.map((l, idx) => `
                <div class="lenta-chip-row">
                    <img src="${l.image || placeholderImg('Lenta', 150, 150)}" alt="Lenta" onerror="this.src='${placeholderImg('Lenta', 150, 150)}'">
                    <input type="file" accept="image/*" onchange="updateLentaImage(${idx}, this)">
                    <input type="text" value="${(l.name || '').replace(/"/g, '&quot;')}" placeholder="Lenta nomi" oninput="updateLenta(${idx}, 'name', this.value)">
                    <input type="number" value="${l.price || 0}" placeholder="Narxi (so'm)" oninput="updateLenta(${idx}, 'price', this.value)">
                    <button type="button" class="lenta-chip-remove" onclick="removeLentaRow(${idx})">✕ O'chirish</button>
                </div>
            `).join('')
            : `<span style="color:var(--text-muted); font-size:0.82rem;">Hali lenta qo'shilmagan. "+ Lenta qo'shish" tugmasini bosing.</span>`;
    }

    function addLentaRow() {
        lentaChipsState.push({ id: 'LENTA-' + Date.now() + '-' + lentaChipsState.length, name: '', price: 0, image: '' });
        renderLentaChipsEditor();
    }

    function updateLenta(idx, field, value) {
        if (!lentaChipsState[idx]) return;
        lentaChipsState[idx][field] = field === 'price' ? (parseFloat(value) || 0) : value;
    }

    async function updateLentaImage(idx, inputEl) {
        if (!lentaChipsState[idx] || !inputEl.files || !inputEl.files[0]) return;
        lentaChipsState[idx].image = await convertBase64(inputEl.files[0]);
        renderLentaChipsEditor();
    }

    function removeLentaRow(idx) {
        lentaChipsState.splice(idx, 1);
        renderLentaChipsEditor();
    }

    function renderDetailsChipsEditor() {
        const container = document.getElementById('detailsChipsEditor');
        if (!container) return;
        container.innerHTML = detailsChipsState.length > 0
            ? detailsChipsState.map((d, idx) => `
                <div class="detail-chip-row" style="width:220px;">
                    <label>Detal nomi:</label>
                    <input type="text" value="${(d.name || '').replace(/"/g, '&quot;')}" placeholder="Masalan: Ruchka" oninput="updateDetail(${idx}, 'name', this.value)">
                    <label>UF Pechat narxi (so'm):</label>
                    <input type="number" value="${d.printPrices?.uv || 0}" placeholder="0" oninput="updateDetailPrice(${idx}, 'uv', this.value)">
                    <label>UF DTF narxi (so'm):</label>
                    <input type="number" value="${d.printPrices?.dtf || 0}" placeholder="0" oninput="updateDetailPrice(${idx}, 'dtf', this.value)">
                    <label>Gravirovka narxi (so'm):</label>
                    <input type="number" value="${d.printPrices?.laser || 0}" placeholder="0" oninput="updateDetailPrice(${idx}, 'laser', this.value)">
                    <button type="button" class="detail-chip-remove" onclick="removeDetailRow(${idx})">✕ O'chirish</button>
                </div>
            `).join('')
            : `<span style="color:var(--text-muted); font-size:0.82rem;">Hali detal qo'shilmagan. "+ Detal qo'shish" tugmasini bosing.</span>`;
    }

    function addDetailRow() {
        detailsChipsState.push({ name: '', printPrices: { uv: 0, dtf: 0, laser: 0 } });
        renderDetailsChipsEditor();
    }

    function updateDetail(idx, field, value) {
        if (!detailsChipsState[idx]) return;
        detailsChipsState[idx][field] = value;
    }

    function updateDetailPrice(idx, printType, value) {
        if (!detailsChipsState[idx]) return;
        if (!detailsChipsState[idx].printPrices) detailsChipsState[idx].printPrices = { uv: 0, dtf: 0, laser: 0 };
        detailsChipsState[idx].printPrices[printType] = parseFloat(value) || 0;
    }

    function removeDetailRow(idx) {
        detailsChipsState.splice(idx, 1);
        renderDetailsChipsEditor();
    }

    // Kalkulyator shu funksiyadan foydalanadi: modeldan + miqdordan -> amaldagi narxlar
    function resolveSouvenirPrices(pen, qty) {
        let baseFallback = (pen && parseFloat(pen.basePrice)) || 0;
        let printFallback = (pen && pen.printPrices) || {};
        let result = { basePrice: baseFallback, printPrices: { ...printFallback }, tier: null, tiers: [] };

        let list = normalizeTierList(pen && pen.tiers);
        result.tiers = list;
        if (list.length === 0) return result;

        let t = findTierForQty(list, qty);
        if (!t) return result;

        // Jadval mavjud bo'lsa — yagona manba o'sha. Eski qat'iy narxlarga qaytilmaydi.
        result.tier = t;
        result.basePrice = t.basePrice;
        TIER_PRINT_KEYS.forEach(k => { result.printPrices[k] = t.printPrices[k]; });
        return result;
    }

    // Berilgan oraliq uchun bitta dona tannarxi (margin qo'shilmagan holda).
    // Kalkulyator ham, jadval ko'rinishi ham AYNAN shu funksiyadan foydalanadi —
    // shuning uchun jadvaldagi narx bilan hisoblangan narx hech qachon farq qilmaydi.
    function souvenirUnitTotalForTier(pen, tier) {
        if (!pen) return 0;
        let isNaborlar = (activeProductType === 'naborlar');
        let fallbackBase = parseFloat(pen.basePrice) || 0;
        // Oraliq berilgan bo'lsa — narx faqat undan olinadi.
        // Oraliq yo'q (juda eski model) bo'lsagina eski qat'iy narxga qaytamiz.
        let basePrice = tier ? tier.basePrice
                      : (fallbackBase > 0 ? fallbackBase : (defaultPrices[activeProductType] || 1000));

        let printCost = 0;
        if (!isNaborlar) {
            let pp = pen.printPrices || { uv: 5000, sifravoy: 4000 };
            let basePrint = tier ? (tier.printPrices[selectedPrintType] || 0) : (pp[selectedPrintType] || 0);
            let sizeExtra = 0;
            if (hasSizesTypes.includes(activeProductType) && pen.sizes) {
                sizeExtra = pen.sizes[selectedPrintSize] || 0;
            }
            printCost = (basePrint + sizeExtra) * (selectedSide === 2 ? 1.5 : 1);
        }

        let detailsPrintCost = 0;
        if (isNaborlar && pen.details && pen.details.length > 0) {
            detailsPrintCost = pen.details
                .map(normalizeNaborDetail)
                .reduce((sum, d) => sum + (d.printPrices[selectedNaborPrintType] || 0), 0);
        }

        let lentaCost = 0;
        if (selectedLenta && pen.lentas) {
            let l = pen.lentas.find(x => x.id === selectedLenta);
            if (l) lentaCost = l.price || 0;
        }

        return basePrice + printCost + lentaCost + detailsPrintCost;
    }

    // Kalkulyatorda mijozga to'liq jadvalni ko'rsatamiz — qaysi oraliqda turgani ajratib beriladi
    function renderTierPreview(pen, qty, marginPercent) {
        const box = document.getElementById('tierPreviewBox');
        if (!box) return;

        let list = normalizeTierList(pen && pen.tiers);
        if (!pen || list.length === 0) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }

        let active = findTierForQty(list, qty);
        let m = 1 + ((parseFloat(marginPercent) || 0) / 100);

        box.style.display = 'block';
        box.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Miqdor bo'yicha narx jadvali</div>
            <div style="font-size:0.76rem; color:var(--text-muted);">Ko'proq olsangiz — dona narxi arzonlashadi.</div>
            <table class="tier-preview-table">
                <thead><tr><th>Miqdor</th><th style="text-align:right;">Dona narxi</th><th style="text-align:right;">Eng kam miqdorda jami</th></tr></thead>
                <tbody>
                    ${list.map(t => {
                        let unit = Math.round(souvenirUnitTotalForTier(pen, t) * m);
                        let isActive = active && t.from === active.from && t.to === active.to;
                        return `
                            <tr class="${isActive ? 'tier-active' : ''}">
                                <td>${tierLabel(t)}${isActive ? ' ✓' : ''}</td>
                                <td style="text-align:right;">${unit.toLocaleString()} so'm</td>
                                <td style="text-align:right;">${(unit * t.from).toLocaleString()} so'm</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    /* =========================================================================
       TEXTILE: material + pechat o'lchami, ikkalasi ham tirajga bog'liq
       Tuzilma:  textileDatabase[key] = { materials: [...], printSizes: [...] }
       Har bir element: { id, name, tiers: [ {from, to, basePrice} ] }
       Dona narxi = material(tiraj) + old tomon o'lchami(tiraj) + orqa tomon o'lchami(tiraj)
       ========================================================================= */

    function tierPriceRangeText(pen, printKey) {
        let list = normalizeTierList(pen && pen.tiers);
        if (list.length === 0) return ((pen && pen.printPrices && pen.printPrices[printKey]) || 0).toLocaleString();
        let vals = list.map(t => t.printPrices[printKey] || 0);
        let min = Math.min(...vals), max = Math.max(...vals);
        return min === max ? min.toLocaleString() : `${max.toLocaleString()} → ${min.toLocaleString()}`;
    }

    // --- Admin formasidagi jadval muharriri ---

    function visibleTierPrintKeys() {
        return TIER_PRINT_KEYS.filter(k => currentPrintColumns[k]);
    }

    function renderTierEditor() {
        const head = document.getElementById('tierTableHeader');
        const body = document.getElementById('tierTableBody');
        if (!head || !body) return;

        let keys = visibleTierPrintKeys();

        head.innerHTML = `
            <th style="width:90px;">Dan (dona)</th>
            <th style="width:90px;">Gacha</th>
            <th style="width:120px;">Mahsulot narxi</th>
            ${keys.map(k => `<th style="width:110px;">${currentPrintColumns.labels[k]}</th>`).join('')}
            <th style="width:90px;"></th>
        `;

        if (tierChipsState.length === 0) {
            body.innerHTML = `<tr><td colspan="${keys.length + 4}" style="padding:14px 6px; color:#b45309; font-size:0.82rem;">
                Hali oraliq qo'shilmagan. Modelni saqlash uchun kamida bitta oraliq kerak —
                "+ Oraliq qo'shish" yoki "⚡ Namuna oraliqlar" tugmasini bosing.
            </td></tr>`;
            renderTierWarnings();
            return;
        }

        let sortedIdx = tierChipsState
            .map((t, i) => ({ t, i }))
            .sort((a, b) => (parseInt(a.t.from) || 0) - (parseInt(b.t.from) || 0));

        body.innerHTML = sortedIdx.map(({ t, i }) => `
            <tr data-tier-row="${i}">
                <td><input type="number" min="1" value="${parseInt(t.from) || 1}" oninput="updateTier(${i}, 'from', this.value)"></td>
                <td><input type="number" min="0" value="${parseInt(t.to) || 0}" placeholder="∞" oninput="updateTier(${i}, 'to', this.value)"></td>
                <td><input type="number" min="0" value="${parseFloat(t.basePrice) || 0}" oninput="updateTier(${i}, 'basePrice', this.value)"></td>
                ${keys.map(k => `<td><input type="number" min="0" value="${parseFloat(t.printPrices?.[k]) || 0}" oninput="updateTierPrint(${i}, '${k}', this.value)"></td>`).join('')}
                <td><button type="button" class="tier-remove" onclick="removeTierRow(${i})">✕</button></td>
            </tr>
        `).join('');

        renderTierWarnings();
    }

    function renderTierWarnings() {
        const box = document.getElementById('tierWarningBox');
        if (!box) return;
        let msgs = tierValidationMessages(tierChipsState);
        box.innerHTML = msgs.length === 0 ? '' :
            `<div class="tier-warning">⚠️ ${msgs.map(m => `<div>• ${m}</div>`).join('')}</div>`;
    }

    // Yangi qator qo'shganda oxirgi qatordagi narxlarni nusxalaymiz —
    // admin noldan emas, tayyor raqamdan boshlab tahrirlaydi.
    function addTierRow() {
        let sorted = normalizeTierList(tierChipsState);
        let last = sorted.slice(-1)[0];
        let nextFrom = last ? (tierUpper(last) === Infinity ? last.from + 1 : tierUpper(last) + 1) : 1;
        tierChipsState.push({
            from: nextFrom, to: 0,
            basePrice: last ? last.basePrice : 0,
            printPrices: last ? { ...last.printPrices } : { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 }
        });
        renderTierEditor();
    }

    function fillDefaultTiers() {
        if (tierChipsState.length > 0 && !confirm("Mavjud oraliqlar o'chib, o'rniga namuna oraliqlar qo'yiladi. Davom etamizmi?")) return;
        let first = normalizeTierList(tierChipsState)[0];
        let base = first ? first.basePrice : 0;
        let pp = first ? first.printPrices : { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 };
        let ranges = [[1, 3], [4, 10], [11, 20], [21, 50], [51, 100], [101, 0]];
        tierChipsState = ranges.map(([from, to]) => ({
            from, to, basePrice: base, printPrices: { ...pp }
        }));
        renderTierEditor();
        showToast("📊 Namuna oraliqlar qo'yildi — narxlarni to'ldiring!");
    }

    // Eski modellarda (oraliq jadvali paydo bo'lishidan oldin saqlangan) narx
    // bitta qat'iy maydonda edi. Ularni bir martalik "1+ dona" oralig'iga ko'chiramiz,
    // shunda hech qaysi model narxsiz qolib ketmaydi.
    function migrateLegacySouvenirPrices() {
        let changed = false;
        souvenirKeys.forEach(key => {
            let list = pensDatabase[key];
            if (!Array.isArray(list)) return;
            list.forEach(pen => {
                if (!pen || normalizeTierList(pen.tiers).length > 0) return;
                let pp = pen.printPrices || {};
                pen.tiers = [{
                    from: 1, to: 0,
                    basePrice: parseFloat(pen.basePrice) || 0,
                    printPrices: {
                        uv: parseFloat(pp.uv) || 0,
                        sifravoy: parseFloat(pp.sifravoy) || 0,
                        dtf: parseFloat(pp.dtf) || 0,
                        gravirovka: parseFloat(pp.gravirovka) || 0
                    }
                }];
                changed = true;
            });
        });
        if (changed) localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
        return changed;
    }

    // via.placeholder.com xizmati yopilib qolgani uchun avval saqlangan modellar/lentalarda
    // shu manzilga ishora qiluvchi rasm maydonlari endi hech qachon yuklanmaydi (bo'sh quti
    // ko'rinadi). Bir martalik migratsiya bilan ularni mahalliy (hech qachon buzilmaydigan)
    // SVG rasm-o'rnbosarga almashtiramiz.
    function migrateDeadPlaceholderImages() {
        let changed = false;
        souvenirKeys.forEach(key => {
            let list = pensDatabase[key];
            if (!Array.isArray(list)) return;
            list.forEach(pen => {
                if (!pen) return;
                if (typeof pen.image === 'string' && pen.image.includes('via.placeholder.com')) {
                    pen.image = placeholderImg(pen.name || 'Model', 150, 150);
                    changed = true;
                }
                (pen.lentas || []).forEach(l => {
                    if (l && typeof l.image === 'string' && l.image.includes('via.placeholder.com')) {
                        l.image = placeholderImg(l.name || 'Lenta', 150, 150);
                        changed = true;
                    }
                });
            });
        });
        if (changed) localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
        // Bayroqlar rasmlari uchun xuddi shu migratsiya: textile.js → migrateDeadBayroqPlaceholderImages()
        return changed;
    }

    function updateTier(idx, field, value) {
        if (!tierChipsState[idx]) return;
        tierChipsState[idx][field] = (field === 'basePrice') ? (parseFloat(value) || 0) : (parseInt(value) || 0);
        renderTierWarnings();
    }

    function updateTierPrint(idx, key, value) {
        if (!tierChipsState[idx]) return;
        if (!tierChipsState[idx].printPrices) tierChipsState[idx].printPrices = { uv: 0, sifravoy: 0, dtf: 0, gravirovka: 0 };
        tierChipsState[idx].printPrices[key] = parseFloat(value) || 0;
    }

    function removeTierRow(idx) {
        tierChipsState.splice(idx, 1);
        renderTierEditor();
    }

    async function savePen() {
        if (!currentManagingProduct) return;
        if (!pensDatabase[currentManagingProduct]) pensDatabase[currentManagingProduct] = [];

        let editIdx = parseInt(document.getElementById('editPenIndex').value);
        let id = document.getElementById('newPenId').value.trim();
        let name = document.getElementById('newPenName').value.trim();
        let price = parseFloat(document.getElementById('newPenPrice').value) || 0;

        let allowUv = document.getElementById('chkUv').checked;
        let allowSifravoy = document.getElementById('chkSifravoy').checked;
        let allowDtf = document.getElementById('chkDtf').checked;
        let allowGravirovka = document.getElementById('chkGravirovka').checked;

        let pUv = parseFloat(document.getElementById('pricePrintUv').value) || 0;
        let pSifravoy = parseFloat(document.getElementById('pricePrintSifravoy').value) || 0;
        let pDtf = parseFloat(document.getElementById('pricePrintDtf').value) || 0;
        let pGravirovka = parseFloat(document.getElementById('pricePrintGravirovka').value) || 0;

        let pSmall = parseFloat(document.getElementById('priceSizeSmall').value) || 0;
        let pMedium = parseFloat(document.getElementById('priceSizeMedium').value) || 0;
        let pLarge = parseFloat(document.getElementById('priceSizeLarge').value) || 0;

        let colors = colorChipsState
            .map(c => ({ name: (c.name && c.name.trim()) ? c.name.trim() : c.hex, hex: c.hex || '#94a3b8' }));

        let lentas = (currentManagingProduct === 'beyjik')
            ? lentaChipsState
                .filter(l => (l.name && l.name.trim()) || l.image)
                .map(l => ({
                    id: l.id || ('LENTA-' + Math.random().toString(36).slice(2)),
                    name: (l.name && l.name.trim()) ? l.name.trim() : 'Lenta',
                    price: parseFloat(l.price) || 0,
                    image: l.image || placeholderImg('Lenta', 150, 150)
                }))
            : [];

        let naborDetails = detailsChipsState
            .filter(d => d.name && d.name.trim())
            .map(d => ({
                name: d.name.trim(),
                printPrices: {
                    uv: parseFloat(d.printPrices?.uv) || 0,
                    dtf: parseFloat(d.printPrices?.dtf) || 0,
                    laser: parseFloat(d.printPrices?.laser) || 0
                }
            }));

        if (!id || !name) { showToast("⚠️ ID va nomini kiriting!"); return; }

        if (currentManagingProduct === 'naborlar' && naborDetails.length === 0) {
            showToast("⚠️ Nabor tarkibidagi detallarni kiriting (masalan: Ruchka, Bloknot)!");
            return;
        }

        // Suvenirlarda narx faqat oraliq jadvalidan olinadi — demak jadval bo'sh bo'lmasligi kerak
        let isSouvenirSave = souvenirKeys.includes(currentManagingProduct);
        let tiers = normalizeTierList(tierChipsState);

        if (isSouvenirSave) {
            if (tiers.length === 0) {
                showToast("⚠️ Kamida bitta miqdor oralig'i qo'shing — narx shu jadvaldan olinadi!");
                return;
            }
            let bosh = tiers.find(t => !(t.basePrice > 0));
            if (bosh) {
                showToast(`⚠️ "${tierLabel(bosh)}" oralig'ida mahsulot narxi kiritilmagan!`);
                return;
            }
        }

        let image = '';
        let fileInput = document.getElementById('newPenFile');

        if (fileInput.files && fileInput.files[0]) {
            image = await convertBase64(fileInput.files[0]);
        } else if (editIdx >= 0 && pensDatabase[currentManagingProduct][editIdx]) {
            image = pensDatabase[currentManagingProduct][editIdx].image;
        } else {
            showToast("⚠️ Asosiy rasmni yuklang — rasm majburiy!");
            return;
        }

        // basePrice / printPrices maydonlari eski kod va hisobotlar uchun saqlanadi,
        // lekin suvenirlarda ular birinchi oraliqdan avtomatik to'ldiriladi.
        let legacyBase = isSouvenirSave ? tiers[0].basePrice : price;
        let legacyPrint = isSouvenirSave
            ? { ...tiers[0].printPrices }
            : { uv: pUv, sifravoy: pSifravoy, dtf: pDtf, gravirovka: pGravirovka };

        let penData = {
            id, name, basePrice: legacyBase, image,
            allowUv, allowSifravoy, allowDtf, allowGravirovka,
            printPrices: legacyPrint,
            sizes: { small: pSmall, medium: pMedium, large: pLarge },
            colors: colors,
            lentas: lentas,
            details: naborDetails,
            tiers: tiers,
            images: penExtraImagesState.slice(0, PEN_QOSHIMCHA_RASM_MAX)
        };

        if (editIdx >= 0) {
            pensDatabase[currentManagingProduct][editIdx] = penData;
            showToast("✏️ Model yangilandi!");
            if (typeof logAudit === 'function') logAudit("Suvenir modeli tahrirlandi", `${currentManagingProduct} / ${name} (${id})`);
        } else {
            pensDatabase[currentManagingProduct].push(penData);
            showToast("✅ Model qo'shildi!");
            if (typeof logAudit === 'function') logAudit("Suvenir modeli qo'shildi", `${currentManagingProduct} / ${name} (${id})`);
        }

        localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
        renderAdminPensTable();
        cancelPenEdit();
    }

    function editPen(index) {
        let pen = pensDatabase[currentManagingProduct][index];
        if (!pen) return;

        document.getElementById('editPenIndex').value = index;
        document.getElementById('newPenId').value = pen.id;
        document.getElementById('newPenName').value = pen.name;
        document.getElementById('newPenPrice').value = pen.basePrice;

        document.getElementById('chkUv').checked = pen.allowUv;
        document.getElementById('chkSifravoy').checked = pen.allowSifravoy !== undefined ? pen.allowSifravoy : true;
        document.getElementById('chkDtf').checked = pen.allowDtf !== undefined ? pen.allowDtf : true;
        document.getElementById('chkGravirovka').checked = pen.allowGravirovka !== undefined ? pen.allowGravirovka : true;

        if (pen.printPrices) {
            document.getElementById('pricePrintUv').value = pen.printPrices.uv || 0;
            document.getElementById('pricePrintSifravoy').value = pen.printPrices.sifravoy || 4000;
            document.getElementById('pricePrintDtf').value = pen.printPrices.dtf || 0;
            document.getElementById('pricePrintGravirovka').value = pen.printPrices.gravirovka || 0;
        }

        if (pen.sizes) {
            document.getElementById('priceSizeSmall').value = pen.sizes.small || 0;
            document.getElementById('priceSizeMedium').value = pen.sizes.medium || 0;
            document.getElementById('priceSizeLarge').value = pen.sizes.large || 0;
        }

        colorChipsState = (pen.colors || []).map(normalizeColorEntry);
        renderColorChipsEditor();

        lentaChipsState = (pen.lentas || []).map(l => ({ ...l }));
        renderLentaChipsEditor();

        detailsChipsState = (pen.details || []).map(normalizeNaborDetail);
        renderDetailsChipsEditor();

        tierChipsState = normalizeTierList(pen.tiers);
        renderTierEditor();

        penExtraImagesState = Array.isArray(pen.images) ? pen.images.slice() : [];
        renderPenExtraImages();

        document.getElementById('penFormTitle').innerText = `✏️ Modelni Tahrirlash (${pen.id})`;
        document.getElementById('btnSavePen').innerText = "💾 Saqlash";
        document.getElementById('btnCancelEdit').style.display = "inline-flex";

        let previewImg = document.getElementById('newPenImagePreview');
        let placeholder = document.getElementById('newPenImagePreviewPlaceholder');
        if (previewImg) {
            if (pen.image) { previewImg.src = pen.image; previewImg.style.display = 'block'; if (placeholder) placeholder.style.display = 'none'; }
            else { previewImg.style.display = 'none'; if (placeholder) placeholder.style.display = 'block'; }
        }
    }

    function cancelPenEdit() {
        document.getElementById('editPenIndex').value = "-1";
        document.getElementById('newPenId').value = '';
        document.getElementById('newPenName').value = '';
        document.getElementById('newPenPrice').value = '';
        document.getElementById('newPenFile').value = '';
        document.getElementById('chkUv').checked = true;
        document.getElementById('chkSifravoy').checked = true;
        document.getElementById('chkDtf').checked = true;
        document.getElementById('chkGravirovka').checked = true;

        document.getElementById('pricePrintUv').value = 5000;
        document.getElementById('pricePrintSifravoy').value = 4000;
        document.getElementById('pricePrintDtf').value = 5500;
        document.getElementById('pricePrintGravirovka').value = 6000;

        document.getElementById('priceSizeSmall').value = 0;
        document.getElementById('priceSizeMedium').value = 5000;
        document.getElementById('priceSizeLarge').value = 12000;

        colorChipsState = [];
        renderColorChipsEditor();

        lentaChipsState = [];
        renderLentaChipsEditor();

        detailsChipsState = [];
        renderDetailsChipsEditor();

        tierChipsState = [];
        renderTierEditor();

        penExtraImagesState = [];
        renderPenExtraImages();

        document.getElementById('penFormTitle').innerText = "➕ Yangi Model Qo'shish";
        document.getElementById('btnSavePen').innerText = "💾 Saqlash";
        document.getElementById('btnCancelEdit').style.display = "none";

        let previewImg = document.getElementById('newPenImagePreview');
        let placeholder = document.getElementById('newPenImagePreviewPlaceholder');
        if (previewImg) { previewImg.style.display = 'none'; previewImg.src = ''; }
        if (placeholder) placeholder.style.display = 'block';
    }

    function deletePen(index) {
        if (confirm("Rostdan ham o'chirmoqchimisiz?")) {
            let removed = pensDatabase[currentManagingProduct][index];
            pensDatabase[currentManagingProduct].splice(index, 1);
            localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
            if (typeof logAudit === 'function') logAudit("Suvenir modeli o'chirildi", `${currentManagingProduct} / ${removed ? removed.name : ''} (${removed ? removed.id : ''})`);
            renderAdminPensTable();
            showToast("🗑️ Model o'chirildi.");
        }
    }

    function renderPensList(activeDb) {
        const grid = document.getElementById('penGrid');
        if (!grid) return;
        grid.innerHTML = activeDb.map(pen => `
            <div class="pen-card ${selectedPen && selectedPen.id === pen.id ? 'active' : ''}" id="pen-card-${pen.id}" onclick="selectPenModel('${pen.id}')">
                <img src="${pen.image}" alt="${pen.name}" onerror="this.src='${placeholderImg('No Img', 100, 75)}'">
                <span class="pen-id">${pen.id}</span>
                <span class="pen-name" title="${pen.name}">${pen.name}</span>
            </div>
        `).join('');
    }

    function selectPenModel(penId) {
        let activeDb = pensDatabase[activeProductType] || [];
        selectedPen = activeDb.find(p => p.id === penId);
        if (!selectedPen) return;

        let penPrintScheme = printTypeSchemes[activeProductType];
        if (penPrintScheme) {
            let allowedSchemeTypes = [];
            if (penPrintScheme.uv && selectedPen.allowUv !== false) allowedSchemeTypes.push('uv');
            if (penPrintScheme.dtf && selectedPen.allowDtf !== false) allowedSchemeTypes.push('dtf');
            if (penPrintScheme.gravirovka && selectedPen.allowGravirovka !== false) allowedSchemeTypes.push('gravirovka');
            if (!allowedSchemeTypes.includes(selectedPrintType)) {
                selectedPrintType = allowedSchemeTypes[0] || 'uv';
            }
        } else if (selectedPrintType === 'uv' && !selectedPen.allowUv) {
            selectedPrintType = selectedPen.allowSifravoy ? 'sifravoy' : 'uv';
        }

        if (activeProductType === 'naborlar') {
            let allowedNaborTypes = [];
            if (selectedPen.allowUv !== false) allowedNaborTypes.push('uv');
            if (selectedPen.allowDtf !== false) allowedNaborTypes.push('dtf');
            if (selectedPen.allowGravirovka !== false) allowedNaborTypes.push('laser');
            if (!allowedNaborTypes.includes(selectedNaborPrintType)) {
                selectedNaborPrintType = allowedNaborTypes[0] || 'uv';
            }
        }

        document.querySelectorAll('.pen-card').forEach(c => c.classList.remove('active'));
        document.getElementById(`pen-card-${penId}`)?.classList.add('active');
        selectedColor = null;
        selectedLenta = null;
        renderPrintOptions();
        renderColorOptions();
        renderLentaOptions();
        renderNaborDetails();
        renderPenGallery();
        calculate();
    }

    function renderNaborDetails() {
        let wrap = document.getElementById('naborDetailsGroup');
        let container = document.getElementById('naborDetailsContainer');
        if (!wrap || !container || !selectedPen) return;

        let details = selectedPen.details || [];
        if (details.length === 0) {
            wrap.style.display = 'none';
            return;
        }

        wrap.style.display = 'block';
        container.innerHTML = details.map(normalizeNaborDetail).map(d => {
            let price = d.printPrices[selectedNaborPrintType] || 0;
            return `<span class="detail-tag">${d.name} (+${price.toLocaleString()} so'm)</span>`;
        }).join('');
    }

    function renderColorOptions() {
        let wrap = document.getElementById('colorOptionsGroup');
        let container = document.getElementById('colorButtonsContainer');
        if (!wrap || !container || !selectedPen) return;

        let colors = (selectedPen.colors || []).map(normalizeColorEntry);
        if (colors.length === 0) {
            wrap.style.display = 'none';
            selectedColor = null;
            return;
        }

        wrap.style.display = 'block';
        if (!selectedColor || !colors.some(c => c.name === selectedColor)) {
            selectedColor = colors[0].name;
        }

        container.innerHTML = colors.map(c => `
            <button type="button" class="color-swatch-btn ${selectedColor === c.name ? 'active' : ''}" onclick="selectPenColor('${c.name.replace(/'/g, "\\'")}')" title="${c.name}">
                <span class="color-swatch-dot" style="background:${c.hex};"></span>
                <span>${c.name}</span>
            </button>
        `).join('');
    }

    function selectPenColor(color) {
        selectedColor = color;
        renderColorOptions();
        calculate();
    }

    function renderLentaOptions() {
        let wrap = document.getElementById('lentaOptionsGroup');
        let container = document.getElementById('lentaButtonsContainer');
        if (!wrap || !container || !selectedPen) return;

        let lentas = selectedPen.lentas || [];
        if (lentas.length === 0) {
            wrap.style.display = 'none';
            selectedLenta = null;
            return;
        }

        wrap.style.display = 'block';
        if (!selectedLenta || !lentas.some(l => l.id === selectedLenta)) {
            selectedLenta = lentas[0].id;
        }

        container.innerHTML = lentas.map(l => `
            <div class="lenta-card ${selectedLenta === l.id ? 'active' : ''}" onclick="selectLenta('${l.id.replace(/'/g, "\\'")}')" title="${l.name}">
                <img src="${l.image}" alt="${l.name}" onerror="this.src='${placeholderImg('Lenta', 150, 150)}'">
                <span class="lenta-name">${l.name}</span>
                <span class="lenta-price">+${(l.price || 0).toLocaleString()} so'm</span>
            </div>
        `).join('');
    }

    function selectLenta(lentaId) {
        selectedLenta = lentaId;
        renderLentaOptions();
        calculate();
    }

    function renderPrintOptions() {
        const group = document.getElementById('printTypeGroup');
        if (!group || !selectedPen) return;

        if (activeProductType === 'naborlar') {
            let naborHtml = '';
            if (selectedPen.allowUv !== false) naborHtml += `<button class="opt-btn ${selectedNaborPrintType === 'uv' ? 'active' : ''}" onclick="selectNaborPrintType('uv')">UF Pechat</button>`;
            if (selectedPen.allowDtf !== false) naborHtml += `<button class="opt-btn ${selectedNaborPrintType === 'dtf' ? 'active' : ''}" onclick="selectNaborPrintType('dtf')">UF DTF</button>`;
            if (selectedPen.allowGravirovka !== false) naborHtml += `<button class="opt-btn ${selectedNaborPrintType === 'laser' ? 'active' : ''}" onclick="selectNaborPrintType('laser')">Gravirovka</button>`;
            group.innerHTML = naborHtml;
            return;
        }

        let printScheme = printTypeSchemes[activeProductType];
        if (printScheme && printTypeInfoOnly.includes(activeProductType)) {
            let nomlar = [];
            if (printScheme.uv && selectedPen.allowUv !== false) nomlar.push(printScheme.uv);
            if (printScheme.dtf && selectedPen.allowDtf !== false) nomlar.push(printScheme.dtf);
            if (printScheme.gravirovka && selectedPen.allowGravirovka !== false) nomlar.push(printScheme.gravirovka);
            group.innerHTML = `<span class="print-type-info">ℹ️ ${nomlar.join(' / ') || printScheme.uv}</span>`;
            return;
        }
        if (printScheme) {
            let schemeHtml = '';
            if (printScheme.uv && selectedPen.allowUv !== false) schemeHtml += `<button class="opt-btn ${selectedPrintType === 'uv' ? 'active' : ''}" onclick="selectPenPrint('uv')">${printScheme.uv}</button>`;
            if (printScheme.dtf && selectedPen.allowDtf !== false) schemeHtml += `<button class="opt-btn ${selectedPrintType === 'dtf' ? 'active' : ''}" onclick="selectPenPrint('dtf')">${printScheme.dtf}</button>`;
            if (printScheme.gravirovka && selectedPen.allowGravirovka !== false) schemeHtml += `<button class="opt-btn ${selectedPrintType === 'gravirovka' ? 'active' : ''}" onclick="selectPenPrint('gravirovka')">${printScheme.gravirovka}</button>`;
            group.innerHTML = schemeHtml;
            return;
        }

        let html = '';
        if (selectedPen.allowUv) {
            html += `<button class="opt-btn ${selectedPrintType === 'uv' ? 'active' : ''}" onclick="selectPenPrint('uv')">UF Pechat</button>`;
        }
        if (selectedPen.allowSifravoy) {
            html += `<button class="opt-btn ${selectedPrintType === 'sifravoy' ? 'active' : ''}" onclick="selectPenPrint('sifravoy')">Sifravoy Pechat</button>`;
        }
        group.innerHTML = html;
    }

    function selectPenPrint(type) {
        selectedPrintType = type;
        renderPrintOptions();
        calculate();
    }

    function selectNaborPrintType(type) {
        selectedNaborPrintType = type;
        renderPrintOptions();
        renderNaborDetails();
        calculate();
    }

    function selectPenSize(size) {
        selectedPrintSize = size;
        document.getElementById('sizeSmallBtn')?.classList.toggle('active', size === 'small');
        document.getElementById('sizeMediumBtn')?.classList.toggle('active', size === 'medium');
        document.getElementById('sizeLargeBtn')?.classList.toggle('active', size === 'large');
        calculate();
    }

    function selectPenSide(sides) {
        selectedSide = sides;
        document.getElementById('side1Btn')?.classList.toggle('active', sides === 1);
        document.getElementById('side2Btn')?.classList.toggle('active', sides === 2);
        calculate();
    }


function generateForm_suvenir(type, form, rightCol) {
            rightCol.className = "right-panel-col";
            rightCol.style.display = "flex";
            rightCol.innerHTML = `
                <div class="margin-card">
                    <div class="form-group">
                        <label>Ishxona Marjasi (%):</label>
                        <input type="number" id="inpMargin" value="${marjaQiymati('inpMargin', MARJA_STANDART)}" min="0" step="1" oninput="calculate()">
                    </div>
                </div>
                <div class="result-box">
                    <div>
                        <h3 style="margin-bottom: 12px; color: var(--text-main); font-size: 1rem;">Hisob-kitob Natijasi</h3>
                        <div class="card-preview-header" id="previewCardBox" style="display: none;">
                            <div class="card-preview-img">
                                <img id="previewProductImg" src="" alt="Mahsulot rasmi" onerror="this.src='${placeholderImg('Foto', 50, 50)}'">
                            </div>
                            <div class="card-preview-text">
                                <span>Tanlangan model:</span>
                                <strong id="previewProductName">-</strong>
                            </div>
                        </div>
                        <div class="result-item"><span>Tafsilot:</span> <strong id="resDetails" style="text-align: right; max-width: 60%;">-</strong></div>
                        <div class="result-item"><span>Miqdor / Hajm:</span> <strong id="resQuantity">0 dona</strong></div>
                        <div class="result-item"><span>Birlik narxi:</span> <strong id="resUnitPrice">0 so'm</strong></div>
                        <div class="result-item result-total"><span>Jami summa:</span> <span id="resTotalPrice">0 so'm</span></div>
                    </div>
                    <div id="tierPreviewBox" style="display:none; margin-top:16px;"></div>
                    <div style="margin-top: 20px; display:flex; gap:8px;">
                        <button class="btn" style="flex:1;" onclick="copyResult()">📋 Natijani nusxalash</button>
                        <button class="btn btn-outline" title="To'liq hisob-kitob (parol talab qilinadi)" onclick="openFullCalcInfoModal()">👁️</button>
                    </div>
                </div>
            `;

            let activeDb = pensDatabase[type] || [];
            if (activeDb.length > 0) {
                selectedPen = activeDb[0];
                let initScheme = printTypeSchemes[type];
                if (initScheme) {
                    if (initScheme.uv && selectedPen.allowUv !== false) selectedPrintType = 'uv';
                    else if (initScheme.dtf && selectedPen.allowDtf !== false) selectedPrintType = 'dtf';
                    else if (initScheme.gravirovka && selectedPen.allowGravirovka !== false) selectedPrintType = 'gravirovka';
                    else selectedPrintType = 'uv';
                } else {
                    selectedPrintType = selectedPen.allowUv ? 'uv' : 'sifravoy';
                }
                selectedNaborPrintType = 'uv';
                selectedPrintSize = 'small';
                selectedSide = 1;
                selectedLenta = null;

                let hasSizes = hasSizesTypes.includes(type);
                let isOneSidedOnly = oneSidedOnlySouvenirs.includes(type);

                let stepNum = 2;
                let sizeStepHtml = '';
                if (hasSizes) {
                    stepNum++;
                    sizeStepHtml = `
                        <div class="step-title">${stepNum}. Chop etish razmeri (o'lchami):</div>
                        <div class="options-group" id="printSizeGroup">
                            <button class="opt-btn active" id="sizeSmallBtn" onclick="selectPenSize('small')">Kichik (Standart)</button>
                            <button class="opt-btn" id="sizeMediumBtn" onclick="selectPenSize('medium')">O'rta</button>
                            <button class="opt-btn" id="sizeLargeBtn" onclick="selectPenSize('large')">Katta</button>
                        </div>
                    `;
                }

                let sideStepHtml = '';
                if (!isOneSidedOnly) {
                    stepNum++;
                    sideStepHtml = `
                        <div class="step-title">${stepNum}. Bosma tomoni:</div>
                        <div class="options-group">
                            <button class="opt-btn active" id="side1Btn" onclick="selectPenSide(1)">1 tomonlama</button>
                            <button class="opt-btn" id="side2Btn" onclick="selectPenSide(2)">2 tomonlama</button>
                        </div>
                    `;
                }

                stepNum++;

                html = `
                    <div class="step-title">1. Modelni tanlang (${activeDb.length} ta mavjud):</div>
                    <div class="pen-grid" id="penGrid"></div>
                    <div class="pen-gallery" id="penGalleryGroup" style="display:none;"></div>

                    <div id="naborDetailsGroup" style="display:none; margin-bottom:12px;">
                        <div class="step-title" style="margin-bottom:8px;">📦 Nabor tarkibi:</div>
                        <div class="detail-tag-list" id="naborDetailsContainer"></div>
                    </div>

                    <div id="colorOptionsGroup" style="display:none; margin-bottom:12px;">
                        <div class="step-title" style="margin-bottom:8px;">🎨 Rangni tanlang:</div>
                        <div class="options-group" id="colorButtonsContainer"></div>
                    </div>

                    <div id="lentaOptionsGroup" style="display:none; margin-bottom:12px;">
                        <div class="step-title" style="margin-bottom:8px;">🎗️ Lentani tanlang:</div>
                        <div class="lenta-grid" id="lentaButtonsContainer"></div>
                    </div>

                    <div class="step-title">2. Chop etish turi:${printTypeInfoOnly.includes(type) ? ' <span class="paket-step-hint">(ma&#39;lumot — tanlanmaydi)</span>' : ''}</div>
                    <div class="options-group" id="printTypeGroup"></div>

                    ${sizeStepHtml}

                    ${sideStepHtml}

                    <div class="form-group" style="margin-top:10px;">
                        <label>${stepNum}. Adad (dona):</label>
                        <input type="number" id="inpQuantity" value="50" min="1" oninput="calculate()">
                    </div>
                `;
                form.innerHTML = html;
                renderPensList(activeDb);
                renderPrintOptions();
                renderColorOptions();
                renderLentaOptions();
                renderNaborDetails();
                return;
            } else {
                let isOneSidedOnlyFallback = oneSidedOnlySouvenirs.includes(type);
                html = `
                    <div style="background:#fff3cd; color:#856404; padding:12px; border-radius:8px; margin-bottom:15px; font-size:0.88rem;">
                        ⚠️ Ushbu mahsulot uchun hali alohida modellar kiritilmagan. Standart hisob ishlatiladi.
                    </div>
                    ${isOneSidedOnlyFallback ? '' : `
                    <div class="form-group" style="margin-bottom:12px;">
                        <label>Bosma Turi:</label>
                        <select id="inpSides" onchange="calculate()">
                            <option value="1">Bir tomonlama</option>
                            <option value="1.5">Ikki tomonlama</option>
                        </select>
                    </div>
                    `}
                    <div class="form-group">
                        <label>Adad (dona):</label>
                        <input type="number" id="inpQuantity" value="50" min="1" oninput="calculate()">
                    </div>
                `;
                form.innerHTML = html;
                return;
            }
}

function calculateResult_suvenir(qty, baseCost, marginPercent, previewBox) {
    let details = activeProductType.toUpperCase();
    let baseUnitPrice = 0;
    let previewImgUrl = '';
    let previewNameText = activeProductType.toUpperCase();

            let activeDb = pensDatabase[activeProductType] || [];

            if (activeDb.length > 0 && selectedPen) {
                if(previewBox) previewBox.style.display = 'flex';
                previewImgUrl = selectedPen.image;
                previewNameText = `${selectedPen.id} - ${selectedPen.name}`;

                // Miqdor oraliqlari: buyurtma soniga mos narxni topamiz.
                // Jadval bo'sh bo'lsa avvalgi qat'iy narx qaytadi.
                let tierResult = resolveSouvenirPrices(selectedPen, qty);
                let activeTier = tierResult.tier;

                let itemPrice = tierResult.basePrice > 0 ? tierResult.basePrice : baseCost;
                let isNaborlar = (activeProductType === 'naborlar');

                let printCost = 0;
                let printName = 'UF Pechat';
                let sizeExtra = 0;
                let sizeLabel = 'Standart';

                if (!isNaborlar) {
                    let printPrices = tierResult.printPrices || { uv: 5000, sifravoy: 4000 };
                    let basePrintCost = printPrices[selectedPrintType] || 0;
                    let calcPrintScheme = printTypeSchemes[activeProductType];

                    if (calcPrintScheme) {
                        printName = calcPrintScheme[selectedPrintType] || calcPrintScheme.uv || 'Pechat';
                    } else if (selectedPrintType === 'sifravoy') {
                        printName = 'Sifravoy Pechat';
                    }

                    if (hasSizesTypes.includes(activeProductType) && selectedPen.sizes) {
                        sizeExtra = selectedPen.sizes[selectedPrintSize] || 0;
                        sizeLabel = selectedPrintSize === 'small' ? 'Kichik' : (selectedPrintSize === 'medium' ? "O'rta" : 'Katta');
                    }

                    printCost = (basePrintCost + sizeExtra) * (selectedSide === 2 ? 1.5 : 1);
                }

                if (isNaborlar) {
                    if (selectedNaborPrintType === 'dtf') printName = 'UF DTF';
                    else if (selectedNaborPrintType === 'laser') printName = 'Gravirovka';
                    else printName = 'UF Pechat';
                    details = `${selectedPen.id} (${selectedPen.name}) | ${printName}`;
                } else {
                    details = `${selectedPen.id} (${selectedPen.name}) | ${printName} [${sizeLabel}] (${selectedSide} tomon)`;
                }
                if (selectedColor) details += ` | Rang: ${selectedColor}`;

                let detailsPrintCost = 0;
                if (selectedPen.details && selectedPen.details.length > 0) {
                    let naborDetailsNorm = selectedPen.details.map(normalizeNaborDetail);
                    if (isNaborlar) {
                        detailsPrintCost = naborDetailsNorm.reduce((sum, d) => sum + (d.printPrices[selectedNaborPrintType] || 0), 0);
                    }
                    details += ` | Tarkibi: ${naborDetailsNorm.map(d => d.name).join(', ')}`;
                }

                let lentaCost = 0;
                if (selectedLenta && selectedPen.lentas) {
                    let lentaObj = selectedPen.lentas.find(l => l.id === selectedLenta);
                    if (lentaObj) {
                        lentaCost = lentaObj.price || 0;
                        details += ` | Lenta: ${lentaObj.name}`;
                    }
                }

                if (activeTier) {
                    details += ` | Oraliq: ${tierLabel(activeTier)}`;
                }
                renderTierPreview(selectedPen, qty, marginPercent);

                // Yagona manba: jadval ko'rinishi ham shu funksiyani chaqiradi
                let totalItemSum = souvenirUnitTotalForTier(selectedPen, activeTier);

                baseUnitPrice = totalItemSum;
            } else {
                renderTierPreview(null, qty, marginPercent);
                if(previewBox) previewBox.style.display = 'none';
                let sideFactor = parseFloat(document.getElementById('inpSides')?.value || 1);
                baseUnitPrice = baseCost * sideFactor;
                details = "Standart Hisob";
            }

    return { details, baseUnitPrice, previewImgUrl, previewNameText };
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('suvenir', {
        init: function () {
            let savedPens = localStorage.getItem('erp_pens_db_v3');
            pensDatabase = savedPens ? JSON.parse(savedPens) : getDefaultPensDatabase();

            // Eski (avvalroq saqlangan) bazalarda hali mavjud bo'lmagan yangi suvenir turlari uchun
            // namuna modellarni to'ldirib qo'yish (masalan keyinroq qo'shilgan Fleshka, Statuetka va h.k.)
            let missingSouvenirKeys = souvenirKeys.filter(key => !pensDatabase[key] || pensDatabase[key].length === 0);
            if (missingSouvenirKeys.length > 0) {
                let defaultDb = getDefaultPensDatabase();
                missingSouvenirKeys.forEach(key => {
                    pensDatabase[key] = defaultDb[key] || [];
                });
                localStorage.setItem('erp_pens_db_v3', JSON.stringify(pensDatabase));
            }

            // Eski modellarni miqdor oraliqlari jadvaliga ko'chiramiz (bir martalik)
            migrateLegacySouvenirPrices();

            // O'chib qolgan via.placeholder.com xizmatiga ishora qiluvchi eski rasmlarni
            // mahalliy SVG rasm-o'rnbosarga almashtirish. Alohida bayroq emas — barcha
            // saqlangan model/lenta rasmlarini tozalaydi; tekshiruv o'zi idempotent
            // (faqat hali tuzatilmagan yozuvlarga tegadi), shuning uchun alohida bayroq shart emas.
            migrateDeadPlaceholderImages();
        }
    });
