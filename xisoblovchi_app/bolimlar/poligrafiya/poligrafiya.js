// Poligrafiya bo'limi — ro'yxatdan o'tkazish (init: saqlangan sozlamalarni yuklash). Mahsulotlar kodi shu papkadagi
// asos.js, bloknot.js, varaqli.js, diplom.js, katalog.js, paket.js, kubarik.js, papka.js, kalendar.js, vizitka.js, stiker.js va
// dvigatel.js fayllarida; bu fayl ENG OXIRIDA yuklanadi.

    // ====================== BO'LIMNI RO'YXATDAN O'TKAZISH ======================
    // Bu chaqiruv fayl OXIRIDA turishi shart: fayl oxirigacha xatosiz yuklangandagina
    // bo'lim "ishlayapti" deb belgilanadi. init() — saqlangan (localStorage) ma'lumotlarni
    // yuklaydi; core.js uni xatolikdan himoyalangan holda chaqiradi, shuning uchun bu yerdagi
    // xato faqat shu bo'limni o'chiradi, qolgan bo'limlar ishlayveradi.
    // talab: shu bo'lim ishlashi uchun kerak bo'lgan boshqa bo'limlar (ularning bazasidan foydalanadi).
    // Bo'lim bir nechta fayldan iborat (asos.js ... dvigatel.js). Har bir qism oxirida o'zini POLI_QISMLAR ga yozadi;
    // biror qism xato bilan yuklanmagan bo'lsa — bo'lim ro'yxatdan o'tmaydi va 'ishlamayapti' deb belgilanadi.
    const POLI_KUTILGAN_QISMLAR = ['asos', 'bloknot', 'varaqli', 'diplom', 'katalog', 'paket', 'kubarik', 'papka', 'kalendar', 'vizitka', 'stiker', 'dvigatel'];
    const POLI_YETISHMAYDI = POLI_KUTILGAN_QISMLAR.filter(q => !(window.POLI_QISMLAR || []).includes(q));
    if (POLI_YETISHMAYDI.length) console.error('[Poligrafiya] yuklanmagan qismlar:', POLI_YETISHMAYDI.join(', '));

    if (!POLI_YETISHMAYDI.length) bolimRoyxatdan('poligrafiya', {
        talab: ['ofset', 'sifravoy'],
        init: function () {
            let savedPoligrafiyaSizeLabels = localStorage.getItem('erp_poligrafiya_size_labels');
            if (savedPoligrafiyaSizeLabels) {
                poligrafiyaSizeLabels = { ...poligrafiyaSizeLabels, ...JSON.parse(savedPoligrafiyaSizeLabels) };
            }

            let savedPoligrafiyaGsm = localStorage.getItem('erp_poligrafiya_gsm_db');
            if (savedPoligrafiyaGsm) {
                poligrafiyaGsmDatabase = { ...poligrafiyaGsmDatabase, ...JSON.parse(savedPoligrafiyaGsm) };
            }
            // Bir martalik migratsiya: paperType maydoni qo'shilishidan OLDIN saqlangan
            // qatorlarda bu maydon yo'q — Doorhanger uchun Karton, qolganlari uchun Melovka
            // standart qilib to'ldiramiz (avvalgi xatti-harakat bilan mos: doorhanger allaqachon
            // faqat Karton bilan ishlar edi, qolganlari faqat Melovka bilan).
            Object.keys(poligrafiyaGsmDatabase).forEach(key => {
                let list = poligrafiyaGsmDatabase[key];
                if (!Array.isArray(list)) return;
                list.forEach(g => { if (!g.paperType) g.paperType = (key === 'doorhanger') ? 'Karton' : 'Melovka'; });
            });

            // Otkritka — o'z qog'oz ro'yxati bilan. Eski sxemada qog'ozlar Sifravoy bazasidan olinardi —
            // migrateOtkritkaConfig ularni (narxi bilan) bir marta otkritka ro'yxatiga ko'chiradi.
            let savedOtkritka = localStorage.getItem('erp_otkritka_config');
            if (savedOtkritka) {
                try {
                    otkritkaConfig = migrateOtkritkaConfig(JSON.parse(savedOtkritka), otkritkaConfig);
                } catch (e) {
                    console.warn("Otkritka sozlamalarini o'qishda xato:", e);
                }
            }

            let savedVizitka = localStorage.getItem('erp_vizitka_config');
            if (savedVizitka) {
                try {
                    let vz = JSON.parse(savedVizitka);
                    if (vz && Array.isArray(vz.turlar) && vz.turlar.length) vizitkaConfig = { ...vizitkaConfig, ...vz };
                } catch (e) {
                    console.warn("Vizitka sozlamalarini o'qishda xato:", e);
                }
            }

            let savedStiker = localStorage.getItem('erp_stiker_config');
            if (savedStiker) {
                try {
                    let st = JSON.parse(savedStiker);
                    if (st && typeof st === 'object') stikerConfig = migrateStikerConfig(st, stikerConfig);
                } catch (e) {
                    console.warn("Stiker sozlamalarini o'qishda xato:", e);
                }
            }

            let savedKatalog = localStorage.getItem('erp_katalog_config');
            if (savedKatalog) {
                try {
                    katalogConfig = migrateKatalogConfig(JSON.parse(savedKatalog), katalogConfig);
                } catch (e) {
                    console.warn("Katalog sozlamalarini o'qishda xato:", e);
                }
            }

            let savedDiplom = localStorage.getItem('erp_diplom_config');
            if (savedDiplom) {
                try {
                    let d = JSON.parse(savedDiplom);
                    if (d && typeof d === 'object') {
                        diplomConfig = {
                            zapasVaraq: typeof d.zapasVaraq === 'number' ? d.zapasVaraq : diplomConfig.zapasVaraq,
                            olchamlar: Array.isArray(d.olchamlar) ? d.olchamlar : diplomConfig.olchamlar,
                            qogozlar: Array.isArray(d.qogozlar) ? d.qogozlar : diplomConfig.qogozlar,
                            ramkalar: Array.isArray(d.ramkalar) ? d.ramkalar : diplomConfig.ramkalar
                        };
                    }
                } catch (e) {
                    console.warn("Diplom sozlamalarini o'qishda xato:", e);
                }
            }

            let savedVaraqli = localStorage.getItem('erp_varaqli_config');
            if (savedVaraqli) {
                try {
                    varaqliConfig = migrateVaraqliConfig(JSON.parse(savedVaraqli), varaqliConfig);
                } catch (e) {
                    console.warn("Konvert/Otkritka sozlamalarini o'qishda xato:", e);
                }
            }

            let savedPaket = localStorage.getItem('erp_paket_config');
            if (savedPaket) {
                try {
                    paketConfig = migratePaketConfig(JSON.parse(savedPaket), paketConfig);
                } catch (e) {
                    console.warn("Paket sozlamalarini o'qishda xato:", e);
                }
            }

            let savedKubarik = localStorage.getItem('erp_kubarik_config');
            if (savedKubarik) {
                try {
                    let parsed = JSON.parse(savedKubarik);
                    if (parsed && typeof parsed === 'object') {
                        // versiya < 2: eski turlar (Oq/Rangli/Kleyli/Pechatli) yangi 3 ta turga (idishlik 90x90, 90x130,
                        // termokleylik) almashtirildi — eski turlar ishlatilmaydi, qolgan sozlamalar saqlanadi.
                        let yangi = parsed.versiya >= 3;
                        kubarikConfig = {
                            ...kubarikConfig, ...parsed,
                            versiya: 3,
                            turlar: (yangi && Array.isArray(parsed.turlar)) ? parsed.turlar : kubarikConfig.turlar
                        };
                    }
                } catch (e) {
                    console.warn("Kubarik sozlamalarini o'qishda xato:", e);
                }
            }

            let savedPoliSozlama = localStorage.getItem('erp_poligrafiya_mahsulot_sozlama');
            if (savedPoliSozlama) {
                try {
                    let parsed = JSON.parse(savedPoliSozlama);
                    Object.keys(parsed || {}).forEach(k => {
                        poligrafiyaMahsulotSozlama[k] = { ...poliSozlama(k), ...parsed[k] };
                    });
                } catch (e) {
                    console.warn("Poligrafiya mahsulot sozlamasini o'qishda xato:", e);
                }
            }

            let savedPoligrafiyaSideTypes = localStorage.getItem('erp_poligrafiya_side_types');
            if (savedPoligrafiyaSideTypes) {
                poligrafiyaSideTypes = { ...poligrafiyaSideTypes, ...JSON.parse(savedPoligrafiyaSideTypes) };
            }

            let savedBloknot = localStorage.getItem('erp_bloknot_config');
            if (savedBloknot) {
                try {
                    bloknotConfig = migrateBloknotConfig(JSON.parse(savedBloknot), bloknotConfig);
                } catch (e) {
                    console.warn('Bloknot sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedPapka = localStorage.getItem('erp_papka_config');
            if (savedPapka) {
                try {
                    let eski = JSON.parse(savedPapka);
                    // Bir martalik ko'chirish: Papka'ning alohida Lak/Tisneniya narxlari (A3/A2) umumiy
                    // pardozlash xizmatlariga — agar umumiy narxlar hali saqlanmagan bo'lsa.
                    if (!ofsetLakTisSaqlangan && eski && (eski.lak || eski.tisneniya)) {
                        ['a3', 'a2'].forEach(m => {
                            if (eski.lak && eski.lak[m] && typeof eski.lak[m] === 'object') ofsetFinishingServices.lak[m] = { ...ofsetFinishingServices.lak[m], ...eski.lak[m] };
                            if (eski.tisneniya && eski.tisneniya[m] && typeof eski.tisneniya[m] === 'object') ofsetFinishingServices.tisneniya[m] = { ...ofsetFinishingServices.tisneniya[m], ...eski.tisneniya[m] };
                        });
                        ofsetLakTisSaqlangan = true;
                        localStorage.setItem('erp_ofset_finishing_services', JSON.stringify(ofsetFinishingServices));
                    }
                    papkaConfig = migratePapkaConfig(eski, papkaConfig);
                } catch (e) {
                    console.warn('Papka sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedKalendar = localStorage.getItem('erp_kalendar_config');
            if (savedKalendar) {
                try {
                    let parsed = JSON.parse(savedKalendar);
                    if (Array.isArray(parsed.subtypes)) {
                        // Admin saqlagan qiymatlarni standart subtypes ustiga qo'shib qo'yamiz — yangi
                        // subtype maydoni keyinchalik qo'shilsa ham eski saqlangan sozlama buzilmaydi.
                        kalendarConfig.subtypes = kalendarConfig.subtypes.map(defSub => {
                            let saved = parsed.subtypes.find(p => p.key === defSub.key);
                            return saved ? { ...defSub, ...saved, extras: { ...defSub.extras, ...(saved.extras || {}) } } : defSub;
                        });
                    }
                } catch (e) {
                    console.warn('Kalendar sozlamalarini o\'qishda xato:', e);
                }
            }

            let savedDoorhanger = localStorage.getItem('erp_doorhanger_config');
            if (savedDoorhanger) {
                try {
                    let parsed = JSON.parse(savedDoorhanger);
                    // Eski saqlangan ma'lumotda visochka narxi alohida bo'lgan bo'lishi mumkin edi —
                    // endi u umumiy ofsetFinishingServices'dan olinadi, bu yerda faqat
                    // yoqilgan/o'chirilgan bayrog'i o'qiladi (mavjud bo'lmasa — standart true).
                    if (typeof parsed.visochkaEnabled === 'boolean') doorhangerConfig.visochkaEnabled = parsed.visochkaEnabled;
                    if (parsed.paperType) doorhangerConfig.paperType = parsed.paperType;
                } catch (e) {
                    console.warn('Doorhanger sozlamalarini o\'qishda xato:', e);
                }
            }

            // Doorhanger 400gr Karton ishlatadi — bu grammaj hali Ofset bazasida yo'q edi,
            // shuning uchun bir martalik (idempotent) qatorni narxi 0 bilan qo'shib qo'yamiz.
            if (!ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === 400)) {
                ofsetRawPapers.push({ name: 'Karton', gsm: 400, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
            }

            // Bir martalik: Paket turlarining standart kartonlari (190/210/230/250) Ofset bazasida bo'lmasa —
            // narxi 0 bilan qo'shiladi (admin Ofset bo'limida narxini kiritadi). Admin keyin o'chirsa,
            // qayta paydo bo'lmasligi uchun bayroq bilan himoyalangan.
            if (!localStorage.getItem('erp_paket_karton_seeded')) {
                let qoshildi = false;
                [190, 210, 230, 250].forEach(g => {
                    if (!ofsetRawPapers.some(p => p.name === 'Karton' && p.gsm === g)) {
                        ofsetRawPapers.push({ name: 'Karton', gsm: g, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                        qoshildi = true;
                    }
                });
                if (qoshildi) localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
                localStorage.setItem('erp_paket_karton_seeded', '1');
            }

            // Bir martalik migratsiya: Kalendar moduli uchun kerakli Melovka/Karton grammajlari
            // Ofset bazasida mavjud bo'lmasa, narxi 0 bilan qo'shib qo'yamiz (admin keyin narxni
            // to'g'rilaydi) — admin keyinchalik shu qatorlarni o'chirsa, qayta paydo bo'lmasligi
            // uchun bitta marta ishlaydigan bayroq bilan himoyalangan.
            if (!localStorage.getItem('erp_kalendar_paper_seeded')) {
                let paperChanged = false;
                [["Melovka", 200], ["Melovka", 300], ["Karton", 300], ["Karton", 350]].forEach(([pName, pGsm]) => {
                    let exists = ofsetRawPapers.some(p => p.name === pName && p.gsm === pGsm);
                    if (!exists) {
                        ofsetRawPapers.push({ name: pName, gsm: pGsm, prices: { "sra3": 0, "620x880": 0, "620x940": 0, "700x1000": 0 } });
                        paperChanged = true;
                    }
                });
                if (paperChanged) localStorage.setItem('erp_ofset_raw_papers', JSON.stringify(ofsetRawPapers));
                localStorage.setItem('erp_kalendar_paper_seeded', '1');
            }
        }
    });
