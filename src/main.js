/**
 * PilahPilih — Main Application Logic
 * Modular Object-Oriented design that optimizes camera performance, AI loop latency, 
 * and handles robust audio interlocking & play-once greeting rules.
 */
import './style.css';

/**
 * ===== AUDIO MANAGER =====
 * Handles preloading, playing, volume adjustments, and terpusat stopping of all audio.
 */
class AudioManager {
    constructor() {
        this.volume = 0.5; // Default 50% volume
        
        // Preload sound effects and Robi voice lines
        this.sfxComplete = this.loadAudio('/assets/audio/sound-fx-complete-v1.mp3');
        this.pembuka = this.loadAudio('/assets/audio/1-pembuka.mp3');
        
        this.plastik = [
            this.loadAudio('/assets/audio/2-plastik-v1.mp3'),
            this.loadAudio('/assets/audio/3-plastik-v2.mp3')
        ];
        this.kertas = [
            this.loadAudio('/assets/audio/4-kertas-v1.mp3'),
            this.loadAudio('/assets/audio/5-kertas-v2.mp3')
        ];
        this.organik = [
            this.loadAudio('/assets/audio/6-organik-v1.mp3'),
            this.loadAudio('/assets/audio/7-organik-v2.mp3')
        ];
        this.ragu = [
            this.loadAudio('/assets/audio/8-ragu-v1.mp3'),
            this.loadAudio('/assets/audio/9-ragu-v2.mp3'),
            this.loadAudio('/assets/audio/10-ragu-v3.mp3')
        ];

        this.playingTracks = new Set();
        this.hasPlayedOpening = false;
    }

    loadAudio(src) {
        const audio = new Audio(src);
        audio.volume = this.volume;
        return audio;
    }

    /**
     * Updates active volume across all preloaded audio components.
     * @param {number} value - Volume value from range slider (0 - 100).
     */
    setVolume(value) {
        this.volume = value / 100;
        const allTracks = [
            this.sfxComplete, this.pembuka,
            ...this.plastik, ...this.kertas,
            ...this.organik, ...this.ragu
        ];
        allTracks.forEach(track => {
            track.volume = this.volume;
        });
    }

    /**
     * Stops all active audio tracks, resetting their play positions immediately.
     */
    stopAll() {
        this.playingTracks.forEach(track => {
            track.pause();
            track.currentTime = 0;
        });
        this.playingTracks.clear();
    }

    /**
     * Helper to wrap HTML5 audio playback inside a Promise for asynchronous control.
     * @param {HTMLAudioElement} track
     */
    playTrack(track) {
        this.playingTracks.add(track);
        track.currentTime = 0;
        
        return track.play()
            .then(() => {
                return new Promise((resolve) => {
                    track.onended = () => {
                        this.playingTracks.delete(track);
                        resolve();
                    };
                });
            })
            .catch(err => {
                console.warn(`Audio playback failed or was interrupted for: ${track.src}`, err);
                this.playingTracks.delete(track);
            });
    }

    /**
     * Sequential player: triggers Success SFX first, followed by a randomized Robi VO variation.
     */
    playTransitionSequence(voTracksArray, onStart, onComplete) {
        this.stopAll();
        
        if (onStart) onStart();

        this.playTrack(this.sfxComplete)
            .then(() => {
                const randomVO = voTracksArray[Math.floor(Math.random() * voTracksArray.length)];
                return this.playTrack(randomVO);
            })
            .then(() => {
                if (onComplete) onComplete();
            })
            .catch(() => {
                if (onComplete) onComplete();
            });
    }

    /**
     * Welcome screen audio greeting. Only plays once per session.
     */
    playWelcome(welcomeBtn, onComplete) {
        if (this.hasPlayedOpening) {
            if (onComplete) onComplete();
            return;
        }

        welcomeBtn.disabled = true;
        const originalText = welcomeBtn.textContent;
        welcomeBtn.textContent = "🔊 Mendengarkan...";

        this.stopAll();
        this.playTrack(this.pembuka)
            .then(() => {
                this.hasPlayedOpening = true;
                welcomeBtn.disabled = false;
                welcomeBtn.textContent = originalText;
                if (onComplete) onComplete();
            })
            .catch(() => {
                this.hasPlayedOpening = true;
                welcomeBtn.disabled = false;
                welcomeBtn.textContent = originalText;
                if (onComplete) onComplete();
            });
    }
}

