/**
 * PilahPilih — Main Application Logic
 * Handles state transitions, camera management, and simulation controls.
 */
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    /* ===== STATE REGISTRY ===== */
    const STATES = {
        welcome:   document.getElementById('state-welcome'),
        scanning:  document.getElementById('state-scanning'),
        plastic:   document.getElementById('state-plastic'),
        paper:     document.getElementById('state-paper'),
        organic:   document.getElementById('state-organic'),
        uncertain: document.getElementById('state-uncertain'),
    };

    /* ===== CAMERA MANAGEMENT ===== */
    const videoEl = document.getElementById('webcamVideo');
    let stream = null;

    async function startCamera() {
        if (stream || !videoEl) return;
        try {
            videoEl.classList.remove('live');
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width:  { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            videoEl.srcObject = stream;
            videoEl.onplaying = () => videoEl.classList.add('live');
        } catch (err) {
            console.error('Camera access denied or error:', err);
        }
    }

    function stopCamera() {
        if (!stream) return;
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        if (videoEl) {
            videoEl.srcObject = null;
            videoEl.classList.remove('live');
        }
    }

    /* ===== VOLUME CONTROL ===== */
    const volSlider = document.getElementById('vol-slider');
    const volText = document.getElementById('vol-text');
    const volIcon = document.getElementById('vol-icon');
    
    if (volSlider && volText && volIcon) {
        volSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            volText.textContent = val;
            
            // Update icon based on volume level
            if (val == 0) volIcon.textContent = '🔇';
            else if (val < 50) volIcon.textContent = '🔉';
            else volIcon.textContent = '🔊';
            
            // Update gradient fill
            volSlider.style.background = `linear-gradient(to right, var(--blue) ${val}%, #E0E0E0 ${val}%)`;
            
            // In final version, this would adjust actual app volume:
            // if (videoEl) videoEl.volume = val / 100;
        });
        
        // Initialize gradient on load
        volSlider.style.background = `linear-gradient(to right, var(--blue) ${volSlider.value}%, #E0E0E0 ${volSlider.value}%)`;
    }

    /* ===== STATE MACHINE ===== */
    function switchState(targetKey) {
        const target = STATES[targetKey];
        if (!target) return;

        Object.values(STATES).forEach(el => el?.classList.remove('active'));
        target.classList.add('active');

        // Camera only runs in scanning state
        if (targetKey === 'scanning') {
            startCamera();
        } else {
            stopCamera();
        }
    }

    /* ===== EVENT DELEGATION ===== */
    // Instead of attaching individual listeners to every button,
    // we use a single delegated listener on the app container.
    const app = document.querySelector('.app');

    app.addEventListener('click', (e) => {
        const target = e.target.closest('[class]');
        if (!target) return;

        // Navigation: start / continue / retry → scanning
        if (target.matches('.btn-start-game')) {
            switchState('scanning');
            return;
        }

        // Navigation: stop / pause → welcome
        if (target.matches('.btn-stop')) {
            switchState('welcome');
            return;
        }

        // Guide button
        if (target.matches('.btn-guide')) {
            alert('Fitur Panduan akan ditampilkan dalam bentuk modal atau overlay di versi final.');
            return;
        }

        // Volume button toggle
        if (target.matches('.btn-volume')) {
            const popup = document.getElementById('vol-popup');
            if (popup) popup.classList.toggle('show');
            return;
        }

        // Close volume popup if clicking outside
        const popup = document.getElementById('vol-popup');
        if (popup && popup.classList.contains('show') && !target.closest('.vol-wrapper')) {
            popup.classList.remove('show');
        }

        // Simulation: bin clicks during scanning state
        const scanningActive = STATES.scanning.classList.contains('active');
        if (scanningActive) {
            if (target.closest('.sim-organic')) {
                switchState('organic');
                return;
            }
            if (target.closest('.sim-plastic')) {
                switchState('plastic');
                return;
            }
            if (target.closest('.sim-paper')) {
                switchState('paper');
                return;
            }
        }

        // Simulation: clicking the scan viewport → uncertain
        if (target.closest('#vp-scan') && scanningActive && !target.closest('.bin')) {
            switchState('uncertain');
        }
    });
});
