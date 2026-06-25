// Qlobal Proqram Vəziyyəti (State)
const ADSEA_DATA = {
    cariİstifadəçi: { adSoyad: "Qərib Səfərov", vəzifə: "Sistem Administratoru", idarə: "Mərkəzi Aparat" },
    cihazKodu: "455 129 803",
    daxiliIp: "10.40.12.85",
    // Region və Şöbələr üzrə tam strukturlaşdırılmış işçi siyahısı (Sürətli axtarış üçün)
    əməkdaşlar: [
        { id: 1, ad: "Elnur Məmmədov", rayon: "Bərdə", idarə: "Bərdə SMSİİ", vəzifə: "Baş Mühəndis", kod: "123 456 789", status: "online" },
        { id: 2, ad: "Asif Həsənov", rayon: "Kəlbəcər", idarə: "Kəlbəcər SMSİİ", vəzifə: "Sistem Operatoru", kod: "987 654 321", status: "online" },
        { id: 3, ad: "Vüqar Əliyev", rayon: "Gəncə", idarə: "Gəncə Regional İdarəsi", vəzifə: "Aparat Rəhbəri", kod: "456 123 789", status: "offline" },
        { id: 4, ad: "Rəşad Hüseynov", rayon: "Xaçmaz", idarə: "Xaçmaz Şöbəsi", vəzifə: "Mütəxəssis", kod: "321 654 987", status: "online" }
    ],
    // Operativliyi təmin etmək üçün son daxil olunan kompüterlərin siyahısı
    keçmişBağlantılar: [
        { ad: "Asif Həsənov", təfərrüat: "Kəlbəcər SMSİİ - Sistem Operatoru", kod: "987 654 321", tarix: "Bugün, 14:20" },
        { ad: "Elnur Məmmədov", təfərrüat: "Bərdə SMSİİ - Baş Mühəndis", kod: "123 456 789", tarix: "Dünən, 10:45" }
    ]
};