/**
 * ===== CAMERA MANAGER =====
 * Manages video tracks and guarantees countdown overlays only run when video frame data is ready.
 */
class CameraManager {
    constructor(videoEl) {
        this.videoEl = videoEl;
        this.stream = null;
        this.frameCheckId = null;
    }

    /**
     * Initializes webcam stream and polls until actual visual frame metrics exist.
     */
    start(onReady) {
        if (this.stream) {
            if (onReady) onReady();
            return;
        }

        // Hide old live content visuals
        this.videoEl.classList.remove('live');

        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        })
        .then(stream => {
            this.stream = stream;
            this.videoEl.srcObject = stream;
            
            // Critical fix: ensure the browser is ACTUALLY rendering camera frames
            // before initiating countdown. This prevents countdown screen hangs on loading state.
            const checkFrame = () => {
                if (this.videoEl.videoWidth > 0 && this.videoEl.readyState >= 2) {
                    this.videoEl.classList.add('live');
                    if (onReady) onReady();
                } else {
                    this.frameCheckId = requestAnimationFrame(checkFrame);
                }
            };
            this.frameCheckId = requestAnimationFrame(checkFrame);
        })
        .catch(err => {
            console.error('Camera access denied or could not warm up hardware:', err);
        });
    }

    /**
     * Stop and safely clean up all active video streaming tracks.
     */
    stop() {
        if (this.frameCheckId) {
            cancelAnimationFrame(this.frameCheckId);
            this.frameCheckId = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoEl) {
            this.videoEl.srcObject = null;
            this.videoEl.classList.remove('live');
        }
    }
}

/**
 * ===== MODEL MANAGER =====
 * Handles Teachable Machine model predictions with throttle optimization.
 */
class ModelManager {
    constructor(modelUrl) {
        this.modelUrl = modelUrl;
        this.aiModel = null;
        this.maxPredictions = 0;
        this.isPredicting = false;
        this.predictionTimeout = null;
        this.lastPredictionTime = 0;
        this.predictionInterval = 120; // 120ms throttle prevents 60fps thermal throttles (saves up to 85% CPU/GPU)
    }

    /**
     * Loads the model in the background.
     */
    async loadModel() {
        if (this.aiModel) return;

        const modelURL = this.modelUrl + "model.json";
        const metadataURL = this.modelUrl + "metadata.json";

        try {
            if (window.tmImage) {
                this.aiModel = await window.tmImage.load(modelURL, metadataURL);
                this.maxPredictions = this.aiModel.getTotalClasses();
                console.log("AI Model loaded successfully");
            } else {
                console.warn("window.tmImage not loaded yet. Retrying in 1s...");
                setTimeout(() => this.loadModel(), 1000);
            }
        } catch (e) {
            console.error("Error loading Teachable Machine model:", e);
        }
    }

