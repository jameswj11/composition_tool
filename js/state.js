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
        posterizeEnabled: false,
        sliceShift: true,
        polygonErase: true
    }
};