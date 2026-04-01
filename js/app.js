const state = {
    sourceImages: [],
    layers: [],
    hasGenerated: false,

    // FUTURE CONTRO: global settings
    compositionSettings: {
        useCompositionMode: false,
        useOverlapPlacement: false,
        useSmartRemix: true
    }
};

const generateBtn = document.getElementById('generateBtn');
const remixBtn = document.getElementById('remixBtn')
const fileInput = document.getElementById('fileInput');
const stage = document.getElementById('stage');

generateBtn.addEventListener('click', handleGenerate);
remixBtn.addEventListener('click', remixLayers)

// adds listener to file input to get images, handles upload
fileInput.addEventListener('change', handleFiles);

// handles file upload
async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    const loadedImages = await Promise.all(files.map(loadFileAsImage));
    state.sourceImages = loadedImages.filter(Boolean);

    generateBtn.disabled = state.sourceImages.length === 0;

    renderStatus();
};

// converts uploaded file into image
function loadFileAsImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            resolve({
                file,
                url,
                image: img,
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    })
};

// displays how many images uploaded
function renderStatus() {
    const status = document.getElementById('status');
    status.textContent = `${state.sourceImages.length} images loaded.`
};

function handleGenerate() {
    const stageWidth = 1000;
    const stageHeight = 700;

    stage.innerHTML = '';

    const shuffled = [...state.sourceImages].sort(() => Math.random() - 0.5);
    const desiredLayerCount = Math.min(Math.floor(random(3, 6)), shuffled.length); // FUTURE CONTROL: density / layer count range

    const {
        useCompositionMode,
        useOverlapPlacement
    } = state.compositionSettings;

    const lockedLayers = state.layers.filter(layer => layer.locked);
    const availableSlots = Math.max(0, desiredLayerCount - lockedLayers.length)
    const selected = shuffled.slice(0, availableSlots);
    const mode = getCompositionMode();
    const placedLayers = [...lockedLayers];

    const newLayers = selected.map((source, index) => {
        const role = getLayerRole(index + lockedLayers.length, desiredLayerCount);
        const canvas = mutateImage(source);
        const aspectRatio = canvas.height / canvas.width;
        const width = getLayerWidthByRole(role, stageWidth)
        const height = width * aspectRatio;

        // FUTURE CONTROL: overlap intensity
        const targetOverlap =
            role === 'dominant' ? 0 :
                role === 'support' ? 1 : 2;

        const placement = findPlacement({
            mode,
            layerWidth: width,
            layerHeight: height,
            stageWidth,
            stageHeight,
            placedLayers,
            targetOverlap,
            useCompositionMode,
            useOverlapPlacement
        });

        const layer = {
            canvas,
            x: placement.x,
            y: placement.y,
            width,
            height,

            // FUTURE CONTROL: rotation intensity
            rotation: role === 'dominant' ?
                random(-4, 4) :
                random(-12, 12),

            // FUTURE CONTROL: opacity range
            opacity: role === 'dominant' ?
                random(0.75, 1) :
                random(0.35, 0.85),
            zIndex: lockedLayers.length + index,
            locked: false,
            showLockIndicator: false // UI-only, temporary
        };

        placedLayers.push(layer);
        return layer;
    });

    state.layers = [...lockedLayers, ...newLayers]

    renderLayers();
    flasLockedInidcators();

    state.hasGenerated = true;
    remixBtn.disabled = false;
};

// handles showing lock badge on layer lock
function flasLockedInidcators(duration = 1000) {
    state.layers.forEach(layer => {
        if (layer.locked) {
            layer.showLockIndicator = true
        };
    });

    renderLayers();

    setTimeout(() => {
        state.layers.forEach(layer => {
            layer.showLockIndicator = false
        })
        renderLayers();
    }, duration)
}

// muates image
function mutateImage(source) {
    console.log('mutating');
    const image = source.image;
    const maxWidth = 2500;
    const maxHeight = 2500;
    const scale = Math.min(maxWidth / image.naturalWidth,
        maxHeight / image.naturalHeight, 1
    );
    const width = Math.floor(image.naturalWidth * scale);
    const height = Math.floor(image.naturalHeight * scale);
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');

    newCanvas.width = width;
    newCanvas.height = height;

    const displayWidth = 1200;

    newCanvas.style.width = displayWidth + 'px';
    newCanvas.style.height = 'auto';

    ctx.drawImage(image, 0, 0, width, height);

    // FUTURE CONTROL: number of polygon erasures per image
    for (let i = 0; i < random(1, 5); i++) {
        erasePolygon(ctx, width, height)
    };

    // FUTURE CONTROL: frequency of slice shifting
    if (Math.random() < 0.7) {
        shiftSlices(ctx, width, height);
        shiftSlices(ctx, width, height)
    };

    return newCanvas;
};

