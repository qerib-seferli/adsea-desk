let CURRENT = null;
let ALL_PROFILES = [];

document.addEventListener("DOMContentLoaded", async () => {
  CURRENT = await Auth.requireApproved();
  if (!CURRENT) return;

  await loadApp();
  Presence.start(CURRENT.profile);
  WebRTCControl.listen(CURRENT.profile);
});

async function loadApp() {
  const { data: profiles, error } = await db
    .from("profiles")
    .select("*")
    .eq("is_approved", true)
    .order("region", { ascending: true });

  if (error) {
    toast("Əməkdaş siyahısı yüklənmədi.", "error");
    return;
  }

  ALL_PROFILES = profiles || [];

  const { data: rawHistory, error: historyError } = await db
    .from("connection_history")
    .select("*")
    .or(`operator_id.eq.${CURRENT.user.id},target_user_id.eq.${CURRENT.user.id}`)
    .eq("response_status", "accepted")
    .order("started_at", { ascending: false })
    .limit(50);
  
  const seenHistory = new Set();
  
  const history = (rawHistory || []).filter(h => {
    const otherId = h.operator_id === CURRENT.user.id ? h.target_user_id : h.operator_id;
    if (!otherId || seenHistory.has(otherId)) return false;
    seenHistory.add(otherId);
    return true;
  }).slice(0, 8);
    
    if (historyError) {
      console.warn(historyError);
    }

  renderApp(history || []);
}

