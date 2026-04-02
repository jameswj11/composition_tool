import { state } from './state.js';
import {
    createLargeRegionMask,
    pixelMatchesRegionAndBrightness,
} from './mutation.js';
import {
    random,
    rgbToHsl,
    hslToRgb
} from './utils.js';

export function applyPostProduction(sourceCanvas) {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');

    outputCanvas.width = sourceCanvas.width;
    outputCanvas.height = sourceCanvas.height;

    ctx.drawImage(sourceCanvas, 0, 0);

    // for most of these global postproduction effects, no randomness
    if (state.postProductionSettings.valueCompression && Math.random() < 0.3) {
        const compressionAmount = random(0.4, 0.8);

        compressValuesPost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            compressionAmount,
            state.mutationSettings.brightnessMasking
        );
    };

    if (state.postProductionSettings.depthCompression && Math.random() < 0.5) {
        const strength = random(0.3, 0.7);

        compressDepthPost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            strength,
            state.mutationSettings.brightnessMasking
        );
    };

    if (state.postProductionSettings.saturationBoost && Math.random() < 0.3) {
        const amount = random(0.5, 1.5);

        boostSaturationPost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            amount,
            state.mutationSettings.brightnessMasking
        );
    };

    if (state.postProductionSettings.paletteLimiting && Math.random() < 0.5) {
        limitPalettePost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            state.mutationSettings.brightnessMasking
        );
    };

    return outputCanvas;
};

export function compressValuesPost(
    ctx,
    width,
    height,
    compressionAmount = 0.6,
    useBrightnessMasking = false
) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskData = createLargeRegionMask(width, height);
    const brightnessRanges = ['dark', 'mid', 'light'];
    const brightnessRange = brightnessRanges[Math.floor(Math.random() * brightnessRanges.length)];
    const useRegionMask = useBrightnessMasking ? Math.random() < 0.7 : true;

    for (let i = 0; i < data.length; i += 4) {
        if (
            data[i + 3] > 0 &&
            pixelMatchesRegionAndBrightness(
                maskData,
                i,
                data[i],
                data[i + 1],
                data[i + 2],
                brightnessRange,
                useBrightnessMasking,
                useRegionMask
            )
        ) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            const compressedL = 0.5 + (l - 0.5) * compressionAmount;
            const rgb = hslToRgb(h, s, compressedL);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function boostSaturationPost(
    ctx,
    width,
    height,
    amount = 5,
    useBrightnessMasking = false
) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskData = createLargeRegionMask(width, height);
    const brightnessRanges = ['dark', 'mid', 'light'];
    const brightnessRange = brightnessRanges[Math.floor(Math.random() * brightnessRanges.length)];
    const useRegionMask = useBrightnessMasking ? Math.random() < 0.7 : true;

    for (let i = 0; i < data.length; i += 4) {
        if (
            data[i + 3] > 0 &&
            pixelMatchesRegionAndBrightness(
                maskData,
                i,
                data[i],
                data[i + 1],
                data[i + 2],
                brightnessRange,
                useBrightnessMasking,
                useRegionMask
            )
        ) {
            const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            const boostedS = Math.max(0.9, Math.min(1, s * amount));
            const rgb = hslToRgb(h, boostedS, l);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

export function compressDepthPost(
    ctx,
    width,
    height,
    strength = 0.5,
    useBrightnessMasking = false
) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const maskData = createLargeRegionMask(width, height);

    const brightnessRanges = ['dark', 'mid', 'light'];
    const brightnessRange = brightnessRanges[Math.floor(Math.random() * brightnessRanges.length)];

    const useRegionMask = useBrightnessMasking ? Math.random() < 0.7 : true;

    for (let i = 0; i < data.length; i += 4) {
        if (
            data[i + 3] > 0 &&
            pixelMatchesRegionAndBrightness(
                maskData,
                i,
                data[i],
                data[i + 1],
                data[i + 2],
                brightnessRange,
                useBrightnessMasking,
                useRegionMask
            )
        ) {
            let { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);

            // 🔹 reduce contrast slightly (but less than value compression)
            const compressedL = 0.5 + (l - 0.5) * (0.75 + 0.25 * (1 - strength));

            // 🔹 desaturate slightly (depth cue reduction)
            const reducedS = s * (0.7 + 0.3 * (1 - strength));

            // 🔹 bias midtones slightly (flattening depth perception)
            const midBias = l + (0.5 - l) * strength * 0.2;

            const finalL = (compressedL + midBias) / 2;

            const rgb = hslToRgb(h, reducedS, finalL);

            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};

// FUTURE CONTROL: change palette
export function getPaletteSet() {
    const palettes = [
        [
            { r: 35, g: 28, b: 24 },
            { r: 92, g: 74, b: 58 },
            { r: 158, g: 128, b: 92 },
            { r: 210, g: 176, b: 120 },
            { r: 238, g: 220, b: 184 }
        ],
        [
            { r: 22, g: 30, b: 42 },
            { r: 58, g: 82, b: 108 },
            { r: 110, g: 134, b: 150 },
            { r: 186, g: 180, b: 158 },
            { r: 232, g: 216, b: 190 }
        ],
        [
            { r: 48, g: 34, b: 64 },
            { r: 96, g: 66, b: 128 },
            { r: 152, g: 104, b: 170 },
            { r: 212, g: 150, b: 190 },
            { r: 242, g: 214, b: 220 }
        ],
        [
            { r: 30, g: 42, b: 32 },
            { r: 70, g: 96, b: 68 },
            { r: 124, g: 146, b: 100 },
            { r: 186, g: 180, b: 122 },
            { r: 230, g: 214, b: 168 }
        ],
        [
            { r: 28, g: 24, b: 20 },
            { r: 86, g: 54, b: 40 },
            { r: 150, g: 84, b: 56 },
            { r: 210, g: 126, b: 72 },
            { r: 242, g: 198, b: 132 }
        ]
    ];

    return palettes[Math.floor(Math.random() * palettes.length)];
};

export function getClosestPaletteColor(r, g, b, palette) {
    let closest = palette[0];
    let closestDistance = Infinity;

    for (const color of palette) {
        const dr = r - color.r;
        const dg = g - color.g;
        const db = b - color.b;
        const distance = dr * dr + dg * dg + db * db;

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = color;
        };
    };

    return closest;
};

export function limitPalettePost(
    ctx,
    width,
    height,
    useBrightnessMasking = false
) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const palette = getPaletteSet();
    const maskData = createLargeRegionMask(width, height);

    const brightnessRanges = ['dark', 'mid', 'light'];
    const brightnessRange = brightnessRanges[Math.floor(Math.random() * brightnessRanges.length)];

    const useRegionMask = useBrightnessMasking ? Math.random() < 0.7 : true;

    for (let i = 0; i < data.length; i += 4) {
        if (
            data[i + 3] > 0 &&
            pixelMatchesRegionAndBrightness(
                maskData,
                i,
                data[i],
                data[i + 1],
                data[i + 2],
                brightnessRange,
                useBrightnessMasking,
                useRegionMask
            )
        ) {
            const closest = getClosestPaletteColor(
                data[i],
                data[i + 1],
                data[i + 2],
                palette
            );

            data[i] = closest.r;
            data[i + 1] = closest.g;
            data[i + 2] = closest.b;
        };
    };

    ctx.putImageData(imageData, 0, 0);
};