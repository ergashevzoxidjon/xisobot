function openFullCalcInfoModal() {
    let overlay = document.getElementById('fullCalcInfoOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.getElementById('fullCalcInfoGate').style.display = 'block';
    document.getElementById('fullCalcInfoContent').style.display = 'none';
    document.getElementById('fullCalcInfoError').style.display = 'none';
    let pinInput = document.getElementById('fullCalcInfoPinInput');
    pinInput.value = '';
    setTimeout(() => pinInput.focus(), 50);
}

function closeFullCalcInfoModal() {
    let overlay = document.getElementById('fullCalcInfoOverlay');
    if (overlay) overlay.style.display = 'none';
}

async function submitFullCalcInfoPin() {
    let pin = document.getElementById('fullCalcInfoPinInput').value;
    // Xisobot ichida: admin akkauntining paroli serverda tekshiriladi; mustaqil rejimda — eski PIN
    let isAdmin = window.XIS
        ? (await adminTasdiq(pin)).ok
        : (Array.isArray(usersDb) && usersDb.some(u => u.role === 'admin' && u.pin === pin));
    if (!isAdmin) {
        document.getElementById('fullCalcInfoError').style.display = 'block';
        return;
    }
    document.getElementById('fullCalcInfoGate').style.display = 'none';
    document.getElementById('fullCalcInfoContent').style.display = 'block';
    renderFullCalcInfoBody();
}

// currentCalcResult'dagi barcha hisob-kitob qismlarini (tafsilot, miqdor, marja, baza narx,
// birlik narx, jami summa) to'liq, o'qilishi qulay shaklda ko'rsatadi — har qanday mahsulot
// turi uchun umumiy (calculate() ichida to'ldiriladi).
function renderFullCalcInfoBody() {
    let r = currentCalcResult || {};
    let body = document.getElementById('fullCalcInfoBody');
    if (!body) return;

    let detailLines = (r.details || '-').split(' | ').map(line => `<div style="padding:4px 0; border-bottom:1px dashed #e2e8f0;">${line}</div>`).join('');

    const row = (label, val, bold) => `<tr><td style="padding:6px 0; color:var(--text-muted);">${label}</td><td style="padding:6px 0; text-align:right; ${bold ? 'font-weight:700; color:var(--primary);' : 'font-weight:600;'}">${val}</td></tr>`;

    // NIMA va NECHTA ishlatilgani, hamda har birining tannarxi (marjasiz) — faqat ofset
    // asosidagi turlarda (Papka/Kalendar/Poligrafiya) to'ldiriladi.
    let costItemsHtml = '';
    if (Array.isArray(r.costItems) && r.costItems.length > 0) {
        let itemRows = r.costItems.map(ci => `
            <tr>
                <td style="padding:6px 0; color:var(--text-main);">${ci.label}</td>
                <td style="padding:6px 0; text-align:center; color:var(--text-muted); white-space:nowrap;">${ci.qty || ''}</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; white-space:nowrap;">${(ci.total || 0).toLocaleString()} so'm</td>
            </tr>`).join('');
        let tannarxJami = r.costItems.reduce((sum, ci) => sum + (ci.total || 0), 0);
        costItemsHtml = `
            <div style="margin-bottom:14px;">
                <div style="font-weight:700; margin-bottom:6px;">Nima va nechta ishlatilgan (tannarx, marjasiz):</div>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:2px solid #e2e8f0;">
                            <th style="text-align:left; padding:4px 0; font-size:0.78rem; color:var(--text-muted);">Nomi</th>
                            <th style="text-align:center; padding:4px 0; font-size:0.78rem; color:var(--text-muted);">Miqdori</th>
                            <th style="text-align:right; padding:4px 0; font-size:0.78rem; color:var(--text-muted);">Narxi</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                    <tfoot>
                        <tr style="border-top:2px solid #e2e8f0;">
                            <td style="padding:6px 0; font-weight:700;" colspan="2">Jami tannarx (marjasiz)</td>
                            <td style="padding:6px 0; text-align:right; font-weight:700;">${tannarxJami.toLocaleString()} so'm</td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;
    }

    let rows = [];
    rows.push(row('Mahsulot', r.name || r.productType || '-'));
    rows.push(row('Miqdor', (r.qty || 0).toLocaleString() + ' dona'));
    rows.push(row('Ishxona marjasi', (r.marginPercent != null ? r.marginPercent : '-') + '%'));
    if (r.baseUnitPrice != null) {
        rows.push(row('Baza narx (marjasiz, 1 dona)', Math.round(r.baseUnitPrice).toLocaleString() + " so'm"));
    }
    rows.push(row('Birlik narxi (marja bilan)', (r.unitPrice || 0).toLocaleString() + " so'm"));
    rows.push(row('Birlik narxi × Miqdor', ((r.unitPrice || 0) * (r.qty || 0)).toLocaleString() + " so'm"));
    rows.push(row('JAMI SUMMA', (r.totalPrice || 0).toLocaleString() + " so'm", true));

    body.innerHTML = `
        <div style="margin-bottom:14px;">
            <div style="font-weight:700; margin-bottom:6px;">To'liq tafsilot:</div>
            ${detailLines}
        </div>
        ${costItemsHtml}
        <table style="width:100%; border-collapse:collapse;">${rows.join('')}</table>
    `;
}
