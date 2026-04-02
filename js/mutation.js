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

    if (state.mutationSettings.edgeErosion && Math.random() < 0.8) {
        silhouetteBreak(ctx, width, height);
    };

    if (state.mutationSettings.edgeBite && Math.random() < 0.75) {
        edgeBite(ctx, width, height);
    };

    // FUTURE CONTROL: number of shape erasures per image
    if (state.mutationSettings.shapeErase) {
        for (let i = 0; i < random(1, 5); i++) {
            eraseShape(ctx, width, height)
        };
    };

    // FUTURE CONTROL: frequency of slice shifting
    if (state.mutationSettings.sliceShift && Math.random() < 0.5) {
        shiftSlices(ctx, width, height);
        shiftSlices(ctx, width, height)
    };

    // FUTURE CONTROL: displacement of self and others
    if (state.mutationSettings.displacement) {
        const strength = random(4, 16);
        let mapCanvas = null;

        if (placedLayers.length > 0 && Math.random() < 0.5) {
            const randomLayer = placedLayers[Math.floor(Math.random() * placedLayers.length)];
            const scaledMapCanvas = document.createElement('canvas');
            const scaledMapCtx = scaledMapCanvas.getContext('2d');

            scaledMapCanvas.width = width;
            scaledMapCanvas.height = height;

            scaledMapCtx.drawImage(randomLayer.canvas, 0, 0, width, height);
            mapCanvas = scaledMapCanvas;
        };

        displaceImage(ctx, width, height, strength, mapCanvas);
    };

    // FUTURE CONTROLS: probability of color mutations happening (global)
    if (state.mutationSettings.hueReassign && Math.random() < 0.25) {
        const hueShift = random(-0.22, 0.22);
        reassignHueInRegion(ctx, width, height, hueShift);
    };

    if (state.mutationSettings.colorInjection && Math.random() < 0.18) {
        const targetColor = getInjectionColor();
        const strength = random(0.25, 0.55);
        injectColorInRegion(ctx, width, height, targetColor, strength);
    };

    if (state.mutationSettings.valuePreservingSaturation && Math.random() < 0.3) {
        const amount = random(1.3, 1.9);
        pushSaturationPreserveValue(ctx, width, height, amount);
    };

    if (state.mutationSettings.colorRangeExpansion && Math.random() < 0.2) {
        const saturationAmount = random(1.25, 1.9);
        const lightnessPush = random(0.04, 0.1);
        expandColorRangeInRegion(ctx, width, height, saturationAmount, lightnessPush);
    };

    if (state.mutationSettings.destroyRebuild && Math.random() < 0.5) {
        destroyAndReconstruct(ctx, width, height);
    };

    if (state.mutationSettings.saturationBoost && Math.random() < 0.35) {
        const amount = random(4, 8);
        boostSaturationInRegion(ctx, width, height, amount);
    };

    // FUTURE CONTROL: posterization toggle
    if (state.mutationSettings.posterize && Math.random() < 0.25) {
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

    const directionMode = Math.random();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            const r = mapData[i];
            const g = mapData[i + 1];
            const b = mapData[i + 2];

            const brightness = (r + g + b) / 3;
            const normalized = (brightness - 128) / 128;

            let offsetX = 0;
            let offsetY = 0;

            if (directionMode < 0.33) {
                offsetX = Math.round(normalized * strength);
            } else if (directionMode < 0.66) {
                offsetY = Math.round(normalized * strength);
            } else {
                offsetX = Math.round(normalized * strength);
                offsetY = Math.round(normalized * strength)
            };

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
    };

    ctx.putImageData(imageData, 0, 0);
};

