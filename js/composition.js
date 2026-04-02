import { state } from './state.js';
import {
    random,
    clamp,
    weightedChoice,
    getCanvasOrientation,
    clampCanvasSize
} from './utils.js';
import { mutateImage } from './mutation.js';

export function getCompositionMetrics(stageWidth, stageHeight) {
    const orientation = getCanvasOrientation(stageWidth, stageHeight);

    if (orientation === 'portrait') {
        return {
            orientation,
            dominantWidthMin: stageWidth * 0.82,
            dominantWidthMax: stageWidth * 1.02,
            supportWidthMin: stageWidth * 0.58,
            supportWidthMax: stageWidth * 0.92,
            accentWidthMin: stageWidth * 0.32,
            accentWidthMax: stageWidth * 0.62,
            smartRemixXJitter: 50,
            smartRemixYJitter: 95,
            randomXMinFactor: 0.12,
            randomXMaxFactor: 0.88,
            randomYMinFactor: 0.08,
            randomYMaxFactor: 0.92,
        };
    };

    if (orientation === 'square') {
        return {
            orientation,
            dominantWidthMin: stageWidth * 0.78,
            dominantWidthMax: stageWidth * 1.0,
            supportWidthMin: stageWidth * 0.54,
            supportWidthMax: stageWidth * 0.96,
            accentWidthMin: stageWidth * 0.3,
            accentWidthMax: stageWidth * 0.68,
            smartRemixXJitter: 75,
            smartRemixYJitter: 75,
            randomXMinFactor: 0.08,
            randomXMaxFactor: 0.9,
            randomYMinFactor: 0.08,
            randomYMaxFactor: 0.9,
        };
    };

    return {
        orientation: 'landscape',
        dominantWidthMin: stageWidth * 0.75,
        dominantWidthMax: stageWidth * 1.0,
        supportWidthMin: stageWidth * 0.5,
        supportWidthMax: stageWidth * 1.0,
        accentWidthMin: stageWidth * 0.3,
        accentWidthMax: stageWidth * 0.75,
        smartRemixXJitter: 95,
        smartRemixYJitter: 60,
        randomXMinFactor: 0.08,
        randomXMaxFactor: 0.92,
        randomYMinFactor: 0.08,
        randomYMaxFactor: 0.88,
    };
};

export function handleGenerate() {
    const stageWidth = clampCanvasSize(state.canvasWidth);
    const stageHeight = clampCanvasSize(state.canvasHeight);
    const metrics = getCompositionMetrics(stageWidth, stageHeight);

    const shuffled = [...state.sourceImages].sort(() => Math.random() - 0.5);
    const desiredLayerCount = Math.min(Math.floor(random(3, 6)), shuffled.length); // FUTURE CONTROL: density / layer count range

    const {
        useCompositionMode,
        useOverlapPlacement
    } = state.compositionSettings;

    const lockedLayers = state.layers.filter(layer => layer.locked);
    const availableSlots = Math.max(0, desiredLayerCount - lockedLayers.length);
    const selected = shuffled.slice(0, availableSlots);
    const mode = getCompositionMode(metrics.orientation);
    const placedLayers = [...lockedLayers];

    const newLayers = selected.map((source, index) => {
        const role = getLayerRole(index + lockedLayers.length, desiredLayerCount);
        const canvas = mutateImage(source, placedLayers);
        const aspectRatio = canvas.height / canvas.width;
        const width = getLayerWidthByRole(role, metrics);
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
            useOverlapPlacement,
            orientation: metrics.orientation
        });

        const layer = {
            canvas,
            x: placement.x,
            y: placement.y,
            width,
            height,

            // FUTURE CONTROL: rotation intensity
            rotation: role === 'dominant'
                ? random(-4, 4)
                : random(-12, 12),

            // FUTURE CONTROL: opacity range
            opacity: role === 'dominant'
                ? random(0.85, 1)
                : random(0.5, 0.85),
            zIndex: lockedLayers.length + index,
            locked: false,
            showLockIndicator: false // UI-only, temporary
        };

        placedLayers.push(layer);
        return layer;
    });

    state.layers = [...lockedLayers, ...newLayers];
};

