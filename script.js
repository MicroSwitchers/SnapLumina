// Element References
const lightPanel = document.getElementById('light-panel');
const drawer = document.getElementById('drawer');
const drawerHandle = document.getElementById('drawer-handle');
const brightnessSlider = document.getElementById('brightness');
const temperatureSlider = document.getElementById('temperature');
const redSlider = document.getElementById('red');
const greenSlider = document.getElementById('green');
const blueSlider = document.getElementById('blue');
const brightnessValue = document.getElementById('brightness-value');
const temperatureValue = document.getElementById('temperature-value');
const redValue = document.getElementById('red-value');
const greenValue = document.getElementById('green-value');
const blueValue = document.getElementById('blue-value');
const brightnessFill = document.getElementById('brightness-fill');
const temperatureFill = document.getElementById('temperature-fill');
const redFill = document.getElementById('red-fill');
const greenFill = document.getElementById('green-fill');
const blueFill = document.getElementById('blue-fill');
const temperatureControls = document.getElementById('temperature-controls');
const rgbControls = document.getElementById('rgb-controls');
const maskControls = document.getElementById('mask-controls');
const fullscreenButton = document.getElementById('fullscreen-button');
const blueLightFilterToggle = document.getElementById('blue-light-filter');

// Mask elements
const maskOverlay = document.getElementById('mask-overlay');
const maskHole = document.getElementById('mask-hole');
const maskSizeSlider = document.getElementById('mask-size');
const maskSizeValue = document.getElementById('mask-size-value');
const maskEnabled = document.getElementById('mask-enabled');

// Tab Switching
const tabs = document.querySelectorAll('.tab');
const tabContents = {
    'temperature-controls': temperatureControls,
    'rgb-controls': rgbControls,
    'mask-controls': maskControls
};

// Initialize states
let isRGBMode = false;
let maskShape = 'circle';
let maskSize = 200;
let isDragging = false;
let startX, startY, startSize;
let lastTouchX, lastTouchY;

// Core functions
function getCurrentMode() {
    const activeTab = document.querySelector('.tab.active');
    return activeTab.getAttribute('data-target') === 'rgb-controls' ? 'rgb' : 'temperature';
}

function kelvinToRGB(temperature) {
    temperature = temperature / 100;
    let r, g, b;
    if (temperature <= 66) {
        r = 255;
        g = temperature;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        b = temperature <= 19 ? 0 : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307;
    } else {
        r = 329.698727446 * Math.pow(temperature - 60, -0.1332047592);
        g = 288.1221695283 * Math.pow(temperature - 60, -0.0755148492);
        b = 255;
    }
    return {
        r: Math.min(255, Math.max(0, r)),
        g: Math.min(255, Math.max(0, g)),
        b: Math.min(255, Math.max(0, b))
    };
}

function updateSliderFill(slider, fill) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    fill.style.width = percentage + '%';
}

function updateMaskPosition(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const position = `${x}px ${y}px`;
    maskHole.style.left = `${x}px`;
    maskHole.style.top = `${y}px`;

    if (maskShape === 'circle' || maskShape === 'square') {
        maskOverlay.style.setProperty('--mask-position', position);
    }

    if (maskShape === 'square' || maskShape === 'band') {
        maskOverlay.style.setProperty('--x', `${x}px`);
        maskOverlay.style.setProperty('--y', `${y}px`);
        maskOverlay.style.setProperty('--half-size', `${maskSize / 2}px`);
    }
    
    if (maskShape === 'band') {
        maskHole.style.width = '100%';
        maskHole.style.height = `${maskSize / 10}px`;
    } else {
        maskHole.style.width = `${maskSize}px`;
        maskHole.style.height = `${maskSize}px`;
    }
}

function updateMaskSize(size) {
    maskSize = size;
    const sizeInPx = `${size}px`;
    if (maskShape === 'band') {
        maskHole.style.height = `${size / 10}px`;
        maskHole.style.width = '100%';
    } else {
        maskHole.style.width = sizeInPx;
        maskHole.style.height = sizeInPx;
    }
    maskSizeValue.textContent = sizeInPx;

    // Update mask CSS variables
    maskOverlay.style.setProperty('--mask-size', sizeInPx);
    maskOverlay.style.setProperty('--half-size', `${size / 2}px`);

    updateSliderFill(maskSizeSlider, document.getElementById('mask-size-fill'));
}

function updateSliders() {
    if (getCurrentMode() === 'temperature') {
        if (blueLightFilterToggle.checked) {
            temperatureSlider.max = '6500';
            if (parseInt(temperatureSlider.value) > 6500) {
                temperatureSlider.value = '6500';
            }
        } else {
            temperatureSlider.max = '10000';
        }
        updateSliderFill(temperatureSlider, temperatureFill);
    }
}

