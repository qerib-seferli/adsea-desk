import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = 'https://hdpdykooqirguwnojovb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.querySelector('#app').innerHTML = `
  <main class="agent-page">
    <section class="agent-card">
      <div class="brand">
        <div class="logo">AD</div>
        <div>
          <h1>ADSEA Desk</h1>
          <p>Windows Agent</p>
        </div>
      </div>

      <div class="form">
        <label>Email</label>
        <input id="email" type="email" placeholder="email@example.com" />

        <label>Şifrə</label>
        <input id="password" type="password" placeholder="Şifrənizi yazın" />

        <button id="loginBtn">Daxil ol</button>
      </div>

      <div id="status" class="status">Agent hazırdır.</div>

      <div class="device-box">
        <span>Cihaz kodu</span>
        <strong id="deviceCode">---</strong>
      </div>
    </section>
  </main>
`;

const statusEl = document.querySelector('#status');
const deviceCodeEl = document.querySelector('#deviceCode');

function setStatus(text) {
  statusEl.textContent = text;
}

function makeDeviceCode() {
  return 'ADSEA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

document.querySelector('#loginBtn').addEventListener('click', async () => {
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value.trim();

  if (!email || !password) {
    setStatus('Email və şifrə yazın.');
    return;
  }

  setStatus('Supabase giriş yoxlanılır...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setStatus('Login xətası: ' + error.message);
    return;
  }

  const user = data.user;
  const deviceCode = makeDeviceCode();
  deviceCodeEl.textContent = deviceCode;

  setStatus('Cihaz Supabase-ə yazılır...');

  const { error: deviceError } = await supabase
    .from('devices')
    .upsert(
      {
        user_id: user.id,
        device_code: deviceCode,
        name: 'ADSEA Desk Windows Agent',
        platform: 'windows',
        is_online: true,
        last_seen: new Date().toISOString()
      },
      {
        onConflict: 'user_id,platform'
      }
    );

  if (deviceError) {
    setStatus('Device xətası: ' + deviceError.message);
    return;
  }

  setStatus('ADSEA Desk Agent online oldu.');
});