export function remixLayers() {
    if (!state.hasGenerated) return;

    const stageWidth = clampCanvasSize(state.canvasWidth);
    const stageHeight = clampCanvasSize(state.canvasHeight);
    const metrics = getCompositionMetrics(stageWidth, stageHeight);
    const { useSmartRemix } = state.compositionSettings;

    state.layers = state.layers.map((layer, index) => {
        if (layer.locked) return layer;

        // FUTURE CONTROL: remix position jitter
        const xJitter = index === 0 ? metrics.smartRemixXJitter * 0.7 : metrics.smartRemixXJitter;
        const yJitter = index === 0 ? metrics.smartRemixYJitter * 0.7 : metrics.smartRemixYJitter;
        const rotationJitter = index === 0 ? 4 : 8;
        const opacityJitter = 0.08;

        if (!useSmartRemix) {
            return {
                ...layer,
                x: random(
                    -layer.width * metrics.randomXMinFactor,
                    stageWidth - layer.width * (1 - metrics.randomXMaxFactor)
                ),
                y: random(
                    -layer.height * metrics.randomYMinFactor,
                    stageHeight - layer.height * (1 - metrics.randomYMaxFactor)
                ),
                rotation: random(-15, 15),
                opacity: random(0.5, 1)
            };
        };

        return {
            ...layer,
            x: clamp(
                layer.x + random(-xJitter, xJitter),
                -layer.width * 0.3,
                stageWidth - layer.width * 0.7
            ),
            y: clamp(
                layer.y + random(-yJitter, yJitter),
                -layer.height * 0.3,
                stageHeight - layer.height * 0.7
            ),
            rotation: layer.rotation + random(-rotationJitter, rotationJitter),
            opacity: clamp(layer.opacity + random(-opacityJitter, opacityJitter), 0.5, 1)
        };
    });
};

export function getCompositionMode(orientation) {
    // FUTURE CONTROL: composition mode weighting / manual control override
    if (orientation === 'portrait') {
        return weightedChoice([
            { value: 'verticalStack', weight: 4 },
            { value: 'clustered', weight: 3 },
            { value: 'edgeWeighted', weight: 2 },
            { value: 'spread', weight: 1 },
            { value: 'centralVoid', weight: 1 },
        ]);
    }

    if (orientation === 'square') {
        return weightedChoice([
            { value: 'clustered', weight: 3 },
            { value: 'spread', weight: 2 },
            { value: 'verticalStack', weight: 2 },
            { value: 'edgeWeighted', weight: 2 },
            { value: 'centralVoid', weight: 1 },
        ]);
    };

    return weightedChoice([
        { value: 'clustered', weight: 4 },
        { value: 'spread', weight: 3 },
        { value: 'edgeWeighted', weight: 2 },
        { value: 'verticalStack', weight: 1 },
        { value: 'centralVoid', weight: 1 },
    ]);
};

export function getLayerRole(index, total) {
    if (index === 0) return 'dominant';
    if (index < total - 1) return 'support';
    return 'accent';
};

export function getLayerWidthByRole(role, metrics) {
    // FUTURE CONTROL: variance and hierarchy system
    if (role === 'dominant') {
        return random(metrics.dominantWidthMin, metrics.dominantWidthMax);
    };

    if (role === 'support') {
        return random(metrics.supportWidthMin, metrics.supportWidthMax);
    };

    return random(metrics.accentWidthMin, metrics.accentWidthMax);
};

