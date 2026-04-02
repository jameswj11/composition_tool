import { state, resetStateToDefaults } from './state.js';
import { rerenderCurrentComposition, generateAndRender, remixAndRender } from './app.js';
import { renderStatus } from './upload.js';

const clearBtn = document.getElementById('clearImagesBtn');

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        state.sourceImages = [];

        renderStatus();

        generateBtn.disabled = true;
        remixBtn.disabled = true;

        state.layers = [];
        state.hasGenerated = false;

        stage.innerHTML = '';
    });
}

const CONTROL_MAP = [
    {
        id: 'backgroundColor',
        type: 'color',
        get: () => state.backgroundColor,
        set: (value) => { state.backgroundColor = value; },
        rerender: true
    },

    {
        id: 'useCompositionMode',
        type: 'checkbox',
        get: () => state.compositionSettings.useCompositionMode,
        set: (value) => { state.compositionSettings.useCompositionMode = value; }
    },
    {
        id: 'useOverlapPlacement',
        type: 'checkbox',
        get: () => state.compositionSettings.useOverlapPlacement,
        set: (value) => { state.compositionSettings.useOverlapPlacement = value; }
    },
    {
        id: 'useSmartRemix',
        type: 'checkbox',
        get: () => state.compositionSettings.useSmartRemix,
        set: (value) => { state.compositionSettings.useSmartRemix = value; }
    },

    {
        id: 'posterize',
        type: 'checkbox',
        get: () => state.mutationSettings.posterize,
        set: (value) => { state.mutationSettings.posterize = value; }
    },
    {
        id: 'sliceShift',
        type: 'checkbox',
        get: () => state.mutationSettings.sliceShift,
        set: (value) => { state.mutationSettings.sliceShift = value; }
    },
    {
        id: 'shapeErase',
        type: 'checkbox',
        get: () => state.mutationSettings.shapeErase,
        set: (value) => { state.mutationSettings.shapeErase = value; }
    },
    {
        id: 'displacement',
        type: 'checkbox',
        get: () => state.mutationSettings.displacement,
        set: (value) => { state.mutationSettings.displacement = value; }
    },
    {
        id: 'destroyRebuild',
        type: 'checkbox',
        get: () => state.mutationSettings.destroyRebuild,
        set: (value) => { state.mutationSettings.destroyRebuild = value; }
    },
    {
        id: 'edgeBite',
        type: 'checkbox',
        get: () => state.mutationSettings.edgeBite,
        set: (value) => { state.mutationSettings.edgeBite = value; }
    },
    {
        id: 'edgeErosion',
        type: 'checkbox',
        get: () => state.mutationSettings.edgeErosion,
        set: (value) => { state.mutationSettings.edgeErosion = value; }
    },
    {
        id: 'mutationSaturationBoost',
        type: 'checkbox',
        get: () => state.mutationSettings.saturationBoost,
        set: (value) => { state.mutationSettings.saturationBoost = value; }
    },
    {
        id: 'hueReassign',
        type: 'checkbox',
        get: () => state.mutationSettings.hueReassign,
        set: (value) => { state.mutationSettings.hueReassign = value; }
    },
    {
        id: 'colorInjection',
        type: 'checkbox',
        get: () => state.mutationSettings.colorInjection,
        set: (value) => { state.mutationSettings.colorInjection = value; }
    },
    {
        id: 'valuePreservingSaturation',
        type: 'checkbox',
        get: () => state.mutationSettings.valuePreservingSaturation,
        set: (value) => { state.mutationSettings.valuePreservingSaturation = value; }
    },
    {
        id: 'colorRangeExpansion',
        type: 'checkbox',
        get: () => state.mutationSettings.colorRangeExpansion,
        set: (value) => { state.mutationSettings.colorRangeExpansion = value; }
    },
    {
        id: 'brightnessMasking',
        type: 'checkbox',
        get: () => state.mutationSettings.brightnessMasking,
        set: (value) => { state.mutationSettings.brightnessMasking = value; }
    },

    {
        id: 'valueCompressionPost',
        type: 'checkbox',
        get: () => state.postProductionSettings.valueCompression,
        set: (value) => { state.postProductionSettings.valueCompression = value; },
        rerender: true
    },
    {
        id: 'postSaturationBoostPost',
        type: 'checkbox',
        get: () => state.postProductionSettings.saturationBoost,
        set: (value) => { state.postProductionSettings.saturationBoost = value; },
        rerender: true
    },
    {
        id: 'depthCompressionPost',
        type: 'checkbox',
        get: () => state.postProductionSettings.depthCompression,
        set: (value) => { state.postProductionSettings.depthCompression = value; },
        rerender: true
    },
    {
        id: 'paletteLimitingPost',
        type: 'checkbox',
        get: () => state.postProductionSettings.paletteLimiting,
        set: (value) => { state.postProductionSettings.paletteLimiting = value; },
        rerender: true
    }
];

function getControlValue(el, type) {
    if (type === 'checkbox') return el.checked;
    if (type === 'number') return Number(el.value);
    return el.value;
}

function setControlValue(el, type, value) {
    if (type === 'checkbox') {
        el.checked = value;
        return;
    }

    el.value = value;
}

export function syncControlsFromState() {
    const canvasWidthEl = document.getElementById('canvasWidth');
    const canvasHeightEl = document.getElementById('canvasHeight');

    if (canvasWidthEl) {
        canvasWidthEl.value = state.canvasWidth;
    }

    if (canvasHeightEl) {
        canvasHeightEl.value = state.canvasHeight;
    }

    CONTROL_MAP.forEach((control) => {
        const el = document.getElementById(control.id);
        if (!el) {
            console.warn(`Missing control element: #${control.id}`);
            return;
        }

        setControlValue(el, control.type, control.get());
    });
}

export function initControls() {
    syncControlsFromState();

    CONTROL_MAP.forEach((control) => {
        const el = document.getElementById(control.id);
        if (!el) {
            console.warn(`Missing control element: #${control.id}`);
            return;
        }

        const eventName = control.type === 'checkbox' ? 'change' : 'input';

        el.addEventListener(eventName, (e) => {
            const value = getControlValue(e.target, control.type);
            control.set(value);

            if (control.rerender && state.hasGenerated) {
                rerenderCurrentComposition();
            }
        });
    });

    const generateBtn = document.getElementById('generateBtn');
    const defaultBtn = document.getElementById('defaultBtn');
    const remixBtn = document.getElementById('remixBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            generateAndRender();
            remixBtn.disabled = !state.hasGenerated;
        });
    }

    if (defaultBtn) {
        defaultBtn.addEventListener('click', () => {
            resetStateToDefaults();
            syncControlsFromState();

            if (state.hasGenerated) {
                rerenderCurrentComposition();
            }
        });
    }

    if (remixBtn) {
        remixBtn.addEventListener('click', () => {
            remixAndRender();
        });

        remixBtn.disabled = !state.hasGenerated;
    }
}