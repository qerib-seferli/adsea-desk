import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = 'https://hdpdykooqirguwnojovb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT_USER = null;
let CURRENT_PROFILE = null;
let SIGNAL_CHANNEL = null;
let HEARTBEAT_TIMER = null;

document.querySelector('#app').innerHTML = `
  <main class="agent-page">
    <section class="agent-card">
      <div class="brand">
        <div class="logo">AD</div>
        <div>
          <h1>ADSEA Desk</h1>
          <p>Windows Təhlükəsiz Uzaqdan Dəstək Agenti</p>
        </div>
      </div>

      <div id="loginView">
        <div class="security-banner">
          Bu proqram yalnız səlahiyyətli əməkdaşlar tərəfindən istifadə olunmalıdır.
        </div>

        <label>Korporativ e-poçt</label>
        <input id="email" type="email" placeholder="email@example.com" />

        <label>Şifrə</label>
        <input id="password" type="password" placeholder="Şifrənizi daxil edin" />

        <button id="loginBtn">Təhlükəsiz giriş</button>
      </div>

      <div id="dashboardView" class="hidden">
        <div class="profile-box">
          <span>Aktiv istifadəçi</span>
          <strong id="fullName">---</strong>
          <small id="profileInfo">---</small>
        </div>

        <div class="device-box">
          <span>Bu kompüterin ADSEA kodu</span>
          <strong id="deviceCode">---</strong>
        </div>

        <div class="agent-state">
          <span class="pulse"></span>
          <b id="agentStateText">Agent xidməti aktivdir</b>
        </div>

        <button id="logoutBtn" class="secondary-btn">Çıxış</button>
      </div>

      <div id="status" class="status">Agent hazırdır.</div>
    </section>

    <div id="modalRoot"></div>
  </main>
`;

const statusEl = document.querySelector('#status');

function setStatus(text) {
  statusEl.textContent = text;
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

  if (error || !data) {
    throw new Error('Profil məlumatı tapılmadı.');
  }

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
}

function startHeartbeat(profile) {
  if (HEARTBEAT_TIMER) clearInterval(HEARTBEAT_TIMER);

  HEARTBEAT_TIMER = setInterval(async () => {
    await markAgentOnline(profile);
  }, 15000);
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
    setStatus('Gələn uzaqdan qoşulma sorğusu var.');
    showIncomingRequest(signal, p);
  }

  if (signal.type === 'connection-response') {
    setStatus(p.accepted ? 'Qarşı tərəf icazə verdi.' : 'Qarşı tərəf sorğunu rədd etdi.');
  }
}

function showDashboard(profile) {
  document.querySelector('#loginView').classList.add('hidden');
  document.querySelector('#dashboardView').classList.remove('hidden');

  document.querySelector('#fullName').textContent = fullName(profile);
  document.querySelector('#profileInfo').textContent = profileDetails(profile);
  document.querySelector('#deviceCode').textContent = profile.device_code || 'Kod yoxdur';
}

function showIncomingRequest(signal, p) {
  const modal = document.querySelector('#modalRoot');

  modal.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal">
        <h2>Gələn uzaqdan qoşulma sorğusu</h2>
        <p class="modal-desc">
          Aşağıdakı əməkdaş bu kompüterə təhlükəsiz uzaqdan dəstək məqsədilə qoşulmaq istəyir.
        </p>

        <div class="request-grid">
          <div><b>Əməkdaş</b><span>${esc(p.sender_name || 'Naməlum')}</span></div>
          <div><b>Rayon</b><span>${esc(p.sender_region || '-')}</span></div>
          <div><b>İdarə</b><span>${esc(p.sender_office || '-')}</span></div>
          <div><b>Struktur</b><span>${esc(p.sender_department || '-')}</span></div>
          <div><b>Vəzifə</b><span>${esc(p.sender_role || '-')}</span></div>
          <div><b>Cihaz kodu</b><span>${esc(p.sender_device_code || '-')}</span></div>
        </div>

        <div class="security-note">
          Yalnız tanıdığınız və gözlədiyiniz əməkdaşa icazə verin. Şübhəli halda sorğunu rədd edin.
        </div>

        <div class="modal-actions">
          <button class="danger-btn" id="rejectBtn">Rədd et</button>
          <button class="primary-btn" id="acceptBtn">İcazə ver</button>
        </div>
      </section>
    </div>
  `;

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

  if (error || !data?.user) {
    setStatus('Giriş rədd edildi. E-poçt və ya şifrə yanlışdır.');
    return;
  }

  CURRENT_USER = data.user;

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

  await markAgentOnline(CURRENT_PROFILE);
  startHeartbeat(CURRENT_PROFILE);
  listenSignals(CURRENT_PROFILE);
  showDashboard(CURRENT_PROFILE);

  setStatus('ADSEA Desk Agent aktivdir və təhlükəsiz bağlantı sorğularını gözləyir.');
});

document.querySelector('#logoutBtn').addEventListener('click', async () => {
  if (CURRENT_PROFILE) {
    await supabase
      .from('devices')
      .update({
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', CURRENT_PROFILE.id)
      .eq('platform', 'windows');
  }

  await supabase.auth.signOut();
  location.reload();
});
