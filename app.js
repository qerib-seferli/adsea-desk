// ADSEA Desk - Frontend UI Mühərriki

const state = {
    user: {
        name: "Qərib Səfərov",
        role: "Sistem Administratoru",
        isApproved: true
    },
    myCode: "455 129 803", // Nümunə daxili unikal ID
    myIp: "10.40.12.85",   // Agentliyin daxili IP strukturu
    connectionStatus: "Ready", // Ready, Connecting, Connected
    regions: [
        { id: 1, name: "Bərdə Rayon Şöbəsi", code: "123 456 789", status: "online" },
        { id: 2, name: "Gəncə Regional İdarəsi", code: "987 654 321", status: "online" },
        { id: 3, name: "Xaçmaz Şöbəsi", code: "456 123 789", status: "offline" },
        { id: 4, name: "Şəki Regional İdarəsi", code: "321 654 987", status: "online" }
    ]
};

function renderApp() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <!-- SOL SIDEBAR: Regionlar və Filiallar -->
        <aside class="w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between">
            <div>
                <!-- Loqo və Başlıq -->
                <div class="p-6 border-b border-slate-800 flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center neon-glow-blue">
                        <i class="fa-solid font-bold text-white text-lg">A</i>
                    </div>
                    <div>
                        <h1 class="font-bold text-md tracking-wide">ADSEA DESK</h1>
                        <p class="text-xs text-cyan-400 font-medium">Dövlət Su Ehtiyatları</p>
                    </div>
                </div>

                <!-- İşçi Profil Məlumatı -->
                <div class="p-4 mx-4 my-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-cyan-500/30">
                            <i class="fa-solid fa-user text-xs text-cyan-400"></i>
                        </div>
                        <div class="overflow-hidden">
                            <h4 class="text-xs font-semibold truncate">${state.user.name}</h4>
                            <span class="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 font-mono">
                                ${state.user.role}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Regional Bölmələr Siyahısı -->
                <div class="px-4">
                    <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Regional Şöbələr</h3>
                    <div class="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                        ${state.regions.map(region => `
                            <div onclick="selectRegion('${region.code}')" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition group border border-transparent hover:border-slate-800">
                                <div class="flex items-center space-x-3 overflow-hidden">
                                    <span class="w-2 h-2 rounded-full ${region.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}"></span>
                                    <p class="text-xs font-medium text-slate-300 group-hover:text-white truncate">${region.name}</p>
                                </div>
                                <span class="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">${region.code}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Alt tərəf: Sistem tənzimləmələri -->
            <div class="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
                <p class="text-[10px] text-slate-500">Veb ID: <span class="text-slate-400 font-mono">${state.myIp}</span></p>
                <p class="text-[9px] text-slate-600 mt-0.5">ADSEA Təhlükəsizlik Protokolu v1.0</p>
            </div>
        </aside>

        <!-- SAĞ PANEL: İdarəetmə Mərkəzi -->
        <main class="flex-1 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-8 flex flex-col justify-between overflow-y-auto">
            
            <!-- Üst Status Bar -->
            <div class="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl backdrop-blur-md">
                <div class="flex items-center space-x-3">
                    <span class="flex h-3 w-3 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                    <span class="text-xs font-medium text-slate-300">Sistem Statusu: <strong class="text-cyan-400 font-mono">${state.connectionStatus}</strong></span>
                </div>
                <div class="text-xs text-slate-400">
                    Sistem Admin Təsdiqi: <span class="text-emerald-400 font-semibold">Aktivdir ✓</span>
                </div>
            </div>

            <!-- Mərkəzi Qoşulma Blokları -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto max-w-5xl w-full mx-auto">
                
                <!-- BLOK 1: Sizin Masaüstünüz (Bu Kompüter) -->
                <div class="glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <i class="fa-solid fa-display"></i>
                            </div>
                            <h2 class="text-sm font-semibold text-slate-200">Bu Cihazın Ünvanı</h2>
                        </div>
                        <p class="text-xs text-slate-400 mb-4">Başqa əməkdaşın sizin kompüterə qoşulması üçün bu 9 rəqəmli kodu ona təqdim edin.</p>
                    </div>
                    <div>
                        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <span id="my-code" class="text-2xl font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                ${state.myCode}
                            </span>
                            <button onclick="copyMyCode()" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- BLOK 2: Uzaqdan Qoşulma Paneli -->
                <div class="glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[220px] border-cyan-500/10">
                    <div>
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <i class="fa-solid fa-network-wired"></i>
                            </div>
                            <h2 class="text-sm font-semibold text-slate-200">Uzaq İş Masasına Qoşulma</h2>
                        </div>
                        <p class="text-xs text-slate-400 mb-4">Qoşulmaq istədiyiniz regionun, idarənin və ya əməkdaşın 9 rəqəmli kodunu daxil edin.</p>
                    </div>
                    <div class="space-y-3">
                        <div class="relative">
                            <input type="text" id="target-code" placeholder="000 000 000" maxlength="11"
                                class="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3.5 px-4 text-xl font-mono text-center tracking-widest text-cyan-400 placeholder-slate-600 outline-none neon-border-cyan transition">
                        </div>
                        <button onclick="startConnectionSim()" class="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-lg shadow-blue-600/10">
                            <i class="fa-solid fa-plug"></i>
                            <span>Bağlantı Qur</span>
                        </button>
                    </div>
                </div>

            </div>

            <!-- Alt Məlumat Paneli -->
            <div class="text-center text-xs text-slate-500">
                <i class="fa-solid fa-shield-halved text-cyan-500/50 mr-1"></i> Bütün bağlantılar daxilində WebRTC və End-to-End şifrələmə tətbiq olunur.
            </div>
        </main>
    `;
    
    // Kod formalaşdırıcı (Məsələn: 123456789 -> 123 456 789 edir avtomatik)
    document.getElementById('target-code')?.addEventListener('input', function(e) {
        let v = this.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let matches = v.match(/\d{1,3}/g);
        let match = matches && matches.join(' ') || '';
        this.value = match.substring(0, 11);
    });
}

// Kod kopyalama funksiyası
function copyMyCode() {
    navigator.clipboard.writeText(state.myCode);
    alert("Kod kopyalandı: " + state.myCode);
}

// Region seçildikdə inputa yazılması
function selectRegion(code) {
    const input = document.getElementById('target-code');
    if(input) input.value = code;
}

// Qoşulma Simulyasiyası və Qarşı tərəfə gedən "Qərib Səfərov" bildirişi Modalı
function startConnectionSim() {
    const targetCode = document.getElementById('target-code').value;
    if(targetCode.length < 11) {
        alert("Zəhmət olmasa 9 rəqəmli kodu tam daxil edin.");
        return;
    }
    
    // Modalı ekrana basırıq (Qarşı tərəfdə bu pəncərənin necə görünəcəyini simulyasiya edirik)
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50";
    modal.id = "sim-modal";
    modal.innerHTML = `
        <div class="glass-panel w-full max-w-md rounded-2xl p-6 text-center border-cyan-500/30">
            <div class="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl animate-pulse">
                <i class="fa-solid fa-desktop"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Gələn Qoşulma Sorğusu</h3>
            <p class="text-xs text-slate-300 mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                Mərkəzi Aparatın əməkdaşı <strong class="text-cyan-400">${state.user.name}</strong> (${state.user.role}) sizin kompüterinizə uzaqdan nəzarət etmək istəyir.
            </p>
            <div class="flex space-x-3">
                <button onclick="closeModal(false)" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-xs font-medium transition">
                    İmtina Et
                </button>
                <button onclick="closeModal(true)" class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2.5 px-4 rounded-xl text-xs font-medium transition shadow-lg shadow-cyan-500/20">
                    İcazə Ver (Bağlan)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeModal(isAccepted) {
    document.getElementById('sim-modal').remove();
    if(isAccepted) {
        alert("Bağlantı uğurla quruldu! WebRTC işə düşür. (Növbəti mərhələdə canlı ekran bura inteqrasiya olacaq)");
    }
}

// Proqramı başladırıq
document.addEventListener('DOMContentLoaded', renderApp);
