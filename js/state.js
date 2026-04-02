export const defaultState = {
    sourceImages: [],
    layers: [],
    hasGenerated: false,
    canvasWidth: 1000,
    canvasHeight: 700,
    backgroundColor: '#000000',

    compositionSettings: {
        useCompositionMode: true,
        useOverlapPlacement: true,
        useSmartRemix: true
    },
    mutationSettings: {
        posterize: false,
        sliceShift: true,
        shapeErase: true,
        displacement: true,
        destroyRebuild: true,
        edgeBite: false,
        edgeErosion: true,
        saturationBoost: true,
        hueReassign: true,
        colorInjection: true,
        valuePreservingSaturation: true,
        colorRangeExpansion: true,
        brightnessMasking: true
    },
    postProductionSettings: {
        valueCompression: true,
        saturationBoost: true,
        depthCompression: true,
        paletteLimiting: true
    }
};

export function resetStateToDefaults() {
    state.canvasWidth = defaultState.canvasWidth;
    state.canvasHeight = defaultState.canvasHeight;
    state.backgroundColor = defaultState.backgroundColor;

    state.compositionSettings = structuredClone(defaultState.compositionSettings);
    state.mutationSettings = structuredClone(defaultState.mutationSettings);
    state.postProductionSettings = structuredClone(defaultState.postProductionSettings);
};

export const state = structuredClone(defaultState);