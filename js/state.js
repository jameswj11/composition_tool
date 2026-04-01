import { posterize } from "./mutation";

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
        polygonErase: true,
        displacement: true
    }
};