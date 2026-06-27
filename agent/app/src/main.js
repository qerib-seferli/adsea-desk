import { createClient } from '@supabase/supabase-js';
import './style.css'; 

const SUPABASE_URL = 'https://hdpdykooqirguwnojovb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

let CURRENT_USER = null;
let CURRENT_PROFILE = null;
let SIGNAL_CHANNEL = null;
let PRESENCE_CHANNEL = null;
let HEARTBEAT_TIMER = null;

document.querySelector('#app').innerHTML = `
  <main class="agent-page">
    <section class="agent-window">
      <header class="agent-header">
        <div class="brand-left">
          <div class="logo-mark">AD</div>
          <div>
            <h1>ADSEA Desk</h1>
            <p>Windows Təhlükəsiz Uzaqdan Dəstək Agenti</p>
          </div>
        </div>

        <div id="onlinePill" class="online-pill hidden">
          <span></span>
          ONLAYN
        </div>
      </header>

      <section id="loginView" class="panel">
        <div class="notice">
          Yalnız səlahiyyətli əməkdaşlar istifadə edə bilər.
        </div>

        <label>Korporativ e-poçt</label>
        <input id="email" type="email" autocomplete="username" placeholder="ad.soyad@adsea.gov.az">

        <label>Şifrə</label>
        <input id="password" type="password" autocomplete="current-password" placeholder="Şifrənizi daxil edin">

        <button id="loginBtn" class="primary-btn">Təhlükəsiz giriş</button>
      </section>

      <section id="dashboardView" class="hidden">
        <div class="employee-card">
          <div class="avatar">👤</div>
          <div>
            <strong id="fullName">---</strong>
            <span id="profileInfo">---</span>
          </div>
          <div class="verified">✓</div>
        </div>

        <div class="code-card">
          <span>Bu kompüterin ADSEA kodu</span>
          <div>
            <strong id="deviceCode">---</strong>
            <button id="copyBtn">Kopyala</button>
          </div>
        </div>

        <div class="service-card">
          <div>
            <b><span class="live-dot"></span> Agent xidməti aktivdir</b>
            <p>Bağlantı sorğuları real vaxtda izlənilir.</p>
          </div>
          <small id="lastSeen">indi</small>
        </div>

        <div class="activity-card">
          <b>Son aktivlik</b>
          <ul id="activityList"></ul>
        </div>

        <button id="logoutBtn" class="logout-btn">Çıxış</button>
      </section>

      <div id="status" class="status">Agent hazırdır.</div>

      <footer class="agent-footer">
        <span>🔒 Təhlükəsiz bağlantı</span>
        <span>ADSEA Daxili Sistem</span>
      </footer>
    </section>

    <div id="modalRoot"></div>
  </main>
`;

const statusEl = document.querySelector('#status');

function setStatus(text) {
  statusEl.textContent = text;
  addActivity(text);
}

function addActivity(text) {
  const list = document.querySelector('#activityList');
  if (!list) return;

  const item = document.createElement('li');
  item.innerHTML = `<span>✓</span><div>${esc(text)}<small>${new Date().toLocaleString('az-AZ')}</small></div>`;
  list.prepend(item);

  while (list.children.length > 4) {
    list.lastElementChild.remove();
  }
}

function fullName(p) {
  return `${p.first_name || ''} ${p.last_name || ''} ${p.patronymic || ''}`.trim();
}

