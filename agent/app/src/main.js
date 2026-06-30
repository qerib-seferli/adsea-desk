import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { invoke } from '@tauri-apps/api/core';

const SUPABASE_URL = 'https://hdpdykooqirguwnojovb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA';


/*======================================================================================================*/


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

let CURRENT_PROFILE = null;
let ALL_PROFILES = [];
let HISTORY_ROWS = [];
let ONLINE_IDS = new Set();
let SIGNAL_CHANNEL = null;
let PRESENCE_CHANNEL = null;
let HEARTBEAT_TIMER = null;
let HISTORY_SEARCH = '';
let ACTIVE_PC = null;
let ACTIVE_SESSION_ID = null;
let ACTIVE_TARGET_CODE = null;
let REMOTE_VIDEO_SIZE = { width: 0, height: 0 };
let ACTIVE_ROLE = null; // viewer | host
let LAST_TARGET_CODE = null;
let INPUT_DC = null;
let LAST_REMOTE_INPUT_AT = 0;

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

document.querySelector('#app').innerHTML = `
<main class="agent-page login-mode" id="agentPage">
  <section class="agent-shell">

    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">
          <img src="/foto/Logo.png" alt="ADSEA">
        </div>
        <div>
          <h1>ADSEA Desk</h1>
        </div>
      </div>

      <div id="loginView" class="login-card">
        <div class="security-note-small">
          Səlahiyyətli əməkdaşlar üçün daxili təhlükəsiz bağlantı.
        </div>

        <label>Korporativ e-poçt</label>
        <input id="email" type="email" placeholder="ad.soyad@adsea.gov.az">

        <label>Şifrə</label>
        <input id="password" type="password" placeholder="Şifrənizi daxil edin">

        <button id="loginBtn" class="primary-btn">Təhlükəsiz giriş</button>

        <div id="loginMessage" class="message info">
          Giriş üçün korporativ hesab məlumatlarını daxil edin.
        </div>
      </div>

      <div id="leftNetworkView" class="left-after-login hidden">
        <section class="my-card">
          <span id="netDot" class="net-dot online"></span>
          <strong id="fullName">---</strong>
          <small id="profileInfo">---</small>
        </section>

        <section class="my-code-card">
          <span>Bu kompüterin ADSEA Desk kodu</span>
          <div class="code-copy-row">
            <strong id="deviceCode">---</strong>
            <button id="copyBtn" title="Kopyala">⧉</button>
          </div>
        </section>

        <input id="employeeSearch" class="search-input" placeholder="Rayon, idarə və ya əməkdaş axtar...">

        <div id="employeeTree" class="employee-tree"></div>

        <button id="logoutBtn" class="logout-btn">Çıxış</button>
      </div>
    </aside>

    <section id="mainView" class="main-panel hidden">
      <div class="topbar">
        <div class="topbar-status">
          <span id="connectionDot" class="net-dot online"></span>
          <b id="connectionText">Bağlantı rejimi: Hazır</b>
        </div>
        <p>Təhlükəsiz Uzaqdan Dəstək Agenti</p>
      </div>

      <article class="card connect-card">
        <h2>Uzaq iş masasına qoşulma</h2>
        <p>Qoşulmaq istədiyiniz əməkdaşın 9 rəqəmli ADSEA Desk kodunu daxil edin.</p>

        <div class="connect-row">
          <input id="targetCode" maxlength="11" placeholder="000 000 000">
          <button id="connectBtn" class="primary-btn">Sorğu göndər</button>
        </div>

        <div id="connectMessage" class="message info">
          Sorğu göndərmək üçün əməkdaş kodunu daxil edin.
        </div>
      </article>

      <article class="card history-card">
        <div class="history-head">
          <div>
            <h2>Son daxil olduğunuz kompüterlər</h2>
          </div>
          <input id="historySearch" class="search-input small-search" placeholder="Axtar...">
        </div>

        <div id="historyGrid" class="history-grid"></div>
        <div class="policy-note">
          Bu proqram yalnız Azərbaycan Dövlət Su Ehtiyatları Agentliyinin daxili audit və kibertəhlükəsizlik qaydalarına uyğun istifadə edilə bilər.
        </div>
      </article>
    </section>

    <div id="modalRoot"></div>
  </section>
</main>
`;

function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fullName(p) {
  return `${p.first_name || ''} ${p.last_name || ''} ${p.patronymic || ''}`.trim();
}

