import { createClient } from '@supabase/supabase-js';
import './style.css'; 

const SUPABASE_URL = 'https://hdpdykooqirguwnojovb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA';


/*========================================================================================================*/

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

let CURRENT_PROFILE = null;
let ALL_PROFILES = [];
let SIGNAL_CHANNEL = null;
let PRESENCE_CHANNEL = null;
let HEARTBEAT_TIMER = null;

const app = document.querySelector('#app');

app.innerHTML = `
<main class="agent-page">
  <section class="agent-shell">
    <aside class="left-panel">
      <div class="brand">
        <div class="logo">AD</div>
        <div>
          <h1>ADSEA Desk</h1>
          <p>Windows Təhlükəsiz Uzaqdan Dəstək Agenti</p>
        </div>
      </div>

      <div id="loginView" class="login-card">
        <div class="notice">Yalnız səlahiyyətli əməkdaşlar üçün daxili təhlükəsiz bağlantı sistemi.</div>
        <label>Korporativ e-poçt</label>
        <input id="email" type="email" placeholder="ad.soyad@adsea.gov.az">
        <label>Şifrə</label>
        <input id="password" type="password" placeholder="Şifrənizi daxil edin">
        <button id="loginBtn">Təhlükəsiz giriş</button>
      </div>

      <div id="profileView" class="hidden">
        <div class="profile-card">
          <div class="avatar">👤</div>
          <div>
            <strong id="fullName">---</strong>
            <span id="profileInfo">---</span>
          </div>
          <b class="online">ONLAYN</b>
        </div>

        <div class="code-card">
          <span>Bu kompüterin ADSEA kodu</span>
          <strong id="deviceCode">---</strong>
          <button id="copyBtn">Kopyala</button>
        </div>

        <button id="logoutBtn" class="logout">Çıxış</button>
      </div>
    </aside>

    <section id="workView" class="work-panel hidden">
      <div class="status-row">
        <div><b>Agent xidməti aktivdir</b><span>Bağlantı sorğuları real vaxtda izlənilir.</span></div>
        <strong class="safe">Təhlükəsiz</strong>
      </div>

      <div class="connect-card">
        <h2>Uzaq kompüterə qoşulma</h2>
        <p>Qoşulmaq istədiyiniz əməkdaşın 9 rəqəmli ADSEA kodunu daxil edin.</p>
        <div class="connect-line">
          <input id="targetCode" maxlength="11" placeholder="000 000 000">
          <button id="connectBtn">Sorğu göndər</button>
        </div>
      </div>

      <div class="activity-card">
        <h2>Son aktivlik</h2>
        <ul id="activityList"></ul>
      </div>
    </section>

    <div id="modalRoot"></div>
  </section>
</main>
`;

function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");}
function fullName(p){return `${p.first_name||''} ${p.last_name||''} ${p.patronymic||''}`.trim();}
function details(p){return `${p.region||''} · ${p.office_name||''} · ${p.department||''} · ${p.role_title||''}`;}
function parsePayload(payload){try{return typeof payload==='object'?payload:JSON.parse(payload||'{}')}catch{return{}}}

function addActivity(text){
  const list=document.querySelector('#activityList');
  if(!list)return;
  const li=document.createElement('li');
  li.innerHTML=`<b>✓</b><div>${esc(text)}<span>${new Date().toLocaleString('az-AZ')}</span></div>`;
  list.prepend(li);
  while(list.children.length>6) list.lastElementChild.remove();
}

function setStatus(text){addActivity(text);}

async function loadProfile(userId){
  const {data,error}=await supabase.from('profiles').select('*').eq('id',userId).single();
  if(error||!data) throw new Error('Profil məlumatı tapılmadı.');
  return data;
}

async function loadProfiles(){
  const {data}=await supabase.from('profiles').select('*').eq('is_approved',true);
  ALL_PROFILES=data||[];
}

