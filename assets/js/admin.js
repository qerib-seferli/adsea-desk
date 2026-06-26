let ADMIN_CTX = null;

document.addEventListener("DOMContentLoaded", async () => {
  ADMIN_CTX = await Auth.requireAdmin();
  if (!ADMIN_CTX) return;

  await loadAdmin();
});

async function loadAdmin() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_approved", false)
    .order("created_at", { ascending: true });

  if (error) {
    toast("Admin məlumatları yüklənmədi.", "error");
    return;
  }

  renderAdmin(data || []);
}

function renderAdmin(rows) {
  const app = document.getElementById("admin-app");

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="../foto/Logo.png" alt="ADSEA">
          <div>
            <strong>ADSEA ADMİN</strong>
            <span>Təhlükəsizlik mərkəzi</span>
          </div>
        </div>

        <section class="user-box">
          <h3>${esc(fullName(ADMIN_CTX.profile))}</h3>
          <p>${esc(ADMIN_CTX.profile.role_title)}</p>
          <div class="sidebar-actions">
            <button class="small-btn" onclick="go('/')">Ana panel</button>
            <button class="small-btn" onclick="Auth.logout()">Çıxış</button>
          </div>
        </section>
      </aside>

      <main class="main">
        <section class="topbar">
          <div><span class="status-dot"></span>Admin rejimi aktivdir</div>
          <div><b style="color:var(--cyan)">Təsdiq gözləyən hesablar</b></div>
        </section>

        <section class="card">
          <h2>Hesab təsdiqləmə sorğuları</h2>
          <p>Sistemə giriş icazəsi gözləyən əməkdaşlar.</p>

          ${
            rows.length
              ? `
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Əməkdaş</th>
                      <th>Region / İdarə</th>
                      <th>Struktur / Vəzifə</th>
                      <th>Tarix</th>
                      <th>Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map(p => `
                      <tr id="row-${p.id}">
                        <td>${esc(fullName(p))}</td>
                        <td>${esc(p.region)} / ${esc(p.office_name)}</td>
                        <td>${esc(p.department)} / ${esc(p.role_title)}</td>
                        <td>${esc(formatDate(p.created_at))}</td>
                        <td>
                          <button class="small-btn admin" onclick="approveUser('${p.id}')">Təsdiqlə</button>
                          <button class="small-btn" onclick="rejectUser('${p.id}')">Rədd et</button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `
              : `<p>Təsdiq gözləyən yeni sorğu yoxdur.</p>`
          }
        </section>
      </main>
    </div>
  `;
}

async function approveUser(id) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) {
    toast("Təsdiqləmə alınmadı.", "error");
    return;
  }

  toast("Əməkdaş təsdiqləndi.", "success");
  await loadAdmin();
}

async function rejectUser(id) {
  const ok = confirm("Bu qeydiyyat sorğusu silinsin?");
  if (!ok) return;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) {
    toast("Sorğu silinmədi.", "error");
    return;
  }

  toast("Sorğu rədd edildi.", "success");
  await loadAdmin();
}
