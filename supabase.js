// ADSEA Desk - Supabase Canlı Əlaqə Modulu
const SUPABASE_URL = "https://hdpdykooqirguwnojovb.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA";

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ŞəbəkəMühərriki = {
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
                    region: rayon,
                    onlineAt: new Date().toISOString()
                });
            }
        });
    }
};

const BazaMühərriki = {
    qeydiyyatYarat: async (email, password, profilData) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı qurula bilmədi." } };
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) return { error: authError };

        // ASCII sütun adları ilə təhlükəsiz insert
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

    girişYoxla: async (email, password) => {
        if (!supabase) return { error: { message: "Supabase bağlantısı qurula bilmədi." } };

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) return { error: authError };

        const { data: profil, error: profilError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profilError || !profil) return { error: { message: "Profil verilənləri mövcud deyil." } };
        
        return { data: { user: authData.user, profil: profil } };
    }
};