function profileLine(p) {
  return `${p.region || ''} ${p.office_name || ''} · ${p.department || ''} - ${p.role_title || ''}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function parsePayload(payload) {
  try {
    return typeof payload === 'object' ? payload : JSON.parse(payload || '{}');
  } catch {
    return {};
  }
}


let ALERT_AUDIO_CTX = null;

async function playRequestAlert() {
  try {
    ALERT_AUDIO_CTX ||= new (window.AudioContext || window.webkitAudioContext)();

    if (ALERT_AUDIO_CTX.state === 'suspended') {
      await ALERT_AUDIO_CTX.resume();
    }

    [0, 220, 440, 760].forEach(delay => {
      setTimeout(() => {
        const osc = ALERT_AUDIO_CTX.createOscillator();
        const gain = ALERT_AUDIO_CTX.createGain();

        osc.type = 'square';
        osc.frequency.value = 1250;

        gain.gain.setValueAtTime(0.001, ALERT_AUDIO_CTX.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.28, ALERT_AUDIO_CTX.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ALERT_AUDIO_CTX.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(ALERT_AUDIO_CTX.destination);

        osc.start();
        osc.stop(ALERT_AUDIO_CTX.currentTime + 0.24);
      }, delay);
    });
  } catch {}
}


function setLoginMessage(text, type = 'info') {
  const el = document.querySelector('#loginMessage');
  el.className = `message ${type}`;
  el.textContent = text;
}

function setConnectMessage(text, type = 'info') {
  const el = document.querySelector('#connectMessage');
  el.className = `message ${type}`;
  el.textContent = text;
}

function updateInternetState() {
  const online = navigator.onLine;

  document.querySelectorAll('#netDot, #connectionDot').forEach(dot => {
    dot.className = `net-dot ${online ? 'online' : 'offline'}`;
  });

  document.querySelector('#connectionText').textContent = online
    ? 'Bağlantı rejimi: Hazır'
    : 'İnternet bağlantınız kəsilib';

  if (!online) {
    setConnectMessage('İnternet bağlantınız kəsilib. Bağlantı sorğuları göndərilə bilməz.', 'error');
  }
}

async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new Error('Profil məlumatı tapılmadı.');
  return data;
}

async function loadProfiles() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_approved', true)
    .eq('is_blocked', false)
    .order('region', { ascending: true });

  ALL_PROFILES = data || [];
}

async function loadHistory() {
  if (!CURRENT_PROFILE) return;

  const { data } = await supabase
    .from('connection_history')
    .select('*')
    .or(`operator_id.eq.${CURRENT_PROFILE.id},target_user_id.eq.${CURRENT_PROFILE.id}`)
    .eq('response_status', 'accepted')
    .order('started_at', { ascending: false })
    .limit(120);

  HISTORY_ROWS = data || [];
  renderHistory();
}

async function markOnline() {
  if (!CURRENT_PROFILE) return;

  const now = new Date().toISOString();

  await supabase.from('profiles').update({ last_seen_at: now }).eq('id', CURRENT_PROFILE.id);

  await supabase.from('devices').upsert({
    user_id: CURRENT_PROFILE.id,
    device_code: CURRENT_PROFILE.device_code,
    name: 'ADSEA Desk Windows Agent',
    platform: 'windows',
    is_online: true,
    last_seen: now
  }, { onConflict: 'user_id,platform' });
}

async function markOffline() {
  if (!CURRENT_PROFILE) return;

  await supabase.from('devices')
    .update({ is_online: false, last_seen: new Date().toISOString() })
    .eq('user_id', CURRENT_PROFILE.id)
    .eq('platform', 'windows');
}

function startHeartbeat() {
  if (HEARTBEAT_TIMER) clearInterval(HEARTBEAT_TIMER);
  HEARTBEAT_TIMER = setInterval(markOnline, 15000);
}

function startPresence() {
  if (PRESENCE_CHANNEL) supabase.removeChannel(PRESENCE_CHANNEL);

  PRESENCE_CHANNEL = supabase.channel('adsea-online-presence', {
    config: { presence: { key: CURRENT_PROFILE.id } }
  });

  PRESENCE_CHANNEL.on('presence', { event: 'sync' }, () => {
    const state = PRESENCE_CHANNEL.presenceState();
    ONLINE_IDS = new Set(Object.keys(state));
    renderEmployeeTree();
    renderHistory();
  });

  PRESENCE_CHANNEL.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      await PRESENCE_CHANNEL.track({
        id: CURRENT_PROFILE.id,
        name: fullName(CURRENT_PROFILE),
        region: CURRENT_PROFILE.region,
        office_name: CURRENT_PROFILE.office_name,
        role_title: CURRENT_PROFILE.role_title,
        device_code: CURRENT_PROFILE.device_code,
        source: 'windows-agent',
        online_at: new Date().toISOString()
      });
    }
  });
}

function listenSignals() {
  if (SIGNAL_CHANNEL) supabase.removeChannel(SIGNAL_CHANNEL);

  SIGNAL_CHANNEL = supabase.channel(`agent-signals-${CURRENT_PROFILE.device_code}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'signals',
      filter: `target_code=eq.${CURRENT_PROFILE.device_code}`
    }, payload => handleSignal(payload.new))
    .subscribe();
}

