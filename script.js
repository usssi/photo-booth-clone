const windowEl = document.getElementById('photo-booth-window');
const titleBar = document.getElementById('title-bar');

let isDragging = false;
let isResizing = false;
let currentResizeEdge = null;

// Dragging variables
let dragStartX, dragStartY;
let initialWindowX, initialWindowY;

// Resizing variables
let resizeStartX, resizeStartY;
let initialWidth, initialHeight;
let initialLeft, initialTop;

// Bring window to front
windowEl.addEventListener('mousedown', () => {
    windowEl.style.zIndex = 100;
});

// Dragging logic
titleBar.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.classList.contains('control')) return;
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = windowEl.getBoundingClientRect();
    initialWindowX = rect.left;
    initialWindowY = rect.top;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
});

function onDrag(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    let newLeft = initialWindowX + dx;
    let newTop = initialWindowY + dy;
    
    const rect = windowEl.getBoundingClientRect();
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    
    // Keep window within visible screen bounds
    newLeft = Math.max(0, Math.min(maxWidth - rect.width, newLeft));
    newTop = Math.max(0, Math.min(maxHeight - rect.height, newTop));
    
    windowEl.style.left = `${newLeft}px`;
    windowEl.style.top = `${newTop}px`;
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Corner Resize logic
const resizeHandle = document.querySelector('.resize-handle');
resizeHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startResize(e, 'se');
});

// Edge Resize logic
const resizeEdges = document.querySelectorAll('.resize-edge');
resizeEdges.forEach(edge => {
    edge.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        startResize(e, edge.dataset.edge);
    });
});

function startResize(e, edge) {
    isResizing = true;
    currentResizeEdge = edge;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    const rect = windowEl.getBoundingClientRect();
    initialWidth = rect.width;
    initialHeight = rect.height;
    initialLeft = rect.left;
    initialTop = rect.top;
    
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
}

function onResize(e) {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newLeft = initialLeft;
    let newTop = initialTop;
    
    const minWidth = 480;
    const minHeight = 458;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    if (currentResizeEdge === 'se' || currentResizeEdge === 'right') {
        newWidth = Math.min(maxWidth, Math.max(minWidth, initialWidth + dx));
    }
    if (currentResizeEdge === 'se' || currentResizeEdge === 'bottom') {
        newHeight = Math.min(maxHeight, Math.max(minHeight, initialHeight + dy));
    }
    if (currentResizeEdge === 'left') {
        newWidth = Math.min(maxWidth, Math.max(minWidth, initialWidth - dx));
        newLeft = initialLeft + (initialWidth - newWidth);
    }
    if (currentResizeEdge === 'top') {
        newHeight = Math.min(maxHeight, Math.max(minHeight, initialHeight - dy));
        newTop = initialTop + (initialHeight - newHeight);
    }
    
    // Ensure position is also constrained within screen boundaries
    newLeft = Math.max(0, Math.min(maxWidth - newWidth, newLeft));
    newTop = Math.max(0, Math.min(maxHeight - newHeight, newTop));

    windowEl.style.width = `${newWidth}px`;
    windowEl.style.height = `${newHeight}px`;
    windowEl.style.left = `${newLeft}px`;
    windowEl.style.top = `${newTop}px`;
}

function stopResize() {
    isResizing = false;
    currentResizeEdge = null;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
}

// ==========================================
// Camera Functionality
// ==========================================

const videoFeed = document.getElementById('video-feed');
const noCameraMessage = document.getElementById('no-camera-message');
const previewImage = document.getElementById('preview-image');
const previewVideo = document.getElementById('preview-video');
const captureBtn = document.getElementById('capture-btn');
const flashOverlay = document.getElementById('flash-overlay');
const captureCanvas = document.getElementById('capture-canvas');
const ctx = captureCanvas.getContext('2d');

const countdownOverlay = document.getElementById('countdown-overlay');
const count3 = document.getElementById('count-3');
const count2 = document.getElementById('count-2');
const count1 = document.getElementById('count-1');
const countIcon = document.getElementById('count-icon');

