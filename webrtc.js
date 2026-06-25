// ADSEA Desk - WebRTC P2P Yüksək Sürətli Qoşulma Mühərriki
const WebRTCMühərriki = {
    peerConnection: null,
    dataChannel: null,
    yerliAxın: null,
    konfiqurasiya: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // İlkin IP təyini üçün pulsuz STUN
            // Gələcəkdə bura sizin Cloudflare Calls və ya Twilio TURN məlumatları daxil olacaq
        ]
    },

    bağlantınıBaşlat: async (hədəfCihazKodu, operatorMəlumatı) => {
        WebRTCMühərriki.peerConnection = new RTCPeerConnection(WebRTCMühərriki.konfiqurasiya);
        
        // Donmaların qarşısını almaq üçün aşağı gecikməli (Low Latency) Data Kanalı açırıq
        WebRTCMühərriki.dataChannel = WebRTCMühərriki.peerConnection.createDataChannel("adsea-remote-control", {
            ordered: false, // Paket itkisi zamanı gözləməməsi üçün (Donmanı tamamilə əngəlləyir)
            maxRetransmits: 0
        });

        WebRTCMühərriki.dataChannel.onmessage = (event) => {
            const əmr = JSON.parse(event.data);
            WebRTCMühərriki.əmriİcraEt(əmr);
        };

        // Qarşı tərəfdən gələn video axınını (Ekranı) tuturuq
        WebRTCMühərriki.peerConnection.ontrack = (event) => {
            const videoElementi = document.getElementById('remote-screen-video');
            if (videoElementi && event.streams[0]) {
                videoElementi.srcObject = event.streams[0];
                document.getElementById('remote-window').classList.remove('hidden');
            }
        };

        // Supabase Realtime siqnal ötürülməsi üçün ICE namizədlərini toplayırıq
        WebRTCMühərriki.peerConnection.onicecandidate = async (event) => {
            if (event.candidate && supabase) {
                await supabase.from('siqnallar').insert([{
                    hədəf_kod: hədəfCihazKodu,
                    tip: 'ice-candidate',
                    məlumat: JSON.stringify(event.candidate)
                }]);
            }
        };
    },

    əmriİcraEt: (əmr) => {
        // Tauri mühitində işləyəcək OS əmrləri (Rust tərəfinə siçan və klaviatura hərəkətlərini ötürür)
        if (window.__TAURI__) {
            window.__TAURI__.invoke("execute_desktop_command", { commandJson: JSON.stringify(əmr) });
        }
    },

    siçanHərəkətiniÖtür: (x, y, en, hündürlük) => {
        if (WebRTCMühərriki.dataChannel && WebRTCMühərriki.dataChannel.readyState === "open") {
            // Siçan koordinatlarını throttle edərək (60 FPS ilə limitli) sıxlaşdırılmış ötürürük
            WebRTCMühərriki.dataChannel.send(JSON.stringify({
                tip: "mouse-move",
                x: x / en,
                y: y / hündürlük
            }));
        }
    }
};
