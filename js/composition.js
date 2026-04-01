import { renderLayers, flashLockedIndicators } from './render.js';
import { state } from './state.js';
import { random, clamp, weightedChoice } from './utils.js';
import { mutateImage } from './mutation.js';

export function handleGenerate() {
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
        const canvas = mutateImage(source, placedLayers);
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
                random(0.85, 1) :
                random(0.5, 0.85),
            zIndex: lockedLayers.length + index,
            locked: false,
            showLockIndicator: false // UI-only, temporary
        };

        placedLayers.push(layer);
        return layer;
    });

    state.layers = [...lockedLayers, ...newLayers]

    renderLayers();
    flashLockedIndicators();

    state.hasGenerated = true;
    remixBtn.disabled = false;
};

// preserve layers and remix
export function remixLayers() {
    const stageWidth = 1000;
    const stageHeight = 700;
    const { useSmartRemix } = state.compositionSettings;

    state.layers = state.layers.map((layer, index) => {
        if (layer.locked) return layer;

        if (!useSmartRemix) {
            return {
                ...layer,
                x: random(-layer.width * 0.2, stageWidth - layer.width * 0.8),
                y: random(-layer.height * 0.2, stageHeight - layer.height * 0.8),
                rotation: random(-15, 15),
                opacity: random(0.5, 1)
            };
        };

        const positionJitter = index === 0 ? 60 : 100; // FUTURE CONTROL: remix position jitter
        const rotationJitter = index === 0 ? 4 : 8;
        const opacityJitter = 0.08;

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
            opacity: clamp(layer.opacity + random(-opacityJitter, opacityJitter), 0.5, 1)
        };
    });

    renderLayers();
    flashLockedIndicators();
};

// gives generation spatial bias without killing randomness
export function getCompositionMode() {
    // FUTURE CONTROL: composition mode weighting / manual control override
    return weightedChoice([
        { value: 'clustered', weight: 4 },
        { value: 'spread', weight: 2 },
        { value: 'verticalStack', weight: 2 },
        { value: 'edgeWeighted', weight: 2 },
        { value: 'centralVoid', weight: 1 },
    ]);
};

// layer hierarchy
export function getLayerRole(index, total) {
    if (index === 0) return 'dominant';
    if (index < total - 1) return 'support';
    return 'accent';
};

export function getLayerWidthByRole(role, stageWidth) {
    // FUTURE CONTROL: scale variance / hierarchy strength
    if (role === 'dominant') return random(stageWidth * 0.75, stageWidth * 1);
    if (role === 'support') return random(stageWidth * 0.5, stageWidth * 1);
    return random(stageWidth * 0.3, stageWidth * 0.75);
}

// positioning by mode
export function placeLayerByCompMode(mode, layerWidth, layerHeight, stageWidth, stageHeight) {
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
            const centerX = random(stageCenterX - stageWidth * 0.12, stageCenterX + stageWidth * 0.12);
            const centerY = random(stageCenterY - stageHeight * 0.12, stageCenterY + stageHeight * 0.12);
            return fromCenter(centerX, centerY, 0.08);
        };

        case 'spread': {
            const centerX = random(stageWidth * 0.25, stageWidth * 0.75);
            const centerY = random(stageHeight * 0.25, stageHeight * 0.75);
            return fromCenter(centerX, centerY, 0.12);
        };

        case 'verticalStack': {
            const centerX = random(stageCenterX - stageWidth * 0.08, stageCenterX + stageWidth * 0.08);
            const centerY = random(stageHeight * 0.2, stageHeight * 0.8);
            return fromCenter(centerX, centerY, 0.1);
        };

        case 'edgeWeighted': {
            const centerX = Math.random() < 0.5
                ? random(stageWidth * 0.22, stageWidth * 0.35)
                : random(stageWidth * 0.65, stageWidth * 0.78);

            const centerY = random(stageHeight * 0.2, stageHeight * 0.8);

            return fromCenter(centerX, centerY, 0.1);
        };

        case 'centralVoid': {
            const zones = [
                {
                    xMin: stageWidth * 0.18,
                    xMax: stageWidth * 0.3,
                    yMin: stageHeight * 0.2,
                    yMax: stageHeight * 0.8
                },
                {
                    xMin: stageWidth * 0.7,
                    xMax: stageWidth * 0.82,
                    yMin: stageHeight * 0.2,
                    yMax: stageHeight * 0.8
                },
                {
                    xMin: stageWidth * 0.35,
                    xMax: stageWidth * 0.65,
                    yMin: stageHeight * 0.12,
                    yMax: stageHeight * 0.25
                },
                {
                    xMin: stageWidth * 0.35,
                    xMax: stageWidth * 0.65,
                    yMin: stageHeight * 0.75,
                    yMax: stageHeight * 0.88
                }
            ];

            const zone = zones[Math.floor(Math.random() * zones.length)];
            const centerX = random(zone.xMin, zone.xMax);
            const centerY = random(zone.yMin, zone.yMax);

            return fromCenter(centerX, centerY, 0.08);
        };

        default: {
            const centerX = random(stageWidth * 0.3, stageWidth * 0.7);
            const centerY = random(stageHeight * 0.3, stageHeight * 0.7);
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
};

export function countOverlaps(candidate, placedLayers) {
    let count = 0;

    for (const layer of placedLayers) {
        if (rectanglesOverlap(candidate, layer)) {
            count++
        };
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
    useOverlapPlacement
}) {
    if (!useCompositionMode && !useOverlapPlacement) {
        return {
            x: random(-layerWidth * 0.05, stageWidth - layerWidth * 0.95),
            y: random(-layerHeight * 0.05, stageHeight - layerHeight * 0.95)
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