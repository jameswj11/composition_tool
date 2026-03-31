const state = {
    sourceImages: []
};

const generateBtn = document.getElementById('generateBtn');
const fileInput = document.getElementById('fileInput');
const stage = document.getElementById('stage');

generateBtn.addEventListener('click', handleGenerate);

// adds listener to file input to get images, handles upload
fileInput.addEventListener('change', handleFiles);

// handles file upload
async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    const loadedImages = await Promise.all(files.map(loadFileAsImage));
    state.sourceImages = loadedImages.filter(Boolean);

    generateBtn.disabled = state.sourceImages.length === 0;

    renderStatus();
};

// converts uploaded file into image
function loadFileAsImage(file) {
    return new Promise ((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = ()=>{
            resolve({
                file, 
                url,
                image: img,
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = ()=>{
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    })
};

// displays how many images uploaded
function renderStatus() {
    const status = document.getElementById('status');
    status.textContent = `${state.sourceImages.length} images loaded.`
};

function handleGenerate() {
    const source = state.sourceImages[0];
    if (!source) return;
    const canvas = mutateImage(source);
    stage.innerHTML = '';
    stage.appendChild(canvas);
};

// muates image. currently only draws image onto canvas
function mutateImage(source) {
    console.log('mutating');
    const image = source.image;
    const maxWidth = 2500;
    const maxHeight = 2500;
    const scale = Math.min(maxWidth/image.naturalWidth,
        maxHeight/image.naturalHeight, 1
    );
    const width = Math.floor(image.naturalWidth * scale);
    const height = Math.floor(image.naturalHeight * scale);
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');
    
    newCanvas.width = width;
    newCanvas.height = height;

    const displayWidth = 1200;

    newCanvas.style.width = displayWidth + 'px';
    newCanvas.style.height = 'auto';

    ctx.drawImage(image, 0, 0, width, height);
    
    return newCanvas;
};
