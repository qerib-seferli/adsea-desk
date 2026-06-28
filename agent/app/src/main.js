import { createClient } from '@supabase/supabase-js';
import './style.css'; 

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
          Yalnız səlahiyyətli əməkdaşlar üçün daxili təhlükəsiz bağlantı sistemi.
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
          <span>Bu kompüterin ADSEA kodu</span>
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
        <p>Windows Təhlükəsiz Uzaqdan Dəstək Agenti</p>
      </div>

      <article class="card connect-card">
        <h2>Uzaq iş masasına qoşulma</h2>
        <p>Qoşulmaq istədiyiniz əməkdaşın 9 rəqəmli ADSEA kodunu daxil edin.</p>

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
  
  if (signal.type === 'connection-response') {
    if (p.accepted) {
      setConnectMessage(`${p.responder_name || 'Qarşı tərəf'} qoşulmaya icazə verdi. Növbəti mərhələdə ekran paylaşımı başlayacaq.`, 'success');
    } else {
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
    setConnectMessage('9 rəqəmli ADSEA kodunu düzgün daxil edin.', 'error');
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
    setConnectMessage(`${fullName(target)} hazırda offline-dır. Sorğu göndərilə bilməz.`, 'error');
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

  setConnectMessage(`${fullName(target)} üçün qoşulma sorğusu göndərildi.`, 'success');
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
    setLoginMessage('Profil üçün ADSEA kodu tapılmadı.', 'error');
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

document.querySelector('#loginBtn').onclick = async () => {
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
};

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

(async () => {
  const { data } = await supabase.auth.getSession();
  if (data?.session) await login(data.session);
  updateInternetState();


  
    async function createPeer(sessionId, targetCode) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
  
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
  
    ACTIVE_PC = pc;
    ACTIVE_SESSION_ID = sessionId;
  
    return pc;
  }
  
  async function startHostScreenShare(requestPayload) {
    try {
      const sessionId = requestPayload.history_id;
      const targetCode = requestPayload.sender_device_code;
  
      setConnectMessage('Ekran paylaşımı başladılır...', 'info');
  
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
  
      showHostSessionPanel(requestPayload, stream);
  
      const pc = await createPeer(sessionId, targetCode);
  
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
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
          host_device_code: CURRENT_PROFILE.device_code
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
      const targetCode = signal.sender_id ? payload.host_device_code : '';
  
      showRemoteViewer(payload);
  
      const pc = await createPeer(sessionId, payload.host_device_code);
  
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
    document.querySelector('#modalRoot').innerHTML = `
      <div class="remote-session">
        <div class="remote-topbar">
          <div>
            <strong>Uzaq ekran bağlantısı</strong>
            <span>${esc(payload.host_name || 'Qarşı tərəf')} · ${esc(payload.host_device_code || '')}</span>
          </div>
          <button id="closeRemoteBtn">Bağlantını bitir</button>
        </div>
  
        <video id="remoteVideo" autoplay playsinline></video>
      </div>
    `;
  
    document.querySelector('#closeRemoteBtn').onclick = closeRemoteSession;
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
  
  function closeRemoteSession() {
    if (ACTIVE_PC) {
      ACTIVE_PC.close();
      ACTIVE_PC = null;
    }
  
    ACTIVE_SESSION_ID = null;
  
    const root = document.querySelector('#modalRoot');
    if (root) root.innerHTML = '';
  
    setConnectMessage('Bağlantı sonlandırıldı.', 'info');
  }
  
})();
