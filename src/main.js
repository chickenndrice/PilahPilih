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

    /* ===== RAIN TRANSITION ===== */
    function triggerRainTransition(targetKey, imageSrcs) {
        // Ensure imageSrcs is an array
        const images = Array.isArray(imageSrcs) ? imageSrcs : [imageSrcs];
        
        // Create rain container
        const rainContainer = document.createElement('div');
        rainContainer.className = 'rain-container';
        document.body.appendChild(rainContainer);

        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            const img = document.createElement('img');
            // Distribute evenly among all provided image variants
            img.src = images[i % images.length];
            img.className = 'rain-item';
            
            // Randomize size (reverted back to 5x larger: 300px to 550px)
            const size = Math.random() * 250 + 300; 
            img.style.width = `${size}px`;
            
            // Spawn from -20vw to 110vw to cover empty gaps on the far left/right edges
            img.style.left = `${Math.random() * 130 - 20}vw`;
            
            const duration = Math.random() * 1 + 1.5; // 1.5s to 2.5s
            const delay = Math.random() * 0.5; // 0s to 0.5s
            img.style.animationDuration = `${duration}s`;
            img.style.animationDelay = `${delay}s`;
            
            // Random rotation end
            const rotEnd = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 360 + 180);
            img.style.setProperty('--rot-end', `${rotEnd}deg`);

            rainContainer.appendChild(img);
        }

        // Switch state halfway through the animation (when screen is covered)
        setTimeout(() => {
            switchState(targetKey);
        }, 800);

        // Clean up rain container after max duration
        setTimeout(() => {
            rainContainer.remove();
        }, 3500);
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
                triggerRainTransition('organic', '/assets/images/Sampah/Organik/Sampah Kulit Pisang.png');
                return;
            }
            if (target.closest('.sim-plastic')) {
                triggerRainTransition('plastic', [
                    '/assets/images/Sampah/Botol/Sampah Botol.png',
                    '/assets/images/Sampah/Botol/Sampah Botol 2.png',
                    '/assets/images/Sampah/Botol/Sampah Botol 3.png',
                    '/assets/images/Sampah/Botol/Sampah Botol 4.png',
                    '/assets/images/Sampah/Botol/Sampah Botol 5.png',
                    '/assets/images/Sampah/Botol/Sampah Botol 6.png'
                ]);
                return;
            }
            if (target.closest('.sim-paper')) {
                triggerRainTransition('paper', '/assets/images/Sampah/Kertas/Sampah Kertas.png');
                return;
            }
        }

        // Simulation: clicking the scan viewport → uncertain
        if (target.closest('#vp-scan') && scanningActive && !target.closest('.bin')) {
            switchState('uncertain');
        }
    });
});
