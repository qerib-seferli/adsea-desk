const AZ_CITY_REGIONS = [
  "Abşeron", "Ağcabədi", "Ağdam", "Ağdaş", "Ağdərə", "Ağstafa", "Ağsu", "Astara", "Babək", "Bakı",
  "Balakən", "Beyləqan", "Bərdə", "Biləsuvar", "Culfa", "Cəbrayıl", "Cəlilabad", "Daşkəsən",
  "Füzuli", "Gəncə", "Göyçay", "Göygöl", "Hacıqabul", "Xaçmaz", "Xankəndi", "Xocalı", "İmişli",
  "İsmayıllı", "Kəlbəcər", "Kürdəmir", "Laçın", "Lənkəran", "Masallı", "Mingəçevir", "Naxçıvan",
  "Qazax", "Quba", "Qusar", "Qəbələ", "Sabirabad", "Sumqayıt", "Şamaxı", "Şəki", "Şəmkir", "Şirvan", "Şuşa"
];

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const resetForm = document.getElementById("reset-form");
  const regionSelect = document.getElementById("region");

  if (regionSelect) {
    regionSelect.innerHTML =
      `<option value="">Şəhər / rayon seçin</option>` +
      AZ_CITY_REGIONS.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join("");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      if (!email || !password) {
        toast("E-poçt və şifrə daxil edin.", "error");
        return;
      }

      toast("Kimlik yoxlanılır...", "info");

      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.user) {
        toast("E-poçt və ya şifrə yanlışdır.", "error");
        return;
      }

      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await db.auth.signOut();
        toast("Profil tapılmadı. Adminlə əlaqə saxlayın.", "error");
        return;
      }

      if (!profile.is_approved) {
        await db.auth.signOut();
        toast("Hesabınız hələ admin tərəfindən təsdiqlənməyib.", "warn");
        return;
      }

      toast("Giriş uğurludur.", "success");

      setTimeout(() => {
        go("/");
      }, 500);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();

      const firstName = document.getElementById("first_name").value.trim();
      const lastName = document.getElementById("last_name").value.trim();
      const patronymic = document.getElementById("patronymic").value.trim();
      const region = document.getElementById("region").value;
      const officeName = document.getElementById("office_name").value.trim();
      const department = document.getElementById("department").value.trim();
      const roleTitle = document.getElementById("role_title").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const password2 = document.getElementById("password2").value;

      if (!firstName || !lastName || !patronymic || !region || !officeName || !department || !roleTitle || !email || !password) {
        toast("Bütün xanaları doldurun.", "error");
        return;
      }

      if (password.length < 6) {
        toast("Şifrə ən azı 6 simvol olmalıdır.", "error");
        return;
      }

      if (password !== password2) {
        toast("Şifrələr eyni deyil.", "error");
        return;
      }

      const metadata = {
        email: email,
        first_name: firstName,
        last_name: lastName,
        patronymic: patronymic,
        region: region,
        office_name: officeName,
        department: department,
        role_title: roleTitle
      };

      toast("Qeydiyyat sorğusu göndərilir...", "info");

      const { error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        toast(error.message, "error");
        return;
      }

      await db.auth.signOut();

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

      if (!email) {
        toast("E-poçt ünvanını daxil edin.", "error");
        return;
      }

      toast("Bərpa linki göndərilir...", "info");

      const { error } = await db.auth.resetPasswordForEmail(email, {
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