// erases polygons from canvas
function erasePolygon(ctx, width, height) {
    ctx.save();

    // erases polygons
    ctx.globalCompositeOperation = 'destination-out';

    // chooses a random location to start operation
    let centerX;
    let centerY;

    if (Math.random() < 0.35) {
        centerX = random(width * 0.25, width * 0.75);
        centerY = random(height * 0.25, height * 0.75);
    } else {
        centerX =
            Math.random() > 0.5
                ? random(width * 0.05, width * 0.3)
                : random(width * 0.7, width * 0.95);

        centerY =
            Math.random() > 0.5
                ? random(height * 0.05, height * 0.3)
                : random(height * 0.7, height * 0.95);
    }

    // set size of polygon
    const minDim = Math.min(width, height);
    const radius = random(minDim * 0.1, minDim * 0.25)

    // set polygon complexity
    const points = Math.floor(random(4, 9)); // 4-8 points

    ctx.beginPath();

    // build shape
    for (let i = 0; i < points; i++) {
        // evenly spaced angle
        const baseAngle = (Math.PI * 2 * i) / points;

        // adds randomness to angle
        const angle = baseAngle + random(-0.3, 0.3)

        // varies radius per point
        const r = radius * random(0.6, 1.3);

        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        (i === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    };

    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

function shiftSlices(ctx, width, height) {
    // creates temporary canvas and copies original into it for mutation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = width;
    tempCanvas.height = height;

    tempCtx.drawImage(ctx.canvas, 0, 0);

    const horizontal = Math.random() < 0.5;

    // create slices
    if (horizontal) {
        let y = 0;

        while (y < height) {
            let sliceHeight = Math.floor(random(height * 0.06, height * 0.22));
            sliceHeight = Math.min(sliceHeight, height - y);

            let shiftX;
            if (Math.random() < 0.25) {
                shiftX = 0;
            } else if (Math.random() < 0.75) {
                shiftX = random(-25, 25);
            } else {
                shiftX = random(-60, 60);
            }
            ctx.drawImage(tempCanvas, 0, y, width, sliceHeight, shiftX, y, width, sliceHeight);

            y += sliceHeight;
        }
    } else {
        let x = 0;

        while (x < width) {
            let sliceWidth = Math.floor(random(width * 0.06, width * 0.22));
            sliceWidth = Math.min(sliceWidth, width - x);

            let shiftY;
            if (Math.random() < 0.25) {
                shiftY = 0;
            } else if (Math.random() < 0.75) {
                shiftY = random(-25, 25);
            } else {
                shiftY = random(-60, 60)
            }

            ctx.drawImage(tempCanvas, x, 0, sliceWidth, height, x, shiftY, sliceWidth, height);
            x += sliceWidth;
        };
    };
};

// layer lock helper
function toggleLayerLock(index) {
    const layer = state.layers[index];
    layer.locked = !layer.locked;
    layer.showLockIndicator = true;

    renderLayers();

    setTimeout(() => {
        layer.showLockIndicator = false;
        renderLayers()
    }, 1000)
};

// main render layer function
function renderLayers() {
    console.log('render layers')
    stage.innerHTML = '';

    state.layers.forEach((layer, index) => {
        const wrapper = document.createElement('div');

        wrapper.style.position = 'absolute';
        wrapper.style.left = `${layer.x}px`;
        wrapper.style.top = `${layer.y}px`;
        wrapper.style.width = `${layer.width}px`;
        wrapper.style.height = `${layer.height}px`;
        wrapper.style.transform = `rotate(${layer.rotation}deg)`;
        wrapper.style.opacity = layer.opacity;
        wrapper.style.zIndex = layer.zIndex;
        wrapper.style.cursor = 'pointer';

        const img = document.createElement('img');

        img.src = layer.canvas.toDataURL();
        img.style.position = 'absolute';
        img.style.left = `${layer.x}px`;
        img.style.top = `${layer.y}px`;
        img.style.width = `${layer.width}px`;
        img.style.height = `${layer.height}px`;
        img.style.opacity = layer.opacity;
        img.style.transform = `rotate(${layer.rotation}deg)`;
        img.style.zIndex = layer.zIndex;

        wrapper.appendChild(img);
        wrapper.addEventListener('dblclick', () => { // FUTURE CONTROL: layer lock UI
            toggleLayerLock(index);
        });

        if (layer.showLockIndicator) {
            const badge = document.createElement('div');
            badge.textContent = 'L';

            badge.style.position = 'absolute';
            badge.style.top = '6px';
            badge.style.right = '6px';
            badge.style.width = '16px';
            badge.style.height = '16px';
            badge.style.fontSize = '10px';
            badge.style.lineHeight = '16px';
            badge.style.textAlign = 'center';
            badge.style.background = 'red';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.pointerEvents = 'none';
            badge.style.fontFamily = 'sans-serif';

            wrapper.appendChild(badge);
        };

        stage.appendChild(wrapper)
    });
};

// preserve layers and remix
function remixLayers() {
    const stageWidth = 1000;
    const stageHeight = 700;
    const { useSmartRemix } = state.compositionSettings;

    state.layers = state.layers.map((layer, index) => {
        if (layer.locked) return layer;

        if (!useSmartRemix) {
            return {
                ...layer,
                x: random(-layer.width * 0.2, stageWidth - layer.width * 0.8),
                y: random(-layer.height * 0.2, stageHeight - layerHeight * 0.8),
                rotation: random(-15, 15),
                opacity: random(0.35, 1)
            };
        };

        const positionJitter = index === 0 ? 60 : 100; // FUTURE CONTROL: remix position jitter
        const rotationJitter = index === 0 ? 4 : 8;
        const opactiyJitter = 0.08;

        return {
            ...layer,
            x: clamp(
                layer.x + random(-positionJitter, positionJitter),
                -layer.width * 0.3,
                stageWidth - layer.width * 0.7
            ),
            y: clamp(
                layer.y + random(-positionJitter, positionJitter),
                -layer.height * 0.3,
                stageHeight - layer.height * 0.7
            ),
            rotation: layer.rotation + random(-rotationJitter, rotationJitter),
            opacity: clamp(layer.opacity + random(-opactiyJitter, opactiyJitter), 0.35, 1)
        };
    });

    renderLayers();
    flasLockedInidcators();
};

function placeLayerOnStage(canvas, index) {
    const stageWidth = 1000;
    const stageHeight = 700;
    const aspectRatio = canvas.height / canvas.width;

    let layerWidth;

    const sizeMode = Math.random()

    if (sizeMode < 0.333) {
        layerWidth = random(stageWidth * 0.5, stageWidth * 0.9);
    } else if (sizeMode < 0.6666) {
        if (index === 0) {
            layerWidth = random(stageWidth * 0.7, stageWidth * 1.0);
        } else {
            layerWidth = random(stageWidth * 0.35, stageWidth * 0.75);
        }
    } else {
        if (index === 0) {
            layerWidth = random(stageWidth * 0.9, stageWidth * 1.2);
        } else {
            layerWidth = random(stageWidth * 0.35, stageWidth * 0.75);
        }
    }

    const layerHeight = layerWidth * aspectRatio;

    const x = random(-layerWidth * 0.15, stageWidth - layerWidth * 0.85);
    const y = random(-layerHeight * 0.15, stageHeight - layerHeight * 0.85);

    canvas.style.position = 'absolute';
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    canvas.style.width = `${layerWidth}px`;
    canvas.style.height = `${layerHeight}px`;
    canvas.style.opacity = random(0.55, 0.9);
    canvas.style.zIndex = index + 1;
    canvas.style.transform = `rotate(${random(-10, 10)}deg)`;

    stage.appendChild(canvas);
};

// gives generation spatial bias without killing randomness
function getCompositionMode() {
    // FUTURE CONTROL: composition mode weighting / manual control override
    return weightedChoice([
        { value: 'clustered', weight: 4 },
        { value: 'spread', weight: 2 },
        { value: 'verticalStack', weight: 2 },
        { value: 'edgeWeighted', weight: 2 },
        { value: 'centralVoic', weight: 1 },
    ]);
};

// layer hierarchy
function getLayerRole(index, total) {
    if (index === 0) return 'dominant';
    if (index < total - 1) return 'support';
    return 'accent';
};

function getLayerWidthByRole(role, stageWidth) {
    // FUTURE CONTROL: scale variance / hierarchy strength
    if (role === 'dominant') return random(stageWidth * 0.6, stageWidth * 0.95);
    if (role === 'support') return random(stageWidth * 0.3, stageWidth * 0.65);
    return random(stageWidth * 0.15, stageWidth * 0.35);
}

// positioning by mode
function placeLayerByCompMode(mode, layerWidth, layerHeight, stageWidth, stageHeight) {
    // FUTURE CONTROLS BELOW: edge placement / cropping bias
    switch (mode) {
        case 'clustered':
            return {
                x: random(stageWidth * 0.15, stageWidth * 0.55),
                y: random(stageHeight * 0.15, stageHeight * 0.55)
            };
        case 'spread':
            return {
                x: random(-layerWidth * 0.15, stageWidth - layerWidth * 0.85),
                y: random(-layerHeight * 0.15, stageHeight - layerHeight * 0.85)
            };
        case 'verticalStack':
            return {
                x: random(stageWidth * 0.25, stageWidth * 0.55),
                y: random(-layerHeight * 0.15, stageHeight - layerHeight * 0.85)
            };
        case 'edgeWeighted':
            return {
                x: Math.random() < 0.5 ?
                    random(-layerWidth * 0.3, stageWidth * 0.15) :
                    random(stageWidth * 0.7, stageWidth - layerWidth * 0.7),
                y: random(-layerHeight * 0.15, stageHeight - layerHeight * 0.85)
            };
        case 'centralVoid': {
            const zones = [
                {
                    xMin: -layerWidth * 0.2,
                    xMax: stageWidth * 0.2,
                    yMin: -layerHeight * 0.2,
                    yMax: stageHeight - layerHeight * 0.8
                },
                {
                    xMin: stageWidth * 0.8,
                    xMax: stageWidth - layerWidth * 0.6,
                    yMin: -layerHeight * 0.2,
                    yMax: stageHeight - layerHeight * 0.8
                },
                {
                    xMin: stageWidth * 0.25,
                    xMax: stageWidth * 0.65,
                    yMin: -layerHeight * 0.2,
                    yMax: stageHeight * 0.15
                },
                {
                    xMin: stageWidth * 0.25,
                    xMax: stageWidth * 0.65,
                    yMin: stageHeight * 0.8,
                    yMax: stageHeight - layerHeight * 0.6
                }
            ];

            const zone = zones[Math.floor(Math.random() * zones.length)];

            return {
                x: random(zone.xMin, zone.xMax),
                y: random(zone.yMin, zone.yMax)
            };
        };

        default:
            return {
                x: random(0, stageWidth - layerWidth),
                y: random(0, stageHeight - layerHeight)
            };
    };
};

// overlap-aware placement
function rectanglesOverlap(a, b) {
    return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
    );
};

function countOverlaps(candidate, placedLayers) {
    let count = 0;

    for (const layer of placedLayers) {
        if (rectanglesOverlap(candidate, layer)) {
            count++
        };
    };

    return count;
};

// placement search
function findPlacement({
    mode,
    layerWidth,
    layerHeight,
    stageWidth,
    stageHeight,
    placedLayers,
    targetOverlap,
    useCompositionMode,
    useOverlapPlacement
}) {
    if (!useCompositionMode && !useOverlapPlacement) {
        return {
            x: random(-layerWidth * 0.2, stageWidth - layerWidth * 0.8),
            y: random(-layerHeight * 0.2, stageHeight - layerHeight * 0.8)
        };
    };

    if (useCompositionMode && !useOverlapPlacement) {
        return placeLayerByCompMode(mode, layerWidth, layerHeight, stageWidth, stageHeight)
    };

    let bestCandidate = null;
    let bestScore = Infinity;

    // FUTURE CONTORL: placement search intensity / strictness
    for (let i = 0; i < 30; i++) {
        const basePosition = useCompositionMode ?
            placeLayerByCompMode(mode, layerWidth, layerHeight, stageWidth, stageHeight) :
            {
                x: random(-layerWidth * 0.2, stageWidth - layerWidth * 0.8),
                y: random(-layerHeight * 0.2, stageHeight - layerHeight * 0.8)
            };

        const candidate = {
            x: basePosition.x,
            y: basePosition.y,
            width: layerWidth,
            height: layerHeight
        };

        const overlapCount = countOverlaps(candidate, placedLayers);
        const score = Math.abs(overlapCount - targetOverlap);

        if (score < bestScore) {
            bestScore = score;
            bestCandidate = candidate;
        };
    };

    return bestCandidate;
};

// HELPER UTILITIES //

function random(max, min) {
    return Math.random() * (max - min) + min;
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
};

function weightedChoice(options) {
    const total = options.reduce((sum, option) => sum + option.weight, 0);
    let r = Math.random() * total;

    for (const option of options) {
        r -= option.weight;
        if (r <= 0) return option.value;
    };

    return options[options.length - 1].value;
};