export function buildEdgeShapePath(ctx, width, height) {
    const minDim = Math.min(width, height);
    const isCorner = Math.random() < 0.35;

    let centerX;
    let centerY;
    let radiusX;
    let radiusY;

    if (isCorner) {
        const corner = Math.floor(random(0, 4)); // 0 TL, 1 TR, 2 BR, 3 BL

        radiusX = random(minDim * 0.12, minDim * 0.28);
        radiusY = random(minDim * 0.12, minDim * 0.28);

        if (corner === 0) {
            centerX = random(-radiusX * 0.6, radiusX * 0.35);
            centerY = random(-radiusY * 0.6, radiusY * 0.35);
        } else if (corner === 1) {
            centerX = random(width - radiusX * 0.35, width + radiusX * 0.6);
            centerY = random(-radiusY * 0.6, radiusY * 0.35);
        } else if (corner === 2) {
            centerX = random(width - radiusX * 0.35, width + radiusX * 0.6);
            centerY = random(height - radiusY * 0.35, height + radiusY * 0.6);
        } else {
            centerX = random(-radiusX * 0.6, radiusX * 0.35);
            centerY = random(height - radiusY * 0.35, height + radiusY * 0.6);
        }
    } else {
        const edge = Math.floor(random(0, 4)); // 0 top, 1 right, 2 bottom, 3 left

        if (edge === 0 || edge === 2) {
            radiusX = random(width * 0.12, width * 0.3);
            radiusY = random(minDim * 0.06, minDim * 0.16);

            centerX = random(width * 0.12, width * 0.88);
            centerY =
                edge === 0
                    ? random(-radiusY * 0.8, radiusY * 0.35)
                    : random(height - radiusY * 0.35, height + radiusY * 0.8);
        } else {
            radiusX = random(minDim * 0.06, minDim * 0.16);
            radiusY = random(height * 0.12, height * 0.3);

            centerX =
                edge === 1
                    ? random(width - radiusX * 0.35, width + radiusX * 0.8)
                    : random(-radiusX * 0.8, radiusX * 0.35);

            centerY = random(height * 0.12, height * 0.88);
        };
    };

    const pointsCount = Math.floor(random(5, 10));
    const points = [];

    for (let i = 0; i < pointsCount; i++) {
        const baseAngle = (Math.PI * 2 * i) / pointsCount;
        const angle = baseAngle + random(-0.22, 0.22);

        const px = centerX + Math.cos(angle) * radiusX * random(0.7, 1.25);
        const py = centerY + Math.sin(angle) * radiusY * random(0.7, 1.25);

        points.push({ x: px, y: py });
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

            const curveOffset = random(-segmentLength * 0.28, segmentLength * 0.28);

            const controlX = midX + normalX * curveOffset;
            const controlY = midY + normalY * curveOffset;

            ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
        } else {
            ctx.lineTo(next.x, next.y);
        };
    };

    ctx.closePath();
};

export function buildIrregularSilhouettePath(ctx, width, height) {
    const minDim = Math.min(width, height);
    const depth = random(minDim * 0.04, minDim * 0.3); // FUTURE CONTROL: edge erosion intensity

    const topSegments = Math.floor(random(2, 6));
    const rightSegments = Math.floor(random(2, 6));
    const bottomSegments = Math.floor(random(2, 6));
    const leftSegments = Math.floor(random(2, 6));

    const topPoints = [];
    const rightPoints = [];
    const bottomPoints = [];
    const leftPoints = [];

    // top edge: move left -> right, push inward (down)
    for (let i = 0; i <= topSegments; i++) {
        const x = (width * i) / topSegments;
        const y = random(0, depth);
        topPoints.push({ x, y });
    }

    // right edge: move top -> bottom, push inward (left)
    for (let i = 0; i <= rightSegments; i++) {
        const y = (height * i) / rightSegments;
        const x = random(width - depth, width);
        rightPoints.push({ x, y });
    }

    // bottom edge: move right -> left, push inward (up)
    for (let i = bottomSegments; i >= 0; i--) {
        const x = (width * i) / bottomSegments;
        const y = random(height - depth, height);
        bottomPoints.push({ x, y });
    }

    // left edge: move bottom -> top, push inward (right)
    for (let i = leftSegments; i >= 0; i--) {
        const y = (height * i) / leftSegments;
        const x = random(0, depth);
        leftPoints.push({ x, y });
    }

    const points = [
        ...topPoints,
        ...rightPoints,
        ...bottomPoints,
        ...leftPoints
    ];

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];

        if (Math.random() < 0.5) { // FUTURE CONTROL: angular vs. curved edge erosion
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;

            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy) || 1;

            const normalX = -dy / segmentLength;
            const normalY = dx / segmentLength;

            const curveOffset = random(-segmentLength * 0.5, segmentLength * 0.9);

            const controlX = midX + normalX * curveOffset;
            const controlY = midY + normalY * curveOffset;

            ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
        } else {
            ctx.lineTo(next.x, next.y);
        }
    }

    ctx.closePath();
}

export function silhouetteBreak(ctx, width, height) {
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');

    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceCtx.drawImage(ctx.canvas, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    buildIrregularSilhouettePath(ctx, width, height);
    ctx.clip();
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
};

export function edgeBite(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const biteCount = Math.floor(random(2, 5));

    for (let i = 0; i < biteCount; i++) {
        buildEdgeShapePath(ctx, width, height);
        ctx.fill();
    };

    ctx.restore();
};

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
            };

            ctx.drawImage(tempCanvas, x, 0, sliceWidth, height, x, shiftY, sliceWidth, height);
            x += sliceWidth;
        };
    };
};

export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        };

        h /= 6;
    };

    return { h, s, l };
};

export function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hueToRgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    };

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

