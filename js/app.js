const state = {
    sourceImages: [],
    layers: []
};

const generateBtn = document.getElementById('generateBtn');
const remixBtn = document.getElementById('remixBtn')
const fileInput = document.getElementById('fileInput');
const stage = document.getElementById('stage');

generateBtn.addEventListener('click', handleGenerate);
remixBtn.addEventListener('click', remixLayout)

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
    stage.innerHTML = '';

    const shuffled = [...state.sourceImages].sort(() => Math.random() - 0.5);
    const layerCount = Math.min(Math.floor(random(3, 6)), shuffled.length);
    const selected = shuffled.slice(0, layerCount);

    state.layers = selected.map(source => mutateImage(source));

    remixBtn.disabled = state.layers.length === 0;

    state.layers.forEach((canvas, index) => {
        placeLayerOnStage(canvas, index)
    });
};

// muates image. currently only draws image onto canvas
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

    // here I can choose a random percentage for mutation
    for (let i = 0; i < random(1, 5); i++) {
        erasePolygon(ctx, width, height)
    };
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

function remixLayout() {
    if (!state.layers || !state.layers.length) return;

    stage.innerHTML = '';

    state.layers.forEach((canvas, index) => {
        placeLayerOnStage(canvas, index)
    })
}

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
}

// random helper
function random(max, min) {
    return Math.random() * (max - min) + min;
}
