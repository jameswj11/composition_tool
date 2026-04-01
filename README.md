# Composition Tool

A browser-based image composition tool built with vanilla JavaScript.

The tool generates layered compositions from uploaded images using controlled randomness, mutation, and spatial logic. It is designed primarily as a reference generator for painting — favoring ambiguity, hierarchy, cropping, and partial legibility over clean or finished imagery.

---

## Features

* Upload multiple source images
* Canvas-based image mutation:

  * Polygon erasure (`destination-out`)
  * Horizontal and vertical slice shifting
* Layered composition system:

  * Randomized scale, position, rotation, opacity
  * Composition modes (clustered, spread, edge-weighted, etc.)
  * Overlap-aware placement
* Remix system:

  * Repositions layers without remutating
  * Preserves composition identity (bounded perturbation)
* Layer locking:

  * Lock layers to preserve strong elements
  * Generate and remix respect locked layers
  * Temporary visual lock indicator (badge)

---

## Project Structure

```
/js
  app.js          // entry point + event wiring
  state.js         // global state
  dom.js           // DOM element references
  utils.js         // helper functions (random, clamp, etc.)
  upload.js        // file handling + image loading
  mutation.js      // canvas image mutation logic
  composition.js   // generation + remix logic
  render.js        // DOM rendering + UI indicators
```

---

## How It Works

### 1. Mutation

Each source image is transformed using canvas operations:

* Irregular polygon erasures
* Slice-based displacement

This produces unstable, fragmented image material.

### 2. Composition

Mutated images are layered using:

* Role-based hierarchy (dominant / support / accent)
* Composition modes (spatial bias)
* Overlap-aware placement

### 3. Remix

Existing layers are perturbed:

* Position, rotation, and opacity are adjusted
* Locked layers remain fixed

---

## Development

Run with a local server (required for ES modules):

```bash
python3 -m http.server
```

Then open:

```
http://localhost:8000
```

---

## Philosophy

This is not a design tool or collage app.

The goal is to produce images that feel:

* unresolved
* spatially tense
* partially legible
* structurally interesting

The system should generate compositions that are **usable as painting references**, not finished outputs.

---

## TODO

### Core Interaction

* [ ] Add layer selection system (single click to select)
* [ ] Add lock/unlock via UI (button or keyboard shortcut)
* [ ] Fix inability to lock overlapping layers via direct click
* [ ] Visual indicator for selected layer (non-intrusive)
* [ ] Allow multi-layer locking without UI ambiguity

---

### Composition Controls (UI)

Add minimal controls to influence generation without overcomplicating the tool:

* [ ] Density (layer count)

* [ ] Overlap intensity

* [ ] Scale variance (hierarchy strength)

* [ ] Edge pressure (cropping bias)

* [ ] Rotation intensity

* [ ] Opacity range / transparency bias

* [ ] Toggle composition systems:

  * [ ] Composition modes on/off
  * [ ] Overlap placement on/off
  * [ ] Smart remix on/off

* [ ] Consider preset buttons:

  * [ ] “Sparse”
  * [ ] “Dense”
  * [ ] “Edge-heavy”
  * [ ] “Overlapping”

---

### Mutation Improvements

* [ ] Increase variety of polygon erasure shapes
* [ ] Add directional or biased slice shifting
* [ ] Control mutation intensity per layer role
* [ ] Add mutation presets or modes
* [ ] Explore partial image retention vs full disruption

---

### Workflow Improvements

* [ ] Add undo/redo (basic history stack)
* [ ] Add ability to regenerate only unlocked layers
* [ ] Export composition as image

---

### Rendering / Performance

* [ ] Avoid repeated `toDataURL()` calls (performance)
* [ ] Consider caching mutated canvases
* [ ] Improve rendering efficiency for many layers

---

### Bug Fixes

* [ ] Fix layer selection when layers overlap (click-through issue)
* [ ] Ensure consistent z-index behavior after multiple generates

---

## Notes

The tool is intentionally minimal.

New features should:

* improve compositional quality
* preserve unpredictability
* avoid UI clutter

When in doubt, prioritize:

> better images over more features

---
