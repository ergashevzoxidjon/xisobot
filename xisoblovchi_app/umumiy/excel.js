// ====================== EXCEL ORQALI NARXLARNI TO'LDIRISH ======================
// Admin: "📊 Excel shablon" — joriy narxlar (standartlari bilan) Excelga yuklanadi; to'ldirib
// "📤 Excel yuklash" orqali qaytariladi. Faqat qiymatlar yangilanadi va yangi qatorlar qo'shiladi,
// Excelda yo'q qatorlar o'chirilmaydi. Server faylni JSON'ga o'giradi (xisoblovchi_excel.py),
// qiymatlar esa shu yerda joriy JS ma'lumotiga qo'shilib, odatiy yo'l (localStorage -> server-xotira.js)
// bilan bazaga saqlanadi, so'ng sahifa qayta yuklanadi.
//
// EXCEL_BOLIMLAR: sozlama kaliti -> [JS o'zgaruvchi nomi, Excel varaq nomi].
// Yangi sozlama qo'shilsa — shu ro'yxatga qo'shing.

    const EXCEL_BOLIMLAR = {
        erp_default_prices: ['defaultPrices', 'Umumiy narxlar'],
        erp_klishe_prices: ['klisheOneTimePrices', 'Klishe narxlari'],
        erp_taxi_narxi: ['taxiNarxi', 'Taxi narxi'],
        erp_qogoz_bolimi: ['qogozBolimi', "Qog'oz bo'limi"],
        erp_poligrafiya_gsm_db: ['poligrafiyaGsmDatabase', 'Poligrafiya GSM'],
        erp_poligrafiya_mahsulot_sozlama: ['poligrafiyaMahsulotSozlama', 'Poligrafiya sozlama'],
        erp_poligrafiya_size_labels: ['poligrafiyaSizeLabels', "Poligrafiya o'lchamlar"],
        erp_vizitka_config: ['vizitkaConfig', 'Vizitka'],
        erp_bloknot_config: ['bloknotConfig', 'Bloknot'],
        erp_varaqli_config: ['varaqliConfig', 'Konvert (varaqli)'],
        erp_otkritka_config: ['otkritkaConfig', 'Otkritka'],
        erp_diplom_config: ['diplomConfig', 'Diplom'],
        erp_katalog_config: ['katalogConfig', 'Katalog'],
        erp_paket_config: ['paketConfig', 'Paket'],
        erp_kubarik_config: ['kubarikConfig', 'Kubarik'],
        erp_papka_config: ['papkaConfig', 'Papka'],
        erp_kalendar_config: ['kalendarConfig', 'Kalendar'],
        erp_doorhanger_config: ['doorhangerConfig', 'Doorhanger'],
        erp_stiker_config: ['stikerConfig', 'Stiker'],
        erp_ofset_raw_papers: ['ofsetRawPapers', 'Ofset qog\'ozlari'],
        erp_ofset_finishing_services: ['ofsetFinishingServices', 'Ofset xizmatlari'],
        erp_ofset_machine_settings: ['ofsetMachineSettings', 'Ofset mashina'],
        erp_digital_papers_db: ['digitalPapersDatabase', "Sifravoy qog'ozlari"],
        erp_textile_db: ['textileDatabase', 'Textile'],
        erp_textile_dtf_config: ['textileDtfConfig', 'Textile DTF'],
        erp_bayroq_db: ['bayroqDatabase', 'Bayroqlar'],
        erp_pens_db_v3: ['pensDatabase', 'Suvenir (ruchkalar)'],
        erp_tablichka_db: ['tablichkaDatabase', 'Tablichka'],
        erp_reklama_extra_prices: ['reklamaExtraPrices', 'Reklama qo\'shimcha'],
        erp_reklama_max_eni: ['reklamaMaxEni', 'Reklama max eni'],
        erp_reklama_stend_qty_tiers: ['reklamaStendQtyTiers', 'Stend miqdor'],
        erp_reklama_stend_sizes: ['reklamaStendSizeDatabase', "Stend o'lchamlari"],
        erp_stend_config: ['stendConfig', 'Stend'],
        erp_custom_products_v1: ['customProductsDb', 'Maxsus mahsulotlar']
    };

    // Joriy qiymatni o'qish / yozish (let bilan e'lon qilingan global o'zgaruvchilar — bilvosita eval orqali)
    function excelQiymatOl(nom) {
        try { return (0, eval)(nom); } catch (e) { return undefined; }
    }
    function excelQiymatQoy(nom, v) {
        (0, eval)(nom + ' = JSON.parse(' + JSON.stringify(JSON.stringify(v)) + ')');
    }

    function excelPaket() {
        let bolimlar = [];
        Object.keys(EXCEL_BOLIMLAR).forEach(kalit => {
            let [nom, varaq] = EXCEL_BOLIMLAR[kalit];
            let v = excelQiymatOl(nom);
            if (v !== undefined) bolimlar.push({ kalit: kalit, nom: varaq, qiymat: v });
        });
        return bolimlar;
    }

    function excelCsrf() { return (window.XIS && window.XIS.csrf) || ''; }

    async function excelShablonYuklash(tugma) {
        let eski = tugma && tugma.textContent;
        if (tugma) { tugma.disabled = true; tugma.textContent = '⏳ Tayyorlanmoqda…'; }
        try {
            let r = await fetch('excel/shablon', {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': excelCsrf() },
                body: JSON.stringify({ bolimlar: excelPaket() })
            });
            if (!r.ok) throw new Error('Server javobi ' + r.status);
            let blob = await r.blob();
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'xisoblovchi-narxlar.xlsx';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            showToast('📊 Excel shablon yuklandi');
        } catch (e) {
            alert('Excel shablon yuklanmadi: ' + e.message);
        } finally {
            if (tugma) { tugma.disabled = false; tugma.textContent = eski; }
        }
    }

    // ---- Excel qiymatini mavjud qiymat turiga moslash ----
    function excelMosla(eski, yangi) {
        if (yangi === null || yangi === undefined) return { skip: true };
        if (typeof eski === 'number') {
            let n = typeof yangi === 'number' ? yangi : Number(String(yangi).replace(/\s/g, '').replace(',', '.'));
            return isFinite(n) && String(yangi).trim() !== '' ? { v: n } : { xato: true };
        }
        if (typeof eski === 'boolean') {
            if (typeof yangi === 'boolean') return { v: yangi };
            let s = String(yangi).trim().toLowerCase();
            if (['true', 'ha', '1', 'yes'].includes(s)) return { v: true };
            if (['false', "yo'q", 'yoq', '0', 'no'].includes(s)) return { v: false };
            return { xato: true };
        }
        if (typeof eski === 'string') return { v: String(yangi) };
        return { v: yangi };   // yangi katak (eski qiymat yo'q): Excel turida
    }

    function excelYolBol(yol) {
        let res = [], re = /^([^.\[\]]+)|\.([^.\[\]]+)|\[(\d+)\]/, qoldiq = yol;
        while (qoldiq.length) {
            let m = re.exec(qoldiq);
            if (!m) return null;
            res.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : parseInt(m[3], 10)));
            qoldiq = qoldiq.slice(m[0].length);
        }
        return res.length ? res : null;
    }

    // root ichida yo'l bo'yicha qiymatni o'rnatadi. natija: 'ozgardi' | 'yangi' | 'bir xil' | 'xato'
    function excelYolQoy(root, tokens, yangi) {
        let cur = root;
        for (let i = 0; i < tokens.length - 1; i++) {
            let t = tokens[i], keyingi = tokens[i + 1];
            if (cur[t] === null || typeof cur[t] !== 'object') {
                if (cur[t] !== undefined && cur[t] !== null) return 'xato';
                cur[t] = typeof keyingi === 'number' ? [] : {};
            }
            cur = cur[t];
        }
        let oxirgi = tokens[tokens.length - 1];
        let eski = cur[oxirgi];
        let m = excelMosla(eski, yangi);
        if (m.skip) return 'bir xil';
        if (m.xato) return 'xato';
        if (eski === undefined) { cur[oxirgi] = m.v; return 'yangi'; }
        if (eski === m.v) return 'bir xil';
        cur[oxirgi] = m.v;
        return 'ozgardi';
    }

    // Bitta varaqni nusxaga qo'llaydi. Qaytaradi: { qiymat, ozgardi, yangi, xato:[...] }
    function excelVaraqniQollash(joriy, varaq) {
        let nusxa = joriy === undefined ? (varaq.tur === 'jadval' ? [] : {}) : JSON.parse(JSON.stringify(joriy));
        let st = { ozgardi: 0, yangi: 0, xato: [] };
        function hisobla(natija, joy) {
            if (natija === 'ozgardi') st.ozgardi++;
            else if (natija === 'yangi') st.yangi++;
            else if (natija === 'xato') st.xato.push(joy);
        }
        if (varaq.tur === 'daraxt') {
            varaq.qatorlar.forEach(([yol, qiymat]) => {
                if (yol === 'qiymat' && (typeof nusxa !== 'object' || nusxa === null)) {
                    let m = excelMosla(nusxa, qiymat);
                    if (m.xato) st.xato.push(yol);
                    else if (!m.skip && m.v !== nusxa) { nusxa = m.v; st.ozgardi++; }
                    return;
                }
                let t = excelYolBol(yol);
                if (!t || typeof nusxa !== 'object' || nusxa === null) { st.xato.push(yol); return; }
                hisobla(excelYolQoy(nusxa, t, qiymat), yol);
            });
        } else {
            if (!Array.isArray(nusxa)) { st.xato.push('jadval'); return { qiymat: joriy, ...st }; }
            let idUstun = varaq.sarlavha.indexOf('id');
            varaq.qatorlar.forEach((qator, qi) => {
                let item;
                if (idUstun >= 0 && qator[idUstun] !== null) {
                    let id = String(qator[idUstun]);
                    item = nusxa.find(x => x && String(x.id) === id);
                } else if (idUstun < 0) {
                    item = nusxa[qi];
                }
                let yangiQator = !item;
                if (yangiQator) item = {};
                let tegdi = 0;
                varaq.sarlavha.forEach((yol, ci) => {
                    if (!yol || qator[ci] === null || qator[ci] === undefined) return;
                    let t = excelYolBol(yol);
                    if (!t) { st.xato.push(yol); return; }
                    let n = excelYolQoy(item, t, qator[ci]);
                    if (n === 'ozgardi' || n === 'yangi') tegdi++;
                    if (!yangiQator) hisobla(n, `${yol} (${qi + 1}-qator)`);
                    else if (n === 'xato') st.xato.push(`${yol} (${qi + 1}-qator)`);
                });
                if (yangiQator && tegdi > 0) { nusxa.push(item); st.yangi++; }
            });
        }
        return { qiymat: nusxa, ...st };
    }

    async function excelYuklash(fayl) {
        let fd = new FormData();
        fd.append('fayl', fayl);
        let r, j;
        try {
            r = await fetch('excel/oqish', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRFToken': excelCsrf() }, body: fd });
            j = await r.json();
        } catch (e) { alert('Excel fayl o\'qilmadi: ' + e.message); return; }
        if (!r.ok) { alert('Excel fayl o\'qilmadi: ' + (j.xato || r.status)); return; }

        let rejalar = [], jami = { ozgardi: 0, yangi: 0, xato: [] }, bilinmagan = [];
        Object.keys(j.bolimlar).forEach(kalit => {
            let reja = EXCEL_BOLIMLAR[kalit];
            if (!reja) { bilinmagan.push(kalit); return; }
            let joriy = excelQiymatOl(reja[0]);
            let n = excelVaraqniQollash(joriy, j.bolimlar[kalit]);
            jami.ozgardi += n.ozgardi; jami.yangi += n.yangi;
            n.xato.forEach(x => jami.xato.push(reja[1] + ': ' + x));
            if (n.ozgardi || n.yangi) rejalar.push({ kalit: kalit, nom: reja[0], varaq: reja[1], qiymat: n.qiymat, ozgardi: n.ozgardi, yangi: n.yangi });
        });

        if (!rejalar.length) {
            alert('Excelda o\'zgargan qiymat topilmadi — hech narsa yangilanmadi.' +
                (jami.xato.length ? '\n\nXatolar (' + jami.xato.length + '):\n' + jami.xato.slice(0, 10).join('\n') : ''));
            return;
        }
        let matn = `Excel bo'yicha yangilanadi:\n• o'zgargan qiymatlar: ${jami.ozgardi}\n• yangi qator/qiymatlar: ${jami.yangi}\n\nVaraqlar:\n` +
            rejalar.map(x => `  - ${x.varaq}: ${x.ozgardi} o'zgardi, ${x.yangi} yangi`).join('\n');
        if (jami.xato.length) matn += `\n\nO'tkazib yuborilgan noto'g'ri kataklar (${jami.xato.length}):\n` + jami.xato.slice(0, 8).join('\n');
        matn += '\n\nDavom etamizmi? (Excelda yo\'q qatorlar o\'chmaydi. Zaxira: "💾 Zaxira" sahifasidan.)';
        if (!confirm(matn)) return;

        rejalar.forEach(x => {
            excelQiymatQoy(x.nom, x.qiymat);
            localStorage.setItem(x.kalit, JSON.stringify(x.qiymat));
        });
        if (typeof logAudit === 'function') logAudit('Excel orqali narxlar yangilandi', `${jami.ozgardi} o'zgardi, ${jami.yangi} yangi`);
        showToast('✅ Narxlar yangilandi — sahifa qayta yuklanadi…');
        // server-xotira.js saqlashni 0.5 soniyadan keyin yuboradi — tugagach qayta yuklaymiz
        let urinish = 0, kut = setInterval(() => {
            urinish++;
            let band = window.XIS && window.xisSaqlashKutilmoqda && window.xisSaqlashKutilmoqda();
            if (!band || urinish > 40) { clearInterval(kut); location.reload(); }
        }, 250);
    }

    function excelFaylTanla() {
        let inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.xlsx';
        inp.onchange = () => { if (inp.files[0]) excelYuklash(inp.files[0]); };
        inp.click();
    }