    /**
     * Commences active scanning loops and fallback timeout triggers.
     */
    startPrediction(videoEl, onSuccess, onUncertain) {
        this.isPredicting = true;
        this.lastPredictionTime = 0;

        // Switch to uncertain state if no high confidence object is detected in 6 seconds
        this.predictionTimeout = setTimeout(() => {
            if (this.isPredicting) {
                this.stopPrediction();
                if (onUncertain) onUncertain();
            }
        }, 6000);

        const loop = (timestamp) => {
            if (!this.isPredicting) return;

            // Throttling logic
            if (timestamp - this.lastPredictionTime >= this.predictionInterval) {
                this.lastPredictionTime = timestamp;
                this.predict(videoEl, onSuccess);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    async predict(videoEl, onSuccess) {
        if (!this.aiModel || !this.isPredicting) return;

        try {
            const prediction = await this.aiModel.predict(videoEl);
            for (let i = 0; i < this.maxPredictions; i++) {
                const className = prediction[i].className;
                const probability = prediction[i].probability;

                // Threshold confidence > 95%
                if (probability > 0.95) {
                    this.stopPrediction();
                    if (onSuccess) onSuccess(className, probability);
                    break;
                }
            }
        } catch (e) {
            console.error("Inference prediction error:", e);
        }
    }

    stopPrediction() {
        this.isPredicting = false;
        if (this.predictionTimeout) {
            clearTimeout(this.predictionTimeout);
            this.predictionTimeout = null;
        }
    }
}

/**
 * ===== TRANSITION MANAGER =====
 * Triggers particle rain UI overlay animations and handles proper cleaning.
 */
class TransitionManager {
    constructor() {
        this.activeContainer = null;
    }

    /**
     * Renders falling object particles for interactive state changes.
     */
    triggerRain(images, sizeMultiplier = 1.0, onHalfway, onComplete) {
        this.cleanup();

        // Create rain container
        const container = document.createElement('div');
        container.className = 'rain-container';
        document.body.appendChild(container);
        this.activeContainer = container;

        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            const img = document.createElement('img');
            img.src = images[i % images.length];
            img.className = 'rain-item';

            const baseSize = Math.random() * 135 + 160;
            const size = baseSize * sizeMultiplier;
            img.style.width = `${size}px`;

            const baseLeft = (i / particleCount) * 130 - 20;
            const jitter = (Math.random() - 0.5) * 5;
            img.style.left = `${baseLeft + jitter}vw`;

            const duration = Math.random() * 1.5 + 2.0;
            const delay = Math.random() * 2.0;
            img.style.animationDuration = `${duration}s`;
            img.style.animationDelay = `${delay}s`;

            const rotEnd = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 360 + 180);
            img.style.setProperty('--rot-end', `${rotEnd}deg`);

            container.appendChild(img);
        }

        // State switch trigger halfway through animation (~1800ms)
        setTimeout(() => {
            if (onHalfway) onHalfway();
        }, 1800);

        // Entire cleanup after anim cycles complete
        setTimeout(() => {
            this.cleanup();
            if (onComplete) onComplete();
        }, 6000);
    }

    /**
     * Removes active animations immediately and prevents DOM leaking of redundant containers.
     */
    cleanup() {
        if (this.activeContainer) {
            this.activeContainer.remove();
            this.activeContainer = null;
        }
        
        // Safety wipe
        const leftovers = document.querySelectorAll('.rain-container');
        leftovers.forEach(el => el.remove());
    }
}

/**
 * ===== APPLICATION CONTROLLER =====
 * Core orchestrator managing elements, global states, events and interlocking bindings.
 */
class AppController {
    constructor() {
        this.states = {
            welcome:   document.getElementById('state-welcome'),
            scanning:  document.getElementById('state-scanning'),
            plastic:   document.getElementById('state-plastic'),
            paper:     document.getElementById('state-paper'),
            organic:   document.getElementById('state-organic'),
            uncertain: document.getElementById('state-uncertain'),
        };

        this.videoEl = document.getElementById('webcamVideo');
        this.countdownOverlay = document.getElementById('countdown-overlay');
        this.countdownNumber = document.getElementById('countdown-number');
        this.volSlider = document.getElementById('vol-slider');
        this.volText = document.getElementById('vol-text');
        this.volIcon = document.getElementById('vol-icon');

        // Initialize sub-managers
        this.audio = new AudioManager();
        this.camera = new CameraManager(this.videoEl);
        this.model = new ModelManager('/model/controllable/');
        this.transition = new TransitionManager();

        this.countdownInterval = null;
        this.isTransitioningState = false;
    }

    /**
     * Initializes app bindings, volume overlays, and loads active models.
     */
    async init() {
        this.bindEvents();
        this.updateVolumeUI();
        
        // Kick off model load immediately in background
        await this.model.loadModel();
    }

