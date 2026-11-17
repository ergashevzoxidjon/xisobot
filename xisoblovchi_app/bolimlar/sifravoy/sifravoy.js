    let digitalPapersDatabase = [
        { name: "Melovka 130g", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 800, price2: 1200 },
        { name: "Melovka 150g", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 1000, price2: 1500 },
        { name: "Melovka 250g", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 1500, price2: 2200 },
        { name: "Melovka 300g", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 2000, price2: 3000 }
    ];

    let currentPaper = { name: 'Melovka 130g', q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 800, price2: 1200 };
    let printSidesDigital = 1;

    function renderAdminDigitalPaperTable() {
        let tbody = document.getElementById('adminDigitalPaperTableBody');
        if (!tbody) return;

        tbody.innerHTML = digitalPapersDatabase.map((item, index) => `
            <tr>
                <td><input type="text" id="dig_name_${index}" value="${item.name}" style="max-width: 100%; min-width: 130px;"></td>
                <td><input type="number" id="dig_qeni_${index}" value="${item.q_eni}"></td>
                <td><input type="number" id="dig_qboyi_${index}" value="${item.q_boyi}"></td>
                <td><input type="number" id="dig_peni_${index}" value="${item.p_eni}"></td>
                <td><input type="number" id="dig_pboyi_${index}" value="${item.p_boyi}"></td>
                <td><input type="number" id="dig_price1_${index}" value="${item.price1}"></td>
                <td><input type="number" id="dig_price2_${index}" value="${item.price2}"></td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn btn-warning" title="O'zgartirish" onclick="updateSingleDigitalPaper(${index})">✏️</button>
                        <button class="btn btn-danger" title="O'chirish" onclick="deleteDigitalPaperRow(${index})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function updateSingleDigitalPaper(index) {
        digitalPapersDatabase[index] = {
            name: document.getElementById(`dig_name_${index}`).value,
            q_eni: Number(document.getElementById(`dig_qeni_${index}`).value),
            q_boyi: Number(document.getElementById(`dig_qboyi_${index}`).value),
            p_eni: Number(document.getElementById(`dig_peni_${index}`).value),
            p_boyi: Number(document.getElementById(`dig_pboyi_${index}`).value),
            price1: Number(document.getElementById(`dig_price1_${index}`).value),
            price2: Number(document.getElementById(`dig_price2_${index}`).value)
        };
        localStorage.setItem('erp_digital_papers_db', JSON.stringify(digitalPapersDatabase));
        showToast("✅ Qog'oz ma'lumotlari o'zgartirildi!");
    }

    // Jadvaldagi (hali saqlanmagan) qiymatlarni o'qiydi — saqlash, qator qo'shish va o'chirishda ishlatiladi
    function readDigitalPapersUI() {
        for (let index = 0; index < digitalPapersDatabase.length; index++) {
            let nameInput = document.getElementById(`dig_name_${index}`);
            if (nameInput) {
                digitalPapersDatabase[index] = {
                    name: nameInput.value,
                    q_eni: Number(document.getElementById(`dig_qeni_${index}`).value),
                    q_boyi: Number(document.getElementById(`dig_qboyi_${index}`).value),
                    p_eni: Number(document.getElementById(`dig_peni_${index}`).value),
                    p_boyi: Number(document.getElementById(`dig_pboyi_${index}`).value),
                    price1: Number(document.getElementById(`dig_price1_${index}`).value),
                    price2: Number(document.getElementById(`dig_price2_${index}`).value)
                };
            }
        }
    }

    function saveAllDigitalPapers() {
        readDigitalPapersUI();
        localStorage.setItem('erp_digital_papers_db', JSON.stringify(digitalPapersDatabase));
        if (typeof logAudit === 'function') logAudit("Raqamli pechat qog'ozlari o'zgartirildi", `${digitalPapersDatabase.length} ta qog'oz turi yangilandi`);
        showToast("💾 Barcha o'zgarishlar muvaffaqiyatli saqlandi!");
        renderAdminDigitalPaperTable();
    }

    function addDigitalPaperRow() {
        readDigitalPapersUI();
        digitalPapersDatabase.push({ name: "Yangi qog'oz", q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 1000, price2: 1500 });
        localStorage.setItem('erp_digital_papers_db', JSON.stringify(digitalPapersDatabase));
        renderAdminDigitalPaperTable();
        showToast("✅ Yangi qog'oz qo'shildi!");
    }

    function deleteDigitalPaperRow(index) {
        if (confirm("Rostdan ham ushbu qog'ozni o'chirmoqchimisiz?")) {
            readDigitalPapersUI();
            digitalPapersDatabase.splice(index, 1);
            localStorage.setItem('erp_digital_papers_db', JSON.stringify(digitalPapersDatabase));
            renderAdminDigitalPaperTable();
            showToast("🗑️ O'chirildi.");
        }
    }

    function renderDigitalPublicTable() {
        let tbody = document.getElementById('digitalPublicTableBody');
        if (!tbody) return;
        tbody.innerHTML = digitalPapersDatabase.map(item => `
            <tr>
                <td style="font-weight:600;">${item.name}</td>
                <td>${item.q_eni} x ${item.q_boyi} mm</td>
                <td>${item.price1.toLocaleString()} so'm</td>
                <td>${item.price2.toLocaleString()} so'm</td>
            </tr>
        `).join('');
    }

    function setPaperByIndex(index) {
        if (digitalPapersDatabase[index]) {
            currentPaper = digitalPapersDatabase[index];
            let btns = document.querySelectorAll('#paperTypeGroup button');
            btns.forEach((btn, idx) => {
                if (idx === index) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            calculate();
        }
    }

   function setSize(w, h, btnId) {
        document.getElementById('widthX').value = w;
        document.getElementById('heightY').value = h;
        
        let sizeBtns = document.querySelectorAll('#standardSizeGroup button');
        sizeBtns.forEach(btn => {
            if (btn.id === btnId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function setPrintTypeDigital(sides) {
        printSidesDigital = sides;
        let btns = document.querySelectorAll('#printTypeGroupDigital button');
        btns.forEach((btn, idx) => {
            if ((idx + 1) === sides) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        calculate();
    }

    function updatePreviewDigital(cols, rows) {
        const previewBox = document.getElementById('previewBox');
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
        previewBox.style.border = '2px dashed #0284c7';
        previewBox.style.backgroundColor = '#f0f9ff';
        previewBox.style.borderRadius = '6px';

        let totalItems = cols * rows;
        for (let i = 0; i < totalItems; i++) {
            let div = document.createElement('div');
            div.className = 'preview-item';
            div.textContent = i + 1;
            div.style.background = '#38bdf8';
            div.style.border = '1px solid #0284c7';
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


function generateForm_raqamli(type, form, rightCol) {
            form.className = "";
            let parentGrid = document.querySelector('.calc-grid');
            parentGrid.classList.add('calc-grid-teng');

            printSidesDigital = 1;

            if (digitalPapersDatabase.length > 0 && !digitalPapersDatabase.some(p => p.name === currentPaper.name)) {
                currentPaper = digitalPapersDatabase[0];
            }

            let paperButtonsHtml = digitalPapersDatabase.map((p, idx) => `
                <button class="opt-btn ${idx === 0 ? 'active' : ''}" onclick="setPaperByIndex(${idx})">${p.name}</button>
            `).join('');

            form.innerHTML = `
                <div class="step-title">Qog'oz turi va grammi:</div>
                <div class="options-group" id="paperTypeGroup">
                    ${paperButtonsHtml}
                </div>

                <div class="step-title">Standart o'lchamlar:</div>
                <div class="options-group" id="standardSizeGroup">
                    <button class="opt-btn active" id="btnSizeA3" onclick="setSize(297, 420, 'btnSizeA3')">A3</button>
                    <button class="opt-btn" id="btnSizeA4" onclick="setSize(210, 297, 'btnSizeA4')">A4</button>
                    <button class="opt-btn" id="btnSizeA5" onclick="setSize(148, 210, 'btnSizeA5')">A5</button>
                    <button class="opt-btn" id="btnSizeA6" onclick="setSize(105, 148, 'btnSizeA6')">A6</button>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Mahsulot eni X (mm):</label>
                        <input type="number" id="widthX" value="297" oninput="calculate()">
                    </div>
                    <div class="form-group">
                        <label>Mahsulot bo'yi Y (mm):</label>
                        <input type="number" id="heightY" value="420" oninput="calculate()">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Kerakli mahsulot soni (dona):</label>
                        <input type="number" id="inpQuantity" value="100" min="1" oninput="calculate()">
                    </div>
                    <div class="form-group">
                        <label>Pechat turi:</label>
                        <div class="options-group" id="printTypeGroupDigital" style="margin-bottom:0; display:flex;">
                            <button class="opt-btn active" onclick="setPrintTypeDigital(1)" style="flex:1;">Bir tomonlama</button>
                            <button class="opt-btn" onclick="setPrintTypeDigital(2)" style="flex:1;">Ikki tomonlama</button>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Ishxona Marjasi (%):</label>
                        <input type="number" id="digitalMargin" value="${marjaQiymati('digitalMargin', MARJA_STANDART)}" min="0" step="1" oninput="calculate()">
                    </div>
                </div>

                <div class="result-box" style="margin-top: 16px;">
                    <div>
                        <h3 style="margin-bottom: 8px; color: var(--text-main); font-size: 0.95rem;">Hisob-kitob natijasi:</h3>
                        <div style="font-size: 0.88rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px;">
                            <div id="resDigitalSheetInfo">1 ta listga sig'adigan mahsulot: 0 dona</div>
                            <div id="resDigitalListCount">Kerakli listlar soni: 0 dona</div>
                            <div id="resDigitalTotal" style="font-weight: 700; color: var(--primary); margin-top: 4px;">Umumiy narx: 0 so'm</div>
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
                <div class="step-title" style="margin-top:0;">Pechat maydoni joylashuvi:</div>
                <div id="previewBox" style="width: 100%; height: 350px; border: 2px dashed #38bdf8; background: #f0fdf4; border-radius: 8px; display: grid; gap: 4px; padding: 6px; box-sizing: border-box; overflow: hidden;"></div>
            `;

            let tableContainerId = document.getElementById('digitalTableContainer');
            if (!tableContainerId) {
                let tableDiv = document.createElement('div');
                tableDiv.id = 'digitalTableContainer';
                tableDiv.style.marginTop = "30px";
                tableDiv.innerHTML = `
                    <div class="section-title">Qog'oz turlari, O'lchamlari va Narxlari</div>
                    <div class="table-card">
                        <div class="table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Qog'oz turi / Grammi</th>
                                    <th style="width: 200px;">Qog'oz o'lchami</th>
                                    <th style="width: 160px;">1 tomon. narxi</th>
                                    <th style="width: 160px;">2 tomon. narxi</th>
                                </tr>
                            </thead>
                            <tbody id="digitalPublicTableBody"></tbody>
                        </table>
                        </div>
                    </div>
                `;
                document.getElementById('calcScreen').appendChild(tableDiv);
            } else {
                tableContainerId.style.display = 'block';
            }
            renderDigitalPublicTable();

            calculate();
            return;
}

function calculate_raqamli() {
    let qty = parseInt(document.getElementById('inpQuantity')?.value) || 1;
    let details = activeProductType.toUpperCase();
    let previewNameText = activeProductType.toUpperCase();
            let x = parseFloat(document.getElementById('widthX')?.value) || 1;
            let y = parseFloat(document.getElementById('heightY')?.value) || 1;

            let pW = currentPaper.p_eni || 310;
            let pH = currentPaper.p_boyi || 440;
            const gap = 2;

            let effectiveW = x + gap;
            let effectiveH = y + gap;

            let cols1 = Math.floor((pW + gap) / effectiveW);
            let rows1 = Math.floor((pH + gap) / effectiveH);
            let count1 = cols1 * rows1;

            let cols2 = Math.floor((pW + gap) / (y + gap));
            let rows2 = Math.floor((pH + gap) / (x + gap));
            let count2 = cols2 * rows2;

            let bestCols = cols1, bestRows = rows1, perSheet = count1;
            let isRotated = false;

            if (count2 > count1) {
                bestCols = cols2;
                bestRows = rows2;
                perSheet = count2;
                isRotated = true;
            }

            if (perSheet <= 0) {
                showToast("⚠️ Kiritilgan mahsulot o'lchami tanlangan pechat maydonidan katta, sig'maydi!");
                let previewBoxEl = document.getElementById('previewBox');
                if (previewBoxEl) previewBoxEl.innerHTML = '<span style="color:#e31c79; font-weight:700; font-size:0.8rem; text-align:center; padding: 20px;">Bu o\'lcham tanlangan qog\'ozga sig\'maydi!</span>';
                document.getElementById('resDigitalSheetInfo').innerText = `1 ta listga sig'adigan mahsulot: 0 dona`;
                document.getElementById('resDigitalListCount').innerText = `Kerakli listlar soni: 0 dona`;
                document.getElementById('resDigitalTotal').innerText = `Umumiy narx: 0 so'm`;
                currentCalcResult = { details: "Sig'maydi", qty, unitPrice: 0, totalPrice: 0, name: "Raqamli Pechat", imageUrl: '' };
                return;
            }

            let sheetsNeeded = Math.ceil(qty / perSheet);
            let unitPaperPrice = (printSidesDigital === 1) ? currentPaper.price1 : currentPaper.price2;
            let totalPaperCost = sheetsNeeded * unitPaperPrice;

            // Umumiy Taxi (umumiy/yordamchi.js) — buyurtmaga bir marta, marja bilan
            let marginPercent = marjaOl('digitalMargin', MARJA_STANDART);
            let totalSum = totalPaperCost * (1 + marginPercent / 100) + taxiMarjaBilan(marginPercent);
            let unitPrice = Math.round(totalSum / qty);

            details = `${currentPaper.name} | (${x}x${y}mm) | ${printSidesDigital} tomon ${isRotated ? '[Aylantirilgan]' : ''}`;
            if (taxiNarxi > 0) details += ` | Taxi (bir martalik): ${taxiNarxi.toLocaleString()} so'm`;
            previewNameText = "Raqamli Pechat";
            
            updatePreviewDigital(bestCols, bestRows);

            document.getElementById('resDigitalSheetInfo').innerText = `1 ta listga sig'adigan mahsulot: ${perSheet} dona`;
            document.getElementById('resDigitalListCount').innerText = `Kerakli listlar soni: ${sheetsNeeded} dona`;
            document.getElementById('resDigitalTotal').innerText = `Umumiy narx: ${Math.round(totalSum).toLocaleString()} so'm` + (taxiNarxi > 0 ? ' (taxi bilan)' : '');

            currentCalcResult = { details, qty, unitPrice, totalPrice: Math.round(totalSum), name: previewNameText, imageUrl: '', marginPercent };
            return;
}

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    bolimRoyxatdan('sifravoy', {
        init: function () {
            let savedDigitalPapers = localStorage.getItem('erp_digital_papers_db');
            if (savedDigitalPapers) {
                digitalPapersDatabase = JSON.parse(savedDigitalPapers);
            }
            if (digitalPapersDatabase.length > 0) {
                currentPaper = digitalPapersDatabase[0];
            }
        }
    });