function profileDetails(p) {
  return `${p.region || ''} ${p.office_name || ''} · ${p.department || ''} · ${p.role_title || ''}`;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parsePayload(payload) {
  if (!payload) return {};
  if (typeof payload === 'object') return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error('Profil məlumatı tapılmadı.');
  return data;
}

async function markAgentOnline(profile) {
  const now = new Date().toISOString();

  await supabase
    .from('profiles')
    .update({ last_seen_at: now })
    .eq('id', profile.id);

  await supabase
    .from('devices')
    .upsert(
      {
        user_id: profile.id,
        device_code: profile.device_code,
        name: 'ADSEA Desk Windows Agent',
        platform: 'windows',
        is_online: true,
        last_seen: now
      },
      { onConflict: 'user_id,platform' }
    );

  document.querySelector('#lastSeen').textContent = 'indi';
}

async function markAgentOffline() {
  if (!CURRENT_PROFILE) return;

  await supabase
    .from('devices')
    .update({
      is_online: false,
      last_seen: new Date().toISOString()
    })
    .eq('user_id', CURRENT_PROFILE.id)
    .eq('platform', 'windows');
}

function startHeartbeat(profile) {
  if (HEARTBEAT_TIMER) clearInterval(HEARTBEAT_TIMER);

  HEARTBEAT_TIMER = setInterval(async () => {
    await markAgentOnline(profile);
  }, 15000);
}

function startPresence(profile) {
  if (PRESENCE_CHANNEL) {
    supabase.removeChannel(PRESENCE_CHANNEL);
    PRESENCE_CHANNEL = null;
  }

  PRESENCE_CHANNEL = supabase.channel('adsea-online-presence', {
    config: {
      presence: {
        key: profile.id
      }
    }
  });

  PRESENCE_CHANNEL.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      await PRESENCE_CHANNEL.track({
        id: profile.id,
        name: fullName(profile),
        region: profile.region,
        office_name: profile.office_name,
        role_title: profile.role_title,
        device_code: profile.device_code,
        source: 'windows-agent',
        online_at: new Date().toISOString()
      });
    }
  });
}

