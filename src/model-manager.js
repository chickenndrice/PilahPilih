/**
 * ===== MODEL MANAGER =====
 * Handles Teachable Machine model predictions with throttle optimization.
 */
export class ModelManager {
    constructor(modelUrl) {
        this.modelUrl = modelUrl;
        this.aiModel = null;
        this.maxPredictions = 0;
        this.isPredicting = false;
        this.isProcessing = false;
        this.predictionTimeout = null;
        this.lastPredictionTime = 0;
        this.predictionInterval = 120; // 120ms throttle prevents 60fps thermal throttles (saves up to 85% CPU/GPU)
        this.isModelReady = false;
    }

    /**
     * Loads the model in the background and warms it up.
     */
    async loadModel(onModelReadyCallback) {
        if (this.aiModel) {
            if (onModelReadyCallback) onModelReadyCallback();
            return;
        }

        const modelURL = this.modelUrl + "model.json";
        const metadataURL = this.modelUrl + "metadata.json";

        try {
            if (window.tmImage) {
                this.aiModel = await window.tmImage.load(modelURL, metadataURL);
                this.maxPredictions = this.aiModel.getTotalClasses();
                console.log("AI Model loaded successfully, starting WebGL warmup...");

                // Warm up the model with a blank canvas to compile shaders before countdown reaches 1
                const dummyCanvas = document.createElement('canvas');
                dummyCanvas.width = 224;
                dummyCanvas.height = 224;
                await this.aiModel.predict(dummyCanvas);

                this.isModelReady = true;
                console.log("AI Model warmed up and ready");

                if (onModelReadyCallback) onModelReadyCallback();
            } else {
                console.warn("window.tmImage not loaded yet. Retrying in 1s...");
                setTimeout(() => this.loadModel(onModelReadyCallback), 1000);
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
        this.isProcessing = false;
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

            // Throttling logic and concurrency guard
            if (!this.isProcessing && (timestamp - this.lastPredictionTime >= this.predictionInterval)) {
                this.lastPredictionTime = timestamp;
                this.isProcessing = true;

                this.predict(videoEl, onSuccess).finally(() => {
                    this.isProcessing = false;
                });
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    async predict(videoEl, onSuccess) {
        if (!this.aiModel || !this.isPredicting) return;

        try {
            const prediction = await this.aiModel.predict(videoEl);

            // Critical check: if prediction was stopped while in-flight, discard results
            if (!this.isPredicting) return;

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
