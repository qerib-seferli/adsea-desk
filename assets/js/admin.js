let ADMIN_CTX = null;
let ADMIN_TAB = "pending";
let ADMIN_ROWS = [];

document.addEventListener("DOMContentLoaded", async () => {
  ADMIN_CTX = await Auth.requireAdmin();
  if (!ADMIN_CTX) return;

  await loadAdmin();
});

async function loadAdmin() {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    toast("Admin məlumatları yüklənmədi.", "error");
    return;
  }

  ADMIN_ROWS = data || [];
  renderAdmin();
}

function getFilteredRows() {
  if (ADMIN_TAB === "pending") {
    return ADMIN_ROWS.filter(p => !p.is_approved && !p.is_blocked);
  }

  if (ADMIN_TAB === "active") {
    return ADMIN_ROWS.filter(p => p.is_approved && !p.is_blocked);
  }

  if (ADMIN_TAB === "blocked") {
    return ADMIN_ROWS.filter(p => p.is_blocked);
  }

  return ADMIN_ROWS;
}

function renderAdmin() {
  const rows = getFilteredRows();

  document.getElementById("admin-app").innerHTML = `
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

          <div class="sidebar-actions sidebar-actions-3">
            <button class="small-btn" onclick="go('/')">Ana panel</button>
            <button class="small-btn" onclick="go('/profile/')">Hesabım</button>
            <button class="small-btn danger-soft" onclick="Auth.logout()">Çıxış</button>
          </div>
        </section>

        <div class="admin-stats">
          <div><b>${ADMIN_ROWS.filter(p => !p.is_approved && !p.is_blocked).length}</b><span>Gözləyən</span></div>
          <div><b>${ADMIN_ROWS.filter(p => p.is_approved && !p.is_blocked).length}</b><span>Aktiv</span></div>
          <div><b>${ADMIN_ROWS.filter(p => p.is_blocked).length}</b><span>Bloklu</span></div>
        </div>
      </aside>

      <main class="main">
        <section class="topbar">
          <div><span class="status-dot"></span>Admin rejimi aktivdir</div>
          <div><b style="color:var(--cyan)">Əməkdaşların idarə edilməsi</b></div>
        </section>

        <section class="card">
          <div class="admin-head">
            <div>
              <h2>Əməkdaşlar paneli</h2>
              <p>Qeydiyyat sorğuları, aktiv əməkdaşlar və bloklanmış hesablar.</p>
            </div>

            <div class="admin-tabs">
              <button class="${ADMIN_TAB === "pending" ? "active" : ""}" onclick="setAdminTab('pending')">Gözləyən</button>
              <button class="${ADMIN_TAB === "active" ? "active" : ""}" onclick="setAdminTab('active')">Aktiv</button>
              <button class="${ADMIN_TAB === "blocked" ? "active" : ""}" onclick="setAdminTab('blocked')">Bloklu</button>
              <button class="${ADMIN_TAB === "all" ? "active" : ""}" onclick="setAdminTab('all')">Hamısı</button>
            </div>
          </div>

          ${
            rows.length
              ? renderAdminTable(rows)
              : `<p>Bu bölmədə məlumat yoxdur.</p>`
          }
        </section>
      </main>
    </div>
  `;
}

