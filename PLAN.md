# Beyond Color: Camouflage Vision Challenge

## 1. Project Goal

Build a university Computer Graphics web application that lets users explore how camouflage works in 3D scenes. The game will show hidden animals under different environments, lighting conditions, textures, contrast levels, and simulated color vision modes.

The goal is educational rather than medical: users should learn that visibility depends on more than color alone, including shape, brightness, texture, lighting direction, shadows, and background complexity.

## 2. Minimum Viable Version

The first manageable version should include:

- One playable challenge scene, preferably forest.
- One hidden animal model placed in the scene.
- A timer, score, and click-to-find interaction.
- Basic lighting controls for brightness and light direction.
- Vision modes: normal vision, grayscale, and one color vision deficiency simulation.
- A simple results screen showing time, score, and selected vision mode.
- A short Learn section with a scientific disclaimer.

After the MVP works, add desert and grassland scenes, more animals, and the remaining vision modes.

## 3. Proposed Folder Structure

```text
camouflage-vision-game/
  public/
    models/
      forest/
      desert/
      grassland/
  scripts/
    blender/
      create_forest_scene.py
      create_desert_scene.py
      create_grassland_scene.py
      export_glb.py
  src/
    components/
    data/
    game/
    shaders/
    scenes/
    styles/
    App.tsx
    main.tsx
  PLAN.md
  package.json
  vite.config.ts
```

This is the planned structure only. The folders and application files should be created later when development starts.

## 4. React Components

Planned components:

- `App`: top-level routing or screen state.
- `HomeScreen`: title, start button, and navigation to Learn or Vision Lab.
- `ChallengeScreen`: main game screen with the 3D canvas, timer, score, and controls.
- `VisionLab`: free exploration mode for switching vision filters and lighting without scoring.
- `ResultsScreen`: final score, time, accuracy, and replay options.
- `LearnSection`: short explanations of camouflage, lighting, contrast, and color vision simulation limits.
- `SceneCanvas`: React Three Fiber canvas wrapper.
- `LightingControls`: brightness, direction, and environment controls.
- `VisionModeSelector`: normal, protanopia, deuteranopia, tritanopia, and grayscale.
- `ScorePanel`: timer, clicks, found animals, and score.
- `SceneSelector`: forest, desert, and grassland selection.

## 5. Blender Scripts and Exported Models

Blender Python scripts using `bpy` should generate simple low-poly educational scenes and export them as GLB files.

Initial Blender script goals:

- Create a forest scene with ground, trees, rocks, leaves, and one camouflaged animal.
- Create a desert scene with sand, stones, sparse plants, and one camouflaged animal.
- Create a grassland scene with grass clumps, terrain, and one camouflaged animal.
- Use simple geometry and procedural materials first.
- Export GLB models for use in Three.js.

The first version should keep models simple: low-poly animal silhouettes, simple materials, and clear object names for click detection.

## 6. Color Vision Shader Approach

Use a post-processing shader or material color transform to approximate color vision modes.

Planned modes:

- Normal vision: no color transform.
- Protanopia simulation: approximate reduced red perception.
- Deuteranopia simulation: approximate reduced green perception.
- Tritanopia simulation: approximate reduced blue-yellow perception.
- Grayscale: luminance-based conversion.

The shader should use matrix-based RGB transforms for performance and simplicity. The UI must include a disclaimer that these are approximate educational simulations, not clinical or diagnostic tools.

## 7. Lighting System

The lighting system should start simple and interactive:

- Ambient light intensity slider.
- Directional light intensity slider.
- Directional light position or angle control.
- Optional shadows after the basic scene is stable.
- Optional time-of-day presets later.

Lighting should affect gameplay because changes in brightness, contrast, and shadows can make camouflaged animals easier or harder to find.

## 8. Animal Click-Detection Approach

Use React Three Fiber pointer events or Three.js raycasting to detect clicks on animal meshes.

Recommended approach:

- Give animal meshes clear names such as `animal_hidden_fox` or `target_lizard`.
- Store target metadata in scene data.
- On click, check whether the clicked mesh or one of its parents is a target animal.
- If correct, mark the animal as found, update score, and give visual feedback.
- If incorrect, count the click as a miss or apply a small score penalty.

For the MVP, use one target animal per scene. Add multiple animals only after the full loop works.

## 9. Scoring and Results

Suggested scoring model:

- Start from a base score per animal.
- Award faster discoveries with a time bonus.
- Subtract a small penalty for incorrect clicks.
- Track selected scene, vision mode, lighting settings, time, clicks, and found targets.

The Results screen should show:

- Final score.
- Completion time.
- Number of correct finds.
- Number of incorrect clicks.
- Scene and vision mode used.
- A short educational note about why the animal may have been difficult to detect.

## 10. Development Phases in the Correct Order

1. Create the React, TypeScript, and Vite app.
2. Add Three.js and React Three Fiber.
3. Build the basic screen flow: Home, Challenge, Results, Learn.
4. Create a placeholder 3D scene directly in React Three Fiber.
5. Implement timer, score state, and click detection on a simple placeholder animal.
6. Add basic lighting controls.
7. Add grayscale and one color vision shader mode.
8. Create the first Blender Python script for the forest scene.
9. Export the first GLB model and load it in the app.
10. Replace placeholder geometry with the forest GLB.
11. Add the scientific disclaimer and Learn content.
12. Add desert and grassland Blender scripts and GLB exports.
13. Add protanopia, deuteranopia, and tritanopia modes.
14. Polish UI, scoring, results, and scene selection.
15. Test on desktop and smaller screens.

## 11. Testing Checklist

- App starts locally without console errors.
- Home screen opens the challenge mode.
- 3D scene renders correctly.
- Hidden animal can be clicked and detected.
- Incorrect clicks are counted.
- Timer starts and stops correctly.
- Score changes as expected.
- Results screen receives final game data.
- Vision modes visibly change scene colors.
- Grayscale mode preserves brightness contrast.
- Lighting controls affect the scene.
- Forest, desert, and grassland scenes load.
- GLB model paths work after a production build.
- Learn section includes the scientific disclaimer.
- UI remains usable on common laptop screen sizes.

## 12. Main Technical Risks and Simpler Fallback Options

- Risk: Full color vision simulation is scientifically complex.
  Fallback: Use clearly labeled approximate matrix transforms and explain the limitation.

- Risk: Post-processing shaders take too long to integrate.
  Fallback: Apply color transforms through simpler material or canvas-level effects for the first version.

- Risk: Blender-generated scenes become too detailed or slow.
  Fallback: Use low-poly primitives, fewer objects, and baked/simple materials.

- Risk: GLB loading introduces path or deployment issues.
  Fallback: Keep one placeholder React Three Fiber scene available until model loading is stable.

- Risk: Click detection fails on nested GLB meshes.
  Fallback: Add invisible simplified hitbox meshes around target animals.

- Risk: Three scenes are too much for the first deadline.
  Fallback: Complete forest first, then add desert and grassland as simpler variations.

- Risk: Lighting controls make the game too easy or too hard.
  Fallback: Use a few tested lighting presets instead of fully flexible controls.

- Risk: UI scope grows beyond the graphics goal.
  Fallback: Keep navigation simple and focus effort on the 3D scene, shader modes, and interaction loop.
