class AdvancedColorMonitor {
    constructor() {
        this.video = document.getElementById('videoFeed');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.colorPreview = document.getElementById('colorPreview');
        this.alarmFile = document.getElementById('alarmFile');
        this.sensitivity = document.getElementById('sensitivity');

        this.mediaStream = null;
        this.analyzerInterval = null;
        this.alarmSound = null;
        this.threshold = 10;

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.updateSensitivityDisplay();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.alarmFile.addEventListener('change', (e) => this.loadAlarmSound(e));
        this.sensitivity.addEventListener('input', () => this.updateSensitivity());
    }

    async startMonitoring() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = this.mediaStream;
            this.toggleControls(true);
            this.updateStatus('دوربین فعال شد - در حال تحلیل...');
            this.startColorAnalysis();
        } catch (error) {
            this.handleError('خطای دسترسی به دوربین', error);
        }
    }

    startColorAnalysis() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        this.analyzerInterval = setInterval(() => {
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            ctx.drawImage(this.video, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const greenPercentage = this.calculateGreenPercentage(imageData.data);
            
            this.updateColorPreview(greenPercentage);
            
            if (greenPercentage < this.threshold) {
                this.triggerAlarm();
            }
        }, 500);
    }

    calculateGreenPercentage(pixelData) {
        let greenPixels = 0;
        const totalPixels = pixelData.length / 4;
        
        for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i+1];
            const b = pixelData[i+2];
            
            if (this.isGreenPixel(r, g, b)) {
                greenPixels++;
            }
        }
        return (greenPixels / totalPixels) * 100;
    }

    isGreenPixel(r, g, b) {
        return (
            g > 100 &&
            g > r * 2 &&
            g > b * 2 &&
            (g - r) > 50 &&
            (g - b) > 50
        );
    }

    async loadAlarmSound(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.alarmSound = new Audio(URL.createObjectURL(file));
            this.updateStatus('فایل آلارم با موفقیت بارگذاری شد');
        } catch (error) {
            this.handleError('خطای بارگیری فایل صوتی', error);
        }
    }

    triggerAlarm() {
        if (!this.alarmSound) {
            this.updateStatus('هشدار! فایل آلارم انتخاب نشده', true);
            return;
        }

        this.alarmSound.play()
            .catch(error => {
                this.updateStatus('خطای پخش صدا: لطفا مجوزها را بررسی کنید', true);
            });

        this.status.textContent = `هشدار! سطح سبزی به ${this.threshold}% رسید`;
        this.status.style.color = '#ff4444';
    }

    updateSensitivity() {
        this.threshold = parseInt(this.sensitivity.value);
        document.getElementById('sensitivityValue').textContent = this.threshold;
    }

    updateSensitivityDisplay() {
        document.getElementById('sensitivityValue').textContent = this.threshold;
    }

    updateColorPreview(percentage) {
        const greenValue = Math.min(255, Math.floor(percentage * 2.55));
        this.colorPreview.style.backgroundColor = `rgb(0, ${greenValue}, 0)`;
    }

    toggleControls(isActive) {
        this.startBtn.disabled = isActive;
        this.stopBtn.disabled = !isActive;
    }

    updateStatus(message, isError = false) {
        this.status.textContent = message;
        this.status.style.color = isError ? '#ff4444' : 'white';
    }

    stopMonitoring() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.analyzerInterval) {
            clearInterval(this.analyzerInterval);
        }
        if (this.alarmSound) {
            this.alarmSound.pause();
        }
        
        this.toggleControls(false);
        this.updateStatus('سیستم متوقف شد');
        this.colorPreview.style.backgroundColor = 'transparent';
    }

    handleError(context, error) {
        console.error(`${context}:`, error);
        this.updateStatus(`${context}: ${error.message}`, true);
        this.stopMonitoring();
    }
}

// راه اندازی سیستم
window.addEventListener('load', () => new AdvancedColorMonitor());