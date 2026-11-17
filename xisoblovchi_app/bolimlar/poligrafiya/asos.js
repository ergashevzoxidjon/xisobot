// Poligrafiya bo'limi — Umumiy sozlamalar: o'lchamlar, grammajlar, Ofset/Raqamli mahsulot sozlamasi, Bloknot sozlamasi.
// Barcha poligrafiya fayllari bitta umumiy global ko'lamni bo'lishadi va index.html da quyidagi tartibda yuklanadi:
// asos → bloknot → varaqli → diplom → katalog → paket → kubarik → papka → kalendar → vizitka → stiker → dvigatel → poligrafiya (ro'yxatdan o'tkazish).

    let poligrafiyaSizeLabels = {
        flayer: "97x210mm",
        listovka: "148x210mm",
        doorhanger: "95x210mm",
        buklet: "210x297mm",
        bloknot: "105x148mm",
        paket: "250x350mm",
        kalendar: "297x420mm",
        papka: "220x310mm",
        kubarik: "90x90x90mm",
        konvert: "110x220mm",
        otkritka: "100x150mm",
        diplom: "210x297mm",
        katalog: "210x297mm",
        vizitka: "90x50mm",
        stiker: "50x50mm"
    };

    let poligrafiyaSideTypes = {
        flayer: 1.6, listovka: 1.6, doorhanger: 1.6, buklet: 1.6, bloknot: 1.6,
        paket: 1.6, kalendar: 1.6, papka: 1.6, kubarik: 1.6, konvert: 1.6, otkritka: 1.6, diplom: 1.6, katalog: 1.6,
        vizitka: 1.6, stiker: 1.6
    };

    // Bloknot narxi endi (deyarli) to'liq real ishlab chiqarish xarajatlaridan hisoblanadi:
    // usti/osti (Karton) va ichki varoqlar (Ofset 80gr) — Ofset bo'limidagi haqiqiy xom qog'oz/
    // forma/bosma narx bazasidan (calculateOfsetJobFixedSheets), qolgan qismlar (prujina,
    // yig'ish, laminatsiya, tisneniya, 3D lak, taxi) esa admin tomonidan kiritiladigan aniq
    // narxlar. "Adad pog'onasi" (qtyTiers) kabi sun'iy chegirma koeffitsienti endi yo'q —
    // chegirma real qog'oz/bosma narxining o'ziga (yuqori tirajda 1 donaga kamroq forma/bosma
    // to'g'ri kelishiga) allaqachon singdirilgan.
    let bloknotConfig = {
        sizes: [
            { key: 'a6', name: 'A6', label: '105x148mm',
              // a3Share — bitta bloknot uchun usti+osti (jami) 1 A3 listning necha ulushini
              // egallaydi: A6 = 1/4 (bitta A3 listga 4 ta bloknotning usti+ostisi joylashadi).
              a3Share: 0.25,
              coverGsm: 250,           // Usti/osti Karton grammaji (Ofset bo'limi bazasidan)
              // Ichki varoqlar: adad × innerMultiplier = kerakli barg (varoq) soni,
              // so'ng innerDivisor'ga bo'linadi (1 A3 list buklanib shuncha bargga aylanadi).
              innerMultiplier: 30, innerDivisor: 8,
              assemblyPrice: 1500,     // Yig'ish xarajati (majburiy, so'm/dona)
              // Prujina joyi: mijoz tanlaydi, narxi o'lcham bo'yicha farqlanadi
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 300, isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 500, isDefault: false }
              ],
              isDefault: true },
            { key: 'a5', name: 'A5', label: '148x210mm',
              a3Share: 0.5, coverGsm: 250,
              innerMultiplier: 40, innerDivisor: 4,
              assemblyPrice: 2000,
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 500, isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 800, isDefault: false }
              ],
              isDefault: false },
            { key: 'a4', name: 'A4', label: '210x297mm',
              a3Share: 1.0, coverGsm: 250,
              innerMultiplier: 50, innerDivisor: 2,
              assemblyPrice: 2500,
              spring: [
                  { key: 'top',  name: 'Yuqoridan', price: 800,  isDefault: true  },
                  { key: 'side', name: 'Yonidan',   price: 1500, isDefault: false }
              ],
              isDefault: false }
        ],
        // Ichki varoqlar uchun har bir tirajga (buyurtmaga) bir marta qo'shiladigan zapas A3 list
        innerReserveSheets: 100,
        // Laminatsiya — MAJBURIY (mijoz/menejer tanlamaydi), A3 list bo'yicha pog'onali hisob.
        // A3 listlar soni = adad × o'lchamning a3Share'i (usti/osti bilan bir xil sheet asosida).
        laminatsiya: {
            firstPackSheets: 1000,     // birinchi paket - necha A3 list
            firstPackPrice: 350000,    // birinchi paket narxi (minimal to'lov)
            nextSheetPrice: 500        // undan keyingi har bir A3 list
        },
        // Tisneniya: ixtiyoriy (checkbox), dona narxi + bir martalik klishe
        tisneniya: { pricePerUnit: 800, klishePrice: 50000 },
        // 3D lak: ixtiyoriy (checkbox), Tisneniyadan mustaqil — ikkalasi birga tanlanishi mumkin
        lak3d: { pricePerUnit: 1000, klishePrice: 50000 },
        // Qattiq muqova: ixtiyoriy (checkbox), narxi admin kiritadi (so'm/dona) — hisob usuli keyin aniqlanadi
        qattiqMuqova: { pricePerUnit: 0 },
        // Taxi xarajati BU YERDA YO'Q — Bloknot ham "poligrafiya" toifasiga kiradi va umumiy
        // "🚕 Taxi" admin panelidan (umumiy taxiNarxi) avtomatik oladi
        // (calculate() ichida, barcha poligrafiyaKeys mahsulotlariga bir xil qo'llanadi).
        // Mijozga ma'lumot sifatida ko'rsatiladigan matn
        infoText: "Bloknot usti 250-300gr kartondan tayyorlanadi."
    };

    // Mijoz ekranida tanlangan qiymatlar.
    // extras.tisneniya va extras.lak3d — mustaqil checkbox'lar, ikkalasi birga tanlanishi mumkin.
    let bloknotSelected = {
        sizeIndex: 0,
        twoSide: false,
        springIndex: 0,
        extras: { tisneniya: false, lak3d: false, qattiq: false }
    };

    // Har bir grammaj qatori endi o'zining qog'oz TURIGA (paperType: Ofset/Melovka/Karton/
    // Dizayn qog'ozi) ham ega — chunki bir xil gsm qiymati bir nechta qog'oz turida bo'lishi
    // mumkin (masalan Melovka 250gr VA Karton 250gr), va admin qaysi birini nazarda tutayotgani
    // aniq bo'lishi kerak (avval faqat gsm bo'yicha, turini aniqlamasdan qidirilar edi).
    let poligrafiyaGsmDatabase = {
        flayer: [
            { gsm: 115, paperType: 'Melovka', isDefault: false },
            { gsm: 130, paperType: 'Melovka', isDefault: true },
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: false }
        ],
        listovka: [
            { gsm: 115, paperType: 'Melovka', isDefault: false },
            { gsm: 130, paperType: 'Melovka', isDefault: true },
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: false }
        ],
        buklet: [
            { gsm: 150, paperType: 'Melovka', isDefault: false },
            { gsm: 170, paperType: 'Melovka', isDefault: true },
            { gsm: 200, paperType: 'Melovka', isDefault: false },
            { gsm: 300, paperType: 'Melovka', isDefault: false }
        ],
        vizitka: [
            { gsm: 300, paperType: 'Karton', isDefault: true },
            { gsm: 350, paperType: 'Karton', isDefault: false }
        ],
        stiker: [
            { gsm: 80, paperType: 'Ofset', isDefault: true },
            { gsm: 115, paperType: 'Melovka', isDefault: false }
        ],
        doorhanger: [
            { gsm: 250, paperType: 'Karton', isDefault: false },
            { gsm: 300, paperType: 'Karton', isDefault: true },
            { gsm: 350, paperType: 'Karton', isDefault: false },
            { gsm: 400, paperType: 'Karton', isDefault: false }
        ]
        // Konvert va Otkritka — alohida dvigatel (varaqliConfig), qog'ozi Qog'oz bo'limidan
    };
    const POLIGRAFIYA_PAPER_TYPES = ['Ofset', 'Melovka', 'Karton', "Dizayn qog'ozi"];
    let selectedPoligrafiyaGsmIndex = -1;

    // Menejer tanlagan pechat usuli ('ofset' | 'raqamli') va bosma tomoni (1 yoki 2) —
    // narx shu tanlovga qarab Ofset Pechat / Raqamli Pechat bo'limlaridagi haqiqiy
    // qog'oz bazasidan hisoblanadi (pastda calculateResult_poligrafiya ichida).
    let selectedPoligrafiyaEngine = 'ofset';
    let selectedPoligrafiyaSides = 2;

    // ====================== OFSET/RAQAMLI TANLANADIGAN MAHSULOTLAR SOZLAMASI ======================
    // Flayer, Listovka, Buklet, Konvert, Otkritka — umumiy dvigatel (qog'oz grammaji + Ofset yoki
    // Raqamli pechat). Har biri uchun admin belgilaydi:
    //   ofsetMinTiraj  — ofsetda hisoblash uchun eng kam adad. Kiritilgan adad undan kam bo'lsa,
    //                    Ofset tugmasi o'chadi va hisob avtomatik Raqamli (Sifravoy) pechatda bo'ladi.
    //   yoyilganOlcham — bichish (yoyilgan) o'lchami, masalan Konvert 110x220 → 230x330mm.
    //                    Bo'sh bo'lsa, tayyor o'lcham (poligrafiyaSizeLabels) bo'yicha hisoblanadi.
    //   ishlovNomi/ishlovNarxi — qo'shimcha ishlov (vyrubka+skleyka, bigovka), so'm/dona, marjasiz.
    const POLI_DVIGATEL_TURLARI = ['flayer', 'listovka', 'buklet', 'vizitka'];
    let poligrafiyaMahsulotSozlama = {
        flayer:   { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 },
        listovka: { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 },
        buklet:   { ofsetMinTiraj: 1000, yoyilganOlcham: '', ishlovNomi: 'Bigovka (buklash)', ishlovNarxi: 0 },
        vizitka:  { ofsetMinTiraj: 5000, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 },
        stiker:   { ofsetMinTiraj: 5000, yoyilganOlcham: '', ishlovNomi: 'Kesish (vyrubka)', ishlovNarxi: 0 }
    };

    function poliSozlama(type) {
        return poligrafiyaMahsulotSozlama[type] || { ofsetMinTiraj: 0, yoyilganOlcham: '', ishlovNomi: '', ishlovNarxi: 0 };
    }

    function renderAdminPoligrafiyaGsmTable() {
        let grid = document.getElementById('adminPoligrafiyaGsmTableBody');
        if (!grid) return;
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];

        if (list.length === 0) {
            grid.innerHTML = `<div class="poli-gsm-empty">Hozircha grammaj kiritilmagan. Kiritilgan grammajlar Ofset/Raqamli Pechat bo'limidagi qog'oz bazasi bilan solishtirib narxlanadi.</div>`;
            return;
        }

        grid.innerHTML = list.map((g, index) => `
            <div class="poli-gsm-card ${g.isDefault ? 'is-default' : ''}">
                <button class="poli-gsm-delete" title="O'chirish" onclick="deletePoligrafiyaGsmRow(${index})">✕</button>
                <label class="poli-gsm-default-toggle">
                    <input type="radio" name="polgsm_default" id="polgsm_default_${index}" ${g.isDefault ? 'checked' : ''}>
                    <span>${g.isDefault ? '★ Standart' : '☆ Standart qilish'}</span>
                </label>
                <div class="poli-gsm-field">
                    <label>Qog'oz turi</label>
                    <select id="polgsm_type_${index}" class="poli-gsm-type-select" data-ptype="${g.paperType || 'Melovka'}" onchange="this.dataset.ptype = this.value;">
                        ${POLIGRAFIYA_PAPER_TYPES.map(t => `<option value="${t}" ${((g.paperType || 'Melovka') === t) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="poli-gsm-field">
                    <label>Grammaj</label>
                    <div class="poli-gsm-input-wrap">
                        <input type="number" id="polgsm_gsm_${index}" value="${g.gsm}">
                        <span>gr</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ---- Admin: mahsulot sozlamalari (o'lcham, ofset minimal tiraji, qo'shimcha ishlov) ----
    function renderAdminPoliMahsulotSozlama() {
        let card = document.getElementById('poliMahsulotSozlamaCard');
        if (!card) return;
        let key = currentManagingProduct;
        let dvigatelli = POLI_DVIGATEL_TURLARI.includes(key);
        card.style.display = dvigatelli ? 'block' : 'none';
        if (!dvigatelli) return;
        let s = poliSozlama(key);
        let q = id => document.getElementById(id);
        q('poliSozTayyorOlcham').value = poligrafiyaSizeLabels[key] || '';
        q('poliSozYoyilganOlcham').value = s.yoyilganOlcham || '';
        q('poliSozOfsetMin').value = s.ofsetMinTiraj || 0;
        q('poliSozIshlovNomi').value = s.ishlovNomi || '';
        q('poliSozIshlovNarxi').value = s.ishlovNarxi || 0;
    }

    function saveAdminPoliMahsulotSozlama() {
        let key = currentManagingProduct;
        if (!POLI_DVIGATEL_TURLARI.includes(key)) return;
        let q = id => document.getElementById(id);
        let tayyor = q('poliSozTayyorOlcham').value.trim();
        let yoyilgan = q('poliSozYoyilganOlcham').value.trim();
        if (!parsePoligrafiyaSizeLabel(tayyor)) {
            showToast("⚠️ Tayyor o'lchamni \"97x210mm\" ko'rinishida kiriting!");
            return;
        }
        if (yoyilgan && !parsePoligrafiyaSizeLabel(yoyilgan)) {
            showToast("⚠️ Bichish o'lchamini \"230x330mm\" ko'rinishida kiriting yoki bo'sh qoldiring!");
            return;
        }
        poligrafiyaSizeLabels[key] = tayyor;
        poligrafiyaMahsulotSozlama[key] = {
            ofsetMinTiraj: Math.max(0, parseInt(q('poliSozOfsetMin').value) || 0),
            yoyilganOlcham: yoyilgan,
            ishlovNomi: q('poliSozIshlovNomi').value.trim(),
            ishlovNarxi: Math.max(0, parseFloat(q('poliSozIshlovNarxi').value) || 0)
        };
        localStorage.setItem('erp_poligrafiya_size_labels', JSON.stringify(poligrafiyaSizeLabels));
        localStorage.setItem('erp_poligrafiya_mahsulot_sozlama', JSON.stringify(poligrafiyaMahsulotSozlama));
        let m = poligrafiyaMahsulotSozlama[key];
        if (typeof logAudit === 'function') logAudit("Poligrafiya mahsulot sozlamasi o'zgartirildi",
            `${key}: ${tayyor}${yoyilgan ? ' (bichish ' + yoyilgan + ')' : ''}, ofset min ${m.ofsetMinTiraj} dona, ${m.ishlovNomi || 'ishlov'} ${m.ishlovNarxi} so'm`);
        showToast("💾 Mahsulot sozlamalari saqlandi!");
    }

    // Formadagi (hali saqlanmagan) qiymatlarni ro'yxatga o'qiydi. Qator qo'shish/o'chirishda jadval qaytadan
    // chiziladi — bu o'qishsiz admin kiritgan o'zgarishlar (grammaj, qog'oz turi, standart) yo'qolib ketardi.
    function readPoligrafiyaGsmRows() {
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];
        list.forEach((g, index) => {
            let gsmInput = document.getElementById(`polgsm_gsm_${index}`);
            if (!gsmInput) return;
            let typeInput = document.getElementById(`polgsm_type_${index}`);
            let defaultInput = document.getElementById(`polgsm_default_${index}`);
            g.gsm = parseInt(gsmInput.value) || 0;
            if (typeInput) g.paperType = typeInput.value;
            g.isDefault = !!(defaultInput && defaultInput.checked);
        });
        return list;
    }

    function addPoligrafiyaGsmRow() {
        if (!currentManagingProduct) return;
        if (!poligrafiyaGsmDatabase[currentManagingProduct]) poligrafiyaGsmDatabase[currentManagingProduct] = [];
        let list = readPoligrafiyaGsmRows();
        // Doorhanger kabi kartonli mahsulotlarda yangi qator ham Karton bilan boshlansin —
        // qolganlarida Melovka eng ko'p ishlatiladigan standart tur.
        let defaultType = (list.length > 0 && list[list.length - 1].paperType) ? list[list.length - 1].paperType : 'Melovka';
        // Yangi qator mavjud (tur + grammaj) bilan bir xil bo'lib qolmasin: 130 band bo'lsa — shu turdagi eng katta grammajdan keyingisi
        let band = list.filter(g => g.paperType === defaultType).map(g => g.gsm);
        let yangiGsm = 130;
        if (band.includes(yangiGsm)) yangiGsm = Math.max(...band) + 10;
        list.push({ gsm: yangiGsm, paperType: defaultType, isDefault: !list.some(g => g.isDefault) });
        renderAdminPoligrafiyaGsmTable();
    }

    function deletePoligrafiyaGsmRow(index) {
        let list = readPoligrafiyaGsmRows();
        if (!list[index]) return;
        if (confirm("Ushbu grammajni o'chirmoqchimisiz?")) {
            let wasDefault = list[index].isDefault;
            list.splice(index, 1);
            if (wasDefault && list.length > 0) list[0].isDefault = true;
            renderAdminPoligrafiyaGsmTable();
        }
    }

    function saveAllPoligrafiyaGsm() {
        if (!currentManagingProduct) return;
        let list = poligrafiyaGsmDatabase[currentManagingProduct] || [];
        let updated = [];
        for (let index = 0; index < list.length; index++) {
            let gsmInput = document.getElementById(`polgsm_gsm_${index}`);
            if (!gsmInput) continue;
            let typeInput = document.getElementById(`polgsm_type_${index}`);
            let defaultInput = document.getElementById(`polgsm_default_${index}`);
            updated.push({
                gsm: parseInt(gsmInput.value) || 0,
                paperType: typeInput ? typeInput.value : 'Melovka',
                isDefault: defaultInput.checked
            });
        }
        if (updated.length > 0 && !updated.some(g => g.isDefault)) updated[0].isDefault = true;

        // Noto'g'ri yoki takrorlangan qatorlar saqlanmasin (qog'oz bazasida qidirishda adashtiradi)
        if (updated.some(g => !(g.gsm > 0))) { showToast("⚠️ Grammaj 0 dan katta bo'lishi kerak!"); return; }
        let korilgan = new Set();
        for (let g of updated) {
            let kalit = g.paperType + '|' + g.gsm;
            if (korilgan.has(kalit)) { showToast(`⚠️ ${g.paperType} ${g.gsm}gr ikki marta kiritilgan!`); return; }
            korilgan.add(kalit);
        }

        poligrafiyaGsmDatabase[currentManagingProduct] = updated;
        localStorage.setItem('erp_poligrafiya_gsm_db', JSON.stringify(poligrafiyaGsmDatabase));
        if (typeof logAudit === 'function') logAudit("Poligrafiya grammajlari o'zgartirildi", `Mahsulot: ${currentManagingProduct}, ${updated.length} ta grammaj`);
        renderAdminPoligrafiyaGsmTable();
        showToast("💾 Grammajlar saqlandi!");
    }

    function renderPoligrafiyaGsmOptions(gsmList) {
        const group = document.getElementById('poligrafiyaGsmGroup');
        if (!group) return;
        // Bir xil gsm bir nechta qog'oz turida bo'lishi mumkin (masalan Melovka 250gr va
        // Karton 250gr) — shuning uchun tur nomi ham kartochkada ko'rsatiladi.
        group.innerHTML = gsmList.map((g, idx) => `
            <div class="poli-paper-option ${idx === selectedPoligrafiyaGsmIndex ? 'active' : ''}" onclick="selectPoligrafiyaGsm(${idx})">
                <div style="font-size:0.68rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em;">${g.paperType || 'Melovka'}</div>
                <div class="poli-paper-gsm">${g.gsm}<small>gr</small></div>
            </div>
        `).join('');
    }

(window.POLI_QISMLAR = window.POLI_QISMLAR || []).push('asos');
