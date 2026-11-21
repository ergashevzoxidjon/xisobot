// ====================== ISHGA TUSHIRISH ======================
// Bu fayl ENG OXIRIDA yuklanadi — barcha bo'lim fayllari (muvaffaqiyatli yoki xato bilan)
// yuklanib bo'lgandan keyin tizimni ishga tushiradi. Qaysi bo'lim ro'yxatdan o'tmagan bo'lsa,
// init() uni o'tkazib yuboradi va bosh sahifada ogohlantirish ko'rsatadi.
//
// Avval saqlangan katta (siqilmagan) rasmlar bo'lsa, ular init() dan OLDIN siqiladi —
// aks holda bo'limlar eski katta rasmlarni xotiraga yuklab, keyingi saqlashda yana
// "exceeded the quota" xatosiga uchraydi. Siqadigan narsa bo'lmasa init() darhol ishlaydi.
(function () {
    let siqish = null;
    try { siqish = saqlanganRasmlarniSiqish(); } catch (e) { siqish = null; }
    if (siqish) {
        siqish.catch(e => console.error('[Xotira] Rasmlarni siqishda xato:', e)).then(() => init());
    } else {
        init();
    }
})();

// Brauzer parol menejeri saqlangan login nomini (masalan "manager5") qidiruv maydoniga o'zi yozib qo'yishi mumkin —
// shunda hamma mahsulot yashirinib, "Hech narsa topilmadi" chiqadi. Foydalanuvchi o'zi yozmagan matnni tozalaymiz.
(function () {
    const tozala = () => {
        const q = document.getElementById('searchInput');
        if (!q || !q.value || document.activeElement === q) return;
        q.value = '';
        if (typeof filterProducts === 'function') filterProducts();
    };
    [0, 300, 1000, 2500].forEach(ms => setTimeout(tozala, ms));
})();

// ====================== PWA: oflayn ishlash va telefonga o'rnatish ======================
// sw.js saytning ildizida turadi (butun sayt uchun amal qiladi). Brauzer qo'llab-quvvatlamasa, file:// da yoki
// sinov oynasida (srcdoc) ochilgan bo'lsa — jimgina o'tkazib yuboriladi, ilovaning o'zi bundan mustaqil ishlaydi.
(function () {
    try {
        // Xisobot ichida (window.XIS) oflayn kesh kerak emas: ma'lumot serverdan keladi va kirish sessiya bilan
        if (window.XIS || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(e => console.warn("[PWA] Service worker ro'yxatdan o'tmadi:", e && e.message));
        });
    } catch (e) { /* PWA ixtiyoriy */ }
})();