    /**
     * Binds general UI interactions and delegated click events.
     */
    bindEvents() {
        if (this.volSlider) {
            this.volSlider.addEventListener('input', (e) => {
                this.audio.setVolume(e.target.value);
                this.updateVolumeUI();
            });
        }

        const appContainer = document.querySelector('.app');
        if (appContainer) {
            appContainer.addEventListener('click', (e) => {
                const target = e.target.closest('[class]');
                if (!target) return;

                // Handle Mulai / Lanjut / Coba Lagi
                if (target.matches('.btn-start-game')) {
                    if (target.id === 'btn-welcome-start') {
                        this.audio.playWelcome(target, () => {
                            this.switchState('scanning');
                        });
                    } else {
                        this.switchState('scanning');
                    }
                    return;
                }

                // Handle Berhenti / pause
                if (target.matches('.btn-stop')) {
                    this.switchState('welcome');
                    return;
                }

                // Guide guide popup mockup
                if (target.matches('.btn-guide')) {
                    alert('Fitur Panduan akan ditampilkan dalam bentuk modal atau overlay di versi final.');
                    return;
                }

                // Volume slider pop-up toggling
                if (target.matches('.btn-volume')) {
                    const popup = document.getElementById('vol-popup');
                    if (popup) popup.classList.toggle('show');
                    return;
                }

                // Close volume popup if clicking outside its wrapper
                const popup = document.getElementById('vol-popup');
                if (popup && popup.classList.contains('show') && !e.target.closest('.vol-wrapper')) {
                    popup.classList.remove('show');
                }

                // Viewport click triggers uncertain (fallback mockup test helper)
                if (target.closest('#vp-scan') && this.states.scanning.classList.contains('active') && !target.closest('.bin')) {
                    this.triggerUncertainState();
                }
            });
        }
    }

    /**
     * Refreshes the visual state of the volume settings controller popup.
     */
    updateVolumeUI() {
        if (!this.volSlider || !this.volText || !this.volIcon) return;
        const val = this.volSlider.value;
        this.volText.textContent = val;

        if (val == 0) this.volIcon.textContent = '🔇';
        else if (val < 50) this.volIcon.textContent = '🔉';
        else this.volIcon.textContent = '🔊';

        this.volSlider.style.background = `linear-gradient(to right, var(--blue) ${val}%, #E0E0E0 ${val}%)`;
    }

    /**
     * Swings the active DOM state wrapper while restarting/stopping modules.
     * @param {string} targetKey
     */
    switchState(targetKey) {
        const target = this.states[targetKey];
        if (!target) return;

        // Clear active transitions and prediction loops
        this.isTransitioningState = false;
        clearInterval(this.countdownInterval);
        this.model.stopPrediction();
        
        // Always cease background audio leaks during any state switches
        this.audio.stopAll();

        if (targetKey === 'scanning') {
            this.camera.start(() => {
                this.startCountdown();
            });
        } else {
            this.camera.stop();
            if (this.countdownOverlay) this.countdownOverlay.style.display = 'none';
        }

        // Toggle state wrapper visibilities
        Object.values(this.states).forEach(el => el?.classList.remove('active'));
        target.classList.add('active');
    }

