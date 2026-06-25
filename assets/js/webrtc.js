// ADSEA Desk - WebRTC Advanced Signaling and Pro UI Engine
const WebRTCMühərriki = {
    peerConnection: null,
    dataChannel: null,
    konfiqurasiya: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },

    bağlantınıBaşlat: async (hedefId, istifadəçiProfil) => {
        WebRTCMühərriki.peerConnection = new RTCPeerConnection(WebRTCMühərriki.konfiqurasiya);
        WebRTCMühərriki.dataChannel = WebRTCMühərriki.peerConnection.createDataChannel("adsea-remote-control", {
            ordered: false, maxRetransmits: 0
        });

        WebRTCMühərriki.dataChannel.onmessage = (e) => {
            if (window.__TAURI__) {
                window.__TAURI__.invoke("execute_desktop_command", { commandJson: e.data });
            }
        };

        WebRTCMühərriki.peerConnection.onicecandidate = async (event) => {
            if (event.candidate && supabase) {
                await supabase.from('siqnallar').insert([{
                    target_id: hedefId,
                    sender_data: istifadəçiProfil,
                    type: 'ice-candidate',
                    payload: JSON.stringify(event.candidate)
                }]);
            }
        };

        // Realtime Sorğu Dinləyici Modulu
        if (supabase) {
            supabase.channel(`signal-${istifadəçiProfil.id}`).on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'siqnallar'
            }, payload => {
                WebRTCMühərriki.sorğuQəbulEt(payload.new);
            }).subscribe();
        }
    },

    sorğuQəbulEt: (data) => {
        const p = data.sender_data;
        const modal = document.getElementById('remote-request-modal');
        if (!modal) return;
        
        document.getElementById('req-sender-name').textContent = `${p.last_name} ${p.first_name} ${p.patronymic}`;
        document.getElementById('req-sender-meta').textContent = `${p.region} Şəhəri / ${p.office_name}`;
        document.getElementById('req-sender-role').textContent = `${p.bölmə} — ${p.vəzifə}`;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        document.getElementById('btn-accept-remote').onclick = async () => {
            modal.classList.replace('flex', 'hidden');
            AdminMühərriki.mesajGöstər("Bağlantı qurulur, ekran axını başladılır...", "success");
        };

        document.getElementById('btn-reject-remote').onclick = () => {
            modal.classList.replace('flex', 'hidden');
            AdminMühərriki.mesajGöstər("Uzaqdan qoşulma sorğusu rədd edildi.", "error");
        };
    }
};