// FUTURE CONTROL: choose type of compositon mode
export function placeLayerByCompMode(
    mode,
    layerWidth,
    layerHeight,
    stageWidth,
    stageHeight,
    orientation
) {
    const stageCenterX = stageWidth / 2;
    const stageCenterY = stageHeight / 2;

    function fromCenter(centerX, centerY, cropAllowance = 0.12) {
        const minX = -layerWidth * cropAllowance;
        const maxX = stageWidth - layerWidth * (1 - cropAllowance);
        const minY = -layerHeight * cropAllowance;
        const maxY = stageHeight - layerHeight * (1 - cropAllowance);

        return {
            x: clamp(centerX - layerWidth / 2, minX, maxX),
            y: clamp(centerY - layerHeight / 2, minY, maxY)
        };
    };

    switch (mode) {
        case 'clustered': {
            const xRange = orientation === 'portrait' ? 0.08 : 0.12;
            const yRange = orientation === 'portrait' ? 0.16 : 0.12;

            const centerX = random(stageCenterX - stageWidth * xRange, stageCenterX + stageWidth * xRange);
            const centerY = random(stageCenterY - stageHeight * yRange, stageCenterY + stageHeight * yRange);

            return fromCenter(centerX, centerY, 0.08);
        };

        case 'spread': {
            const centerX = orientation === 'portrait'
                ? random(stageWidth * 0.32, stageWidth * 0.68)
                : random(stageWidth * 0.25, stageWidth * 0.75);

            const centerY = orientation === 'portrait'
                ? random(stageHeight * 0.18, stageHeight * 0.82)
                : random(stageHeight * 0.25, stageHeight * 0.75);

            return fromCenter(centerX, centerY, 0.12);
        };

        case 'verticalStack': {
            const centerX = orientation === 'portrait'
                ? random(stageCenterX - stageWidth * 0.05, stageCenterX + stageWidth * 0.05)
                : random(stageCenterX - stageWidth * 0.08, stageCenterX + stageWidth * 0.08);

            const centerY = random(stageHeight * 0.15, stageHeight * 0.85);

            return fromCenter(centerX, centerY, 0.1);
        };

        case 'edgeWeighted': {
            let centerX;

            if (orientation === 'portrait') {
                centerX = Math.random() < 0.5
                    ? random(stageWidth * 0.26, stageWidth * 0.38)
                    : random(stageWidth * 0.62, stageWidth * 0.74);
            } else {
                centerX = Math.random() < 0.5
                    ? random(stageWidth * 0.22, stageWidth * 0.35)
                    : random(stageWidth * 0.65, stageWidth * 0.78);
            }

            const centerY = random(stageHeight * 0.16, stageHeight * 0.84);

            return fromCenter(centerX, centerY, 0.1);
        };

        case 'centralVoid': {
            const zones = orientation === 'portrait'
                ? [
                    { xMin: stageWidth * 0.18, xMax: stageWidth * 0.34, yMin: stageHeight * 0.18, yMax: stageHeight * 0.82 },
                    { xMin: stageWidth * 0.66, xMax: stageWidth * 0.82, yMin: stageHeight * 0.18, yMax: stageHeight * 0.82 },
                    { xMin: stageWidth * 0.3, xMax: stageWidth * 0.7, yMin: stageHeight * 0.08, yMax: stageHeight * 0.2 },
                    { xMin: stageWidth * 0.3, xMax: stageWidth * 0.7, yMin: stageHeight * 0.8, yMax: stageHeight * 0.92 }
                ]
                : [
                    { xMin: stageWidth * 0.18, xMax: stageWidth * 0.3, yMin: stageHeight * 0.2, yMax: stageHeight * 0.8 },
                    { xMin: stageWidth * 0.7, xMax: stageWidth * 0.82, yMin: stageHeight * 0.2, yMax: stageHeight * 0.8 },
                    { xMin: stageWidth * 0.35, xMax: stageWidth * 0.65, yMin: stageHeight * 0.12, yMax: stageHeight * 0.25 },
                    { xMin: stageWidth * 0.35, xMax: stageWidth * 0.65, yMin: stageHeight * 0.75, yMax: stageHeight * 0.88 }
                ];

            const zone = zones[Math.floor(Math.random() * zones.length)];
            const centerX = random(zone.xMin, zone.xMax);
            const centerY = random(zone.yMin, zone.yMax);

            return fromCenter(centerX, centerY, 0.08);
        };

        default: {
            const centerX = orientation === 'portrait'
                ? random(stageWidth * 0.38, stageWidth * 0.62)
                : random(stageWidth * 0.3, stageWidth * 0.7);

            const centerY = orientation === 'portrait'
                ? random(stageHeight * 0.22, stageHeight * 0.78)
                : random(stageHeight * 0.3, stageHeight * 0.7);

            return fromCenter(centerX, centerY, 0.08);
        };
    };
};

// overlap-aware placement
export function rectanglesOverlap(a, b) {
    return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
    );
}

export function countOverlaps(candidate, placedLayers) {
    let count = 0;

    for (const layer of placedLayers) {
        if (rectanglesOverlap(candidate, layer)) {
            count++;
        }
    };

    return count;
};

// placement search
export function findPlacement({
    mode,
    layerWidth,
    layerHeight,
    stageWidth,
    stageHeight,
    placedLayers,
    targetOverlap,
    useCompositionMode,
    useOverlapPlacement,
    orientation
}) {
    if (!useCompositionMode && !useOverlapPlacement) {
        return {
            x: random(-layerWidth * 0.05, stageWidth - layerWidth * 0.95),
            y: random(-layerHeight * 0.05, stageHeight - layerHeight * 0.95)
        };
    };

    if (useCompositionMode && !useOverlapPlacement) {
        return placeLayerByCompMode(
            mode,
            layerWidth,
            layerHeight,
            stageWidth,
            stageHeight,
            orientation
        );
    };

    let bestCandidate = null;
    let bestScore = Infinity;

    // FUTURE CONTORL: placement search intensity / strictness
    for (let i = 0; i < 30; i++) {
        const basePosition = useCompositionMode
            ? placeLayerByCompMode(
                mode,
                layerWidth,
                layerHeight,
                stageWidth,
                stageHeight,
                orientation
            )
            : {
                x: random(-layerWidth * 0.08, stageWidth - layerWidth * 0.92),
                y: random(-layerHeight * 0.08, stageHeight - layerHeight * 0.92)
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