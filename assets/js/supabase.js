// ADSEA Desk - Supabase Canlı Əlaqə Modulu
const SUPABASE_URL = "https://hdpdykooqirguwnojovb.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA";

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ŞəbəkəMühərriki = {
    kanal: null,
    cihazıOnlineEt: async (istifadəçiId, profilData) => {
        if (!supabase) return;
        ŞəbəkəMühərriki.kanal = supabase.channel('online-əməkdaşlar', {
            config: { presence: { key: istifadəçiId } }
        });

        ŞəbəkəMühərriki.kanal.on('presence', { event: 'sync' }, () => {
            const state = ŞəbəkəMühərriki.kanal.presenceState();
            if (typeof UI_AğacYenilə === 'function') UI_AğacYenilə(state);
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await ŞəbəkəMühərriki.kanal.track({
                    id: istifadəçiId,
                    ad: profilData.first_name,
                    soyad: profilData.last_name,
                    ata_adı: profilData.patronymic,
                    rayon: profilData.region,
                    idarə_adı: profilData.office_name,
                    bölmə: profilData.department,
                    vəzifə: profilData.role_title,
                    onlineAt: new Date().toISOString()
                });
            }
        });
    }
};

const BazaMühərriki = {
    qeydiyyatYarat: async (email, password, profilData) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı qurula bilmədi." } };
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) return { error: authError };

        const { error: profilError } = await supabase.from('profiles').insert([{
            id: authData.user.id,
            first_name: profilData.ad,
            last_name: profilData.soyad,
            patronymic: profilData.ata_adı,
            region: profilData.rayon,
            office_name: profilData.idarə_adı,
            department: profilData.bölmə,
            role_title: profilData.vəzifə,
            is_approved: false,
            is_admin: false
        }]);

        if (profilError) return { error: profilError };
        return { data: authData };
    },

    görüşGirişi: async (email, password) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı qurula bilmədi." } };
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) return { error: authError };

        const { data: profil, error: profilError } = await supabase
            .from('profiles').select('*').eq('id', authData.user.id).single();

        if (profilError || !profil) return { error: { message: "Profil məlumatları tapılmadı və ya təsdiqlənməyib." } };
        if (!profil.is_approved) return { error: { message: "Hesabınız Mərkəzi Aparat tərəfindən hələ təsdiqlənməyib!" } };

        localStorage.setItem('adsea_user', JSON.stringify(profil));
        return { data: { user: authData.user, profil } };
    }
};

const AdminMühərriki = {
    mesajGöstər: (mesaj, tip = "info") => {
        const container = document.getElementById('alert-container');
        if (!container) return;
        const colorMap = {
            success: "border-cyan-500 bg-slate-900 text-cyan-400",
            error: "border-red-500 bg-slate-900 text-red-400",
            info: "border-blue-500 bg-slate-900 text-blue-400"
        };
        const iconMap = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
        const el = document.createElement('div');
        el.className = `alert-toast flex items-center space-x-3 border-l-4 p-4 rounded-r-xl shadow-2xl glass-panel text-xs font-semibold ${colorMap[tip]}`;
        el.innerHTML = `<i class="fa-solid ${iconMap[tip]} text-base"></i><span>${mesaj}</span>`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
};
