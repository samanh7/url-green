// script.js
const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const stopAlarmBtn = document.getElementById('stopAlarmBtn');
const statusDiv = document.getElementById('status');

let isMonitoring = false;
let alarmActive = false;
let mediaStream = null;
let analyzerInterval = null;
let alarmSound = null;

// تنظیمات اصلی
const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2590/2590-preview.mp3';
const GREEN_THRESHOLD = 0.4;
const CHECK_INTERVAL = 500;

// آماده‌سازی صدای آلارم
async function initializeAlarm() {
    try {
        statusDiv.textContent = 'Downloading alarm sound...';
        const response = await fetch(ALARM_SOUND_URL);
        const blob = await response.blob();
        alarmSound = new Audio(URL.createObjectURL(blob));
        alarmSound.loop = true;
        statusDiv.textContent = 'Ready to start';
    } catch (error) {
        console.error('Alarm sound error:', error);
        statusDiv.textContent = 'Error loading alarm sound!';
    }
}

// تحلیل رنگ
function analyzeColor(frame) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let greenPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (g > r * 1.5 && g > b * 1.5 && g > 100) {
            greenPixels++;
        }
    }

    return greenPixels / (data.length / 4);
}

// شروع نظارت
async function startMonitoring() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = mediaStream;
        isMonitoring = true;
        statusDiv.textContent = 'Monitoring...';
        startBtn.disabled = true;

        analyzerInterval = setInterval(() => {
            if (!alarmActive) {
                const greenRatio = analyzeColor(video);
                if (greenRatio < GREEN_THRESHOLD) {
                    triggerAlarm();
                }
            }
        }, CHECK_INTERVAL);

    } catch (error) {
        console.error('Camera error:', error);
        statusDiv.textContent = 'Camera access denied!';
    }
}

// فعال‌سازی آلارم
function triggerAlarm() {
    alarmActive = true;
    statusDiv.textContent = 'ALARM TRIGGERED!';
    statusDiv.style.color = '#ff4444';
    stopAlarmBtn.disabled = false;
    
    alarmSound.play().catch(error => {
        console.error('Audio play failed:', error);
        statusDiv.textContent = 'Error playing alarm!';
    });
}

// توقف آلارم
function stopAlarm() {
    alarmActive = false;
    alarmSound.pause();
    alarmSound.currentTime = 0;
    statusDiv.textContent = 'Monitoring...';
    statusDiv.style.color = 'white';
    stopAlarmBtn.disabled = true;
    
    // شروع مجدد نظارت
    if (!isMonitoring) {
        startMonitoring();
    }
}

// مدیریت رویدادها
startBtn.addEventListener('click', startMonitoring);
stopAlarmBtn.addEventListener('click', stopAlarm);

// مقداردهی اولیه
initializeAlarm();

// تمیزکاری
window.addEventListener('beforeunload', () => {
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (alarmSound) URL.revokeObjectURL(alarmSound.src);
});
