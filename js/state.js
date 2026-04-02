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
        colorRangeExpansion: true
    }
};