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
      payload
    });

    if (error) {
      toast("Qoşulma sorğusu göndərilmədi.", "error");
      return;
    }

    toast(`${fullName(targetProfile)} üçün qoşulma sorğusu göndərildi.`, "success");
  },

  async handleSignal(myProfile, signal) {
    if (signal.type === "connection-request") {
      this.showIncomingRequest(myProfile, signal);
      return;
    }

    if (signal.type === "connection-response") {
      const accepted = signal.payload?.accepted;

      toast(
        accepted
          ? "Qarşı tərəf bağlantıya icazə verdi."
          : "Qarşı tərəf bağlantını rədd etdi.",
        accepted ? "success" : "error"
      );
    }
  },

showIncomingRequest(myProfile, signal) {
  const p = signal.payload || {};
  const root = document.getElementById("modal-root");

  root.innerHTML = `
    <div class="modal-backdrop">
      <section class="request-modal incoming-modal">
        <button class="modal-close" onclick="document.getElementById('modal-root').innerHTML=''">×</button>

        <div class="incoming-head">
          <div class="incoming-avatar">
            <span>👤</span>
          </div>
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

        <div class="security-note">
          <b>Təhlükəsizlik qeydi</b>
          <span>Yalnız tanıdığınız və gözlədiyiniz əməkdaşlara icazə verin.</span>
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
    const modalRoot = document.getElementById("modal-root");
    if (modalRoot) modalRoot.innerHTML = "";

    const { data: originalSignal, error: signalReadError } = await db
      .from("signals")
      .select("*")
      .eq("id", signalId)
      .single();

    if (signalReadError) {
      toast("Sorğu məlumatı oxunmadı.", "error");
      return;
    }

    const historyId = originalSignal?.payload?.history_id;

    await db
      .from("signals")
      .update({ is_read: true })
      .eq("id", signalId);

    const my = CURRENT?.profile || await Auth.profile((await Auth.user()).id);

    if (historyId) {
      await db
        .from("connection_history")
        .update({
          response_status: accepted ? "accepted" : "rejected",
          status: accepted ? "accepted" : "rejected",
          ended_at: accepted ? null : new Date().toISOString(),
          duration_seconds: 0
        })
        .eq("id", historyId);
    }

    await db.from("signals").insert({
      sender_id: my.id,
      target_code: senderDeviceCode,
      type: "connection-response",
      payload: {
        accepted,
        history_id: historyId,
        responder_name: fullName(my),
        responder_device_code: my.device_code,
        responded_at: new Date().toISOString()
      }
    });

    toast(
      accepted ? "Qoşulmaya icazə verildi." : "Qoşulma rədd edildi.",
      accepted ? "success" : "error"
    );
  }
};
