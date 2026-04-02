import { state } from './state.js';
import { handleGenerate } from './composition.js';
import { remixLayers } from './composition.js';
import { renderCompositionToCanvas } from './render.js';
import { applyPostProduction } from './postproduction.js';
import { stage, fileInput, generateBtn, remixBtn } from './dom.js';
import { initControls } from './ui.js';
import { handleFiles } from './upload.js';

// re-render current layers with current settings
export function rerenderCurrentComposition() {
    let canvas = renderCompositionToCanvas();
    canvas = applyPostProduction(canvas);

    stage.style.width = `${state.canvasWidth}px`;
    stage.style.height = `${state.canvasHeight}px`;
    stage.innerHTML = '';

    stage.appendChild(canvas);
};

// generate brand new composition
export function generateAndRender() {
    handleGenerate();
    state.hasGenerated = true;
    rerenderCurrentComposition();
};

// remix existing composition (does NOT regenerate from scratch)
export function remixAndRender() {
    if (!state.hasGenerated) return;

    remixLayers(); // should mutate state.layers
    rerenderCurrentComposition();
};

initControls();

fileInput.addEventListener('change', handleFiles);

generateBtn.disabled = true;
remixBtn.disabled = true;