const AZ_CITY_REGIONS = [
    'Abşeron', 'Ağcabədi', 'Ağdam', 'Ağdaş', 'Ağdərə', 'Ağstafa', 'Ağsu', 'Alabaşlı', 'Astara', 'Babək', 'Bakı', 'Balakən', 'Beyləqan', 'Bərdə', 'Biləsuvar', 'Culfa', 'Cəbrayıl', 'Cəlilabad', 'Daşkəsən', 'Dəliməmmədli', 'Füzuli', 'Goranboy', 'Göyçay', 'Göygöl', 'Göytəpə', 'Gədəbəy', 'Gəncə', 'Hacıqabul', 'Horadiz', 'Xaçmaz', 'Xankəndi', 'Xocalı', 'Xocavənd', 'Xudat', 'Xızı', 'İmişli', 'İsmayıllı', 'Kəlbəcər', 'Kəngərli', 'Kürdəmir', 'Laçın', 'Lerik', 'Liman', 'Lənkəran', 'Masallı', 'Mingəçevir', 'Naftalan', 'Naxçıvan', 'Neftçala', 'Oğuz', 'Ordubad', 'Qax', 'Qazax', 'Qobustan', 'Quba', 'Qubadlı', 'Qusar', 'Qəbələ', 'Saatlı', 'Sabirabad', 'Salyan', 'Samux', 'Siyəzən', 'Sumqayıt', 'Sədərək', 'Tərtər', 'Tovuz', 'Ucar', 'Xırdalan', 'Yardımlı', 'Yevlax', 'Zaqatala', 'Zəngilan', 'Zərdab', 'Şabran', 'Şahbuz', 'Şamaxı', 'Şəki', 'Şəmkir', 'Şərur', 'Şirvan', 'Şuşa'
];

// İstifadəçi Təhlükəsizlik və Hesab Vəziyyəti Seansları (Session)
const İstifadəçiSistemi = {
    // Supabase Auth Qeydiyyat funksiyası (Gövdrə qurulacaq addım)
    qeydiyyatYarat: async (data) => {
        console.log("Supabase qeydiyyat datası hazırlandı", data);
        // İnteqrasiya zamanı bura doldurulacaq
    },
    
    // Daxil olma icazə yoxlanışı
    girişYoxla: async (email, password) => {
        // İnteqrasiya zamanı auth.signInWithPassword işləyəcək
    }
};

function GözləməEkranıYüklə() {
    const app = document.getElementById('app');
    if(!app) {
        // Əgər register səhifəsindədirsə bütün body-ni gözləmə rejiminə keçiririk
        document.body.innerHTML = `
            <div class="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 font-sans">
                <div class="glass-panel max-w-xl w-full rounded-2xl p-8 border-cyan-500/10 shadow-2xl text-center">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 mb-5">
                        <i class="fa-solid fa-shield-halved text-white text-2xl animate-pulse"></i>
                    </div>
                    <h2 class="text-xl font-bold text-white">Qeydiyyat Sorğunuz Göndərildi</h2>
                    <p class="text-xs text-slate-400 mt-2 leading-relaxed">Sistem təhlükəsizliyi səbəbindən kənar sızmaların qarşısını almaq üçün Mərkəzi Aparatın Administrator təsdiqi tələb olunur.</p>
                    <div class="bg-slate-900/40 border border-slate-950 rounded-xl p-4 text-center text-xs text-amber-400 font-medium my-5">
                        <i class="fa-solid fa-clock mr-1"></i> Hesabınız yoxlanılır. Təsdiq bildirişi gəldikdən sonra giriş edə bilərsiniz.
                    </div>
                    <a href="login" class="text-xs text-slate-500 hover:text-cyan-400 underline transition">Giriş ekranına qayıt</a>
                </div>
            </div>
        `;
        return;
    }
}