function renderAdminTable(rows) {
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Əməkdaş</th>
            <th>Region / İdarə</th>
            <th>Struktur / Vəzifə</th>
            <th>Status</th>
            <th>Qeydiyyat</th>
            <th>Son aktivlik</th>
            <th>Əməliyyat</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(p => `
            <tr>
              <td>
                <strong>${esc(fullName(p))}</strong>
                <small>${esc(p.email || "Email yoxdur")}</small>
                <small>${esc(p.device_code || "Kod yoxdur")}</small>
              </td>

              <td>
                ${esc(p.region)} / ${esc(p.office_name)}
              </td>

              <td>
                ${esc(p.department)} / ${esc(p.role_title)}
              </td>

              <td>
                ${statusBadge(p)}
              </td>

              <td>
                ${esc(formatDate(p.created_at))}
              </td>
              
              <td>
                ${p.last_seen_at ? esc(formatDate(p.last_seen_at)) : "Hələ daxil olmayıb"}
              </td>
              
              <td>
                <div class="admin-actions">
                  ${!p.is_approved && !p.is_blocked ? `
                    <button class="small-btn admin" onclick="approveUser('${p.id}')">Təsdiqlə</button>
                    <button class="small-btn danger-soft" onclick="rejectUser('${p.id}')">Rədd et</button>
                  ` : ""}

                  ${p.is_approved && !p.is_blocked ? `
                    <button class="small-btn" onclick="blockUser('${p.id}')">Blokla</button>
                  ` : ""}

                  ${p.is_blocked ? `
                    <button class="small-btn admin" onclick="unblockUser('${p.id}')">Aktiv et</button>
                  ` : ""}
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function statusBadge(p) {
  if (p.is_blocked) return `<span class="badge red">Bloklanıb</span>`;
  if (!p.is_approved) return `<span class="badge amber">Təsdiq gözləyir</span>`;
  return `<span class="badge green">Aktiv</span>`;
}

function setAdminTab(tab) {
  ADMIN_TAB = tab;
  renderAdmin();
}

async function approveUser(id) {
  const { error } = await db
    .from("profiles")
    .update({
      is_approved: true,
      is_blocked: false,
      blocked_reason: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    toast("Təsdiqləmə alınmadı.", "error");
    return;
  }

  toast("Əməkdaş təsdiqləndi.", "success");
  await loadAdmin();
}

async function rejectUser(id) {
  showConfirmModal({
    title: "Qeydiyyat sorğusu rədd edilsin?",
    text: "Bu əməkdaşın qeydiyyat sorğusu tam silinəcək və həmin email ilə yenidən müraciət edə biləcək.",
    confirmText: "Rədd et",
    cancelText: "Bağla",
    danger: true,
    onConfirm: async () => {
      const { error } = await db
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) {
        toast("Sorğu silinmədi.", "error");
        return;
      }

      toast("Sorğu rədd edildi və sistemdən silindi.", "success");
      await loadAdmin();
    }
  });
}

async function blockUser(id) {
  showConfirmModal({
    title: "Əməkdaş bloklansın?",
    text: "Bu istifadəçi sistemə daxil ola bilməyəcək.",
    confirmText: "Blokla",
    cancelText: "Bağla",
    danger: true,
    onConfirm: async () => {
      const { error } = await db
        .from("profiles")
        .update({
          is_blocked: true,
          is_approved: false,
          blocked_reason: "Admin tərəfindən bloklandı",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        toast("Bloklama alınmadı.", "error");
        return;
      }

      toast("Əməkdaş bloklandı.", "success");
      await loadAdmin();
    }
  });
}

async function unblockUser(id) {
  const { error } = await db
    .from("profiles")
    .update({
      is_blocked: false,
      is_approved: true,
      blocked_reason: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    toast("Aktivləşdirmə alınmadı.", "error");
    return;
  }

  toast("Əməkdaş yenidən aktiv edildi.", "success");
  await loadAdmin();
}

function showConfirmModal({ title, text, confirmText, cancelText, danger = false, onConfirm }) {
  let root = document.getElementById("modal-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal confirm-modal">
        <h2>${esc(title)}</h2>
        <p>${esc(text)}</p>

        <div class="modal-actions">
          <button class="small-btn" id="modal-cancel">${esc(cancelText || "Bağla")}</button>
          <button class="${danger ? "danger-btn" : "primary-btn"}" id="modal-confirm">${esc(confirmText || "Təsdiqlə")}</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("modal-cancel").onclick = () => {
    root.innerHTML = "";
  };

  document.getElementById("modal-confirm").onclick = async () => {
    root.innerHTML = "";
    await onConfirm();
  };
}
