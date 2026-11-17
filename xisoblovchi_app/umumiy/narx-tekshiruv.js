// ====================== ADMIN: "NARXLARNI TEKSHIRISH" PANELI ======================
// Admin bosh ekranida ikki xil muammoni ko'rsatadi:
//   1) KIRITILMAGAN narxlar — qiymat 0 yoki yo'q, shu sabab kalkulyator narx chiqara olmaydi ("—").
//   2) BOSHLANG'ICH (taxminiy) narxlar — dastur o'zi qo'ygan namunaviy qiymatlar; admin hali o'sha bo'limni
//      saqlab tasdiqlamagan (Stiker, Kubarik quti, Reklama stendlari).
// Har bir qatordagi "Ochish" tugmasi o'sha mahsulotning admin sahifasiga olib boradi.
// Bu fayl boshqa bo'limlar o'zgaruvchilariga faqat xavfsiz (try/catch) murojaat qiladi: biror bo'lim yuklanmagan
// bo'lsa, panel qolgan tekshiruvlarni baribir ko'rsatadi.

const NARX_TASDIQ_KALITI = 'erp_narx_tasdiqlangan';

function narxTasdiqlanganlar() {
    try { return JSON.parse(localStorage.getItem(NARX_TASDIQ_KALITI) || '[]'); } catch (e) { return []; }
}

// Bo'lim saqlanganda chaqiriladi: "bu bo'limdagi boshlang'ich narxlar admin tomonidan ko'rib chiqildi"
function narxTasdiqla(kalit) {
    try {
        let list = narxTasdiqlanganlar();
        if (!list.includes(kalit)) {
            list.push(kalit);
            localStorage.setItem(NARX_TASDIQ_KALITI, JSON.stringify(list));
        }
    } catch (e) { /* xotira to'la bo'lsa ham saqlash jarayoni to'xtamasin */ }
}

function narxMahsulotNomi(kalit) {
    try {
        for (let bolim of Object.keys(allCategories)) {
            let m = allCategories[bolim].find(x => x.key === kalit);
            if (m) return m.name;
        }
    } catch (e) { /* ro'yxat yo'q */ }
    return kalit;
}

