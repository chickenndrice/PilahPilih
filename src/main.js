import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // Collect all states
    const states = {
        welcome: document.getElementById('state-welcome'),
        scanning: document.getElementById('state-scanning'),
        plastic: document.getElementById('state-plastic'),
        paper: document.getElementById('state-paper'),
        organic: document.getElementById('state-organic'),
        uncertain: document.getElementById('state-uncertain'),
    };

    let stream = null;
    const videoElement = document.getElementById('webcamVideo');

    // Helper to start camera
    async function startCamera() {
        try {
            if (!stream && videoElement) {
                videoElement.classList.remove('live');
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: "user",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                videoElement.srcObject = stream;
                videoElement.onplaying = () => {
                    videoElement.classList.add('live');
                };
            }
        } catch (err) {
            console.error("Camera access denied or error:", err);
            // Optionally, show a friendlier error message on screen instead of alert
        }
    }

    // Helper to stop camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            if (videoElement) {
                videoElement.srcObject = null;
                videoElement.classList.remove('live');
            }
        }
    }

    // Helper to switch state
    function switchState(targetStateKey) {
        Object.values(states).forEach(el => {
            if (el) el.classList.remove('active');
        });
        if (states[targetStateKey]) {
            states[targetStateKey].classList.add('active');
            
            // Handle camera state based on active screen
            if (targetStateKey === 'scanning') {
                startCamera();
            } else {
                stopCamera();
            }
        }
    }

    // --- Wire up navigation buttons ---

    // Any "MULAI MAIN", "LANJUT MAIN", "COBA LAGI" button goes to Scanning
    document.querySelectorAll('.btn-start-game').forEach(btn => {
        btn.addEventListener('click', () => switchState('scanning'));
    });

    // Any "BERHENTI", "Jeda" button goes to Welcome
    document.querySelectorAll('.btn-stop').forEach(btn => {
        btn.addEventListener('click', () => switchState('welcome'));
    });

    // Guide button in welcome
    document.querySelectorAll('.btn-guide').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Fitur Panduan akan ditampilkan dalam bentuk modal atau overlay di versi final.');
        });
    });

    // --- Wire up prototype simulation from SCANNING state ---
    // In final version, this would be triggered by AI model outputs.
    // For now, we simulate it by clicking the bins or the viewport itself during scanning.

    const scanOrganic = document.querySelector('#state-scanning .sim-organic');
    const scanPlastic = document.querySelector('#state-scanning .sim-plastic');
    const scanPaper = document.querySelector('#state-scanning .sim-paper');
    const vpScan = document.getElementById('vp-scan');

    if (scanOrganic) scanOrganic.addEventListener('click', () => switchState('organic'));
    if (scanPlastic) scanPlastic.addEventListener('click', () => switchState('plastic'));
    if (scanPaper) scanPaper.addEventListener('click', () => switchState('paper'));
    if (vpScan) {
        vpScan.addEventListener('click', () => switchState('uncertain'));
        vpScan.title = "Klik layar ini untuk simulasi gagal deteksi (Uncertain)";
    }
});
