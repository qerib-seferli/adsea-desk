function parseSignalPayload(payload) {
  if (!payload) return {};

  let p = payload;

  for (let i = 0; i < 2; i++) {
    if (typeof p === "string") {
      try {
        p = JSON.parse(p);
      } catch {
        return {};
      }
    }
  }

  return p && typeof p === "object" ? p : {};
}

function notifySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    [0, 260, 520].forEach((delay) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.value = 1050;
        gain.gain.value = 0.16;

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        setTimeout(() => osc.stop(), 180);
      }, delay);
    });

    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

const WebRTCControl = {
  signalChannel: null,

  listen(profile) {
    this.signalChannel = db
      .channel(`signals-${profile.device_code}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signals",
          filter: `target_code=eq.${profile.device_code}`
        },
        payload => this.handleSignal(profile, payload.new)
      )
      .subscribe();
  },

  async requestConnection(senderProfile, targetProfile) {
    const payload = {
      sender_device_code: senderProfile.device_code,
      sender_name: fullName(senderProfile),
      sender_region: senderProfile.region,
      sender_office: senderProfile.office_name,
      sender_department: senderProfile.department,
      sender_role: senderProfile.role_title,
      target_name: fullName(targetProfile),
      target_device_code: targetProfile.device_code,
      requested_at: new Date().toISOString()
    };

    const { data: historyRow, error: historyError } = await db
      .from("connection_history")
      .insert({
        operator_id: senderProfile.id,
        operator_name: fullName(senderProfile),
        operator_device_code: senderProfile.device_code,
        target_user_id: targetProfile.id,
        target_device_code: targetProfile.device_code,
        target_employee_name: fullName(targetProfile),
        target_details: profileDetails(targetProfile),
        target_region: targetProfile.region,
        target_office_name: targetProfile.office_name,
        target_department: targetProfile.department,
        target_role_title: targetProfile.role_title,
        started_at: new Date().toISOString(),
        connected_at: new Date().toISOString(),
        status: "requested",
        response_status: "pending"
      })
      .select()
      .single();

    if (historyError) {
      console.error(historyError);
      toast("Bağlantı keçmişi yazılmadı.", "error");
      return;
    }

    payload.history_id = historyRow.id;

    const { error } = await db.from("signals").insert({
      sender_id: senderProfile.id,
      target_code: targetProfile.device_code,
      type: "connection-request",
      payload: JSON.stringify(payload)
    });

    if (error) {
      toast("Qoşulma sorğusu göndərilmədi.", "error");
      return;
    }

    toast(`${fullName(targetProfile)} üçün qoşulma sorğusu göndərildi.`, "success");
  },

  async handleSignal(myProfile, signal) {
    const p = parseSignalPayload(signal.payload);

    if (signal.type === "connection-request") {
      notifySound();

      showSystemNotification(
        "ADSEA Desk - Gələn qoşulma sorğusu",
        `${p.sender_name || "Əməkdaş"} sizin kompüterə qoşulmaq istəyir.`
      );

      this.showIncomingRequest(myProfile, signal);
      return;
    }

    if (signal.type === "connection-response") {
      toast(
        p.accepted ? "Qarşı tərəf bağlantıya icazə verdi." : "Qarşı tərəf bağlantını rədd etdi.",
        p.accepted ? "success" : "error"
      );
    }
  },

  showIncomingRequest(myProfile, signal) {
    const p = parseSignalPayload(signal.payload);
    let root = document.getElementById("modal-root");

    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="modal-backdrop">
        <section class="request-modal incoming-modal">
          <button class="modal-close" onclick="document.getElementById('modal-root').innerHTML=''">×</button>

          <div class="incoming-head">
            <div class="incoming-avatar"><span>👤</span></div>
            <div>
              <h2>Gələn uzaqdan qoşulma sorğusu</h2>
              <p>Aşağıdakı əməkdaş sizin kompüterə qoşulmaq istəyir.</p>
            </div>
          </div>

          <div class="incoming-grid">
            <div><b>Ad Soyad</b><span>${esc(p.sender_name)}</span></div>
            <div><b>Rayon</b><span>${esc(p.sender_region)}</span></div>
            <div><b>İdarə</b><span>${esc(p.sender_office)}</span></div>
            <div><b>Struktur</b><span>${esc(p.sender_department)}</span></div>
            <div><b>Vəzifə</b><span>${esc(p.sender_role)}</span></div>
            <div><b>Cihaz kodu</b><span class="code-yellow big">${esc(p.sender_device_code)}</span></div>
          </div>

          <div class="modal-actions">
            <button class="danger-btn" onclick="WebRTCControl.respond('${signal.id}', '${esc(p.sender_device_code)}', false)">Rədd et</button>
            <button class="primary-btn" onclick="WebRTCControl.respond('${signal.id}', '${esc(p.sender_device_code)}', true)">İcazə ver</button>
          </div>
        </section>
      </div>
    `;
  },

  async respond(signalId, senderDeviceCode, accepted) {
    const root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";

    const { data: originalSignal, error: signalReadError } = await db
      .from("signals")
      .select("*")
      .eq("id", signalId)
      .single();

    if (signalReadError) {
      console.error(signalReadError);
      toast("Sorğu məlumatı oxunmadı.", "error");
      return;
    }

    const originalPayload = parseSignalPayload(originalSignal.payload);
    const historyId = originalPayload.history_id;

    await db.from("signals").update({ is_read: true }).eq("id", signalId);

    const my = CURRENT?.profile || ADMIN_CTX?.profile || PROFILE_CTX?.profile || await Auth.profile((await Auth.user()).id);

let finalHistoryId = historyId;

if (!finalHistoryId) {
  const { data: latestPending } = await db
    .from("connection_history")
    .select("id")
    .eq("operator_device_code", senderDeviceCode)
    .eq("target_device_code", my.device_code)
    .eq("response_status", "pending")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  finalHistoryId = latestPending?.id;
}

if (finalHistoryId) {
  const { error: historyUpdateError } = await db
    .from("connection_history")
    .update({
      response_status: accepted ? "accepted" : "rejected",
      status: accepted ? "accepted" : "rejected",
      ended_at: accepted ? null : new Date().toISOString(),
      duration_seconds: 0
    })
    .eq("id", finalHistoryId);

  if (historyUpdateError) console.error(historyUpdateError);
}

    await db.from("signals").insert({
      sender_id: my.id,
      target_code: senderDeviceCode,
      type: "connection-response",
      payload: JSON.stringify({
        accepted,
        history_id: historyId,
        responder_name: fullName(my),
        responder_device_code: my.device_code,
        responded_at: new Date().toISOString()
      })
    });

    toast(accepted ? "Qoşulmaya icazə verildi." : "Qoşulma rədd edildi.", accepted ? "success" : "error");
  }
};
