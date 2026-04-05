import { state } from './state.js';
import { handleGenerate } from './composition.js';
import { remixLayers } from './composition.js';
import { renderCompositionToCanvas } from './render.js';
import { applyPostProduction } from './postproduction.js';
import { stage, fileInput, generateBtn, remixBtn } from './dom.js';
import { bindUI, initControls, updateUIState } from './ui.js';
import { handleFiles } from './upload.js';
import { clampCanvasSize } from './utils.js';

export function rerenderCurrentComposition() {
    let base = renderCompositionToCanvas(1, false);
    state.finalCanvas = applyPostProduction(base);

    redrawFromCache();
};

export function redrawFromCache() {
    if (!state.finalCanvas) return;

    const displayCanvas = document.createElement('canvas');
    const ctx = displayCanvas.getContext('2d');

    displayCanvas.width = state.canvasWidth;
    displayCanvas.height = state.canvasHeight;

    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    ctx.drawImage(state.finalCanvas, 0, 0);

    stage.style.width = `${state.canvasWidth}px`;
    stage.style.height = `${state.canvasHeight}px`;
    stage.innerHTML = '';
    stage.appendChild(displayCanvas);
};

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
bindUI();
updateUIState();

fileInput.addEventListener('change', handleFiles);

generateBtn.disabled = true;
remixBtn.disabled = true;