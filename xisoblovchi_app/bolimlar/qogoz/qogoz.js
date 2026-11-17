// ====================== QOG'OZ BO'LIMI ======================
// Barcha qog'oz narxlari bitta admin bo'limida:
//   • Ofset qog'ozlari (ofsetRawPapers — ma'lumot va hisob ofset.js da, bu yerda faqat admin ko'rinishi)
//   • Konvertlar uchun qog'oz — har xil formatdagi varaqlar va ularning narxi.
// Poligrafiya bo'limi (Konvert) bu ro'yxatni qogozRoyxati('konvert') orqali o'qiydi.

    // Otkritka qog'ozlari endi: oddiy — Sifravoy qog'oz bazasi, 3D lak/folga — Ofset Melovka (poligrafiya.js)
    const QOGOZ_ROYXAT_NOMLARI = { konvert: "Konvertlar uchun qog'oz" };

    // Boshlang'ich (namuna) qog'ozlar — admin haqiqiy narxlarni kiritadi
    let qogozBolimi = {
        konvert: [
            { id: 'kq1', nomi: 'Ofset 120gr',   format: 'SRA3', eni: 320, boyi: 450, narx: 1500 },
            { id: 'kq2', nomi: 'Ofset 120gr',   format: 'A3',   eni: 297, boyi: 420, narx: 1300 },
            { id: 'kq3', nomi: 'Kraft 100gr',   format: 'A3',   eni: 297, boyi: 420, narx: 1200 },
            { id: 'kq4', nomi: 'Dizayn 120gr',  format: 'SRA3', eni: 320, boyi: 450, narx: 4000 },
            { id: 'kq5', nomi: 'Ofset 120gr',   format: 'A2',   eni: 440, boyi: 620, narx: 2800 }
        ]
    };

    function qogozRoyxati(key) {
        return qogozBolimi[key] || [];
    }

    // core.js → openProductManager('qogoz_bolimi') chaqiradi
    function renderAdminQogozBolimi() {
        if (typeof renderAdminOfsetPapersMatrix === 'function') renderAdminOfsetPapersMatrix();
        Object.keys(QOGOZ_ROYXAT_NOMLARI).forEach(renderQogozJadvali);
    }

    function renderQogozJadvali(key) {
        let tbody = document.getElementById('qogozJadval_' + key);
        if (!tbody) return;
        let esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        let list = qogozRoyxati(key);
        tbody.innerHTML = list.length === 0
            ? `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:16px;">Hozircha qog'oz yo'q — "+ Qog'oz qo'shish" ni bosing.</td></tr>`
            : list.map((q, i) => `
            <tr>
                <td><input type="text" id="qg_${key}_nomi_${i}" value="${esc(q.nomi)}" placeholder="masalan: Ofset 120gr"></td>
                <td><input type="text" id="qg_${key}_format_${i}" value="${esc(q.format)}" placeholder="SRA3" style="max-width:110px;"></td>
                <td><input type="number" id="qg_${key}_eni_${i}" value="${q.eni}" min="1"></td>
                <td><input type="number" id="qg_${key}_boyi_${i}" value="${q.boyi}" min="1"></td>
                <td><input type="number" id="qg_${key}_narx_${i}" value="${q.narx}" min="0"></td>
                <td style="text-align:right;"><button type="button" class="btn btn-danger" style="height:30px; padding:0 10px;" title="O'chirish" onclick="deleteQogozQator('${key}', ${i})">✕</button></td>
            </tr>
        `).join('');
    }

    // Jadvaldagi (hali saqlanmagan) qiymatlarni o'qiydi — qator qo'shish/o'chirishda yo'qolmasligi uchun
    function collectQogozRoyxati(key) {
        let q = id => document.getElementById(id);
        qogozBolimi[key] = qogozRoyxati(key).map((item, i) => q(`qg_${key}_nomi_${i}`) ? {
            id: item.id,
            nomi: q(`qg_${key}_nomi_${i}`).value.trim(),
            format: q(`qg_${key}_format_${i}`).value.trim(),
            eni: Math.max(0, parseFloat(q(`qg_${key}_eni_${i}`).value) || 0),
            boyi: Math.max(0, parseFloat(q(`qg_${key}_boyi_${i}`).value) || 0),
            narx: Math.max(0, parseFloat(q(`qg_${key}_narx_${i}`).value) || 0)
        } : item);
    }

    function addQogozQator(key) {
        collectQogozRoyxati(key);
        let oxirgi = qogozRoyxati(key).slice(-1)[0];
        qogozBolimi[key] = qogozRoyxati(key).concat([{
            id: 'q' + Date.now().toString(36),
            nomi: '', format: oxirgi ? oxirgi.format : 'SRA3', eni: oxirgi ? oxirgi.eni : 320, boyi: oxirgi ? oxirgi.boyi : 450, narx: 0
        }]);
        renderQogozJadvali(key);
    }

    function deleteQogozQator(key, i) {
        collectQogozRoyxati(key);
        let item = qogozRoyxati(key)[i];
        if (!item || !confirm(`"${item.nomi || 'Nomsiz'} (${item.format})" qog'ozini o'chirasizmi?`)) return;
        qogozBolimi[key].splice(i, 1);
        renderQogozJadvali(key);
    }

    function saveQogozRoyxati(key) {
        collectQogozRoyxati(key);
        let list = qogozRoyxati(key);
        if (list.some(q => !q.nomi)) { showToast("⚠️ Har bir qog'ozga nom kiriting!"); return; }
        if (list.some(q => !(q.eni > 0 && q.boyi > 0))) { showToast("⚠️ Varaq eni va bo'yi 0 dan katta bo'lishi kerak!"); return; }
        localStorage.setItem('erp_qogoz_bolimi', JSON.stringify(qogozBolimi));
        if (typeof logAudit === 'function') logAudit(`${QOGOZ_ROYXAT_NOMLARI[key]} o'zgartirildi`, list.map(q => `${q.nomi} ${q.format} — ${q.narx} so'm`).join('; '));
        renderQogozJadvali(key);
        showToast(`💾 ${QOGOZ_ROYXAT_NOMLARI[key]} saqlandi!`);
    }

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    // talab: Ofset qog'ozlari jadvali ofset.js dagi ma'lumot va funksiyalardan foydalanadi.
    bolimRoyxatdan('qogoz', {
        talab: ['ofset'],
        init: function () {
            let saved = localStorage.getItem('erp_qogoz_bolimi');
            if (saved) {
                try {
                    let parsed = JSON.parse(saved);
                    Object.keys(QOGOZ_ROYXAT_NOMLARI).forEach(k => {
                        if (parsed && Array.isArray(parsed[k])) qogozBolimi[k] = parsed[k];
                    });
                } catch (e) {
                    console.warn("Qog'oz bo'limi sozlamalarini o'qishda xato:", e);
                }
            }
        }
    });
