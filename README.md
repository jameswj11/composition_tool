# Image Composition Tool

A browser-based image composition and mutation tool for generating unstable, layered image references. Built as part of an ongoing painting practice focused on disrupting image authority and producing compositions that feel provisional, unresolved, and alive.

---

## Overview

This tool takes a set of uploaded images and generates layered compositions through a pipeline of:

1. **Image mutation (per-layer)**
2. **Spatial composition (layout + overlap)**
3. **Postproduction effects (global adjustments)**

The result is a flattened canvas that can be used as reference material for painting.

The system is designed to introduce controlled instability—balancing structure with randomness—rather than producing clean or resolved outputs.

---

## Current Features

### Image Input

* Upload multiple images
* Images are stored in memory and used as a source pool
* Ability to **append uploads across sessions**
* **Clear Images** button to reset source pool

---

### Composition System

* Randomized layer selection and placement
* Overlapping and distributed layout modes
* Rotation, scaling, and opacity variation
* Smart remixing that preserves locked layers
* Layer reuse during remix cycles

---

### Mutation System (Per Layer)

Each image is mutated before placement using togglable effects:

* Slice shifting
* Shape erasure
* Edge erosion / silhouette breaking
* Displacement (self + cross-layer)
* Destroy / reconstruct
* Posterization
* Hue reassignment (region-based)
* Color injection
* Value-preserving saturation push
* Saturation boost (masked)
* Color range expansion
* Brightness-based masking system

Mutations are:

* Toggleable via UI
* Probabilistic (not always applied)
* Region-based rather than global

---

### Postproduction System (Global)

Applied after composition is flattened:

* Value compression
* Depth compression
* Saturation boost
* Palette limiting

These are:

* Toggleable via UI
* **Probabilistic (gated)** to avoid over-processing
* Region + brightness-aware

---

### Rendering Pipeline

```
generate → state.layers
→ renderCompositionToCanvas()
→ applyPostProduction()
→ display final canvas
```

* No DOM layer rendering (canvas-only output)
* Centralized render pipeline (`app.js`)
* Background color controlled via state and UI
* Canvas and stage dimensions dynamically linked

---

### UI System

* Control panel for:

  * Canvas dimensions
  * Background color
  * Composition toggles
  * Mutation toggles
  * Postproduction toggles
* Centralized `CONTROL_MAP` system for UI binding
* Default state reset button
* Generate / Remix controls fixed to viewport
* Upload + Clear controls fixed and accessible

---

## Architecture

### State Management

* Single shared `state` object
* Structured into:

  * `compositionSettings`
  * `mutationSettings`
  * `postProductionSettings`
* `defaultState` used for reset functionality

---

### File Structure (Core)

* `app.js` — orchestration (generate, remix, render)
* `composition.js` — layer generation and remix logic
* `mutation.js` — per-layer image transformations
* `postproduction.js` — global image effects
* `render.js` — canvas rendering
* `ui.js` — UI binding and control system
* `upload.js` — file handling
* `state.js` — shared state + defaults
* `dom.js` — DOM references
* `utils.js` — helper functions

---

## Key Design Principles

* **State-driven architecture**
  All behavior flows from a single shared state object.

* **Separation of concerns**
  Composition, mutation, rendering, and UI are isolated.

* **Probabilistic control instead of determinism**
  Toggles allow effects to participate rather than guarantee execution.

* **Image instability over resolution**
  The system avoids clean outputs in favor of ambiguous, awkward compositions.

---

## Known Behaviors / Intentional Design Choices

* Effects may not always trigger even when enabled (by design)
* Postproduction is intentionally inconsistent to avoid uniformity
* Composition may produce awkward or imbalanced layouts
* Mutation may significantly degrade source images

---
## Running Locally

Because this project uses ES modules (`type="module"`), it must be served over a local server. Opening `index.html` directly will not work.

### Option 1: Python (recommended)

```bash
python3 -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

### Option 2: Node

```bash
npx serve
```

or

```bash
npx http-server
```

---

### Option 3: VS Code

Use the **Live Server** extension and click “Go Live”.

---

## Notes

* Upload or clear one or more images using the top-left controls
* Choose image mutation and canvas settings
* Restore to Default resets all settings
* Generate creates a new composition
* Remix reworks the current composition

---

## Why this matters

Without a server:

* ES module imports (`import ... from './file.js'`) will fail
* The browser blocks local file access
* The app will not run

---

## TODO / Next Steps

### UI / Controls

* Add sliders for effect intensities (currently hardcoded)
* Group controls visually (collapse sections)
* Add thumbnails for uploaded images
* Add preset saving / loading

---

### Composition Improvements

* Better spatial hierarchy control
* Constraint-based composition modes
* Layer grouping / clustering behavior

---

### Mutation System

* Parameterize all mutation strengths
* Add masking visualization/debug mode
* Introduce edge-aware or semantic masking

---

### Postproduction

* User-defined palette selection
* Palette preview UI
* Adjustable probability per effect

---

### Performance

* Optimize large image handling
* Reduce repeated canvas allocations
* Debounce UI-driven rerenders

---

## Notes

This tool is not intended to produce finished images.
It is designed to generate **material for painting**—images that resist clarity, contain internal tension, and require interpretation.

The goal is not control, but negotiation.

---