export function boostSaturationInRegion(ctx, width, height, amount = 1.6) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.fillStyle = 'white';
    buildLargeOrganicShapePath(maskCtx, width, height);
    maskCtx.fill();

    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskData[i];

        if (maskValue > 0 && data[i + 3] > 0) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            const boostedS = Math.min(1, s * amount);
            const rgb = hslToRgb(h, boostedS, l);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function buildLargeOrganicShapePath(ctx, width, height) {
    const horizontalBias = Math.random() < 0.5;

    let centerX;
    let centerY;
    let radiusX;
    let radiusY;

    if (horizontalBias) {
        radiusX = random(width * 0.4, width * 0.9);
        radiusY = random(height * 0.2, height * 0.4);

        centerX = random(width * 0.28, width * 0.72);
        centerY = random(height * 0.2, height * 0.8);
    } else {
        radiusX = random(width * 0.2, width * 0.4);
        radiusY = random(height * 0.4, height * 0.9);

        centerX = random(width * 0.2, width * 0.8);
        centerY = random(height * 0.28, height * 0.72);
    };

    const pointsCount = Math.floor(random(6, 11));
    const points = [];

    for (let i = 0; i < pointsCount; i++) {
        const baseAngle = (Math.PI * 2 * i) / pointsCount;
        const angle = baseAngle + random(-0.22, 0.22);

        const px = centerX + Math.cos(angle) * radiusX * random(0.75, 1.2);
        const py = centerY + Math.sin(angle) * radiusY * random(0.75, 1.2);

        points.push({ x: px, y: py });
    };

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];

        if (Math.random() < 0.7) {
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;

            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy) || 1;

            const normalX = -dy / segmentLength;
            const normalY = dx / segmentLength;

            const curveOffset = random(-segmentLength * 0.16, segmentLength * 0.16);

            const controlX = midX + normalX * curveOffset;
            const controlY = midY + normalY * curveOffset;

            ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
        } else {
            ctx.lineTo(next.x, next.y);
        };
    };

    ctx.closePath();
};

export function reassignHueInRegion(ctx, width, height, hueShift = 0.18) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.fillStyle = 'white';
    buildLargeOrganicShapePath(maskCtx, width, height);
    maskCtx.fill();

    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskData[i];

        if (maskValue > 0 && data[i + 3] > 0) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);

            const shiftedH = (h + hueShift + 1) % 1;
            const rgb = hslToRgb(shiftedH, s, l);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function injectColorInRegion(ctx, width, height, targetColor, strength = 0.45) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.fillStyle = 'white';
    buildLargeOrganicShapePath(maskCtx, width, height);
    maskCtx.fill();

    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskData[i];

        if (maskValue > 0 && data[i + 3] > 0) {
            data[i] = data[i] * (1 - strength) + targetColor.r * strength;
            data[i + 1] = data[i + 1] * (1 - strength) + targetColor.g * strength;
            data[i + 2] = data[i + 2] * (1 - strength) + targetColor.b * strength;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function getInjectionColor() {
    const palette = [
        { r: 220, g: 60, b: 40 },   // red-orange
        { r: 240, g: 170, b: 40 },  // warm yellow-orange
        { r: 60, g: 140, b: 220 },  // blue
        { r: 120, g: 80, b: 200 },  // violet
        { r: 40, g: 170, b: 120 },  // green
        { r: 230, g: 90, b: 150 }   // pink-magenta
    ];

    return palette[Math.floor(Math.random() * palette.length)];
};

export function pushSaturationPreserveValue(ctx, width, height, amount = 1.5) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.fillStyle = 'white';
    buildLargeOrganicShapePath(maskCtx, width, height);
    maskCtx.fill();

    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskData[i];

        if (maskValue > 0 && data[i + 3] > 0) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);

            if (s < 0.04) continue;
            if (l < 0.06 || l > 0.94) continue;

            const newS = Math.min(1, s * amount);
            const rgb = hslToRgb(h, newS, l);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function expandColorRangeInRegion(ctx, width, height, saturationAmount = 1.5, lightnessPush = 0.08) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');

    maskCanvas.width = width;
    maskCanvas.height = height;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.fillStyle = 'white';
    buildLargeOrganicShapePath(maskCtx, width, height);
    maskCtx.fill();

    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < data.length; i += 4) {
        const maskValue = maskData[i];

        if (maskValue > 0 && data[i + 3] > 0) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);

            if (s < 0.03) continue;

            const expandedS = Math.min(1, s * saturationAmount);

            let expandedL = l;
            if (l >= 0.35 && l <= 0.65) {
                expandedL = l < 0.5
                    ? Math.max(0, l - lightnessPush)
                    : Math.min(1, l + lightnessPush);
            }

            const rgb = hslToRgb(h, expandedS, expandedL);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};