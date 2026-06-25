const AZ_CITY_REGIONS = [
    'Abşeron', 'Ağcabədi', 'Ağdam', 'Ağdaş', 'Ağdərə', 'Ağstafa', 'Ağsu', 'Astara', 'Babək', 'Bakı', 'Balakən', 'Beyləqan', 'Bərdə', 'Biləsuvar', 'Culfa', 'Cəbrayıl', 'Cəlilabad', 'Daşkəsən', 'Dəliməmmədli', 'Füzuli', 'Goranboy', 'Göyçay', 'Göygöl', 'Göytəpə', 'Gədəbəy', 'Gəncə', 'Hacıqabul', 'Horadiz', 'Xaçmaz', 'Xankəndi', 'Xocalı', 'Xocavənd', 'Xhudat', 'Xızı', 'İmişli', 'İsmayıllı', 'Kəlbəcər', 'Kəngərli', 'Kürdəmir', 'Laçın', 'Lerik', 'Liman', 'Lənkəran', 'Masallı', 'Mingəçevir', 'Naftalan', 'Naxçıvan', 'Neftçala', 'Oğuz', 'Ordubad', 'Qax', 'Qazax', 'Qobustan', 'Quba', 'Qubadlı', 'Qusar', 'Qəbələ', 'Saatlı', 'Sabirabad', 'Salyan', 'Samux', 'Siyəzən', 'Sumqayıt', 'Sədərək', 'Tərtər', 'Tovuz', 'Ucar', 'Xırdalan', 'Yardımlı', 'Yevlax', 'Zaqatala', 'Zəngilan', 'Zərdab', 'Şabran', 'Şahbuz', 'Şamaxı', 'Şəki', 'Şəmkir', 'Şərur', 'Şirvan', 'Şuşa'
];

function GözləməEkranıYüklə() {
    document.body.innerHTML = `
        <div class="min-h-screen w-full flex items-center justify-center p-6 text-slate-100">
            <div class="glass-panel max-w-xl w-full rounded-2xl p-8 text-center border-cyan-500/20">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 mb-5">
                    <i class="fa-solid fa-shield-halved text-white text-2xl animate-pulse"></i>
                </div>
                <h2 class="text-xl font-bold text-white tracking-wide">Qeydiyyat Sorğunuz Göndərildi</h2>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">Sistem təhlükəsizliyi və daxili audit səbəbindən kənar sızmaların qarşısını almaq üçün Mərkəzi Aparatın Administrator təsdiqi tələb olunur.</p>
                <div class="bg-slate-950/60 border border-cyan-500/10 rounded-xl p-4 text-center text-xs text-cyan-400 font-medium my-5">
                    <i class="fa-solid fa-clock mr-1 animate-spin"></i> Hesabınız yoxlanılır. Təsdiq bildirişi gəldikdən sonra giriş edə bilərsiniz.
                </div>
                <a href="/login" class="text-xs text-slate-500 hover:text-cyan-400 underline transition">Giriş ekranına qayıt</a>
            </div>
        </div>
    `;
}
