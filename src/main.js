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

    /* ===== AUDIO ASSETS ===== */
    const audioSfxComplete = new Audio('/assets/audio/sound-fx-complete-v1.mp3');
    const audioPembuka = new Audio('/assets/audio/1-pembuka.mp3');
    const audioPlastik = [
        new Audio('/assets/audio/2-plastik-v1.mp3'),
        new Audio('/assets/audio/3-plastik-v2.mp3')
    ];
    const audioKertas = [
        new Audio('/assets/audio/4-kertas-v1.mp3'),
        new Audio('/assets/audio/5-kertas-v2.mp3')
    ];
    const audioOrganik = [
        new Audio('/assets/audio/6-organik-v1.mp3'),
        new Audio('/assets/audio/7-organik-v2.mp3')
    ];
    const audioRagu = [
        new Audio('/assets/audio/8-ragu-v1.mp3'),
        new Audio('/assets/audio/9-ragu-v2.mp3'),
        new Audio('/assets/audio/10-ragu-v3.mp3')
    ];
    
    // State flag to track opening audio
    let hasPlayedOpeningAudio = false;

    /* ===== AI MODEL INTEGRATION ===== */
    const MODEL_URL = "/model/controllable/";
    let aiModel, maxPredictions;
    let isPredicting = false;
    let isTransitioning = false;
    let predictionTimeout = null;

    async function initModel() {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";

        try {
            // Load the image model from global tmImage (added via script tag in index.html)
            aiModel = await window.tmImage.load(modelURL, metadataURL);
            maxPredictions = aiModel.getTotalClasses();
            console.log("AI Model loaded successfully");
        } catch (e) {
            console.error("Error loading AI model:", e);
        }
    }

    initModel();

    async function predictLoop() {
        if (!STATES.scanning.classList.contains('active') || !isPredicting) return;
        
        if (videoEl.readyState >= 2 && !isTransitioning) {
            await predict();
        }
        window.requestAnimationFrame(predictLoop);
    }

    async function predict() {
        if (!aiModel || isTransitioning) return;
        
        const prediction = await aiModel.predict(videoEl);
        
        for (let i = 0; i < maxPredictions; i++) {
            const className = prediction[i].className;
            const probability = prediction[i].probability;
            
            // Trigger transition if confidence is very high
            if (probability > 0.95) {
                isTransitioning = true;
                clearTimeout(predictionTimeout);
                
                if (className === "Plastik") {
                    playTransitionAudio(audioPlastik);

                    triggerRainTransition('plastic', [
                        '/assets/images/Sampah/Botol/Sampah Botol.png',
                        '/assets/images/Sampah/Botol/Sampah Botol 2.png',
                        '/assets/images/Sampah/Botol/Sampah Botol 3.png',
                        '/assets/images/Sampah/Botol/Sampah Botol 4.png',
                        '/assets/images/Sampah/Botol/Sampah Botol 5.png',
                        '/assets/images/Sampah/Botol/Sampah Botol 6.png'
                    ], 1.0, probability);
                } else if (className === "Kertas") {
                    playTransitionAudio(audioKertas);

                    triggerRainTransition('paper', [
                        '/assets/images/Sampah/Kertas/Sampah Kertas.png',
                        '/assets/images/Sampah/Kertas/Sampah Kertas 2.png',
                        '/assets/images/Sampah/Kertas/Sampah Kertas 3.png',
                        '/assets/images/Sampah/Kertas/Sampah Kertas 4.png',
                        '/assets/images/Sampah/Kertas/Sampah Kertas 5.png'
                    ], 1.2, probability);
                } else if (className === "Sisa Makanan") {
                    playTransitionAudio(audioOrganik);

                    triggerRainTransition('organic', [
                        '/assets/images/Sampah/Organik/Sampah Kulit Pisang.png',
                        '/assets/images/Sampah/Organik/Daun 1.png',
                        '/assets/images/Sampah/Organik/Daun 2.png',
                        '/assets/images/Sampah/Organik/Daun 3.png',
                        '/assets/images/Sampah/Organik/Daun 4.png',
                        '/assets/images/Sampah/Organik/Daun 5.png'
                    ], 1.0, probability);
                }
                break;
            }
        }
    }

    /* ===== CAMERA MANAGEMENT ===== */
    const videoEl = document.getElementById('webcamVideo');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    let stream = null;
    let countdownInterval = null;

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
            videoEl.onplaying = () => {
                videoEl.classList.add('live');
                startCountdown();
            };
        } catch (err) {
            console.error('Camera access denied or error:', err);
        }
    }

    function startCountdown() {
        isPredicting = false;
        clearInterval(countdownInterval);
        
        let count = 4; // 1s SIAP, 3, 2, 1
        if(countdownOverlay) countdownOverlay.style.display = 'flex';
        if(countdownNumber) {
            countdownNumber.textContent = "SIAP?";
            // Trigger CSS animation restart
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight; /* trigger reflow */
            countdownNumber.style.animation = null; 
        }

        countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if(countdownNumber) {
                    countdownNumber.textContent = count;
                    countdownNumber.style.animation = 'none';
                    countdownNumber.offsetHeight;
                    countdownNumber.style.animation = null;
                }
            } else {
                clearInterval(countdownInterval);
                if(countdownOverlay) countdownOverlay.style.display = 'none';
                isPredicting = true;
                
                // Set a timeout: if no confident prediction is found in 6 seconds, go to uncertain state
                predictionTimeout = setTimeout(() => {
                    if (isPredicting && !isTransitioning) {
                        isTransitioning = true;
                        
                        playTransitionAudio(audioRagu);
                        
                        switchState('uncertain');
                    }
                }, 6000);

                window.requestAnimationFrame(predictLoop);
            }
        }, 1000);
    }

    function stopCamera() {
        if (!stream) return;
        isPredicting = false;
        clearInterval(countdownInterval);
        clearTimeout(predictionTimeout);
        if(countdownOverlay) countdownOverlay.style.display = 'none';
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
            isTransitioning = false;
            startCamera();
        } else {
            stopCamera();
        }
    }

    /* ===== RAIN TRANSITION ===== */
    function triggerRainTransition(targetKey, imageSrcs, sizeMultiplier = 1.0, confidenceScore = 0) {
        // Update the confidence text if a score is provided
        if (confidenceScore > 0) {
            const stateEl = STATES[targetKey];
            if (stateEl) {
                const pctEl = stateEl.querySelector('.pct');
                if (pctEl) {
                    pctEl.textContent = `${Math.round(confidenceScore * 100)}%`;
                }
            }
        }

        // Ensure imageSrcs is an array
        const images = Array.isArray(imageSrcs) ? imageSrcs : [imageSrcs];
        
        // Create rain container
        const rainContainer = document.createElement('div');
        rainContainer.className = 'rain-container';
        document.body.appendChild(rainContainer);

        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            const img = document.createElement('img');
            // Distribute evenly among all provided image variants
            img.src = images[i % images.length];
            img.className = 'rain-item';
            
            // Randomize size, then apply per-category multiplier
            const baseSize = Math.random() * 135 + 160;
            const size = baseSize * sizeMultiplier;
            img.style.width = `${size}px`;
            
            // Spawn from -20vw to 110vw evenly, with slight jitter to look natural
            const baseLeft = (i / particleCount) * 130 - 20;
            const jitter = (Math.random() - 0.5) * 5;
            img.style.left = `${baseLeft + jitter}vw`;
            
            // Slower fall speed so they stay on screen longer (2.0s to 3.5s)
            const duration = Math.random() * 1.5 + 2.0; 
            
            // Spread the spawn delay across 2.0 seconds so the rain lasts much longer
            const delay = Math.random() * 2.0; 
            img.style.animationDuration = `${duration}s`;
            img.style.animationDelay = `${delay}s`;
            
            // Random rotation end
            const rotEnd = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 360 + 180);
            img.style.setProperty('--rot-end', `${rotEnd}deg`);

            rainContainer.appendChild(img);
        }

        // Switch state halfway through the animation (when screen is completely full, ~1800ms)
        setTimeout(() => {
            switchState(targetKey);
        }, 1800);

        // Clean up rain container after max duration (2.0s delay + 3.5s duration = 5.5s max)
        setTimeout(() => {
            rainContainer.remove();
        }, 6000);
    }
    
    /* ===== AUDIO LOCK HELPER ===== */
    function playTransitionAudio(audioArray) {
        const randAudio = audioArray[Math.floor(Math.random() * audioArray.length)];
        randAudio.currentTime = 0;
        audioSfxComplete.currentTime = 0;
        
        lockActionButtons(true);
        
        audioSfxComplete.play().then(() => {
            audioSfxComplete.onended = () => {
                // Play Robi voice after SFX finishes
                randAudio.play().then(() => {
                    randAudio.onended = () => {
                        lockActionButtons(false);
                    };
                }).catch(e => {
                    console.warn("Robi Audio play failed:", e);
                    lockActionButtons(false);
                });
            };
        }).catch(e => {
            console.warn("SFX play failed, falling back to Robi audio:", e);
            randAudio.play().then(() => {
                randAudio.onended = () => {
                    lockActionButtons(false);
                };
            }).catch(err => {
                lockActionButtons(false);
            });
        });
    }

    function lockActionButtons(lock) {
        // Find all buttons that would start/continue the game (except the welcome one)
        const actionBtns = document.querySelectorAll('.btn-start-game:not(#btn-welcome-start)');
        actionBtns.forEach(btn => {
            btn.disabled = lock;
            // Optionally, we could change text, but the CSS :disabled state handles opacity/cursor
        });
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
            if (target.id === 'btn-welcome-start') {
                if (!hasPlayedOpeningAudio) {
                    target.disabled = true;
                    const originalText = target.textContent;
                    target.textContent = "🔊 Mendengarkan...";
                    
                    audioPembuka.play().then(() => {
                        hasPlayedOpeningAudio = true;
                        audioPembuka.onended = () => {
                            target.disabled = false;
                            target.textContent = originalText;
                            switchState('scanning');
                        };
                    }).catch(err => {
                        // Fallback if browser blocks autoplay/audio
                        console.warn("Audio play failed:", err);
                        hasPlayedOpeningAudio = true; // prevent infinite loops of blocking
                        target.disabled = false;
                        target.textContent = originalText;
                        switchState('scanning');
                    });
                } else {
                    // Audio already played once, just start immediately
                    switchState('scanning');
                }
                return;
            }
            
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

        // Simulation: clicking the scan viewport → uncertain (manual override)
        if (target.closest('#vp-scan') && STATES.scanning.classList.contains('active') && !target.closest('.bin')) {
            switchState('uncertain');
        }
    });
});
