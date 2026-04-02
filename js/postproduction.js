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

    if (state.postProductionSettings.valueCompression && Math.random() < 0.4) {
        const compressionAmount = random(0.45, 0.75);

        compressValuesPost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            compressionAmount,
            state.mutationSettings.brightnessMasking
        );
    }

    if (state.postProductionSettings.saturationBoost && Math.random() < 0.3) {
        const amount = random(1.8, 2.8);

        boostSaturationPost(
            ctx,
            outputCanvas.width,
            outputCanvas.height,
            amount,
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
    amount = 2,
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