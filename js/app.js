import { state } from './state.js';
import { handleGenerate } from './composition.js';
import { remixLayers } from './composition.js';
import { renderCompositionToCanvas } from './render.js';
import { applyPostProduction } from './postproduction.js';
import { stage, fileInput, generateBtn, remixBtn } from './dom.js';
import { initControls } from './ui.js';
import { handleFiles } from './upload.js';
import { clampCanvasSize } from './utils.js';

// re-render current layers with current settings
export function rerenderCurrentComposition() {
    let canvas = renderCompositionToCanvas();
    canvas = applyPostProduction(canvas);

    stage.style.width = `${state.canvasWidth}px`;
    stage.style.height = `${state.canvasHeight}px`;
    stage.innerHTML = '';

    stage.appendChild(canvas);
}

// generate brand new composition
export function generateAndRender() {
    const widthInput = document.getElementById('canvasWidth');
    const heightInput = document.getElementById('canvasHeight');

    const rawWidth = Number(widthInput.value) || state.canvasWidth;
    const rawHeight = Number(heightInput.value) || state.canvasHeight;

    const width = clampCanvasSize(rawWidth);
    const height = clampCanvasSize(rawHeight);

    state.canvasWidth = width;
    state.canvasHeight = height;

    widthInput.value = width;
    heightInput.value = height;

    handleGenerate();
    state.hasGenerated = true;
    rerenderCurrentComposition();
}

// remix existing composition (does NOT regenerate from scratch)
export function remixAndRender() {
    if (!state.hasGenerated) return;

    remixLayers();
    rerenderCurrentComposition();
}

initControls();

fileInput.addEventListener('change', handleFiles);

generateBtn.disabled = true;
remixBtn.disabled = true;