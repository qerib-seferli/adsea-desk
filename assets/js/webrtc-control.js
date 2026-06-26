const WebRTCControl = {
  signalChannel: null,

  listen(profile) {
    this.signalChannel = supabase
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
      requested_at: new Date().toISOString()
    };

    const { error } = await supabase.from("signals").insert({
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
      toast(accepted ? "Qarşı tərəf bağlantıya icazə verdi." : "Qarşı tərəf bağlantını rədd etdi.", accepted ? "success" : "error");
    }
  },

  showIncomingRequest(myProfile, signal) {
    const p = signal.payload || {};
    const root = document.getElementById("modal-root");

    root.innerHTML = `
      <div class="modal-backdrop">
        <section class="request-modal">
          <h2>Gələn uzaqdan qoşulma sorğusu</h2>
          <p style="color:var(--muted)">Aşağıdakı əməkdaş sizin kompüterə qoşulmaq istəyir.</p>

          <div class="info-grid">
            <div><b>Ad Soyad</b><span>${esc(p.sender_name)}</span></div>
            <div><b>Şəhər / Rayon</b><span>${esc(p.sender_region)}</span></div>
            <div><b>İdarə</b><span>${esc(p.sender_office)}</span></div>
            <div><b>Struktur</b><span>${esc(p.sender_department)}</span></div>
            <div><b>Vəzifə</b><span>${esc(p.sender_role)}</span></div>
            <div><b>Cihaz kodu</b><span>${esc(p.sender_device_code)}</span></div>
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
    document.getElementById("modal-root").innerHTML = "";

    await supabase
      .from("signals")
      .update({ is_read: true })
      .eq("id", signalId);

    const my = CURRENT?.profile || await Auth.profile((await Auth.user()).id);

    await supabase.from("signals").insert({
      sender_id: my.id,
      target_code: senderDeviceCode,
      type: "connection-response",
      payload: {
        accepted,
        responder_name: fullName(my),
        responder_device_code: my.device_code,
        responded_at: new Date().toISOString()
      }
    });

    toast(accepted ? "Qoşulmaya icazə verildi." : "Qoşulma rədd edildi.", accepted ? "success" : "error");
  }
};
