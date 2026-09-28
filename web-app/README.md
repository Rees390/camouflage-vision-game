# Beyond Color: Camouflage Vision Challenge

An interactive university computer graphics project that explores how lighting, shadows, scene complexity, camouflage, and simulated color vision differences affect an animal-search task.

## Live Demo

[Open the GitHub Pages deployment](https://rees390.github.io/camouflage-vision-game/)

## Features

- Night forest, desert, and grassland environments.
- Blender-generated low-poly brown bear and wild doe models.
- Randomized rounds containing one or two hidden animals.
- Scene-specific hiding positions, foliage, rocks, trees, and grass cover.
- Normal, protanopia, deuteranopia, tritanopia, and grayscale display modes.
- Adjustable light brightness and direction.
- Timer, incorrect-click penalties, scoring, and results.
- Educational Learn section and scientific disclaimer.

## Technology

- React and TypeScript
- Vite
- Three.js and React Three Fiber
- Blender Python scripts using `bpy`
- Blender-authored GLB assets

## Run Locally

From the `web-app` directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite.

## Validate

```powershell
npm.cmd run lint
npm.cmd run build
```

## Project Assets

- Runtime models: `public/models/forest/`
- Reproducible Blender scripts: `../scripts/blender/`
- Blender source files and preview renders: `../assets/blender/`

## How to Play

1. Start a challenge.
2. Select an environment, vision mode, and lighting setup.
3. Search for the hidden animal or animals shown by the progress counter.
4. Click visible parts of each animal while avoiding background clicks.
5. Replay to generate new targets, hiding positions, and cover.

## Scientific Disclaimer

The color vision modes are approximate educational simulations. Individual perception varies, and this application must not be used for diagnosis or clinical assessment.
