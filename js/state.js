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
        shapeErase: true,
        displacement: false
    }
};