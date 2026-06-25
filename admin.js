const AdminMühərriki = {
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

    qoşulmaSorğusuAç: (operatorAdı, operatorVəzifə, onTəsdiq) => {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel w-full max-w-md rounded-2xl p-6 text-center border-cyan-500/30 shadow-2xl scale-95">
                <div class="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl animate-pulse">
                    <i class="fa-solid fa-desktop"></i>
                </div>
                <h3 class="text-base font-bold text-white mb-1">Gələn Uzaqdan Qoşulma Sorğusu</h3>
                <div class="text-left text-xs text-slate-300 mb-5 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 mt-4">
                    <p><strong>Sorğu Göndərən:</strong> <span class="text-cyan-400">${operatorAdı}</span></p>
                    <p><strong>Vəzifə:</strong> <span class="text-slate-400">${operatorVəzifə}</span></p>
                </div>
                <div class="flex space-x-3">
                    <button id="btn-imtina" class="flex-1 bg-slate-900 text-slate-400 py-3 px-4 rounded-xl text-xs font-semibold border border-slate-800">İmtina Et</button>
                    <button id="btn-icaze" class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl text-xs font-semibold shadow-lg">İcazə Ver</button>
                </div>
            </div>
        `;
        container.classList.remove('hidden');
        document.getElementById('btn-imtina').onclick = () => { container.classList.add('hidden'); onTəsdiq(false); };
        document.getElementById('btn-icaze').onclick = () => { container.classList.add('hidden'); onTəsdiq(true); };
    },

    // admin.js daxilində müvafiq funksiyaları bu obyektlərlə əvəzləyin:
    sorğularıYüklə: async () => {
        if (!supabase) return;
        
        const { data: profiles, error } = await supabase
            .from('profiles')
            .eq('is_approved', false);
    
        const tbody = document.getElementById('admin-pending-table');
        const emptyState = document.getElementById('admin-empty-state');
        
        if (error || !profiles || profiles.length === 0) {
            tbody.innerHTML = "";
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        tbody.innerHTML = profiles.map(p => `
            <tr id="row-${p.id}" class="hover:bg-slate-900/30 transition">
                <td class="p-4 font-semibold text-white">${p.last_name} ${p.first_name} ${p.patronymic}</td>
                <td class="p-4 text-slate-400">${p.region} / ${p.office_name}</td>
                <td class="p-4 text-slate-400">${p.department} / <span class="text-cyan-400 font-medium">${p.role_title}</span></td>
                <td class="p-4 font-mono text-slate-500">Əməkdaş v1.0</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="AdminMühərriki.hesabıTəsdiqlə('${p.id}', false)" class="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 text-[11px] py-1 px-2.5 rounded border border-red-500/10 transition">Rədd Et</button>
                    <button onclick="AdminMühərriki.hesabıTəsdiqlə('${p.id}', true)" class="bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-400 text-[11px] py-1 px-2.5 rounded border border-emerald-500/10 transition font-semibold">Təsdiqlə ✓</button>
                </td>
            </tr>
        `).join('');
    },
    
    hesabıTəsdiqlə: async (userId, status) => {
        if (!supabase) return;
        
        if (status) {
            const { error } = await supabase
                .from('profiles')
                .update({ is_approved: true })
                .eq('id', userId);
    
            if (!error) {
                AdminMühərriki.mesajGöstər("Əməkdaş uğurla təsdiqləndi.", "success");
                document.getElementById(`row-${userId}`)?.remove();
                AdminMühərriki.sorğularıYüklə();
            }
        } else {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (!error) {
                AdminMühərriki.mesajGöstər("Sorğu silindi və rədd edildi.", "error");
                document.getElementById(`row-${userId}`)?.remove();
                AdminMühərriki.sorğularıYüklə();
            }
        }
    }
};