async function markOnline(){
  if(!CURRENT_PROFILE)return;
  const now=new Date().toISOString();

  await supabase.from('profiles').update({last_seen_at:now}).eq('id',CURRENT_PROFILE.id);

  await supabase.from('devices').upsert({
    user_id:CURRENT_PROFILE.id,
    device_code:CURRENT_PROFILE.device_code,
    name:'ADSEA Desk Windows Agent',
    platform:'windows',
    is_online:true,
    last_seen:now
  },{onConflict:'user_id,platform'});
}

function startHeartbeat(){
  if(HEARTBEAT_TIMER)clearInterval(HEARTBEAT_TIMER);
  HEARTBEAT_TIMER=setInterval(markOnline,15000);
}

function startPresence(){
  PRESENCE_CHANNEL=supabase.channel('adsea-online-presence',{config:{presence:{key:CURRENT_PROFILE.id}}});
  PRESENCE_CHANNEL.subscribe(async status=>{
    if(status==='SUBSCRIBED'){
      await PRESENCE_CHANNEL.track({
        id:CURRENT_PROFILE.id,
        name:fullName(CURRENT_PROFILE),
        region:CURRENT_PROFILE.region,
        office_name:CURRENT_PROFILE.office_name,
        role_title:CURRENT_PROFILE.role_title,
        device_code:CURRENT_PROFILE.device_code,
        source:'windows-agent',
        online_at:new Date().toISOString()
      });
    }
  });
}

function listenSignals(){
  SIGNAL_CHANNEL=supabase.channel(`agent-signals-${CURRENT_PROFILE.device_code}`)
    .on('postgres_changes',{
      event:'INSERT',
      schema:'public',
      table:'signals',
      filter:`target_code=eq.${CURRENT_PROFILE.device_code}`
    },payload=>handleSignal(payload.new))
    .subscribe();
}

async function handleSignal(signal){
  const p=parsePayload(signal.payload);
  if(signal.type==='connection-request'){
    setStatus('Gələn qoşulma sorğusu alındı.');
    showRequest(signal,p);
  }
  if(signal.type==='connection-response'){
    setStatus(p.accepted?'Qoşulma sorğusuna icazə verildi.':'Qoşulma sorğusu rədd edildi.');
  }
}

function showDashboard(){
  document.querySelector('#loginView').classList.add('hidden');
  document.querySelector('#profileView').classList.remove('hidden');
  document.querySelector('#workView').classList.remove('hidden');

  document.querySelector('#fullName').textContent=fullName(CURRENT_PROFILE);
  document.querySelector('#profileInfo').textContent=details(CURRENT_PROFILE);
  document.querySelector('#deviceCode').textContent=CURRENT_PROFILE.device_code;
}

async function connectByCode(){
  const code=document.querySelector('#targetCode').value.trim();

  if(!/^\d{3} \d{3} \d{3}$/.test(code)){
    setStatus('9 rəqəmli kod düzgün formatda deyil.');
    return;
  }

  const target=ALL_PROFILES.find(p=>p.device_code===code);
  if(!target){
    setStatus('Bu kodla aktiv əməkdaş tapılmadı.');
    return;
  }

  if(target.id===CURRENT_PROFILE.id){
    setStatus('Öz kompüterinizə qoşulma sorğusu göndərilə bilməz.');
    return;
  }

  const now=new Date().toISOString();

  const {data:history,error:historyError}=await supabase.from('connection_history').insert({
    operator_id:CURRENT_PROFILE.id,
    operator_name:fullName(CURRENT_PROFILE),
    operator_device_code:CURRENT_PROFILE.device_code,
    target_user_id:target.id,
    target_device_code:target.device_code,
    target_employee_name:fullName(target),
    target_details:details(target),
    target_region:target.region,
    target_office_name:target.office_name,
    target_department:target.department,
    target_role_title:target.role_title,
    started_at:now,
    connected_at:now,
    status:'requested',
    response_status:'pending'
  }).select().single();

  if(historyError){
    setStatus('Bağlantı jurnalı yazılmadı.');
    return;
  }

  await supabase.from('signals').insert({
    sender_id:CURRENT_PROFILE.id,
    target_code:target.device_code,
    type:'connection-request',
    payload:JSON.stringify({
      history_id:history.id,
      sender_id:CURRENT_PROFILE.id,
      sender_device_code:CURRENT_PROFILE.device_code,
      sender_name:fullName(CURRENT_PROFILE),
      sender_region:CURRENT_PROFILE.region,
      sender_office:CURRENT_PROFILE.office_name,
      sender_department:CURRENT_PROFILE.department,
      sender_role:CURRENT_PROFILE.role_title,
      target_id:target.id,
      target_name:fullName(target),
      target_device_code:target.device_code,
      requested_at:now
    })
  });

  setStatus(`${fullName(target)} üçün qoşulma sorğusu göndərildi.`);
}

