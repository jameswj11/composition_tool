import { random } from './utils.js';
import { state } from './state.js';

// muates image
export function mutateImage(source, placedLayers = []) {
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

    // FUTURE CONTROL: number of shape erasures per image
    if (state.mutationSettings.shapeErase) {
        for (let i = 0; i < random(1, 5); i++) {
            eraseShape(ctx, width, height)
        };
    };

    // FUTURE CONTROL: frequency of slice shifting
    if (state.mutationSettings.sliceShift && Math.random() < 0.7) {
        shiftSlices(ctx, width, height);
        shiftSlices(ctx, width, height)
    };

    // FUTURE CONTROL: displacement of self and others
    if (state.mutationSettings.displacement) {
        const strength = random(8, 35);
        let mapCanvas = null;

        if (placedLayers.length > 0 && Math.random() < 0.5) {
            const randomLayer = placedLayers[Math.floor(Math.random() * placedLayers.length)];
            const scaledMapCanvas = document.createElement('canvas');
            const scaledMapCtx = scaledMapCanvas.getContext('2d');

            scaledMapCanvas.width = width;
            scaledMapCanvas.height = height;

            scaledMapCtx.drawImage(randomLayer.canvas, 0, 0, width, height);
            mapCanvas = scaledMapCanvas;
        }

        displaceImage(ctx, width, height, strength, mapCanvas);
    };

    if (state.mutationSettings.destroyRebuild && Math.random() < 0.5) {
        destroyAndReconstruct(ctx, width, height);
    };

    // FUTURE CONTROL: posterization toggle
    if (state.mutationSettings.posterize && Math.random() < 0.6) {
        const posterizationLevels = Math.floor(random(2, 10));
        posterizeImage(ctx, width, height, posterizationLevels)
    };

    console.log('canvas:', newCanvas, 'image source:', image)
    return newCanvas;
};

export function displaceImage(ctx, width, height, strength, mapCanvas = null) {
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');

    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceCtx.drawImage(ctx.canvas, 0, 0);;

    const displacementCanvas = mapCanvas || sourceCanvas;
    const displacementCtx = displacementCanvas.getContext('2d');

    const sourceImageData = sourceCtx.getImageData(0, 0, width, height);
    const displacementImageData = displacementCtx.getImageData(0, 0, width, height);

    const sourceData = sourceImageData.data;
    const mapData = displacementImageData.data;

    const outputImageData = ctx.createImageData(width, height);
    const outputData = outputImageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            const r = mapData[i];
            const g = mapData[i + 1];
            const b = mapData[i + 2];

            const brightness = (r + g + b) / 3;
            const normalized = (brightness - 128) / 128;

            const offsetX = Math.round(normalized * strength);
            const offsetY = Math.round(normalized * strength);

            const sampleX = Math.max(0, Math.min(width - 1, x + offsetX));
            const sampleY = Math.max(0, Math.min(height - 1, y + offsetY));
            const sampleIndex = (sampleY * width + sampleX) * 4;

            outputData[i] = sourceData[sampleIndex];
            outputData[i + 1] = sourceData[sampleIndex + 1];
            outputData[i + 2] = sourceData[sampleIndex + 2];
            outputData[i + 3] = sourceData[sampleIndex + 3];
        };
    };

    ctx.putImageData(outputImageData, 0, 0);
};

export function posterizeImage(ctx, width, height, posterizationLevels) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const step = 255 / (posterizationLevels - 1);

    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(data[i] / step) * step;       // red
        data[i + 1] = Math.round(data[i + 1] / step) * step; // green
        data[i + 2] = Math.round(data[i + 2] / step) * step; // blue
    }

    ctx.putImageData(imageData, 0, 0);
}

// erases shape from canvas
export function eraseShape(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    buildOrganicShapePath(ctx, width, height);

    ctx.fill();
    ctx.restore();
};

export function destroyAndReconstruct(ctx, width, height) {
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');

    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceCtx.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    buildOrganicShapePath(ctx, width, height);
    ctx.clip();

    ctx.clearRect(0, 0, width, height);

    const fragmentCount = Math.floor(random(4, 7));

    for (let i = 0; i < fragmentCount; i++) {
        const offsetX = random(-width * 0.18, width * 0.18);
        const offsetY = random(-height * 0.18, height * 0.18);

        const bandMode = Math.random() < 0.5;

        ctx.save();
        ctx.beginPath();

        if (bandMode) {
            const bandHeight = random(height * 0.08, height * 0.22);
            const bandY = random(0, height - bandHeight);
            ctx.rect(0, bandY, width, bandHeight);
        } else {
            const bandWidth = random(width * 0.08, width * 0.22);
            const bandX = random(0, width - bandWidth);
            ctx.rect(bandX, 0, bandWidth, height);
        };

        ctx.clip();
        ctx.globalAlpha = random(0.35, 0.8);
        ctx.drawImage(sourceCanvas, offsetX, offsetY, width, height);
        ctx.restore();
    };

    ctx.restore();
};

export function buildOrganicShapePath(ctx, width, height) {
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
    };

    const minDim = Math.min(width, height);
    const radius = random(minDim * 0.1, minDim * 0.25);
    const pointsCount = Math.floor(random(4, 9));

    const points = [];

    for (let i = 0; i < pointsCount; i++) {
        const baseAngle = (Math.PI * 2 * i) / pointsCount;
        const angle = baseAngle + random(-0.3, 0.3);
        const r = radius * random(0.6, 1.3);

        points.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
        });
    };

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];

        if (Math.random() < 0.65) {
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;

            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy) || 1;

            const normalX = -dy / segmentLength;
            const normalY = dx / segmentLength;

            const curveOffset = random(-segmentLength * 0.35, segmentLength * 0.35);

            const controlX = midX + normalX * curveOffset;
            const controlY = midY + normalY * curveOffset;

            ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
        } else {
            ctx.lineTo(next.x, next.y);
        };
    };

    ctx.closePath();
};

export function shiftSlices(ctx, width, height) {
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