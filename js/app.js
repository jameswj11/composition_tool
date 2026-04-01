import { handleFiles } from "./upload.js";
import { fileInput, generateBtn, remixBtn } from "./dom.js";
import { handleGenerate, remixLayers } from "./composition.js";

generateBtn.addEventListener('click', handleGenerate);
remixBtn.addEventListener('click', remixLayers)
fileInput.addEventListener('change', handleFiles);
