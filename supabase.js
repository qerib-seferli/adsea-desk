const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_URL.supabase.co"; 
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ŞəbəkəMühərriki = {
    // Cari istifadəçinin proqramda aktiv olub-olmadığını yoxlayan Realtime Presence metodu
    cihazıOnlineEt: async (istifadəçiId, cihazKodu, rayon) => {
        if (!supabase) return;
        const kanal = supabase.channel('online-əməkdaşlar', {
            config: { presence: { key: istifadəçiId } }
        });

        kanal.on('presence', { event: 'sync' }, () => {
            const state = kanal.presenceState();
            if(typeof appStateYenilə === 'function') appStateYenilə(state);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await kanal.track({
                    cihazKodu: cihazKodu,
                    rayon: rayon,
                    onlineAt: new Date().toISOString()
                });
            }
        });
    }
};

// Real Verilənlər Bazası Əməliyyat Modulu
const BazaMühərriki = {
    qeydiyyatYarat: async (email, password, profilData) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı yoxdur." } };
        
        // 1. Supabase Auth-da istifadəçi yaradırıq
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) return { error: authError };

        // 2. İstifadəçinin ştat idarə profil məlumatlarını 'profillər' cədvəlinə yazırıq
        const { error: profilError } = await supabase.from('profillər').insert([{
            id: authData.user.id,
            ad: profilData.ad,
            soyad: profilData.soyad,
            ata_adı: profilData.ata_adı,
            rayon: profilData.rayon,
            idarə_adı: profilData.idarə_adı,
            bölmə: profilData.bölmə,
            vəzifə: profilData.vəzifə,
            is_approved: false // Sistem admini təsdiqləməlidir!
        }]);

        if (profilError) return { error: profilError };
        return { data: authData };
    },

    girişYoxla: async (email, password) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı yoxdur." } };

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) return { error: authError };

        // İstifadəçinin admin tərəfindən təsdiqlənib-təsdiqlənmədiyini yoxlayırıq
        const { data: profil, error: profilError } = await supabase
            .from('profillər')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profilError || !profil) return { error: { message: "Profil məlumatı tapılmadı." } };
        
        return { data: { user: authData.user, profil: profil } };
    }
};
