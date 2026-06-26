const Presence = {
  channel: null,

  start(profile) {
    this.channel = supabase.channel("adsea-online-presence", {
      config: {
        presence: {
          key: profile.id
        }
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
  }
};
