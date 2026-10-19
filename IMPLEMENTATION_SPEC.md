# GHOST KIOSK v1.7.1 — implementation notes

## Fixed interface change

- Remove only the translucent `GK` watermark from the image stage.
- Retain the v1.7 grey editorial layout, typography and controls.

## Hidden variation layer

`MUTATE` now generates two internal vectors that are not user-facing:

- `uHiddenA`: spatial force / event gain / material response / spatial scale
- `uHiddenB`: color gain / exposure gain / polarity / wildness

The values are distributed differently for each mode. A weighted energy tier creates quiet, active and wild mutations. This is independent from the visible Transform / Color / Depth controls.

## Mode separation

- DREAM uses hidden values to vary flowing deformation, bloom area, exposure and occasional liquid-lens / opal behaviour.
- OCCULT emphasizes shadow/quiet areas, inward pull, cold apertures and low-light material events.
- GHOST emphasizes time displacement, absence/cavity strength and occasional localized witness fields rather than generic full-frame afterimages.
- REASSEMBLE increases the range of continuous spatial field displacement, stitching and local material mismatch without returning to a grid/cell architecture.

## Safety / continuity

The existing structure texture still reduces large displacements in high-detail areas. Hidden variation changes scale and force but does not introduce rectangular selectors or visible pixel cells.
