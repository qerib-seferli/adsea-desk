const AZ_CITY_REGIONS = [
  "Abşeron","Ağcabədi","Ağdam","Ağdaş","Ağdərə","Ağstafa","Ağsu","Astara","Babək","Bakı",
  "Balakən","Beyləqan","Bərdə","Biləsuvar","Culfa","Cəbrayıl","Cəlilabad","Daşkəsən",
  "Füzuli","Gəncə","Göyçay","Göygöl","Hacıqabul","Xaçmaz","Xankəndi","Xocalı","İmişli",
  "İsmayıllı","Kəlbəcər","Kürdəmir","Laçın","Lənkəran","Masallı","Mingəçevir","Naxçıvan",
  "Qazax","Quba","Qusar","Qəbələ","Sabirabad","Sumqayıt","Şamaxı","Şəki","Şəmkir","Şirvan","Şuşa"
];

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const resetForm = document.getElementById("reset-form");
  const regionSelect = document.getElementById("region");

  if (regionSelect) {
    regionSelect.innerHTML = `<option value="">Şəhər / rayon seçin</option>` +
      AZ_CITY_REGIONS.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join("");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      toast("Kimlik yoxlanılır...", "info");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        toast("E-poçt və ya şifrə yanlışdır.", "error");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        toast("Profil tapılmadı.", "error");
        return;
      }

      if (!profile.is_approved) {
        await supabase.auth.signOut();
        toast("Hesabınız hələ admin tərəfindən təsdiqlənməyib.", "warn");
        return;
      }

      toast("Giriş uğurludur.", "success");
      setTimeout(() => go("/"), 500);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();

      const password = document.getElementById("password").value;
      const password2 = document.getElementById("password2").value;

      if (password !== password2) {
        toast("Şifrələr eyni deyil.", "error");
        return;
      }

      const email = document.getElementById("email").value.trim();

      const metadata = {
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        patronymic: document.getElementById("patronymic").value.trim(),
        region: document.getElementById("region").value,
        office_name: document.getElementById("office_name").value.trim(),
        department: document.getElementById("department").value.trim(),
        role_title: document.getElementById("role_title").value.trim()
      };

      toast("Qeydiyyat sorğusu göndərilir...", "info");

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });

      if (error) {
        toast(error.message, "error");
        return;
      }

      await supabase.auth.signOut();

      document.body.innerHTML = `
        <main class="auth-body">
          <section class="auth-card">
            <img src="../foto/Logo.png" class="auth-logo" alt="ADSEA" />
            <h1>Qeydiyyat sorğunuz göndərildi</h1>
            <p>Hesabınız admin tərəfindən təsdiqləndikdən sonra sistemə daxil ola biləcəksiniz.</p>
            <a class="primary-link" href="../login/">Giriş səhifəsinə qayıt</a>
          </section>
        </main>
      `;
    });
  }

  if (resetForm) {
    resetForm.addEventListener("submit", async e => {
      e.preventDefault();

      const email = document.getElementById("reset-email").value.trim();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}${BASE_PATH}/reset-password/`
      });

      if (error) {
        toast(error.message, "error");
        return;
      }

      toast("Bərpa linki e-poçt ünvanınıza göndərildi.", "success");
    });
  }
});
