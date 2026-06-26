let ADMIN_CTX = null;
let ADMIN_TAB = "pending";
let ADMIN_ROWS = [];
let ADMIN_SEARCH = "";

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
  let rows = [];

  if (ADMIN_TAB === "pending") {
    rows = ADMIN_ROWS.filter(p => !p.is_approved && !p.is_blocked);
  } else if (ADMIN_TAB === "active") {
    rows = ADMIN_ROWS.filter(p => p.is_approved && !p.is_blocked);
  } else if (ADMIN_TAB === "blocked") {
    rows = ADMIN_ROWS.filter(p => p.is_blocked);
  } else {
    rows = ADMIN_ROWS;
  }

  const q = ADMIN_SEARCH.trim().toLowerCase();

  if (!q) return rows;

  return rows.filter(p => {
    const text = `
      ${p.first_name || ""}
      ${p.last_name || ""}
      ${p.patronymic || ""}
      ${p.email || ""}
      ${p.region || ""}
      ${p.office_name || ""}
      ${p.department || ""}
      ${p.role_title || ""}
      ${p.device_code || ""}
      ${p.blocked_reason || ""}
    `.toLowerCase();

    return text.includes(q);
  });
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

        <section class="user-box compact-user-box">
          <h3>Admin nəzarəti</h3>
          <p>Hesablar və təhlükəsizlik idarəetməsi</p>
        </section>

        <div class="admin-stats">
          <div><b>${ADMIN_ROWS.filter(p => !p.is_approved && !p.is_blocked).length}</b><span>Gözləyən</span></div>
          <div><b>${ADMIN_ROWS.filter(p => p.is_approved && !p.is_blocked).length}</b><span>Aktiv</span></div>
          <div><b>${ADMIN_ROWS.filter(p => p.is_blocked).length}</b><span>Bloklu</span></div>
        </div>
      </aside>

      <main class="main">
        <section class="topbar topbar-pro">
          <div class="top-status">
            <span class="status-dot"></span>
            Admin rejimi: <b>Aktiv</b>
          </div>
        
          <div class="top-user">
            <strong>${esc(fullName(ADMIN_CTX.profile))}</strong>
            <span>${esc(ADMIN_CTX.profile.region)} ${esc(ADMIN_CTX.profile.office_name)} · ${esc(ADMIN_CTX.profile.role_title)}</span>
          </div>
        
          <div class="top-actions">
            <button onclick="go('/')">Ana panel</button>
            <button onclick="go('/profile/')">Hesabım</button>
            <button class="logout" onclick="Auth.logout()">Çıxış</button>
          </div>
        </section>

        <section class="card">
          <div class="admin-head">
            <div>
              <h2>Əməkdaşlar paneli</h2>
              <p>Qeydiyyat sorğuları, aktiv əməkdaşlar və bloklanmış hesablar.</p>
            </div>


            <div class="admin-search-wrap">
              <input
                class="app-input admin-search-input"
                id="admin-search"
                value="${esc(ADMIN_SEARCH)}"
                placeholder="Ad, soyad, email, rayon, idarə, vəzifə və ya cihaz kodu axtar..."
                oninput="filterAdminTable(this.value)"
              >
            </div>


            <div class="admin-tabs">
              <button class="${ADMIN_TAB === "pending" ? "active" : ""}" onclick="setAdminTab('pending')">Gözləyən</button>
              <button class="${ADMIN_TAB === "active" ? "active" : ""}" onclick="setAdminTab('active')">Aktiv</button>
              <button class="${ADMIN_TAB === "blocked" ? "active" : ""}" onclick="setAdminTab('blocked')">Bloklu</button>
              <button class="${ADMIN_TAB === "all" ? "active" : ""}" onclick="setAdminTab('all')">Hamısı</button>
            </div>
          </div>

            <div class="admin-table-area">
              ${
                rows.length
                  ? renderAdminTable(rows)
                  : `<p>Bu bölmədə məlumat yoxdur.</p>`
              }
            </div>
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
                ${p.blocked_reason ? `<small>${esc(p.blocked_reason)}</small>` : ""}
              </td>

              <td>
                ${esc(formatDate(p.created_at))}
              </td>
              
              <td>
                ${p.last_seen_at ? esc(formatDate(p.last_seen_at)) : "Hələ daxil olmayıb"}
              </td>
              
              <td>
                <div class="admin-actions">
                <button class="small-btn" onclick="editUser('${p.id}')">🖊️</button>
                  ${
                    p.id === ADMIN_CTX.user.id
                      ? `<span class="badge green">Admin hesabı</span>`
                      : `
                        ${!p.is_approved && !p.is_blocked ? `
                          <button class="small-btn admin" onclick="approveUser('${p.id}')">Təsdiqlə</button>
                          <button class="small-btn danger-soft" onclick="rejectUser('${p.id}')">Rədd et</button>
                        ` : ""}
              
                        ${p.is_approved && !p.is_blocked ? `
                          <button class="small-btn danger-soft" onclick="blockUser('${p.id}')">Blokla</button>
                        ` : ""}
              
                        ${p.is_blocked ? `
                          <button class="small-btn admin" onclick="unblockUser('${p.id}')">Aktiv et</button>
                        ` : ""}
                      `
                  }
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