function renderApp(history) {
  const p = CURRENT.profile;
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="foto/Logo.png" alt="ADSEA">
          <div>
            <strong>ADSEA DESK</strong>
            <span>Dövlət Su Ehtiyatları</span>
          </div>
        </div>

        <section class="user-box compact-user-box">
          <h3>Daxili əməkdaş şəbəkəsi</h3>
          <p>İdarələr və struktur bölmələr üzrə əlaqə</p>
        </section>

        <input class="app-input" id="employee-search" placeholder="Rayon, idarə və ya əməkdaş axtar..." oninput="renderTree(this.value)">

        <div id="employee-tree" class="tree"></div>
      </aside>

      <main class="main">
        <section class="topbar topbar-pro">
          <div class="top-status">
            <span class="status-dot"></span>
            Bağlantı rejimi: <b>Hazır</b>
          </div>
        
          <div class="top-user">
            <strong>${esc(fullName(p))}</strong>
            <span>${esc(p.region)} ${esc(p.office_name)} · ${esc(p.role_title)}</span>
          </div>
        
          <div class="top-actions">
            <button onclick="go('/profile/')">Hesabım</button>
            ${p.is_admin ? `<button onclick="go('/admin/')">Admin</button>` : ""}
            <button class="logout" onclick="Auth.logout()">Çıxış</button>
          </div>
        </section>

        <section class="center-grid">
          <div class="action-grid">
            <article class="card">
              <h2>Bu cihazın ünvanı</h2>
              <p>Agentliyin daxilindən kompüterinizə qoşulmaq istəyən əməkdaşa bu kodu təqdim edin.</p>
              <div class="device-code">
                <span>${esc(p.device_code)}</span>
                <button class="small-btn" onclick="copyCode()">Kopyala</button>
              </div>
            </article>

            <article class="card">
              <h2>Uzaq iş masasına qoşulma</h2>
              <p>Qoşulmaq və yardım göstərmək istədiyiniz kompüterin 9 rəqəmli kodunu daxil edin.</p>
              <input class="app-input" id="target-code" maxlength="11" placeholder="000 000 000" oninput="maskCode(this)">
              <br><br>
              <button class="primary-btn" onclick="connectByCode()">Bağlantı qur</button>
            </article>
          </div>

          <article class="card">
            <h2>Son daxil olduğunuz kompüterlər</h2>
            <div class="history-grid">
              ${history.map(h => {
                const otherIsTarget = h.operator_id === CURRENT.user.id;
                const name = otherIsTarget ? h.target_employee_name : h.operator_name;
                const code = otherIsTarget ? h.target_device_code : h.operator_device_code;
                
                const person = ALL_PROFILES.find(x =>
                  x.device_code === code ||
                  x.id === (otherIsTarget ? h.target_user_id : h.operator_id)
                );
                
                const online = person ? Presence?.isOnline?.(person.id) : false;
              
                return `
                  <div class="history-item history-item-pro" onclick="setTargetCode('${esc(code)}')">
                    <div class="history-title">
                      <span class="live-dot ${online ? "online" : "offline"}"></span>
                      <strong>${esc(name)}</strong>
                    </div>
                      <span>${esc(person?.region || h.target_region || "")} ${esc(person?.office_name || h.target_office_name || "")}</span>
                      <span>${esc(person?.role_title || h.target_role_title || "")}</span>
                      <code>${esc(code)}</code>
                    <span>${esc(formatDate(h.started_at || h.connected_at))}</span>
                  </div>
                `;
              }).join("") || `<p>Hələ bağlantı keçmişi yoxdur.</p>`}
            </div>
          </article>
        </section>

        <footer class="footer-note">
          Bu proqram yalnız Azərbaycan Dövlət Su Ehtiyatları Agentliyinin daxili audit və kibertəhlükəsizlik qaydalarına uyğun istifadə edilə bilər.
        </footer>
      </main>
    </div>
  `;

  renderTree("");
}

function renderTree(search = "") {
  const root = document.getElementById("employee-tree");
  if (!root) return;

  const q = search.toLowerCase().trim();

  const list = ALL_PROFILES.filter(p => {
    if (p.id === CURRENT.user.id) return false;
    if (p.is_blocked) return false;

    const text = `
      ${p.first_name || ""}
      ${p.last_name || ""}
      ${p.patronymic || ""}
      ${p.region || ""}
      ${p.office_name || ""}
      ${p.department || ""}
      ${p.role_title || ""}
      ${p.device_code || ""}
    `.toLowerCase();

    return text.includes(q);
  });

  const grouped = {};

  list.forEach(p => {
    const region = p.region || "Digər";
    const office = p.office_name || "İdarə qeyd edilməyib";

    grouped[region] ||= {};
    grouped[region][office] ||= [];
    grouped[region][office].push(p);
  });

  root.innerHTML =
    Object.entries(grouped).map(([region, offices]) => `
      <details>
      
      <summary>
        <span>${esc(region)}</span>
      
        <span class="tree-badge">
          <span class="tree-badge-icon">🏢</span>
          <span>${Object.keys(offices).length}</span>
        </span>
      </summary>

        ${Object.entries(offices).map(([office, people]) => `
          <details class="office">
          
        <summary>
          <span>${esc(office)}</span>
        
          <span class="tree-badge">
            <span class="tree-badge-icon">👤</span>
            <span>${people.length}</span>
          </span>
        </summary>

            ${people.map(person => {
              const online = Presence?.isOnline?.(person.id);
              return `
                <div class="employee" onclick="setTargetCode('${esc(person.device_code)}')">
                  <div>
                    <strong>
                      <span class="live-dot ${online ? "online" : "offline"}"></span>
                      ${esc(fullName(person))}
                    </strong>
                    <span>${esc(person.department)} | ${esc(person.role_title)}</span>
                  </div>
                  <code>${esc(person.device_code)}</code>
                </div>
              `;
            }).join("")}
          </details>
        `).join("")}
      </details>
    `).join("") ||
    `<p style="color:var(--muted);font-size:13px">Uyğun əməkdaş tapılmadı.</p>`;
}

function maskCode(input) {
  let v = input.value.replace(/\D/g, "").slice(0, 9);
  input.value = v.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function setTargetCode(code) {
  const input = document.getElementById("target-code");
  if (input) input.value = code;
}

async function copyCode() {
  await navigator.clipboard.writeText(CURRENT.profile.device_code);
  toast("Cihaz kodu kopyalandı.", "success");
}

async function connectByCode() {
  const code = document.getElementById("target-code").value.trim();

  if (!/^\d{3} \d{3} \d{3}$/.test(code)) {
    toast("9 rəqəmli cihaz kodunu düzgün daxil edin.", "error");
    return;
  }

  const target = ALL_PROFILES.find(p => p.device_code === code);

  if (!target) {
    toast("Bu cihaz kodu ilə əməkdaş tapılmadı.", "error");
    return;
  }

  if (target.id === CURRENT.user.id || target.device_code === CURRENT.profile.device_code) {
  toast("Öz cihazınıza qoşulma sorğusu göndərmək mümkün deyil.", "error");
  return;
  }
  
  await WebRTCControl.requestConnection(CURRENT.profile, target);
}
