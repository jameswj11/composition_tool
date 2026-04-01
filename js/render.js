import { state } from "./state.js";
import { stage } from "./dom.js";

// main render layer function
export function renderLayers() {
    console.log('render layers')
    stage.innerHTML = '';

    state.layers.forEach((layer, index) => {
        const wrapper = document.createElement('div');

        wrapper.style.position = 'absolute';
        wrapper.style.left = `${layer.x}px`;
        wrapper.style.top = `${layer.y}px`;
        wrapper.style.width = `${layer.width}px`;
        wrapper.style.height = `${layer.height}px`;
        wrapper.style.transform = `rotate(${layer.rotation}deg)`;
        wrapper.style.opacity = layer.opacity;
        wrapper.style.zIndex = layer.zIndex;
        wrapper.style.cursor = 'pointer';

        const img = document.createElement('img');

        img.src = layer.canvas.toDataURL();
        img.style.position = 'absolute';
        img.style.left = `${layer.x}px`;
        img.style.top = `${layer.y}px`;
        img.style.width = `${layer.width}px`;
        img.style.height = `${layer.height}px`;
        img.style.opacity = layer.opacity;
        img.style.transform = `rotate(${layer.rotation}deg)`;
        img.style.zIndex = layer.zIndex;

        wrapper.appendChild(img);
        wrapper.addEventListener('dblclick', () => { // FUTURE CONTROL: layer lock UI
            toggleLayerLock(index);
        });

        if (layer.showLockIndicator) {
            const badge = document.createElement('div');
            badge.textContent = 'L';

            badge.style.position = 'absolute';
            badge.style.top = '6px';
            badge.style.right = '6px';
            badge.style.width = '16px';
            badge.style.height = '16px';
            badge.style.fontSize = '10px';
            badge.style.lineHeight = '16px';
            badge.style.textAlign = 'center';
            badge.style.background = 'red';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.pointerEvents = 'none';
            badge.style.fontFamily = 'sans-serif';

            wrapper.appendChild(badge);
        };

        stage.appendChild(wrapper)
    });
};

// layer lock helper
export function toggleLayerLock(index) {
    const layer = state.layers[index];
    layer.locked = !layer.locked;
    layer.showLockIndicator = true;

    renderLayers();

    setTimeout(() => {
        layer.showLockIndicator = false;
        renderLayers()
    }, 1000)
};

// handles showing lock badge on layer lock
export function flashLockedIndicators(duration = 1000) {
    state.layers.forEach(layer => {
        if (layer.locked) {
            layer.showLockIndicator = true
        };
    });

    renderLayers();

    setTimeout(() => {
        state.layers.forEach(layer => {
            layer.showLockIndicator = false
        })
        renderLayers();
    }, duration)
};