function AnaPaneliYüklə() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex h-screen overflow-hidden bg-slate-950">
            
            <!-- SOL PANEL: Şəhər/Rayon və Struktur Üzrə Səliqəli Qruplaşdırılmış İşçi Siyahısı -->
            <aside class="w-85 bg-slate-900/40 border-r border-slate-900 flex flex-col justify-between z-10">
                <div>
                    <!-- Qurum Başlığı -->
                    <div class="p-5 border-b border-slate-900 flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
                            A
                        </div>
                        <div>
                            <h1 class="font-bold text-sm tracking-wide text-white">ADSEA DESK</h1>
                            <p class="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Dövlət Su Ehtiyatları</p>
                        </div>
                    </div>

                    <!-- Canlı Profil -->
                    <div class="p-3.5 mx-4 my-4 rounded-xl bg-slate-950/40 border border-slate-900 flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-slate-900 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><i class="fa-solid fa-user-shield text-xs"></i></div>
                        <div class="overflow-hidden">
                            <h4 class="text-xs font-bold text-slate-200 truncate">${ADSEA_DATA.cariİstifadəçi.adSoyad}</h4>
                            <p class="text-[10px] text-slate-500 font-medium truncate">${ADSEA_DATA.cariİstifadəçi.vəzifə}</p>
                        </div>
                    </div>

                    <!-- PRO UI UX: Struktur və Əməkdaş Axtarış Bölməsi -->
                    <div class="px-4 mb-4">
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
                            <input type="text" id="sidebar-search" oninput="əməkdaşAxtar(this.value)" placeholder="Şəhər, rayon, ad və ya idarə ara..." 
                                class="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-500/40 transition">
                        </div>
                    </div>

                    <!-- Əməkdaşların Struktur Siyahısı -->
                    <div class="px-4">
                        <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-1">Əməkdaşlar Kataloqu</h3>
                        <div id="employee-list" class="space-y-1 overflow-y-auto max-h-[calc(100vh-290px)] pr-1">
                            <!-- Dinamik qruplaşmış siyahı bura dolacaq -->
                        </div>
                    </div>
                </div>

                <!-- Alt məlumat paneli -->
                <div class="p-4 border-t border-slate-900/60 bg-slate-950/20 text-center">
                    <p class="text-[10px] text-slate-500 font-mono">Daxili Şəbəkə IP: <span class="text-cyan-500/70">${ADSEA_DATA.daxiliIp}</span></p>
                </div>
            </aside>

            <!-- SAĞ PANEL: Əsas İdarəetmə və Əməliyyat Sahəsi -->
            <main class="flex-1 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/70 p-6 flex flex-col justify-between overflow-y-auto">
                
                <!-- Üst İnformasiya Barı -->
                <div class="flex justify-between items-center bg-slate-900/30 border border-slate-900/60 p-3.5 rounded-xl backdrop-blur-md">
                    <div class="flex items-center space-x-2.5">
                        <span class="flex h-2 w-2 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span class="text-xs text-slate-400 font-medium">Bağlantı Rejimi: <strong class="text-emerald-400 font-semibold font-mono">Hazır</strong></span>
                    </div>
                    <div class="text-[11px] text-slate-500 font-medium">
                        Sistem Nəzarəti: <span class="text-cyan-400 font-semibold">ADSEA Qorunma Şəbəkəsi ✓</span>
                    </div>
                </div>

                <!-- MƏRKƏZİ BLOKLAR (Yuxarı qaldırılmış tənzimləmə ilə) -->
                <div class="max-w-4xl w-full mx-auto space-y-6 my-auto pt-2">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <!-- BLOK 1: Sizin Masaüstünüz (Bu Kompüter) -->
                        <div class="glass-panel rounded-xl p-5 flex flex-col justify-between min-h-[170px] transition-all hover:border-slate-800">
                            <div>
                                <div class="flex items-center space-x-2.5 mb-2.5">
                                    <div class="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs"><i class="fa-solid fa-display"></i></div>
                                    <h2 class="text-xs font-bold text-slate-200">Bu Cihazın Ünvanı</h2>
                                </div>
                                <p class="text-[11px] text-slate-400 leading-relaxed">Agentliyin daxilindən kompüterinizə qoşulmaq istəyən əməkdaşa bu unikal kodu təqdim edin.</p>
                            </div>
                            <div class="bg-slate-950/80 border border-slate-900 rounded-lg p-3 flex justify-between items-center mt-3">
                                <span class="text-xl font-mono font-bold tracking-wider text-white">${ADSEA_DATA.cihazKodu}</span>
                                <button onclick="koduKopyala()" class="p-1.5 hover:bg-slate-900 rounded-md text-slate-500 hover:text-cyan-400 transition text-xs"><i class="fa-regular fa-copy"></i></button>
                            </div>
                        </div>

                        <!-- BLOK 2: Uzaq İş Masasına Qoşulma Paneli -->
                        <div class="glass-panel rounded-xl p-5 flex flex-col justify-between min-h-[170px] border-cyan-500/5 transition-all hover:border-cyan-500/10">
                            <div>
                                <div class="flex items-center space-x-2.5 mb-2.5">
                                    <div class="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs"><i class="fa-solid fa-network-wired"></i></div>
                                    <h2 class="text-xs font-bold text-slate-200">Uzaq İş Masasına Qoşulma</h2>
                                </div>
                                <p class="text-[11px] text-slate-400 leading-relaxed">Qoşulmaq və yardım göstərmək istədiyiniz kompüterin 9 rəqəmli kodunu daxil edin.</p>
                            </div>
                            <div class="space-y-2 mt-3">
                                <input type="text" id="target-code-input" placeholder="000 000 000" maxlength="11"
                                    class="w-full bg-slate-950/80 border border-slate-900 rounded-lg py-2.5 px-4 text-lg font-mono text-center tracking-widest text-cyan-400 placeholder-slate-700 outline-none neon-border-cyan transition">
                                <button onclick="bağlantıBaşlat()" class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-blue-600/10">
                                    <i class="fa-solid fa-plug text-[10px]"></i> <span>Bağlantı Qur</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- OPERATİV KEÇMİŞ: Son Daxil Olunmuş Kompüterlərin Siyahısı -->
                    <div class="glass-panel rounded-xl p-4">
                        <div class="flex items-center space-x-2 mb-3">
                            <i class="fa-solid fa-clock-rotate-left text-xs text-slate-500"></i>
                            <h3 class="text-xs font-bold text-slate-300">Son Daxil Olduğunuz Kompüterlər</h3>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${ADSEA_DATA.keçmişBağlantılar.map(keçmiş => `
                                <div onclick="koduSahəyəYaz('${keçmiş.kod}')" class="bg-slate-950/50 border border-slate-900/60 rounded-lg p-3 flex justify-between items-center hover:border-cyan-500/20 cursor-pointer transition group">
                                    <div class="overflow-hidden pr-2">
                                        <h4 class="text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition truncate">${keçmiş.ad}</h4>
                                        <p class="text-[10px] text-slate-500 truncate mt-0.5">${keçmiş.təfərrüat}</p>
                                        <span class="text-[9px] text-slate-600 font-medium block mt-1"><i class="fa-regular fa-calendar-days mr-0.5"></i> ${keçmiş.tarix}</span>
                                    </div>
                                    <div class="text-right flex flex-col items-end shrink-0">
                                        <span class="text-[11px] font-mono font-bold text-slate-400 group-hover:text-white">${keçmiş.kod}</span>
                                        <span class="text-[9px] text-cyan-500 bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10 mt-1 font-medium opacity-0 group-hover:opacity-100 transition">Sürətli Seç</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>

                <!-- Alt Korporativ Qorunma Bölməsi -->
                <div class="text-center text-[11px] text-slate-600 border-t border-slate-900/40 pt-3">
                    <i class="fa-solid fa-lock text-cyan-500/30 mr-1"></i> Bu proqram yalnız Azərbaycan Dövlət Su Ehtiyatları Agentliyinin daxili audit və kibertəhlükəsizlik qaydalarına uyğun istifadə edilə bilər.
                </div>
            </main>
        </div>
    `;

    // Giriş maskası: 9 rəqəmli format (123 456 789)
    document.getElementById('target-code-input').addEventListener('input', function(e) {
        let v = this.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let matches = v.match(/\d{1,3}/g);
        let match = matches && matches.join(' ') || '';
        this.value = match.substring(0, 11);
    });

    // Əməkdaş kataloqunu ilkin yükləmə
    əməkdaşAxtar("");
}

function əməkdaşAxtar(axtarışMətni) {
    const listContainer = document.getElementById('employee-list');
    if (!listContainer) return;

    const filtrli = ADSEA_DATA.əməkdaşlar.filter(e => 
        e.ad.toLowerCase().includes(axtarışMətni.toLowerCase()) ||
        e.rayon.toLowerCase().includes(axtarışMətni.toLowerCase()) ||
        e.idarə.toLowerCase().includes(axtarışMətni.toLowerCase())
    );

    if (filtrli.length === 0) {
        listContainer.innerHTML = `<p class="text-[11px] text-slate-600 text-center py-4">Heç bir uyğun əməkdaş tapılmadı</p>`;
        return;
    }

    listContainer.innerHTML = filtrli.map(e => `
        <div onclick="koduSahəyəYaz('${e.kod}')" class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer transition border border-transparent hover:border-slate-800/80 group">
            <div class="flex items-center space-x-2.5 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full shrink-0 ${e.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <div class="overflow-hidden">
                    <p class="text-xs font-semibold text-slate-300 group-hover:text-white truncate">${e.ad}</p>
                    <p class="text-[10px] text-slate-500 truncate mt-0.5">${e.rayon} | ${e.idarə}</p>
                </div>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-600 group-hover:text-cyan-400 shrink-0 ml-2">${e.kod}</span>
        </div>
    `).join('');
}

function koduSahəyəYaz(kod) {
    const input = document.getElementById('target-code-input');
    if (input) {
        input.value = kod;
        AdminMühərriki.mesajGöstər("Kompüter kodu daxil edildi: " + kod, "info");
    }
}

function koduKopyala() {
    navigator.clipboard.writeText(ADSEA_DATA.cihazKodu);
    AdminMühərriki.mesajGöstər("Şəxsi kodunuz kopyalandı", "success");
}

function bağlantıBaşlat() {
    const kodInput = document.getElementById('target-code-input').value;
    if (kodInput.length < 11) {
        AdminMühərriki.mesajGöstər("Zəhmət olmasa 9 rəqəmli kompüter kodunu tam yazın.", "error");
        return;
    }

    // Müvafiq əməkdaşı tapıb simulyasiya edirik (Gələcəkdə Supabase datası ilə əvəzlənəcək)
    const hədəfƏməkdaş = ADSEA_DATA.əməkdaşlar.find(e => e.kod === kodInput) || { ad: "Naməlum Əməkdaş", idarə: "Regional Filial" };

    AdminMühərriki.qoşulmaSorğusuAç(ADSEA_DATA.cariİstifadəçi.adSoyad, `${ADSEA_DATA.cariİstifadəçi.idarə} - ${ADSEA_DATA.cariİstifadəçi.vəzifə}`, (təsdiqləndi) => {
        if (təsdiqləndi) {
            AdminMühərriki.mesajGöstər(`${hədəfƏməkdaş.ad} ilə WebRTC təhlükəsiz bağlantısı qurulur...`, "success");
        } else {
            AdminMühərriki.mesajGöstər("Qoşulma sorğusu rədd edildi və ya imtina olundu.", "error");
        }
    });
}

// Proqramın işə salınması
document.addEventListener('DOMContentLoaded', () => {
    // İlkin olaraq əsas idarəetmə panelini yükləyirik
    AnaPaneliYüklə();
});
