export const state = {
    sourceImages: [],
    layers: [],
    hasGenerated: false,

    // FUTURE CONTROL: global settings
    compositionSettings: {
        useCompositionMode: true,
        useOverlapPlacement: true,
        useSmartRemix: true
    },
    mutationSettings: {
        posterize: false,
        sliceShift: false,
        shapeErase: false,
        displacement: false,
        destroyRebuild: false,
        edgeBite: false,
        edgeErosion: false,
        saturationBoost: false,
        hueReassign: false,
        colorInjection: false,
        valuePreservingSaturation: false,
        colorRangeExpansion: false,
        brightnessMasking: false
    },
    postProductionSettings: {
        valueCompression: true,
        saturationBoost: true,
        depthCompression: true,
        paletteLimiting: true
    }
};