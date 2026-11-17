// Hisob-kitob regressiya testlari uchun holatlar ("oltin namunalar").
// Har bir holat: ilovani toza (standart narxlar bilan) ochadi, mahsulot kalkulyatorini ishga tushiradi,
// adadni kiritadi (va kerak bo'lsa sozlash(w) bilan tanlovlarni o'zgartiradi) va chiqqan narxni
// kutilgan.js dagi qiymat bilan solishtiradi.
//
// Yangi holat qo'shish: shu ro'yxatga qator qo'shing, sahifani "?yozib" bilan oching, chiqqan
// kutilgan qiymatni kutilgan.js ga ko'chiring.  Narx ATAYLAB o'zgartirilgan bo'lsa (masalan formula yangilandi) —
// kutilgan.js ni ham yangilang.
//
// w — sinalayotgan ilova oynasi; "let" bilan e'lon qilingan sozlamalarga w.eval('nom') orqali murojaat qilinadi.
window.HOLATLAR = [
    // ---------- Poligrafiya ----------
    { id: 'flayer_500',      tur: 'flayer',      adad: 500 },
    { id: 'flayer_5000',     tur: 'flayer',      adad: 5000 },
    { id: 'listovka_1000',   tur: 'listovka',    adad: 1000 },
    { id: 'listovka_10000',  tur: 'listovka',    adad: 10000 },
    { id: 'buklet_2000',     tur: 'buklet',      adad: 2000 },
    { id: 'doorhanger_3000', tur: 'doorhanger',  adad: 3000 },
    { id: 'bloknot_100',     tur: 'bloknot',     adad: 100 },
    { id: 'bloknot_500_qattiq', tur: 'bloknot',  adad: 500,
      sozlash: w => { w.eval('bloknotConfig.qattiqMuqova.pricePerUnit = 2000'); w.toggleBloknotExtra('qattiq'); } },
    { id: 'papka_500',       tur: 'papka',       adad: 500 },
    { id: 'paket_300',       tur: 'paket',       adad: 300 },
    { id: 'kalendar_100',    tur: 'kalendar',    adad: 100 },
    { id: 'kubarik_100',     tur: 'kubarik',     adad: 100 },
    { id: 'kubarik_1000',    tur: 'kubarik',     adad: 1000 },
    { id: 'konvert_1000',    tur: 'konvert',     adad: 1000 },
    { id: 'otkritka_300',    tur: 'otkritka',    adad: 300 },
    { id: 'diplom_50',       tur: 'diplom',      adad: 50 },
    { id: 'katalog_100',     tur: 'katalog',     adad: 100 },
    { id: 'vizitka_ofset_5000', tur: 'vizitka',  adad: 5000,
      sozlash: w => { w.eval("vizitkaSelected.chop = 'ofset'"); } },
    { id: 'vizitka_raqamli_300', tur: 'vizitka', adad: 300,
      sozlash: w => {
          w.eval("digitalPapersDatabase.push({ name: 'Karton 300g', q_eni: 320, q_boyi: 450, p_eni: 310, p_boyi: 440, price1: 2000, price2: 3000 })");
          w.eval("vizitkaSelected.chop = 'sifravoy'");
      } },
    { id: 'stiker_ofset_ploter_6000', tur: 'stiker', adad: 6000 },
    { id: 'stiker_ofset_visochka_6000', tur: 'stiker', adad: 6000, sozlash: w => w.selectStikerKesish('visochka') },
    { id: 'stiker_raqamli_500', tur: 'stiker',   adad: 500 },

    // ---------- Suvenir ----------
    { id: 'ruchka_100',      tur: 'ruchka',      adad: 100 },
    { id: 'termos_50',       tur: 'termos',      adad: 50 },
    { id: 'plagetkalar_20',  tur: 'plagetkalar', adad: 20 },
    { id: 'soat_10',         tur: 'soat',        adad: 10 },
    { id: 'naborlar_20',     tur: 'naborlar',    adad: 20 },
    { id: 'yejidnevnik_30',  tur: 'yejidnevnik', adad: 30 },

    // ---------- Tekstil ----------
    { id: 'futbolka_50',     tur: 'futbolka',    adad: 50 },
    { id: 'kepka_100',       tur: 'kepka',       adad: 100 },
    { id: 'svitshot_30',     tur: 'svitshot',    adad: 30 },

    // ---------- Reklama ----------
    { id: 'baner_1',         tur: 'baner',       adad: 1 },
    { id: 'orakal_2',        tur: 'orakal',      adad: 2 },
    { id: 'rollup_1',        tur: 'rollup',      adad: 1 },
    { id: 'tablichka_5',     tur: 'tablichka',   adad: 5 },
    { id: 'nastolniy_tablichka_5', tur: 'nastolniy_tablichka', adad: 5 },
    { id: 'stend_600x900',   tur: 'stend',       adad: 1,
      sozlash: w => {
          w.eval("stendConfig.materiallar[0].narx = 300000; stendConfig.chopTurlari[0].narx = 40000");
      } },
    { id: 'stend_sigmaydi',  tur: 'stend',       adad: 1,
      sozlash: w => {
          w.eval("stendConfig.materiallar[0].narx = 300000; stendConfig.chopTurlari[0].narx = 40000");
          w.document.getElementById('stendX').value = 1300;
          w.document.getElementById('stendY').value = 2500;
      } },

    // ---------- Pechat kalkulyatorlari ----------
    { id: 'ofset_pechat_1000',    tur: 'ofset_pechat',    adad: 1000 },
    { id: 'sifravoy_pechat_500',  tur: 'sifravoy_pechat', adad: 500 }
];
