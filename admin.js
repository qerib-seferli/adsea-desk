const AdminMühərriki = {
    // Qlobal daxili mesaj qutusu (Alert əvəzi)
    mesajGöstər: (mesaj, tip = "info") => {
        const container = document.getElementById('alert-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast glass-panel p-4 rounded-xl shadow-xl flex items-center space-x-3 text-xs font-medium max-w-sm border-l-4 ${
            tip === "success" ? "border-l-emerald-500 text-emerald-400" : 
            tip === "error" ? "border-l-red-500 text-red-400" : "border-l-cyan-500 text-cyan-400"
        }`;
        
        const ikon = tip === "success" ? "fa-circle-check" : tip === "error" ? "fa-circle-xmark" : "fa-circle-info";
        toast.innerHTML = `<i class="fa-solid ${ikon} text-base"></i> <span>${mesaj}</span>`;
        
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = "slideInRight 0.3s reverse forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Qoşulma sorğusu pəncərəsi (Modal)
    qoşulmaSorğusuAç: (operatorAdı, operatorVəzifə, onTəsdiq) => {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel w-full max-w-md rounded-2xl p-6 text-center border-cyan-500/30 shadow-2xl scale-95 transition-transform duration-300">
                <div class="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl animate-pulse">
                    <i class="fa-solid fa-desktop"></i>
                </div>
                <h3 class="text-base font-bold text-white mb-1">Gələn Uzaqdan Qoşulma Sorğusu</h3>
                <p class="text-xs text-slate-400 mb-4">ADSEA Daxili Təhlükəsizlik Protokolu</p>
                <div class="text-left text-xs text-slate-300 mb-5 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <p><strong>Sorğu Göndərən:</strong> <span class="text-cyan-400">${operatorAdı}</span></p>
                    <p><strong>Strukturu / Vəzifəsi:</strong> <span class="text-slate-400">${operatorVəzifə}</span></p>
                    <p class="text-[11px] text-amber-400 pt-2 border-t border-slate-800/60"><i class="fa-solid fa-triangle-exclamation mr-1"></i> İcazə versəniz, qarşı tərəf siçan və klaviaturaya tam sahib olacaq.</p>
                </div>
                <div class="flex space-x-3">
                    <button id="btn-imtina" class="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 px-4 rounded-xl text-xs font-semibold transition border border-slate-800">İmtina Et</button>
                    <button id="btn-icaze" class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 px-4 rounded-xl text-xs font-semibold transition shadow-lg shadow-cyan-500/20">İcazə Ver</button>
                </div>
            </div>
        `;

        container.classList.remove('hidden');
        
        document.getElementById('btn-imtina').onclick = () => { container.classList.add('hidden'); onTəsdiq(false); };
        document.getElementById('btn-icaze').onclick = () => { container.classList.add('hidden'); onTəsdiq(true); };
    }
};