function setAdminSearch(value) {
  ADMIN_SEARCH = value || "";
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

    if (id === ADMIN_CTX.user.id) {
    toast("Öz admin hesabınızı silmək mümkün deyil.", "error");
    return;
  }
  
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
  
    if (id === ADMIN_CTX.user.id) {
    toast("Öz admin hesabınızı bloklamaq mümkün deyil.", "error");
    return;
  }
  
    const user = ADMIN_ROWS.find(p => p.id === id);
    
    if (!user) {
      toast("İstifadəçi tapılmadı.", "error");
      return;
    }
    
    showBlockModal(user);
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


function showBlockModal(user) {
  let root = document.getElementById("modal-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal confirm-modal">
        <h2>Əməkdaş bloklansın?</h2>
        <p><b>${esc(fullName(user))}</b> hesabı sistemə daxil ola bilməyəcək.</p>

        <label class="modal-label">Blok səbəbi</label>
        <textarea id="block-reason" class="modal-textarea" placeholder="Məsələn: Yanlış məlumat, şübhəli fəaliyyət və s.">Admin tərəfindən bloklandı</textarea>

        <div class="modal-actions">
          <button class="small-btn" id="block-cancel">Bağla</button>
          <button class="danger-btn" id="block-confirm">Blokla</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("block-cancel").onclick = () => {
    root.innerHTML = "";
  };

  document.getElementById("block-confirm").onclick = async () => {
    const reason = document.getElementById("block-reason").value.trim() || "Admin tərəfindən bloklandı";
    root.innerHTML = "";

    const { error } = await db
      .from("profiles")
      .update({
        is_blocked: true,
        is_approved: false,
        blocked_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      toast("Bloklama alınmadı.", "error");
      return;
    }

    toast("Əməkdaş bloklandı.", "success");
    await loadAdmin();
  };
}

function editUser(id) {
  const user = ADMIN_ROWS.find(p => p.id === id);

  if (!user) {
    toast("İstifadəçi tapılmadı.", "error");
    return;
  }

  showEditUserModal(user);
}

function showEditUserModal(user) {
  let root = document.getElementById("modal-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }

  const selfAdmin = user.id === ADMIN_CTX.user.id;

  root.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal edit-modal">
        <h2>Əməkdaş məlumatları</h2>
        <p>${selfAdmin ? "Bu sizin admin hesabınızdır. Bloklama/silmə əməliyyatı deaktivdir." : "Məlumatları redaktə edib yadda saxlaya bilərsiniz."}</p>

        <div class="edit-grid">
          <input id="edit-first-name" value="${esc(user.first_name)}" placeholder="Ad">
          <input id="edit-last-name" value="${esc(user.last_name)}" placeholder="Soyad">
          <input id="edit-patronymic" value="${esc(user.patronymic)}" placeholder="Ata adı">
          <input id="edit-region" value="${esc(user.region)}" placeholder="Rayon / şəhər">
          <input id="edit-office" value="${esc(user.office_name)}" placeholder="İdarə">
          <input id="edit-department" value="${esc(user.department)}" placeholder="Struktur">
          <input id="edit-role" value="${esc(user.role_title)}" placeholder="Vəzifə">
          <input value="${esc(user.email || "Email yoxdur")}" disabled>
          <input value="${esc(user.device_code || "Kod yoxdur")}" disabled>
        </div>

        ${user.blocked_reason ? `
          <div class="blocked-reason-box">
            <b>Blok səbəbi:</b>
            <span>${esc(user.blocked_reason)}</span>
          </div>
        ` : ""}

        <div class="modal-actions">
          <button class="small-btn" id="edit-cancel">Bağla</button>
          <button class="primary-btn" id="edit-save">Yadda saxla</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("edit-cancel").onclick = () => {
    root.innerHTML = "";
  };

  document.getElementById("edit-save").onclick = async () => {
    const payload = {
      first_name: document.getElementById("edit-first-name").value.trim(),
      last_name: document.getElementById("edit-last-name").value.trim(),
      patronymic: document.getElementById("edit-patronymic").value.trim(),
      region: document.getElementById("edit-region").value.trim(),
      office_name: document.getElementById("edit-office").value.trim(),
      department: document.getElementById("edit-department").value.trim(),
      role_title: document.getElementById("edit-role").value.trim(),
      updated_at: new Date().toISOString()
    };

    const { error } = await db
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    if (error) {
      toast("Məlumatlar yenilənmədi.", "error");
      return;
    }

    root.innerHTML = "";
    toast("Əməkdaş məlumatları yeniləndi.", "success");
    await loadAdmin();
  };
}


function filterAdminTable(value) {
  ADMIN_SEARCH = value || "";

  const rows = getFilteredRows();
  const card = document.querySelector(".admin-table-area");

  if (!card) return;

  card.innerHTML = rows.length
    ? renderAdminTable(rows)
    : `<p>Bu bölmədə uyğun məlumat tapılmadı.</p>`;
}

