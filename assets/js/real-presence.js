const Presence = {
  channel: null,
  onlineIds: new Set(),

  start(profile) {
    this.channel = db.channel("adsea-online-presence", {
      config: {
        presence: {
          key: profile.id
        }
      }
    });

    this.channel.on("presence", { event: "sync" }, () => {
      const state = this.channel.presenceState();
      this.onlineIds = new Set(Object.keys(state));

      if (typeof renderTree === "function") {
        const search = document.getElementById("employee-search")?.value || "";
        renderTree(search);
      }

      if (typeof renderHistory === "function") {
        renderHistory();
      }
    });

    this.channel.subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await this.channel.track({
          id: profile.id,
          name: fullName(profile),
          region: profile.region,
          office_name: profile.office_name,
          role_title: profile.role_title,
          device_code: profile.device_code,
          online_at: new Date().toISOString()
        });
      }
    });
  },

  isOnline(userId) {
    return this.onlineIds.has(userId);
  }
};