let stream = null;
let currentMode = 'single'; // 'single', '4grid', 'video'
let currentEffect = 'none';       // currently active effect filter string
let currentFilterStyle = 'none';  // CSS filter value for the active effect
let activePreviewItem = null;

function showPreview(item, mediaUrl, isVideo) {
    activePreviewItem = item;
    
    // Add selected class to the active item, remove from others
    document.querySelectorAll('.gallery-item').forEach(el => {
        el.classList.toggle('selected', el === item);
    });
    
    // Hide live video feed
    videoFeed.style.display = 'none';
    noCameraMessage.style.display = 'none';
    
    // Disable capture btn (visually via class to keep it clickable)
    captureBtn.classList.add('preview-inactive');
    
    if (isVideo) {
        previewImage.style.display = 'none';
        previewImage.src = '';
        
        previewVideo.src = mediaUrl;
        previewVideo.style.display = 'block';
    } else {
        previewVideo.style.display = 'none';
        previewVideo.src = '';
        
        previewImage.src = mediaUrl;
        previewImage.style.display = 'block';
    }
}

function exitPreview() {
    activePreviewItem = null;
    
    // Remove selected class from all items
    document.querySelectorAll('.gallery-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Hide preview elements
    previewImage.style.display = 'none';
    previewImage.src = '';
    
    previewVideo.style.display = 'none';
    previewVideo.src = '';
    
    // Re-enable capture btn style
    captureBtn.classList.remove('preview-inactive');
    
    // Restore live feed
    if (stream) {
        videoFeed.style.display = 'block';
        noCameraMessage.style.display = 'none';
    } else {
        videoFeed.style.display = 'none';
        noCameraMessage.style.display = 'block';
    }
}

// Configuration State
const config = {
    showGallery: true,
    autoDownload: false,
    showCountdown: true,
    background: 'bg-classic',
    aspectRatio: 1.5 // 3:2 default
};

function getCropDimensions(videoWidth, videoHeight, targetRatio) {
    const videoRatio = videoWidth / videoHeight;
    let sWidth = videoWidth;
    let sHeight = videoHeight;
    let sx = 0;
    let sy = 0;

    if (videoRatio > targetRatio) {
        sWidth = videoHeight * targetRatio;
        sx = (videoWidth - sWidth) / 2;
    } else if (videoRatio < targetRatio) {
        sHeight = videoWidth / targetRatio;
        sy = (videoHeight - sHeight) / 2;
    }

    return { sx, sy, sWidth, sHeight };
}

function getNonCameraHeight() {
    const cameraView = document.querySelector('.camera-view');
    return windowEl.offsetHeight - cameraView.offsetHeight;
}

function constrainWindow() {
    const rect = windowEl.getBoundingClientRect();
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    
    const minWidth = 480;
    const minHeight = 458;
    
    // Constrain width and height to viewport dimensions
    let newWidth = Math.min(maxWidth, Math.max(minWidth, rect.width));
    let newHeight = Math.min(maxHeight, Math.max(minHeight, rect.height));
    
    // Constrain position (left/top) to keep the window fully on screen
    let newLeft = Math.max(0, Math.min(maxWidth - newWidth, rect.left));
    let newTop = Math.max(0, Math.min(maxHeight - newHeight, rect.top));
    
    windowEl.style.width = `${newWidth}px`;
    windowEl.style.height = `${newHeight}px`;
    windowEl.style.left = `${newLeft}px`;
    windowEl.style.top = `${newTop}px`;
}

// Keep window in bounds when browser is resized
window.addEventListener('resize', constrainWindow);

function adjustWindowToAspectRatio(byWidth = true) {
    const nonCamHeight = getNonCameraHeight();
    const rect = windowEl.getBoundingClientRect();
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    if (byWidth) {
        let targetHeight = rect.width / config.aspectRatio + nonCamHeight;
        if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            const targetWidth = (targetHeight - nonCamHeight) * config.aspectRatio;
            windowEl.style.width = `${Math.max(480, Math.min(maxWidth, targetWidth))}px`;
        }
        windowEl.style.height = `${Math.max(458, Math.min(maxHeight, targetHeight))}px`;
    } else {
        let cameraHeight = rect.height - nonCamHeight;
        let targetWidth = cameraHeight * config.aspectRatio;
        if (targetWidth > maxWidth) {
            targetWidth = maxWidth;
            cameraHeight = targetWidth / config.aspectRatio;
            windowEl.style.height = `${Math.max(458, Math.min(maxHeight, cameraHeight + nonCamHeight))}px`;
        }
        windowEl.style.width = `${Math.max(480, Math.min(maxWidth, targetWidth))}px`;
    }
    constrainWindow();
}