function narxMuammolari() {
    const natija = [];
    const qosh = (kalit, nima, tur) => natija.push({ kalit, nom: narxMahsulotNomi(kalit), nima, tur });
    const sinab = fn => { try { fn(); } catch (e) { /* o'sha bo'lim yuklanmagan — o'tkazib yuboriladi */ } };
    const tasdiq = narxTasdiqlanganlar();
    const saqlangan = k => { try { return localStorage.getItem(k) !== null; } catch (e) { return false; } };

    // ---- Stend ----
    sinab(() => {
        stendConfig.materiallar.filter(m => !(parseFloat(m.narx) > 0)).forEach(m => qosh('stend', `Material «${m.nomi}» narxi (so'm/kv.m) kiritilmagan`, 'nol'));
        stendConfig.chopTurlari.filter(c => !(parseFloat(c.narx) > 0)).forEach(c => qosh('stend', `Chop «${c.nomi}» narxi (so'm/kv.m) kiritilmagan`, 'nol'));
    });

    // ---- Stiker ----
    sinab(() => {
        stikerConfig.shakllar.forEach(s => {
            if (!(parseFloat(s.ploterNarxi) > 0)) qosh('stiker', `«${s.nomi}»: ploter kesish narxi kiritilmagan`, 'nol');
            if (!(parseFloat(s.pichoqNarxi) > 0)) qosh('stiker', `«${s.nomi}»: pichoq narxi (visochka) kiritilmagan`, 'nol');
        });
        stikerConfig.qogozlar.forEach(q => {
            if (!(parseFloat(q.ofsetNarx) > 0) && !(parseFloat(q.raqamliNarx) > 0)) qosh('stiker', `«${q.nomi || 'Nomsiz'}» samokleykasi: Ofset ham, Raqamli ham narxi yo'q`, 'nol');
        });
        if (!saqlangan('erp_stiker_config')) qosh('stiker', "Boshlang'ich (taxminiy) narxlar: ploter, pichoq va samokleyka — haqiqiy narxlarni kiriting va saqlang", 'taxminiy');
    });

    // ---- Bloknot: Qattiq muqova ----
    sinab(() => {
        if (!(parseFloat(bloknotConfig.qattiqMuqova.pricePerUnit) > 0)) qosh('bloknot', "Qattiq muqova narxi (so'm/dona) kiritilmagan", 'nol');
    });

    // ---- Kubarik: quti qog'ozi Ofset bazasida bormi ----
    sinab(() => {
        kubarikConfig.turlar.forEach(t => {
            let nom = t.idishPaperType || 'Karton', gsm = parseInt(t.idishGsm) || 300;
            let bor = ofsetRawPapers.some(p => p.name === nom && p.gsm === gsm && Object.values(p.prices || {}).some(v => v > 0));
            if (!bor) qosh('kubarik', `«${t.name}»: quti qog'ozi ${nom} ${gsm}gr Ofset bazasida narxi yo'q`, 'nol');
        });
        if (!saqlangan('erp_kubarik_config')) qosh('kubarik', "Boshlang'ich quti sozlamalari (qog'oz, format, 1 varaqdagi quti soni) — tekshirib saqlang", 'taxminiy');
    });

    // ---- Vizitka: tanlangan chop turlari uchun qog'oz va hisob ----
    sinab(() => {
        vizitkaConfig.turlar.forEach(t => {
            let ruxsat = vizitkaRuxsatEtilgan(t);
            if (ruxsat.includes('sifravoy')) {
                let bor = digitalPapersDatabase.some(p => (p.name || '').toLowerCase().startsWith((t.paperType || '').toLowerCase()) && parseInt((/(\d+)/.exec(p.name || '') || [])[1]) === parseInt(t.gsm));
                if (!bor) qosh('vizitka', `«${t.nomi}»: ${t.paperType} ${t.gsm}gr qog'ozi Raqamli (Sifravoy) pechat bazasida yo'q`, 'nol');
            }
            if (ruxsat.includes('ofset')) {
                let bor = ofsetRawPapers.some(p => p.name === t.paperType && p.gsm === parseInt(t.gsm) && Object.values(p.prices || {}).some(v => v > 0));
                if (!bor) qosh('vizitka', `«${t.nomi}»: ${t.paperType} ${t.gsm}gr qog'ozi Ofset bazasida narxi yo'q`, 'nol');
            }
            let hisoblanmaydi = ruxsat.filter(k => !VIZITKA_HISOBLANADIGAN.includes(k)).map(k => VIZITKA_CHOP_TURLARI[k]);
            if (hisoblanmaydi.length) qosh('vizitka', `«${t.nomi}»: ${hisoblanmaydi.join(', ')} hisobi hali sozlanmagan (menejerga "mutaxassisga bog'laning" chiqadi)`, 'keyin');
        });
    });

    // ---- Reklama: tayyor o'lchamli mahsulotlar (Roll Up, Pauk, PopUp, PromoStoyka, Tablichka...) ----
    sinab(() => {
        // Tablichka va Nastolniy tablichka — mahsulotlar katalogi (reklama.js tablichkaDatabase), o'z tekshiruvi pastda
        reklamaStendTypes.filter(t => t !== 'stend' && !tablichkaTurlar.includes(t)).forEach(t => {
            (reklamaStendSizeDatabase[t] || []).forEach(s => {
                let tierBor = Array.isArray(s.tierPrices) && s.tierPrices.some(v => v > 0);
                if (!(parseFloat(s.price) > 0) && !tierBor) qosh(t, `«${s.label}» narxi kiritilmagan`, 'nol');
            });
            if (!tasdiq.includes('reklama_' + t)) qosh(t, "Boshlang'ich (demo) narxlar — haqiqiy narxlarni kiritib saqlang", 'taxminiy');
        });
    });

    // ---- Tablichka mahsulotlari ----
    sinab(() => {
        tablichkaTurlar.forEach(t => {
            (tablichkaDatabase[t] || []).forEach(it => {
                if (tablichkaChopRuxsat(it).length === 0) qosh(t, `«${it.name}» narxi kiritilmagan`, 'nol');
            });
            if (!tasdiq.includes('reklama_' + t) && (tablichkaDatabase[t] || []).length > 0) qosh(t, "Boshlang'ich (demo) narxlar — haqiqiy narxlarni kiritib saqlang", 'taxminiy');
        });
    });

    // ---- Suvenir modellari ----
    sinab(() => {
        Object.keys(pensDatabase).forEach(k => {
            (pensDatabase[k] || []).forEach(p => {
                let tierBor = Array.isArray(p.tiers) && p.tiers.some(t => parseFloat(t.basePrice) > 0);
                if (!(parseFloat(p.basePrice) > 0) && !tierBor) qosh(k, `Model «${p.name}» (${p.id}) narxi kiritilmagan`, 'nol');
            });
        });
    });

    // ---- Taxi ----
    sinab(() => {
        if (!(taxiNarxi > 0)) qosh('poligrafiya', "Taxi narxi 0 — buyurtmalarga taxi xarajati qo'shilmaydi (ataylab bo'lsa, e'tiborsiz qoldiring)", 'keyin');
    });

    return natija;
}

function narxTekshiruvChiz() {
    let box = document.getElementById('narxTekshiruvBox');
    if (!box) return;
    let m;
    try { m = narxMuammolari(); } catch (e) { box.innerHTML = ''; return; }
    let nol = m.filter(x => x.tur === 'nol'), taxminiy = m.filter(x => x.tur === 'taxminiy'), keyin = m.filter(x => x.tur === 'keyin');
    let esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    if (m.length === 0) {
        box.innerHTML = `<div class="narx-tek narx-tek-yaxshi">✅ Hamma narxlar kiritilgan — to'ldirilmagan narx topilmadi.</div>`;
        return;
    }
    const guruh = (sarlavha, royxat, klass) => royxat.length === 0 ? '' : `
        <div class="narx-tek-guruh ${klass}">
            <div class="narx-tek-guruh-nomi">${sarlavha} (${royxat.length})</div>
            ${royxat.map(x => `
                <div class="narx-tek-qator">
                    <span><b>${esc(x.nom)}</b> — ${esc(x.nima)}</span>
                    <button type="button" class="btn btn-outline" onclick="openProductManager('${x.kalit}', '${esc(x.nom).replace(/'/g, "\\'")}')">Ochish →</button>
                </div>`).join('')}
        </div>`;
    box.innerHTML = `
        <details class="narx-tek ${nol.length ? 'narx-tek-ogoh' : 'narx-tek-malumot'}" ${nol.length ? 'open' : ''}>
            <summary>🔎 Narxlarni tekshirish: <b>${nol.length}</b> ta kiritilmagan · <b>${taxminiy.length}</b> ta boshlang'ich (taxminiy)${keyin.length ? ` · ${keyin.length} ta keyinga qoldirilgan` : ''}</summary>
            ${guruh('❗ Narxi kiritilmagan', nol, 'narx-tek-nol')}
            ${guruh("⚠️ Boshlang'ich (taxminiy) narxlar — haqiqiylarini kiriting", taxminiy, 'narx-tek-taxminiy')}
            ${guruh('⏳ Keyinga qoldirilgan', keyin, 'narx-tek-keyin')}
        </details>`;
}