async function handleSignal(signal) {
  const p = parsePayload(signal.payload);

  if (signal.type === 'connection-request') {
    await playRequestAlert();
    showRequest(signal, p);
    return;
  }

  if (signal.type === 'webrtc-offer') {
    await handleWebRTCOffer(signal, p);
    return;
  }
  
  if (signal.type === 'webrtc-answer') {
    await handleWebRTCAnswer(signal, p);
    return;
  }
  
  if (signal.type === 'webrtc-ice') {
    await handleWebRTCIce(signal, p);
    return;
  }

  if (signal.type === 'session-ended') {
    closeRemoteSession(false);
    setConnectMessage('Qarşı tərəf bağlantını sonlandırdı.', 'info');
    return;
  }
  
  if (signal.type === 'remote-input') {
    await handleRemoteInput(p);
    return;
  }
  
  if (signal.type === 'connection-response') {
  if (p.accepted) {
    removeDisconnectedOverlay();
    setConnectMessage(`${p.responder_name || 'Qarşı tərəf'} qoşulmaya icazə verdi. Ekran paylaşımı başlayacaq.`, 'success');
  } else {
    setDisconnectMessage(`${p.responder_name || 'Qarşı tərəf'} qoşulma sorğusunu rədd etdi.`, 'error');
    setConnectMessage(`${p.responder_name || 'Qarşı tərəf'} qoşulma sorğusunu rədd etdi.`, 'error');
  }

    await loadHistory();
  }
}

function renderEmployeeTree() {
  const root = document.querySelector('#employeeTree');
  if (!root || !CURRENT_PROFILE) return;

  const q = document.querySelector('#employeeSearch')?.value?.toLowerCase().trim() || '';

  const list = ALL_PROFILES.filter(p => {
    if (p.id === CURRENT_PROFILE.id) return false;

    const text = `${p.first_name} ${p.last_name} ${p.patronymic} ${p.region} ${p.office_name} ${p.department} ${p.role_title} ${p.device_code}`.toLowerCase();
    return text.includes(q);
  });

  const grouped = {};

  list.forEach(p => {
    const region = p.region || 'Digər';
    const office = p.office_name || 'İdarə qeyd edilməyib';

    grouped[region] ||= {};
    grouped[region][office] ||= [];
    grouped[region][office].push(p);
  });

  root.innerHTML = Object.entries(grouped).map(([region, offices]) => `
    <details>
      <summary>${esc(region)} <span>${Object.values(offices).flat().length}</span></summary>

      ${Object.entries(offices).map(([office, people]) => `
        <details class="office">
          <summary>${esc(office)} <span>${people.length}</span></summary>

          ${people.map(p => `
            <div class="employee-item" data-code="${esc(p.device_code)}" data-online="${ONLINE_IDS.has(p.id) ? '1' : '0'}">
              <i class="${ONLINE_IDS.has(p.id) ? 'online' : 'offline'}"></i>
              <div>
                <strong>${esc(fullName(p))}</strong>
                <small>${esc(p.department)} | ${esc(p.role_title)}</small>
              </div>
              <code>${esc(p.device_code)}</code>
            </div>
          `).join('')}
        </details>
      `).join('')}
    </details>
  `).join('') || `<p class="empty">Uyğun əməkdaş tapılmadı.</p>`;

  root.querySelectorAll('.employee-item').forEach(item => {
    item.onclick = () => {
      document.querySelector('#targetCode').value = item.dataset.code;
      setConnectMessage(item.dataset.online === '1'
        ? 'Kod seçildi. Sorğu göndərə bilərsiniz.'
        : 'Seçilən əməkdaş hazırda offline-dır. Sorğu göndərilə bilməz.', item.dataset.online === '1' ? 'info' : 'error');
    };
  });
}


function renderHistory() {
  const root = document.querySelector('#historyGrid');
  if (!root) return;

  const q = HISTORY_SEARCH.toLowerCase().trim();
  const seen = new Set();

  const rows = HISTORY_ROWS.filter(h => {
    const otherIsTarget = h.operator_id === CURRENT_PROFILE.id;
    const otherId = otherIsTarget ? h.target_user_id : h.operator_id;
    const code = otherIsTarget ? h.target_device_code : h.operator_device_code;

    if (!otherId && !code) return false;
    const uniqueKey = otherId || code;

    if (seen.has(uniqueKey)) return false;
    seen.add(uniqueKey);

    const text = `
      ${h.operator_name || ''}
      ${h.operator_device_code || ''}
      ${h.target_employee_name || ''}
      ${h.target_device_code || ''}
      ${h.target_region || ''}
      ${h.target_office_name || ''}
      ${h.target_department || ''}
      ${h.target_role_title || ''}
    `.toLowerCase();

    return text.includes(q);
  });

  root.innerHTML = rows.map(h => {
    const otherIsTarget = h.operator_id === CURRENT_PROFILE.id;
    const name = otherIsTarget ? h.target_employee_name : h.operator_name;
    const code = otherIsTarget ? h.target_device_code : h.operator_device_code;
    const otherId = otherIsTarget ? h.target_user_id : h.operator_id;
    const region = h.target_region || '';
    const office = h.target_office_name || '';
    const department = h.target_department || '';
    const role = h.target_role_title || '';

    return `
      <div class="history-item" data-code="${esc(code)}">
        <span class="net-dot ${ONLINE_IDS.has(otherId) ? 'online' : 'offline'}"></span>
        <strong>${esc(name || 'Naməlum əməkdaş')}</strong>
        <small>${esc(region)} ${esc(office)}</small>
        <small>${esc(department)} · ${esc(role)}</small>
        <code>${esc(code || '')}</code>
        <div class="history-time">
          <span>${esc(formatDate(h.started_at || h.connected_at))}</span>
        </div>
      </div>
    `;
  }).join('') || `<p class="empty">Bağlantı keçmişi tapılmadı.</p>`;

  root.querySelectorAll('.history-item').forEach(item => {
    item.onclick = () => {
      document.querySelector('#targetCode').value = item.dataset.code;
      setConnectMessage('Keçmiş bağlantıdan kod seçildi. Sorğu göndərə bilərsiniz.', 'info');
    };
  });
}