// Apply initial background
document.body.classList.add(config.background);

// Settings UI Logic
const globalSettingsBtn = document.getElementById('global-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');

globalSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');

document.getElementById('toggle-gallery').addEventListener('change', (e) => {
    config.showGallery = e.target.checked;
    document.getElementById('gallery-strip').style.display = config.showGallery ? 'flex' : 'none';
});

document.getElementById('toggle-autodownload').addEventListener('change', (e) => {
    config.autoDownload = e.target.checked;
});

document.getElementById('toggle-countdown').addEventListener('change', (e) => {
    config.showCountdown = e.target.checked;
});

const bgBtns = document.querySelectorAll('.bg-btn');
bgBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        bgBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        document.body.classList.remove(config.background);
        config.background = e.target.dataset.bg;
        document.body.classList.add(config.background);
    });
});

const aspectBtns = document.querySelectorAll('.aspect-btn');
aspectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        exitPreview();
        aspectBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const parts = e.target.dataset.aspect.split('/');
        config.aspectRatio = parseInt(parts[0]) / parseInt(parts[1]);
        
        adjustWindowToAspectRatio(true);
    });
});

// Effects panel elements
const effectsBtn = document.getElementById('effects-btn');
const effectsGrid = document.getElementById('effects-grid');
const effectCells = document.querySelectorAll('.effect-cell');

// Handle mode button switching
const modeBtns = document.querySelectorAll('.mode-btn');
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        exitPreview();
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        const icon = captureBtn.querySelector('i');
        if (currentMode === 'video') {
            icon.className = 'fa-solid fa-video';
        } else {
            icon.className = 'fa-solid fa-camera';
        }
    });
});

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

const videoTimer = document.getElementById('video-timer');
const viewModes = document.getElementById('view-modes');
const effectsSection = document.querySelector('.effects-section');
let recordingStartTime = 0;
let recordingInterval = null;

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function updateTimer() {
    const elapsed = Date.now() - recordingStartTime;
    videoTimer.textContent = formatTime(elapsed);
}

function startRecording() {
    recordedChunks = [];
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch (e) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
    }
    
    mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    
    mediaRecorder.start();
    isRecording = true;
    
    viewModes.style.display = 'none';
    effectsSection.style.display = 'none';
    videoTimer.style.display = 'block';
    
    recordingStartTime = Date.now();
    videoTimer.textContent = "00:00:00";
    recordingInterval = setInterval(updateTimer, 1000);
    
    const icon = captureBtn.querySelector('i');
    icon.className = 'fa-solid fa-square';
    captureBtn.classList.add('recording');
}

function stopRecording() {
    const crop = getCropDimensions(videoFeed.videoWidth, videoFeed.videoHeight, config.aspectRatio);
    captureCanvas.width = crop.sWidth;
    captureCanvas.height = crop.sHeight;
    ctx.save();
    if (currentFilterStyle && currentFilterStyle !== 'none') {
        ctx.filter = currentFilterStyle;
    }
    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoFeed, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, crop.sWidth, crop.sHeight);
    ctx.restore();
    const thumbnailDataUrl = captureCanvas.toDataURL('image/jpeg', 0.8);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = function() {
            const type = mediaRecorder.mimeType || 'video/webm';
            const blob = new Blob(recordedChunks, { type: type });
            const url = URL.createObjectURL(blob);
            const ext = type.includes('mp4') ? 'mp4' : 'webm';
            addToGallery(thumbnailDataUrl, url, true, `PhotoBooth_Video_${Date.now()}.${ext}`);
        };
        mediaRecorder.stop();
    }
    isRecording = false;
    
    clearInterval(recordingInterval);
    recordingInterval = null;
    
    viewModes.style.display = 'flex';
    effectsSection.style.display = 'flex';
    videoTimer.style.display = 'none';
    
    const icon = captureBtn.querySelector('i');
    icon.className = 'fa-solid fa-video';
    captureBtn.classList.remove('recording');
}

