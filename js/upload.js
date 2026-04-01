import { state } from './state.js';
import { generateBtn } from './dom.js';

// handles file upload
export async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    const loadedImages = await Promise.all(files.map(loadFileAsImage));
    state.sourceImages = loadedImages.filter(Boolean);

    generateBtn.disabled = state.sourceImages.length === 0;

    renderStatus();
};

// converts uploaded file into image
export function loadFileAsImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            resolve({
                file,
                url,
                image: img,
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    })
};

// displays how many images uploaded
export function renderStatus() {
    const status = document.getElementById('status')
    status.textContent = `${state.sourceImages.length} images loaded.`
};