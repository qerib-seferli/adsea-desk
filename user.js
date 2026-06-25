const AZ_CITY_REGIONS = [
    'Abşeron', 'Ağcabədi', 'Ağdam', 'Ağdaş', 'Ağdərə', 'Ağstafa', 'Ağsu', 'Alabaşlı', 'Astara', 'Babək', 'Bakı', 'Balakən', 'Beyləqan', 'Bərdə', 'Biləsuvar', 'Culfa', 'Cəbrayıl', 'Cəlilabad', 'Daşkəsən', 'Dəliməmmədli', 'Füzuli', 'Goranboy', 'Göyçay', 'Göygöl', 'Göytəpə', 'Gədəbəy', 'Gəncə', 'Hacıqabul', 'Horadiz', 'Xaçmaz', 'Xankəndi', 'Xocalı', 'Xocavənd', 'Xudat', 'Xızı', 'İmişli', 'İsmayıllı', 'Kəlbəcər', 'Kəngərli', 'Kürdəmir', 'Laçın', 'Lerik', 'Liman', 'Lənkəran', 'Masallı', 'Mingəçevir', 'Naftalan', 'Naxçıvan', 'Neftçala', 'Oğuz', 'Ordubad', 'Qax', 'Qazax', 'Qobustan', 'Quba', 'Qubadlı', 'Qusar', 'Qəbələ', 'Saatlı', 'Sabirabad', 'Salyan', 'Samux', 'Siyəzən', 'Sumqayıt', 'Sədərək', 'Tərtər', 'Tovuz', 'Ucar', 'Xırdalan', 'Yardımlı', 'Yevlax', 'Zaqatala', 'Zəngilan', 'Zərdab', 'Şabran', 'Şahbuz', 'Şamaxı', 'Şəki', 'Şəmkir', 'Şərur', 'Şirvan', 'Şuşa'
];

function GözləməEkranıYüklə() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-slate-950 p-6">
            <div class="glass-panel max-w-xl w-full rounded-2xl p-8 border-cyan-500/10 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 mb-4">
                        <i class="fa-solid fa-shield-halved text-white text-2xl"></i>
                    </div>
                    <h2 class="text-xl font-bold text-white">Qeydiyyat Sorğusu Göndərildi</h2>
                    <p class="text-xs text-slate-400 mt-2">Giriş hüququ qazanmaq və sızmaların qarşısını almaq üçün Sistem Administratorunun təsdiqi gözlənilir.</p>
                </div>
                <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center text-xs text-amber-400 font-medium">
                    <i class="fa-solid fa-clock mr-1 animate-spin"></i> Hesabınız təsdiqlənən kimi proqram avtomatik açılacaqdır.
                </div>
            </div>
        </div>
    `;
}