async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoFeed.srcObject = stream;
        videoFeed.style.display = 'block';
        noCameraMessage.style.display = 'none';
        // Assign the stream to each effect preview video
        effectCells.forEach(cell => {
            const previewVid = cell.querySelector('.effect-preview');
            previewVid.srcObject = stream;
            const filterStr = cell.dataset.filter;
            previewVid.style.filter = filterStr === 'none' ? '' : filterStr;
        });
    } catch (err) {
        console.error("Error accessing camera: ", err);
        noCameraMessage.style.display = 'block';
        videoFeed.style.display = 'none';
    }
}

initCamera();
adjustWindowToAspectRatio(true);
constrainWindow();

// ==========================================
// Effects Panel Logic
// ==========================================

function openEffectsPanel() {
    effectsGrid.style.display = 'grid';
    effectsBtn.classList.add('active');
    // Highlight currently selected cell
    effectCells.forEach(cell => {
        cell.classList.toggle('selected', cell.dataset.effect === currentEffect);
    });
}

function closeEffectsPanel() {
    effectsGrid.style.display = 'none';
    effectsBtn.classList.remove('active');
}

effectsBtn.addEventListener('click', () => {
    if (effectsGrid.style.display === 'none' || effectsGrid.style.display === '') {
        openEffectsPanel();
    } else {
        closeEffectsPanel();
    }
});

effectCells.forEach(cell => {
    cell.addEventListener('click', () => {
        exitPreview();
        currentEffect = cell.dataset.effect;
        currentFilterStyle = cell.dataset.filter === 'none' ? 'none' : cell.dataset.filter;
        // Apply filter to the main video feed
        videoFeed.style.filter = currentFilterStyle === 'none' ? '' : currentFilterStyle;
        closeEffectsPanel();
    });
});

function triggerFlash() {
    flashOverlay.classList.add('flash');
    if (countdownOverlay.classList.contains('active')) {
        countIcon.classList.add('flash-white');
        setTimeout(() => {
            countIcon.classList.remove('flash-white');
        }, 400);
    }
    setTimeout(() => {
        flashOverlay.classList.remove('flash');
    }, 50); // Small delay to let browser render the class addition before transition removes it
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const galleryStrip = document.getElementById('gallery-strip');

function addToGallery(thumbnailDataUrl, mediaUrl, isVideo, filename) {
    // Check auto download
    if (config.autoDownload) {
        downloadImage(mediaUrl, filename);
    }
    
    // Check if gallery is enabled
    if (!config.showGallery) {
        return;
    }

    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = thumbnailDataUrl;
    item.appendChild(img);
    
    if (isVideo) {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-play video-icon';
        item.appendChild(icon);
    }

    // Create Download button in top-right
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.title = 'Download';
    downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent selecting/previewing
        downloadImage(mediaUrl, filename);
    });
    item.appendChild(downloadBtn);

    // Create Delete ('x') button on top-left
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent selecting/previewing
        
        // If this item is currently selected/previewed, stop previewing
        if (activePreviewItem === item) {
            exitPreview();
        }
        
        // Remove item from DOM
        item.remove();
    });
    item.appendChild(deleteBtn);
    
    // Click on item toggles/selects it for preview in feed
    item.addEventListener('click', () => {
        if (activePreviewItem === item) {
            // Already previewing this item, so exit preview to show camera
            exitPreview();
        } else {
            // Show preview of this item
            showPreview(item, mediaUrl, isVideo);
        }
    });
    
    galleryStrip.appendChild(item);
    galleryStrip.scrollLeft = galleryStrip.scrollWidth;
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function takeSinglePhoto() {
    triggerFlash();

    const crop = getCropDimensions(videoFeed.videoWidth, videoFeed.videoHeight, config.aspectRatio);
    captureCanvas.width = crop.sWidth;
    captureCanvas.height = crop.sHeight;

    ctx.save();
    // Apply active effect to canvas
    if (currentFilterStyle && currentFilterStyle !== 'none') {
        ctx.filter = currentFilterStyle;
    }
    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoFeed, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, crop.sWidth, crop.sHeight);
    ctx.restore();

    const dataUrl = captureCanvas.toDataURL('image/png');
    addToGallery(dataUrl, dataUrl, false, `PhotoBooth_${Date.now()}.png`);
}