function showDashboard() {
  document.querySelector('#agentPage').classList.remove('login-mode');
  document.querySelector('#loginView').classList.add('hidden');
  document.querySelector('#leftNetworkView').classList.remove('hidden');
  document.querySelector('#mainView').classList.remove('hidden');

  document.querySelector('#fullName').textContent = fullName(CURRENT_PROFILE);
  document.querySelector('#profileInfo').textContent = profileLine(CURRENT_PROFILE);
  document.querySelector('#deviceCode').textContent = CURRENT_PROFILE.device_code;
}

async function connectByCode() {
  const code = document.querySelector('#targetCode').value.trim();

  if (!navigator.onLine) {
    setConnectMessage('İnternet bağlantınız kəsilib. Sorğu göndərilə bilməz.', 'error');
    return;
  }

  if (!/^\d{3} \d{3} \d{3}$/.test(code)) {
    setConnectMessage('9 rəqəmli ADSEA Desk kodunu düzgün daxil edin.', 'error');
    return;
  }

  await loadProfiles();

  const target = ALL_PROFILES.find(p => p.device_code === code);

  if (!target) {
    setConnectMessage('Bu kodla aktiv əməkdaş tapılmadı.', 'error');
    return;
  }

  if (target.id === CURRENT_PROFILE.id) {
    setConnectMessage('Öz kompüterinizə qoşulma sorğusu göndərilə bilməz.', 'error');
    return;
  }

  if (!ONLINE_IDS.has(target.id)) {
    const msg = `${fullName(target)} hazırda offline-dır. Sorğu göndərilə bilməz.`;
    setConnectMessage(msg, 'error');
    setDisconnectMessage(msg, 'error');
    return;
  }

  const now = new Date().toISOString();

  const { data: history, error: historyError } = await supabase.from('connection_history').insert({
    operator_id: CURRENT_PROFILE.id,
    operator_name: fullName(CURRENT_PROFILE),
    operator_device_code: CURRENT_PROFILE.device_code,
    target_user_id: target.id,
    target_device_code: target.device_code,
    target_employee_name: fullName(target),
    target_details: profileLine(target),
    target_region: target.region,
    target_office_name: target.office_name,
    target_department: target.department,
    target_role_title: target.role_title,
    started_at: now,
    connected_at: now,
    status: 'requested',
    response_status: 'pending'
  }).select().single();

  if (historyError) {
    setConnectMessage('Bağlantı jurnalı yazılmadı.', 'error');
    return;
  }

  const { error } = await supabase.from('signals').insert({
    sender_id: CURRENT_PROFILE.id,
    target_code: target.device_code,
    type: 'connection-request',
    payload: JSON.stringify({
      history_id: history.id,
      sender_id: CURRENT_PROFILE.id,
      sender_device_code: CURRENT_PROFILE.device_code,
      sender_name: fullName(CURRENT_PROFILE),
      sender_region: CURRENT_PROFILE.region,
      sender_office: CURRENT_PROFILE.office_name,
      sender_department: CURRENT_PROFILE.department,
      sender_role: CURRENT_PROFILE.role_title,
      target_id: target.id,
      target_name: fullName(target),
      target_device_code: target.device_code,
      requested_at: now
    })
  });

  if (error) {
    setConnectMessage('Qoşulma sorğusu göndərilmədi.', 'error');
    return;
  }

  const sentMsg = `${fullName(target)} üçün qoşulma sorğusu göndərildi.`;
  setConnectMessage(sentMsg, 'success');
  setDisconnectMessage(sentMsg, 'success');
    
}

