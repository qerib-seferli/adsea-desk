const SUPABASE_URL = "https://hdpdykooqirguwnojovb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGR5a29vcWlyZ3V3bm9qb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNzMsImV4cCI6MjA5Nzk4NTM3M30.G_cqtqwd4d8bCYrNSeMgyQAYkogahUx9uKrRTrxOJoA";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  } 
});

const BASE_PATH = location.pathname.includes("/adsea-desk") ? "/adsea-desk" : "";

function go(path) {
  location.href = `${BASE_PATH}${path}`;
}

function toast(message, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) return alert(message);

  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  root.appendChild(item);

  setTimeout(() => item.remove(), 4200);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fullName(p) {
  return `${p.first_name || ""} ${p.last_name || ""} ${p.patronymic || ""}`.trim();
}

function profileDetails(p) {
  return `${p.region || ""} | ${p.office_name || ""} | ${p.department || ""} | ${p.role_title || ""}`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const Auth = {
  async session() {
    const { data } = await db.auth.getSession();
    return data.session;
  },

  async user() {
    const { data } = await db.auth.getUser();
    return data.user;
  },

  async profile(userId) {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async requireApproved() {
    const session = await this.session();

    if (!session) {
      go("/login/");
      return null;
    }

    const profile = await this.profile(session.user.id);

    if (profile.is_blocked) {
      await db.auth.signOut();
      toast("Hesabınız administrator tərəfindən bloklanıb.", "error");
      setTimeout(() => go("/login/"), 900);
      return null;
    }

    if (!profile.is_approved) {
      await db.auth.signOut();
      toast("Hesabınız hələ admin tərəfindən təsdiqlənməyib.", "warn");
      setTimeout(() => go("/login/"), 900);
      return null;
    }

    await db
      .from("profiles")
      .update({
        last_seen_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    return { session, user: session.user, profile };
  },

  async requireAdmin() {
    const ctx = await this.requireApproved();
    if (!ctx) return null;

    if (!ctx.profile.is_admin) {
      toast("Bu bölməyə yalnız admin daxil ola bilər.", "error");
      setTimeout(() => go("/"), 900);
      return null;
    }

    return ctx;
  },

  async logout() {
    await db.auth.signOut();
    go("/login/");
  }
};


async function askNotificationPermission() {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission === "denied") {
    toast("Bildiriş icazəsi brauzerdə bloklanıb.", "warn");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function showSystemNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: `${BASE_PATH}/foto/Logo.png`,
      badge: `${BASE_PATH}/foto/Logo.png`
    });
  }
}