function showRequest(signal,p){
  document.querySelector('#modalRoot').innerHTML=`
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
  </div>`;

  document.querySelector('#rejectBtn').onclick=()=>respond(signal,false);
  document.querySelector('#acceptBtn').onclick=()=>respond(signal,true);
}

async function respond(signal,accepted){
  document.querySelector('#modalRoot').innerHTML='';
  const p=parsePayload(signal.payload);
  const now=new Date().toISOString();

  await supabase.from('signals').update({is_read:true}).eq('id',signal.id);

  if(p.history_id){
    await supabase.from('connection_history').update({
      response_status:accepted?'accepted':'rejected',
      status:accepted?'accepted':'rejected',
      ended_at:accepted?null:now,
      duration_seconds:0
    }).eq('id',p.history_id);
  }

  await supabase.from('signals').insert({
    sender_id:CURRENT_PROFILE.id,
    target_code:p.sender_device_code,
    type:'connection-response',
    payload:JSON.stringify({
      accepted,
      history_id:p.history_id,
      responder_name:fullName(CURRENT_PROFILE),
      responder_device_code:CURRENT_PROFILE.device_code,
      responded_at:now
    })
  });

  setStatus(accepted?'Qoşulmaya icazə verildi.':'Qoşulma rədd edildi.');
}

async function login(session){
  CURRENT_PROFILE=await loadProfile(session.user.id);

  if(CURRENT_PROFILE.is_blocked){
    await supabase.auth.signOut();
    setStatus('Hesab administrator tərəfindən bloklanıb.');
    return;
  }

  if(!CURRENT_PROFILE.is_approved){
    await supabase.auth.signOut();
    setStatus('Hesab hələ administrator tərəfindən təsdiqlənməyib.');
    return;
  }

  if(!CURRENT_PROFILE.device_code){
    await supabase.auth.signOut();
    setStatus('Profil üçün ADSEA kodu tapılmadı.');
    return;
  }

  await loadProfiles();
  showDashboard();
  await markOnline();
  startHeartbeat();
  startPresence();
  listenSignals();
  setStatus('ADSEA Desk Agent aktivdir.');
}

document.querySelector('#loginBtn').onclick=async()=>{
  const email=document.querySelector('#email').value.trim();
  const password=document.querySelector('#password').value;

  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error||!data?.session){
    setStatus('E-poçt və ya şifrə yanlışdır.');
    return;
  }

  await login(data.session);
};

document.querySelector('#targetCode').addEventListener('input',e=>{
  let v=e.target.value.replace(/\D/g,'').slice(0,9);
  e.target.value=v.replace(/(\d{3})(?=\d)/g,'$1 ').trim();
});

document.querySelector('#connectBtn').onclick=connectByCode;

document.querySelector('#copyBtn').onclick=async()=>{
  await navigator.clipboard.writeText(CURRENT_PROFILE.device_code);
  setStatus('ADSEA kodu kopyalandı.');
};

document.querySelector('#logoutBtn').onclick=async()=>{
  await supabase.from('devices').update({is_online:false,last_seen:new Date().toISOString()}).eq('user_id',CURRENT_PROFILE.id);
  await supabase.auth.signOut();
  location.reload();
};

(async()=>{
  const {data}=await supabase.auth.getSession();
  if(data?.session) await login(data.session);
})();