    /**
     * Starts the interactive 4-stage scan countdown sequence.
     */
    startCountdown() {
        clearInterval(this.countdownInterval);
        let count = 4; // SIAP -> 3 -> 2 -> 1

        if (this.countdownOverlay) this.countdownOverlay.style.display = 'flex';
        
        const setNumber = (text) => {
            if (!this.countdownNumber) return;
            this.countdownNumber.textContent = text;
            this.countdownNumber.style.animation = 'none';
            this.countdownNumber.offsetHeight; // trigger reflow
            this.countdownNumber.style.animation = null;
        };

        setNumber("SIAP?");

        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                setNumber(count);
            } else {
                clearInterval(this.countdownInterval);
                if (this.countdownOverlay) this.countdownOverlay.style.display = 'none';
                
                // Commence real-time image classifications
                this.model.startPrediction(
                    this.videoEl,
                    (className, score) => this.handlePredictionSuccess(className, score),
                    () => this.triggerUncertainState()
                );
            }
        }, 1000);
    }

    /**
     * Processes verified classification results and plays custom visual/audio cues.
     */
    handlePredictionSuccess(className, confidenceScore) {
        if (this.isTransitioningState) return;
        this.isTransitioningState = true;

        let targetState = '';
        let audioVariationArray = [];
        let rainImages = [];
        let sizeMultiplier = 1.0;

        if (className === "Plastik") {
            targetState = 'plastic';
            audioVariationArray = this.audio.plastik;
            rainImages = [
                '/assets/images/Sampah/Botol/Sampah Botol.png',
                '/assets/images/Sampah/Botol/Sampah Botol 2.png',
                '/assets/images/Sampah/Botol/Sampah Botol 3.png',
                '/assets/images/Sampah/Botol/Sampah Botol 4.png',
                '/assets/images/Sampah/Botol/Sampah Botol 5.png',
                '/assets/images/Sampah/Botol/Sampah Botol 6.png'
            ];
            sizeMultiplier = 1.0;
        } else if (className === "Kertas") {
            targetState = 'paper';
            audioVariationArray = this.audio.kertas;
            rainImages = [
                '/assets/images/Sampah/Kertas/Sampah Kertas.png',
                '/assets/images/Sampah/Kertas/Sampah Kertas 2.png',
                '/assets/images/Sampah/Kertas/Sampah Kertas 3.png',
                '/assets/images/Sampah/Kertas/Sampah Kertas 4.png',
                '/assets/images/Sampah/Kertas/Sampah Kertas 5.png'
            ];
            sizeMultiplier = 1.2;
        } else if (className === "Sisa Makanan") {
            targetState = 'organic';
            audioVariationArray = this.audio.organik;
            rainImages = [
                '/assets/images/Sampah/Organik/Sampah Kulit Pisang.png',
                '/assets/images/Sampah/Organik/Daun 1.png',
                '/assets/images/Sampah/Organik/Daun 2.png',
                '/assets/images/Sampah/Organik/Daun 3.png',
                '/assets/images/Sampah/Organik/Daun 4.png',
                '/assets/images/Sampah/Organik/Daun 5.png'
            ];
            sizeMultiplier = 1.0;
        } else {
            this.triggerUncertainState();
            return;
        }

        // Lock action buttons during sequential play
        this.audio.playTransitionSequence(
            audioVariationArray,
            () => this.lockActionButtons(true),
            () => this.lockActionButtons(false)
        );

        // Update confidence percentage text in results viewport
        const targetStateEl = this.states[targetState];
        if (targetStateEl) {
            const pctEl = targetStateEl.querySelector('.pct');
            if (pctEl) {
                pctEl.textContent = `${Math.round(confidenceScore * 100)}%`;
            }
        }

        // Launch transition rain and transition states halfway
        this.transition.triggerRain(rainImages, sizeMultiplier, () => {
            this.switchState(targetState);
        });
    }

    /**
     * Processes model confidence fallbacks or manual override test triggers.
     */
    triggerUncertainState() {
        if (this.isTransitioningState) return;
        this.isTransitioningState = true;

        this.audio.playTransitionSequence(
            this.audio.ragu,
            () => this.lockActionButtons(true),
            () => this.lockActionButtons(false)
        );

        this.switchState('uncertain');
    }

    /**
     * Disable/Enable navigation action buttons (excluding the initial welcome start button).
     */
    lockActionButtons(lock) {
        const actionBtns = document.querySelectorAll('.btn-start-game:not(#btn-welcome-start)');
        actionBtns.forEach(btn => {
            btn.disabled = lock;
        });
    }
}

// Instantiate and initialize the app controller upon DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const controller = new AppController();
    controller.init();
});