function updateLight() {
    const brightness = brightnessSlider.value / 100;
    let r, g, b;
    if (getCurrentMode() === 'rgb') {
        r = Math.round(redSlider.value * brightness);
        g = Math.round(greenSlider.value * brightness);
        b = Math.round(blueSlider.value * brightness);
    } else {
        const temp = temperatureSlider.value;
        const rgb = kelvinToRGB(temp);
        r = Math.round(rgb.r * brightness);
        g = Math.round(rgb.g * brightness);
        b = Math.round(rgb.b * brightness);
    }
    
    lightPanel.style.backgroundColor = `rgb(${r},${g},${b})`;
    brightnessValue.textContent = `${brightnessSlider.value}%`;
    temperatureValue.textContent = `${temperatureSlider.value}K`;
    redValue.textContent = redSlider.value;
    greenValue.textContent = greenSlider.value;
    blueValue.textContent = blueSlider.value;
    
    updateSliderFill(brightnessSlider, brightnessFill);
    updateSliderFill(temperatureSlider, temperatureFill);
    updateSliderFill(redSlider, redFill);
    updateSliderFill(greenSlider, greenFill);
    updateSliderFill(blueSlider, blueFill);
}

// Event Listeners for Tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Object.values(tabContents).forEach(content => content.style.display = 'none');
        const target = tab.getAttribute('data-target');
        tabContents[target].style.display = 'block';
        updateSliders();
        updateLight();
    });
});

// Event Listeners for Mask Controls
document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        maskShape = btn.dataset.shape;
        maskOverlay.classList.remove('circle', 'square', 'band');
        if (maskEnabled.checked) {
            maskOverlay.classList.add(maskShape);
        }
        updateMaskPosition(
            parseInt(maskHole.style.left) || window.innerWidth / 2,
            parseInt(maskHole.style.top) || window.innerHeight / 2
        );
    });
});

maskEnabled.addEventListener('change', () => {
    if (maskEnabled.checked) {
        maskOverlay.classList.add('active', maskShape);
    } else {
        maskOverlay.classList.remove('active', 'circle', 'square', 'band');
    }
});

maskSizeSlider.addEventListener('input', () => {
    updateMaskSize(parseInt(maskSizeSlider.value));
});

// Mask Touch Events
maskHole.addEventListener('touchstart', (e) => {
    if (e.target === maskHole) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        lastTouchX = parseInt(maskHole.style.left) || window.innerWidth / 2;
        lastTouchY = parseInt(maskHole.style.top) || window.innerHeight / 2;
        maskHole.style.transition = 'none';
    }
});

maskHole.addEventListener('touchmove', (e) => {
    if (e.target === maskHole) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        const newX = Math.max(0, Math.min(window.innerWidth, lastTouchX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight, lastTouchY + deltaY));
        
        updateMaskPosition(newX, newY);
    }
});

maskHole.addEventListener('touchend', () => {
    maskHole.style.transition = 'width 0.3s ease, height 0.3s ease';
});

// Handle resize controls
const handles = {
    right: document.getElementById('handle-right'),
    bottom: document.getElementById('handle-bottom'),
    corner: document.getElementById('handle-corner')
};

Object.entries(handles).forEach(([position, handle]) => {
    handle?.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        isDragging = position;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startSize = maskSize;
        maskHole.style.transition = 'none';
    });
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    const delta = Math.max(deltaX, deltaY);
    
    let newSize = startSize + delta;
    newSize = Math.max(50, Math.min(500, newSize));
    
    updateMaskSize(newSize);
    maskSizeSlider.value = newSize;
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        maskHole.style.transition = 'width 0.3s ease, height 0.3s ease';
    }
});

// Drawer Event Listeners
drawerHandle.addEventListener('click', () => {
    drawer.classList.toggle('open');
});

// Light Control Event Listeners
brightnessSlider.addEventListener('input', updateLight);
temperatureSlider.addEventListener('input', () => {
    isRGBMode = false;
    updateLight();
});

redSlider.addEventListener('input', () => {
    isRGBMode = true;
    updateLight();
});

greenSlider.addEventListener('input', () => {
    isRGBMode = true;
    updateLight();
});

blueSlider.addEventListener('input', () => {
    isRGBMode = true;
    updateLight();
});

blueLightFilterToggle.addEventListener('change', () => {
    updateSliders();
    updateLight();
});

// Fullscreen handling
fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error enabling full-screen mode: ${err.message}`);
        });
        fullscreenButton.textContent = 'Exit Full Screen';
    } else {
        document.exitFullscreen();
        fullscreenButton.textContent = 'Enter Full Screen';
    }
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenButton.textContent = 'Enter Full Screen';
    } else {
        fullscreenButton.textContent = 'Exit Full Screen';
    }
});

// Initialize
updateSliders();
updateLight();
updateMaskPosition();
updateMaskSize(200);