async function takeGridPhoto() {
    const crop = getCropDimensions(videoFeed.videoWidth, videoFeed.videoHeight, config.aspectRatio);

    captureCanvas.width = crop.sWidth * 2;
    captureCanvas.height = crop.sHeight * 2;

    const positions = [
        [0, 0], [crop.sWidth, 0],
        [0, crop.sHeight], [crop.sWidth, crop.sHeight]
    ];

    for (let i = 0; i < 4; i++) {
        if (config.showCountdown) {
            if (i === 0) {
                await runCountdown(true);
            } else {
                [count3, count2, count1].forEach(el => el.classList.remove('highlight'));
                countIcon.classList.add('highlight');
                await wait(1000);
            }
        } else {
            if (i > 0) await wait(1000);
        }

        triggerFlash();
        ctx.save();
        if (currentFilterStyle && currentFilterStyle !== 'none') {
            ctx.filter = currentFilterStyle;
        }
        ctx.translate(positions[i][0] + crop.sWidth, positions[i][1]);
        ctx.scale(-1, 1);
        ctx.drawImage(videoFeed, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, crop.sWidth, crop.sHeight);
        ctx.restore();

        if (config.showCountdown) {
            await wait(200);
        }
    }

    if (config.showCountdown) {
        countdownOverlay.classList.remove('active');
    }

    const dataUrl = captureCanvas.toDataURL('image/png');
    addToGallery(dataUrl, dataUrl, false, `PhotoBooth_Grid_${Date.now()}.png`);
}

async function runCountdown(keepActive = false) {
    const iconEl = countIcon.querySelector('i');
    if (currentMode === 'video') {
        iconEl.className = 'fa-solid fa-video';
    } else {
        iconEl.className = 'fa-solid fa-camera';
    }

    [count3, count2, count1, countIcon].forEach(el => el.classList.remove('highlight'));
    
    countdownOverlay.classList.add('active');
    
    count3.classList.add('highlight');
    await wait(1000);
    
    count3.classList.remove('highlight');
    count2.classList.add('highlight');
    await wait(1000);
    
    count2.classList.remove('highlight');
    count1.classList.add('highlight');
    await wait(1000);
    
    count1.classList.remove('highlight');
    countIcon.classList.add('highlight');
    await wait(400);
    
    if (!keepActive) {
        countdownOverlay.classList.remove('active');
        await wait(200);
    }
}

captureBtn.addEventListener('click', async () => {
    if (activePreviewItem !== null) {
        exitPreview();
        return;
    }

    if (!stream) return;
    
    captureBtn.disabled = true;
    captureBtn.style.pointerEvents = 'none';
    
    if (currentMode !== '4grid') {
        if (!(currentMode === 'video' && isRecording)) {
            if (config.showCountdown) {
                await runCountdown(false);
            } else {
                // Small wait to ensure UI logic settles
                await wait(100);
            }
        }
    }
    
    if (currentMode === 'video') {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    } else if (currentMode === 'single') {
        await takeSinglePhoto();
    } else if (currentMode === '4grid') {
        await takeGridPhoto();
    }
    
    captureBtn.disabled = false;
    captureBtn.style.pointerEvents = 'auto';
});