function showRequest(signal, p) {
  document.querySelector('#modalRoot').innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal">
        <h2>Gələn uzaqdan qoşulma sorğusu</h2>
        <p>Aşağıdakı əməkdaş bu kompüterə təhlükəsiz dəstək məqsədilə qoşulmaq istəyir.</p>

        <div class="request-grid">
          <div><b>Əməkdaş</b><span>${esc(p.sender_name)}</span></div>
          <div><b>Rayon</b><span>${esc(p.sender_region)}</span></div>
          <div><b>İdarə</b><span>${esc(p.sender_office)}</span></div>
          <div><b>Struktur</b><span>${esc(p.sender_department)}</span></div>
          <div><b>Vəzifə</b><span>${esc(p.sender_role)}</span></div>
          <div><b>Cihaz kodu</b><span class="yellow">${esc(p.sender_device_code)}</span></div>
        </div>

        <div class="warning">Yalnız tanıdığınız əməkdaşa icazə verin. Şübhəli halda sorğunu rədd edin.</div>

        <div class="modal-actions">
          <button class="danger" id="rejectBtn">Rədd et</button>
          <button id="acceptBtn">İcazə ver</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector('#rejectBtn').onclick = () => respond(signal, false);
  document.querySelector('#acceptBtn').onclick = () => respond(signal, true);
}

async function respond(signal, accepted) {
  document.querySelector('#modalRoot').innerHTML = '';

  const p = parsePayload(signal.payload);
  const now = new Date().toISOString();

  await supabase.from('signals').update({ is_read: true }).eq('id', signal.id);

  if (p.history_id) {
    await supabase.from('connection_history').update({
      response_status: accepted ? 'accepted' : 'rejected',
      status: accepted ? 'accepted' : 'rejected',
      ended_at: accepted ? null : now,
      duration_seconds: 0
    }).eq('id', p.history_id);
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

    if (accepted) {
    await startHostScreenShare(p);
  }
  
  await loadHistory();
}



async function login(session) {
  CURRENT_PROFILE = await loadProfile(session.user.id);

  if (CURRENT_PROFILE.is_blocked) {
    await supabase.auth.signOut();
    setLoginMessage('Hesab administrator tərəfindən bloklanıb.', 'error');
    return;
  }

  if (!CURRENT_PROFILE.is_approved) {
    await supabase.auth.signOut();
    setLoginMessage('Hesab hələ administrator tərəfindən təsdiqlənməyib.', 'error');
    return;
  }

  if (!CURRENT_PROFILE.device_code) {
    await supabase.auth.signOut();
    setLoginMessage('Profil üçün ADSEA Desk kodu tapılmadı.', 'error');
    return;
  }

  await loadProfiles();
  showDashboard();
  renderEmployeeTree();
  await loadHistory();
  await markOnline();
  startHeartbeat();
  startPresence();
  listenSignals();
  updateInternetState();
}

async function doLogin() {
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;

  if (!email || !password) {
    setLoginMessage('Korporativ e-poçt və şifrə daxil edin.', 'error');
    return;
  }

  setLoginMessage('Kimlik yoxlanılır...', 'info');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.session) {
    setLoginMessage('E-poçt və ya şifrə yanlışdır.', 'error');
    return;
  }

  await login(data.session);
}

document.querySelector('#loginBtn').onclick = doLogin;

document.querySelector('#password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

document.querySelector('#email').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});


document.querySelector('#targetCode').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 9);
  e.target.value = v.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
});

document.querySelector('#connectBtn').onclick = connectByCode;

document.querySelector('#copyBtn').onclick = async () => {
  await navigator.clipboard.writeText(CURRENT_PROFILE.device_code);
  setConnectMessage('ADSEA kodu kopyalandı.', 'success');
};

document.querySelector('#employeeSearch').addEventListener('input', renderEmployeeTree);

document.querySelector('#historySearch').addEventListener('input', e => {
  HISTORY_SEARCH = e.target.value || '';
  renderHistory();
});

document.querySelector('#logoutBtn').onclick = async () => {
  await markOffline();
  await supabase.auth.signOut();
  location.reload();
};

window.addEventListener('online', updateInternetState);
window.addEventListener('offline', updateInternetState);




async function createPeer(sessionId, targetCode, mode = 'viewer') {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  if (mode === 'host') {
    const dc = pc.createDataChannel('remote-input', {
      ordered: false,
      maxRetransmits: 0
    });

    dc.onmessage = async e => {
      try {
        await handleRemoteInput(JSON.parse(e.data));
      } catch {}
    };
  }

  pc.ondatachannel = event => {
    INPUT_DC = event.channel;
  };

  pc.onicecandidate = async event => {
    if (event.candidate) {
      await supabase.from('signals').insert({
        sender_id: CURRENT_PROFILE.id,
        target_code: targetCode,
        type: 'webrtc-ice',
        payload: JSON.stringify({
          session_id: sessionId,
          candidate: event.candidate
        })
      });
    }
  };

  pc.onconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
      showDisconnectedOverlay();
    }
  };

  pc.oniceconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
      showDisconnectedOverlay();
    }
  };

  ACTIVE_PC = pc;
  ACTIVE_SESSION_ID = sessionId;
  ACTIVE_TARGET_CODE = targetCode;
  LAST_TARGET_CODE = targetCode;
  ACTIVE_ROLE = mode;

  return pc;
}




