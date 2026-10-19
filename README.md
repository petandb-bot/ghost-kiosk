# GHOST KIOSK v1.7.1 — HIDDEN VARIATION

Four-engine photographic mutation tool for iPhone / desktop browsers.

## v1.7.1

The v1.7 grey editorial interface is retained. The large translucent `GK` letters inside the canvas area have been removed so photographs have a cleaner field.

The engine now has an additional internal variation layer that is deliberately **not exposed in the GUI**. Every `MUTATE` selects mode-specific hidden controls for spatial force, event density, material response, spatial scale, color drift, exposure behaviour, polarity and wildness. The three visible sliders remain understandable macro controls.

This makes repeated mutations diverge more strongly while preserving each mode's identity:

- **DREAM** — milk / pastel overexposure, optical liquid-lens accidents, opal flashes
- **OCCULT** — shadow-driven sinking, cold apertures, false lamps and quiet stains
- **GHOST** — displaced presence, cavities, delayed contours and occasional small witness fields
- **REASSEMBLE** — stronger continuous spatial stitching and surface mismatch without Cartesian cut-up

A weighted hidden energy system yields mostly active results, some quieter accidents, and a smaller proportion of intentionally wild results.

## Use

1. Host the folder over HTTPS.
2. `OPEN` a photograph.
3. Select DREAM / OCCULT / GHOST / REASSEMBLE.
4. Press `MUTATE` repeatedly.
5. Use EDIT for Transform / Color / Depth only when needed.
6. SAVE PNG.

On iPhone, open the hosted page in Safari and use **Share → Add to Home Screen**.

## Build validation

- `sketch.js` and `sw.js` JavaScript syntax checked.
- The common structure shader and all 12 mode shaders were compiled and linked successfully in Chromium WebGL using a software GPU test context.
- A direct four-mode render smoke test was also performed with the same shader pipeline.
- Final iPhone Safari behaviour should still be checked on the target device because its GPU/driver stack differs from the build environment.
