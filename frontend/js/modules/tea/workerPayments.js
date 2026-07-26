// ============================================
// TALAEN FARM - Worker Payments History
// ============================================

class TeaWorkerPayments {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">💰 My Payments</h1><p class="text-stone-500 text-sm mt-1">Your payment history</p></div>
            <div id="wpayContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaWorkerPayments.load();
    }

    static async load() {
        try {
            const res = await api.getPaymentHistory();
            if (res.success && res.payments.length > 0) {
                const payments = res.payments;
                const totalReceived = payments.reduce((s,p) => s + parseFloat(p.net_pay||0), 0);
                
                document.getElementById('wpayContent').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30 mb-6">
                        <p class="text-xs font-medium text-emerald-600 uppercase mb-2">Total Received</p>
                        <p class="text-3xl font-bold text-emerald-700">KES ${totalReceived.toFixed(2)}</p>
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div class="overflow-x-auto"><table class="responsive-table w-full"><thead><tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider"><th class="px-4 py-3">Date</th><th class="px-4 py-3">Gross Pay</th><th class="px-4 py-3">Debt</th><th class="px-4 py-3">Net Pay</th><th class="px-4 py-3">Kg</th></tr></thead><tbody class="divide-y divide-stone-100">
                            ${payments.map(p => `<tr class="hover:bg-stone-50"><td class="px-4 py-3">${new Date(p.settlement_date).toLocaleDateString('en-GB')}</td><td class="px-4 py-3">KES ${parseFloat(p.gross_pay).toFixed(2)}</td><td class="px-4 py-3 text-red-600">KES ${parseFloat(p.total_debt).toFixed(2)}</td><td class="px-4 py-3 font-bold text-emerald-700">KES ${parseFloat(p.net_pay).toFixed(2)}</td><td class="px-4 py-3">${p.kg_settled} kg</td></tr>`).join('')}
                        </tbody></table></div>
                    </div>`;
            } else {
                document.getElementById('wpayContent').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-money-bill-wave text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No payments received yet.</p></div>';
            }
        } catch (e) { document.getElementById('wpayContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load.</p>'; }
    }
}
