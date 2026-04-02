export const state = {
    sourceImages: [],
    layers: [],
    hasGenerated: false,
    canvasWidth: 1000,
    canvasHeight: 700,

    // FUTURE CONTROL: global settings
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