async function startHostScreenShare(requestPayload) {
  try {
    const sessionId = requestPayload.history_id;
    const targetCode = requestPayload.sender_device_code;

    setConnectMessage('Ekran paylaşımı başladılır...', 'info');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setConnectMessage('Bu sistemdə ekran paylaşımı dəstəklənmir.', 'error');
      return;
    }

    
    /*===========================================================*/
    /*ekran paylaşımı keyfiyyəti*/
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: 45, max: 60 },
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 }
      },
      audio: false
    });
    /*===========================================================*/

    
    showHostSessionPanel(requestPayload, stream);

    const pc = await createPeer(sessionId, targetCode, 'host');

    
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream);
    
      const params = sender.getParameters();
      params.encodings = [{
        maxBitrate: 6500000,
        maxFramerate: 45,
        priority: 'high'
      }];
    
      sender.setParameters(params).catch(() => {});
    });

    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await supabase.from('signals').insert({
      sender_id: CURRENT_PROFILE.id,
      target_code: targetCode,
      type: 'webrtc-offer',
      payload: JSON.stringify({
        session_id: sessionId,
        offer,
      host_name: fullName(CURRENT_PROFILE),
      host_device_code: CURRENT_PROFILE.device_code,
      host_region: CURRENT_PROFILE.region,
      host_office: CURRENT_PROFILE.office_name,
      host_department: CURRENT_PROFILE.department,
      host_role: CURRENT_PROFILE.role_title
      })
    });

    setConnectMessage('Ekran paylaşımı aktivdir.', 'success');

    stream.getVideoTracks()[0].onended = () => {
      closeRemoteSession();
    };
  } catch (err) {
    console.error(err);
    setConnectMessage('Ekran paylaşımı başladılmadı. İcazə verilmədi və ya sistem dəstəkləmir.', 'error');
  }
}