function listenSignals(profile) {
  if (SIGNAL_CHANNEL) {
    supabase.removeChannel(SIGNAL_CHANNEL);
    SIGNAL_CHANNEL = null;
  }

  SIGNAL_CHANNEL = supabase
    .channel(`agent-signals-${profile.device_code}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signals',
        filter: `target_code=eq.${profile.device_code}`
      },
      payload => handleSignal(payload.new)
    )
    .subscribe();
}

async function handleSignal(signal) {
  const p = parsePayload(signal.payload);

  if (signal.type === 'connection-request') {
    setStatus('Gələn uzaqdan qoşulma sorğusu qəbul edildi.');
    showIncomingRequest(signal, p);
  }

  if (signal.type === 'connection-response') {
    setStatus(p.accepted ? 'Qarşı tərəf bağlantıya icazə verdi.' : 'Qarşı tərəf sorğunu rədd etdi.');
  }
}

function showDashboard(profile) {
  document.querySelector('#loginView').classList.add('hidden');
  document.querySelector('#dashboardView').classList.remove('hidden');
  document.querySelector('#onlinePill').classList.remove('hidden');

  document.querySelector('#fullName').textContent = fullName(profile);
  document.querySelector('#profileInfo').textContent = profileDetails(profile);
  document.querySelector('#deviceCode').textContent = profile.device_code || 'Kod yoxdur';
}

function showIncomingRequest(signal, p) {
  const modal = document.querySelector('#modalRoot');

  modal.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal">
        <button class="modal-x" id="closeModal">×</button>

        <div class="modal-title">
          <div class="modal-icon">👤</div>
          <div>
            <h2>Gələn uzaqdan qoşulma sorğusu</h2>
            <p>Əməkdaş bu kompüterə təhlükəsiz dəstək məqsədilə qoşulmaq istəyir.</p>
          </div>
        </div>

        <div class="request-grid">
          <div><b>Əməkdaş</b><span>${esc(p.sender_name || 'Naməlum')}</span></div>
          <div><b>Rayon</b><span>${esc(p.sender_region || '-')}</span></div>
          <div><b>İdarə</b><span>${esc(p.sender_office || '-')}</span></div>
          <div><b>Struktur</b><span>${esc(p.sender_department || '-')}</span></div>
          <div><b>Vəzifə</b><span>${esc(p.sender_role || '-')}</span></div>
          <div><b>Cihaz kodu</b><span class="code-yellow">${esc(p.sender_device_code || '-')}</span></div>
        </div>

        <div class="security-note">
          <b>🔐 Təhlükəsizlik xəbərdarlığı</b>
          <span>Yalnız tanıdığınız və gözlədiyiniz əməkdaşa icazə verin. Şübhəli halda sorğunu rədd edin.</span>
        </div>

        <div class="modal-actions">
          <button class="danger-btn" id="rejectBtn">Rədd et</button>
          <button class="primary-btn" id="acceptBtn">İcazə ver</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector('#closeModal').onclick = () => modal.innerHTML = '';
  document.querySelector('#rejectBtn').onclick = () => respondToRequest(signal, false);
  document.querySelector('#acceptBtn').onclick = () => respondToRequest(signal, true);
}

async function respondToRequest(signal, accepted) {
  document.querySelector('#modalRoot').innerHTML = '';

  const p = parsePayload(signal.payload);
  const now = new Date().toISOString();

  await supabase
    .from('signals')
    .update({ is_read: true })
    .eq('id', signal.id);

  if (p.history_id) {
    await supabase
      .from('connection_history')
      .update({
        response_status: accepted ? 'accepted' : 'rejected',
        status: accepted ? 'accepted' : 'rejected',
        ended_at: accepted ? null : now,
        duration_seconds: 0
      })
      .eq('id', p.history_id);
  }

  await supabase.from('signals').insert({
    sender_id: CURRENT_PROFILE.id,
    target_code: p.sender_device_code,
    type: 'connection-response',
    payload: JSON.stringify({
      accepted,
      history_id: p.history_id,
      responder_name: fullName(CURRENT_PROFILE),
      responder_device_code: CURRENT_PROFILE.device_code,
      responded_at: now
    })
  });

  setStatus(accepted ? 'Qoşulmaya icazə verildi.' : 'Qoşulma rədd edildi.');
}

async function loginWithSession(session) {
  CURRENT_USER = session.user;

  try {
    CURRENT_PROFILE = await loadProfile(CURRENT_USER.id);
  } catch (err) {
    await supabase.auth.signOut();
    setStatus(err.message);
    return;
  }

  if (CURRENT_PROFILE.is_blocked) {
    await supabase.auth.signOut();
    setStatus('Hesab administrator tərəfindən bloklanıb.');
    return;
  }

  if (!CURRENT_PROFILE.is_approved) {
    await supabase.auth.signOut();
    setStatus('Hesab hələ administrator tərəfindən təsdiqlənməyib.');
    return;
  }

  if (!CURRENT_PROFILE.device_code) {
    await supabase.auth.signOut();
    setStatus('Profil üçün cihaz kodu tapılmadı. Adminlə əlaqə saxlayın.');
    return;
  }

  showDashboard(CURRENT_PROFILE);
  await markAgentOnline(CURRENT_PROFILE);
  startHeartbeat(CURRENT_PROFILE);
  startPresence(CURRENT_PROFILE);
  listenSignals(CURRENT_PROFILE);

  setStatus('ADSEA Desk Agent aktivdir və təhlükəsiz bağlantı sorğularını gözləyir.');
}

document.querySelector('#loginBtn').addEventListener('click', async () => {
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;

  if (!email || !password) {
    setStatus('Korporativ e-poçt və şifrə daxil edin.');
    return;
  }

  setStatus('Kimlik yoxlanılır...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data?.session) {
    setStatus('Giriş rədd edildi. E-poçt və ya şifrə yanlışdır.');
    return;
  }

  await loginWithSession(data.session);
});

document.querySelector('#copyBtn').addEventListener('click', async () => {
  if (!CURRENT_PROFILE?.device_code) return;
  await navigator.clipboard.writeText(CURRENT_PROFILE.device_code);
  setStatus('Cihaz kodu kopyalandı.');
});

document.querySelector('#logoutBtn').addEventListener('click', async () => {
  await markAgentOffline();
  await supabase.auth.signOut();
  location.reload();
});

window.addEventListener('beforeunload', () => {
  markAgentOffline();
});

(async function boot() {
  const { data } = await supabase.auth.getSession();

  if (data?.session) {
    await loginWithSession(data.session);
  }
})();
