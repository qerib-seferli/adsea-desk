let PROFILE_CTX = null;

document.addEventListener("DOMContentLoaded", async () => {
PROFILE_CTX = await Auth.requireApproved();
if (!PROFILE_CTX) return;

Presence.start(PROFILE_CTX.profile);
askNotificationPermission();
WebRTCControl.listen(PROFILE_CTX.profile);

renderProfile();
});

function renderProfile() {
  const p = PROFILE_CTX.profile;

  document.getElementById("profile-app").innerHTML = `
    <main class="profile-page">
      <section class="auth-card wide profile-card">
        <img src="../foto/Logo.png" class="auth-logo" alt="ADSEA" />

        <h1>Hesabım</h1>
        <p>Şəxsi məlumatlarınızı yeniləyə bilərsiniz.</p>
        
        <div class="profile-email-box">
          <span>Korporativ e-poçt</span>
          <b>${esc(PROFILE_CTX.user.email || p.email || "Email yoxdur")}</b>
        </div>

        <form id="profile-form" class="auth-form grid-form">
          <input id="first_name" value="${esc(p.first_name)}" required placeholder="Ad" />
          <input id="last_name" value="${esc(p.last_name)}" required placeholder="Soyad" />
          <input id="patronymic" value="${esc(p.patronymic)}" required placeholder="Ata adı" />

          <input id="region" value="${esc(p.region)}" required placeholder="Şəhər / rayon" />
          <input id="office_name" value="${esc(p.office_name)}" required placeholder="İdarə adı" />

          <input id="department" value="${esc(p.department)}" required placeholder="Struktur bölmə" />
          <input id="role_title" value="${esc(p.role_title)}" required placeholder="Vəzifə" />

          <button type="submit">Yadda saxla</button>
        </form>

        <div class="profile-actions">
          <button class="small-btn" onclick="go('/')">Ana panel</button>
          <button class="small-btn" onclick="go('/reset-password/')">Şifrəni dəyiş</button>
          <button class="small-btn" onclick="Auth.logout()">Çıxış</button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("profile-form").addEventListener("submit", saveProfile);
}

async function saveProfile(e) {
  e.preventDefault();

  const payload = {
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    patronymic: document.getElementById("patronymic").value.trim(),
    region: document.getElementById("region").value.trim(),
    office_name: document.getElementById("office_name").value.trim(),
    department: document.getElementById("department").value.trim(),
    role_title: document.getElementById("role_title").value.trim(),
    updated_at: new Date().toISOString()
  };

  const { error } = await db
    .from("profiles")
    .update(payload)
    .eq("id", PROFILE_CTX.user.id);

  if (error) {
    toast("Məlumatlar yenilənmədi.", "error");
    return;
  }

  toast("Profil məlumatları yeniləndi.", "success");

  setTimeout(() => {
    go("/");
  }, 700);
}