async function handleWebRTCOffer(signal, payload) {
  try {
    const sessionId = payload.session_id;

    showRemoteViewer(payload);

    const pc = await createPeer(sessionId, payload.host_device_code, 'viewer');

    pc.ontrack = event => {
      const video = document.querySelector('#remoteVideo');
      if (video) {
        video.srcObject = event.streams[0];
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await supabase.from('signals').insert({
      sender_id: CURRENT_PROFILE.id,
      target_code: payload.host_device_code,
      type: 'webrtc-answer',
      payload: JSON.stringify({
        session_id: sessionId,
        answer,
        viewer_name: fullName(CURRENT_PROFILE),
        viewer_device_code: CURRENT_PROFILE.device_code
      })
    });

    setConnectMessage('Uzaq ekran bağlantısı qurulur...', 'success');
  } catch (err) {
    console.error(err);
    setConnectMessage('Uzaq ekran bağlantısı qurulmadı.', 'error');
  }
}


async function handleWebRTCAnswer(signal, payload) {
  try {
    if (!ACTIVE_PC) return;
    await ACTIVE_PC.setRemoteDescription(new RTCSessionDescription(payload.answer));
    setConnectMessage('Qarşı tərəf ekrana qoşuldu.', 'success');
  } catch (err) {
    console.error(err);
  }
}

async function handleWebRTCIce(signal, payload) {
  try {
    if (!ACTIVE_PC || !payload.candidate) return;
    await ACTIVE_PC.addIceCandidate(new RTCIceCandidate(payload.candidate));
  } catch (err) {
    console.warn('ICE candidate error:', err);
  }
}


  function showRemoteViewer(payload) {
    removeDisconnectedOverlay();
    
    document.querySelector('#modalRoot').innerHTML = `
      <div class="remote-session">
        <div class="remote-topbar">
          <div>
            <strong>Uzaq ekran bağlantısı</strong>
            <span>
              ${esc(payload.host_name || 'Qarşı tərəf')} ·
              ${esc(payload.host_region || '')} ${esc(payload.host_office || '')} ·
              ${esc(payload.host_department || '')} - ${esc(payload.host_role || '')} ·
              ${esc(payload.host_device_code || '')}
            </span>
          </div>
            <div class="remote-actions">
              <button data-shortcut="win_r">Win+R</button>
              <button data-shortcut="win_e">Win+E</button>
              <button data-shortcut="win_i">Win+I</button>
              <button data-shortcut="win_x">Win+X</button>
              <button data-shortcut="control_panel">Control Panel</button>
              <button data-shortcut="powershell">PowerShell</button>
              <button data-shortcut="taskmgr">Task Manager</button>
              <button data-shortcut="alt_tab">Alt+Tab</button>
              <button id="closeRemoteBtn" class="danger">Bağlantını bitir</button>
            </div>
        </div>
  
        <video id="remoteVideo" autoplay playsinline></video>
      </div>
    `;
  
    const video = document.querySelector('#remoteVideo');
  
    video.addEventListener('loadedmetadata', () => {
      REMOTE_VIDEO_SIZE.width = video.videoWidth;
      REMOTE_VIDEO_SIZE.height = video.videoHeight;
    });
  
    video.addEventListener('mousemove', sendMouseMove);
    video.addEventListener('mousedown', sendMouseDown);
    video.addEventListener('mouseup', sendMouseUp);
    video.addEventListener('wheel', sendMouseWheel, { passive: false });
    
    video.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
    
    document.addEventListener('keydown', sendKeyboardEvent);
    document.addEventListener('keyup', sendKeyboardEvent);

    document.querySelectorAll('[data-shortcut]').forEach(btn => {
      btn.onclick = () => sendRemoteShortcut(btn.dataset.shortcut);
    });
    
    document.querySelector('#closeRemoteBtn').onclick = () => closeRemoteSession(true);
  }



function showHostSessionPanel(payload, stream) {
  document.querySelector('#modalRoot').innerHTML = `
    <div class="host-session">
      <div class="host-session-card">
        <h2>Ekran paylaşımı aktivdir</h2>
        <p>${esc(payload.sender_name || 'Əməkdaş')} sizin ekranınıza qoşulur.</p>
        <button id="stopShareBtn">Paylaşımı dayandır</button>
      </div>
    </div>
  `;

  document.querySelector('#stopShareBtn').onclick = () => {
    stream.getTracks().forEach(t => t.stop());
    closeRemoteSession();
  };
}


async function closeRemoteSession(sendNotice = true) {
  if (sendNotice && ACTIVE_TARGET_CODE) {
    await supabase.from('signals').insert({
      sender_id: CURRENT_PROFILE.id,
      target_code: ACTIVE_TARGET_CODE,
      type: 'session-ended',
      payload: JSON.stringify({
        session_id: ACTIVE_SESSION_ID,
        ended_by: fullName(CURRENT_PROFILE),
        ended_at: new Date().toISOString()
      })
    });
  }

  if (ACTIVE_PC) {
    ACTIVE_PC.close();
    ACTIVE_PC = null;
  }

  ACTIVE_SESSION_ID = null;
  ACTIVE_TARGET_CODE = null;
  ACTIVE_ROLE = null;
  INPUT_DC = null;
  removeDisconnectedOverlay();

  document.removeEventListener('keydown', sendKeyboardEvent);
  document.removeEventListener('keyup', sendKeyboardEvent);

  const root = document.querySelector('#modalRoot');
  if (root) root.innerHTML = '';

  setConnectMessage('Bağlantı sonlandırıldı.', 'info');
}



function getVideoPoint(e) {
  const video = document.querySelector('#remoteVideo');
  if (!video || !REMOTE_VIDEO_SIZE.width || !REMOTE_VIDEO_SIZE.height) return null;

  const rect = video.getBoundingClientRect();
  const videoRatio = REMOTE_VIDEO_SIZE.width / REMOTE_VIDEO_SIZE.height;
  const boxRatio = rect.width / rect.height;

  let drawWidth = rect.width;
  let drawHeight = rect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (boxRatio > videoRatio) {
    drawHeight = rect.height;
    drawWidth = drawHeight * videoRatio;
    offsetX = (rect.width - drawWidth) / 2;
  } else {
    drawWidth = rect.width;
    drawHeight = drawWidth / videoRatio;
    offsetY = (rect.height - drawHeight) / 2;
  }

  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;

  if (x < 0 || y < 0 || x > drawWidth || y > drawHeight) return null;

  return {
    x: Math.round((x / drawWidth) * REMOTE_VIDEO_SIZE.width),
    y: Math.round((y / drawHeight) * REMOTE_VIDEO_SIZE.height)
  };
}

  
  let lastMouseSent = 0;



  async function sendRemoteInput(payload) {
    if (INPUT_DC && INPUT_DC.readyState === 'open') {
      INPUT_DC.send(JSON.stringify(payload));
      return;
    }
  
    if (!ACTIVE_TARGET_CODE) return;
  
    await supabase.from('signals').insert({
      sender_id: CURRENT_PROFILE.id,
      target_code: ACTIVE_TARGET_CODE,
      type: 'remote-input',
      payload: JSON.stringify(payload)
    });
  }



async function sendMouseMove(e) {
  const now = performance.now();
  if (now - LAST_REMOTE_INPUT_AT < 16) return;
  LAST_REMOTE_INPUT_AT = now;

  const point = getVideoPoint(e);
  if (!point) return;

  await sendRemoteInput({
    action: 'mouse_move',
    x: point.x,
    y: point.y
  });
}



async function sendMouseDown(e) {
  const point = getVideoPoint(e);
  if (!point) return;

  await sendRemoteInput({
    action: 'mouse_down',
    button: e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left',
    x: point.x,
    y: point.y
  });
}



async function sendMouseUp(e) {
  const point = getVideoPoint(e);
  if (!point) return;

  await sendRemoteInput({
    action: 'mouse_up',
    button: e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left',
    x: point.x,
    y: point.y
  });
}



async function sendMouseDoubleClick(e) {
  const point = getVideoPoint(e);
  if (!point || !ACTIVE_TARGET_CODE) return;

  await supabase.from('signals').insert({
    sender_id: CURRENT_PROFILE.id,
    target_code: ACTIVE_TARGET_CODE,
    type: 'remote-input',
    payload: JSON.stringify({
      action: 'mouse_double_click',
      button: 'left',
      x: point.x,
      y: point.y
    })
  });
}



async function sendMouseWheel(e) {
  e.preventDefault();

  const point = getVideoPoint(e);
  if (!point) return;

  await sendRemoteInput({
    action: 'mouse_wheel',
    delta_y: e.deltaY > 0 ? 4 : -4,
    x: point.x,
    y: point.y
  });
}



function normalizeTypedKey(e) {
  if (e.shiftKey && e.code === 'Period') return ',';
  return e.key;
}



async function sendKeyboardEvent(e) {
  if (!ACTIVE_TARGET_CODE) return;
  if (e.type !== 'keydown') return;

  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  e.preventDefault();

  if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    let text = e.key;

    if (e.shiftKey && e.code === 'Period') text = ',';

    await sendRemoteInput({
      action: 'key_text',
      text
    });

    return;
  }

  await sendRemoteInput({
    action: 'key_combo',
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    meta: e.metaKey
  });
}



async function handleRemoteInput(payload) {
  try {
    await invoke('remote_input', { payload });
  } catch (err) {
    console.error('remote_input failed:', err);
  }
}


async function sendRemoteShortcut(shortcut) {
  await sendRemoteInput({
    action: 'shortcut',
    shortcut
  });
}



function removeDisconnectedOverlay() {
  const old = document.querySelector('#remoteDisconnectBox');
  if (old) old.remove();
}

function setDisconnectMessage(text, type = 'info') {
  const el = document.querySelector('#disconnectMessage');
  if (!el) return;
  el.className = `disconnect-message ${type}`;
  el.textContent = text;
}

function showDisconnectedOverlay() {
  if (!ACTIVE_SESSION_ID) return;

  const old = document.querySelector('#remoteDisconnectBox');
  if (old) return;

  const canReconnect = ACTIVE_ROLE === 'viewer';
  const savedCode = ACTIVE_TARGET_CODE || LAST_TARGET_CODE;

  const box = document.createElement('div');
  box.id = 'remoteDisconnectBox';
  box.className = 'remote-disconnect-box';

  box.innerHTML = `
    <div>
      <h2>Bağlantı kəsildi</h2>
      <p>Qarşı tərəfin internet bağlantısı kəsilmiş, proqram bağlanmış və ya ekran paylaşımı dayandırılmış ola bilər.</p>

      <div id="disconnectMessage" class="disconnect-message info">
        ${canReconnect ? 'Yenidən qoşulmaq üçün sorğu göndərə bilərsiniz.' : 'Bağlantını bağlayıb ana ekrana qayıda bilərsiniz.'}
      </div>

      <div class="disconnect-actions ${canReconnect ? '' : 'single'}">
        ${canReconnect ? `<button id="retryRemoteBtn">Yenidən qoşul</button>` : ''}
        <button id="closeDisconnectedBtn">Bağla</button>
      </div>
    </div>
  `;

  document.body.appendChild(box);

  document.querySelector('#closeDisconnectedBtn').onclick = () => {
    closeRemoteSession(false);
  };

  if (canReconnect) {
    document.querySelector('#retryRemoteBtn').onclick = async () => {
      if (!savedCode) {
        setDisconnectMessage('Qoşulacaq cihaz kodu tapılmadı.', 'error');
        return;
      }

      document.querySelector('#targetCode').value = savedCode;
      setDisconnectMessage('Yenidən qoşulma sorğusu göndərilir...', 'info');

      await connectByCode();

      setDisconnectMessage('Sorğu göndərildi. Qarşı tərəfin cavabı gözlənilir.', 'success');
    };
  }
}

  /*==============================================================================================================================*/
  /*Bu blok faylın ən axırında tam belə bağlanmalıdır:*/
  window.addEventListener('keydown', e => {
    if (e.key === 'F5' && !ACTIVE_SESSION_ID) {
      e.preventDefault();
    }
  });
  
  (async () => {
    const { data } = await supabase.auth.getSession();
  
    if (data?.session) {
      try {
        await login(data.session);
      } catch {
        await supabase.auth.signOut();
        setLoginMessage('Sessiya yenilənmədi. Zəhmət olmasa yenidən daxil olun.', 'error');
      }
    }
  
    updateInternetState();
  
})();
