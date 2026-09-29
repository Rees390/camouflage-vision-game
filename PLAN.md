# Beyond Color: Camouflage Vision Challenge

## 1. Project Goal

Build a small university Computer Graphics web application that demonstrates how lighting, contrast, texture, camouflage, and simulated color vision deficiencies affect the ability to find a hidden animal.

The central computer graphics goal is to make these effects directly observable: changing the lighting or color display must visibly alter the scene and the visibility of the camouflaged animal. Scene construction, lighting, shadows, and color are the core graphics elements of the project. Clicking the animal provides an interactive way to test how those visual changes affect the user's ability to find it.

The project must be ready for demonstration by the end of september. The priority is a complete, stable educational experience rather than detailed models or a large amount of content. The simulation is educational and approximate, not medical or diagnostic.

## 2. Minimum Viable Version

The required version includes:

- A simple home screen with a start button and access to the Learn section.
- One playable low-poly forest scene built directly with React Three Fiber primitives.
- One hidden animal represented by a simple recognizable model or grouped geometry.
- Click detection, a timer, incorrect-click tracking, and a score.
- A compact Vision Lab integrated into the challenge screen.
- Normal, protanopia, deuteranopia, tritanopia, and grayscale modes using approximate color transforms.
- Simple lighting controls for brightness and direction.
- A results screen with time, score, and incorrect clicks.
- A short Learn section and scientific disclaimer.
- A successful production build.

Desert and grassland should be lightweight variations of the same scene system only if the core forest experience is complete. Blender-generated GLB assets are stretch work and are not required for the first demonstration.

## 3. Proposed Folder Structure

```text
camouflage-vision-game/
  web-app/
    public/
      models/                 # Optional GLB files if time permits
    src/
      components/
      game/
      scenes/
      shaders/
      styles/
      App.tsx
      main.tsx
    package.json
    vite.config.ts
  scripts/
    blender/                  # Stretch goal only
  PLAN.md
```

Create only the folders needed during implementation. Keep most small components together until splitting them makes the code clearer.

## 4. React Components

Keep the component set small:

- `App`: controls the current screen and shared game results.
- `HomeScreen`: project title, start action, and Learn access.
- `ChallengeScreen`: contains the 3D canvas, controls, timer, and score.
- `SceneCanvas`: renders the environment and hidden animal.
- `VisionModeSelector`: switches among the five required vision modes.
- `LightingControls`: adjusts light brightness and direction.
- `ResultsScreen`: displays score, time, misses, and replay action.
- `LearnSection`: explains camouflage concepts and the simulation limitation.

Use simple React state instead of adding a router or state-management library.

## 5. Blender Scripts and Exported Models

Blender work is a stretch goal for this deadline. The playable version should use low-poly geometry created directly in React Three Fiber so that gameplay does not depend on an asset pipeline.

If the complete app is stable early, create only one Blender Python script using `bpy` to generate and export a simple animal or forest prop as GLB. Do not attempt three complete Blender scenes before the deadline. The app must continue to work with primitive geometry if GLB loading fails.

## 6. Color Vision Shader Approach

Use one lightweight full-scene color effect with matrix-based RGB transforms for:

- Normal vision.
- Protanopia simulation.
- Deuteranopia simulation.
- Tritanopia simulation.
- Grayscale.

Prefer a small custom post-processing shader if it can be integrated quickly. The fallback is a CSS or canvas-level visual filter for the demonstration. Label every deficiency mode as an approximate educational simulation and include a visible disclaimer in the Learn section.

## 7. Lighting System

Use a simple lighting setup:

- One ambient light.
- One directional light.
- One brightness control.
- One direction control, or a few tested direction presets if a continuous control takes too long.
- Shadows only if performance remains stable.

Lighting changes must visibly affect the contrast between the animal and its surroundings.

## 8. Animal Click-Detection Approach

Use React Three Fiber pointer events on the hidden animal group. Stop event propagation on a correct click, mark the animal as found, stop the timer, and open the results screen.

Use a larger invisible hitbox if the visible animal is difficult to click. Treat clicks on the scene background as misses. Only one target is required per round.

## 9. Scoring and Results

Use a transparent scoring rule that is easy to test:

- Start at 1,000 points.
- Subtract points for elapsed time.
- Subtract a fixed penalty for each incorrect click.
- Never allow a negative final score.

The results screen should show final score, completion time, incorrect clicks, selected vision mode, and a short educational observation. Store results only in React state; persistence and accounts are outside the deadline scope.

## 10. Development Phases in the Correct Order

### Today

1. Commit the untouched Vite application as a baseline.
2. Install only Three.js, React Three Fiber, and any required TypeScript typings.
3. Replace the Vite demo with the basic Home, Challenge, Results, and Learn screen flow.
4. Build one forest scene from low-poly primitives.
5. Add one hidden animal, click detection, misses, timer, and scoring.
6. Add the five vision modes and the scientific disclaimer.
7. Add simple lighting controls.

### Tomorrow

8. Complete the results screen and replay flow.
9. Improve camouflage, camera framing, labels, and responsive layout.
10. Add simplified desert and grassland variations only if the forest loop is stable.
11. Run interaction checks and fix blocking bugs.
12. Run the production build and prepare the demonstration.

### Stretch Goals After the Core Build

13. Create one Blender script and export one GLB model.
14. Replace a primitive asset with the GLB while retaining the primitive fallback.
15. Add optional visual polish without changing the core interaction.

## 11. Testing Checklist

### Demo Acceptance Checklist

- The scene clearly demonstrates constructed 3D geometry, lighting, shadows, and color.
- Changing the lighting visibly changes scene contrast and animal visibility.
- Changing the vision mode visibly changes scene color and animal visibility.
- The camouflaged animal remains clickable so the user can test how easily it can be found under different visual settings.
- The complete interaction can be demonstrated reliably from start to results.

- Application starts without console errors.
- Production build completes successfully.
- Home, Challenge, Results, and Learn screens are reachable.
- The 3D scene renders and remains correctly framed on a laptop screen.
- The animal can be found with one click.
- Background clicks increase the miss count.
- Timer starts, updates, and stops correctly.
- Score is calculated correctly and cannot become negative.
- Replay resets the timer, score, misses, and animal state.
- All five vision modes visibly change the scene as expected.
- Lighting controls visibly affect scene contrast.
- The scientific disclaimer is present.
- Keyboard focus and buttons remain usable.
- Desert and grassland are tested only if they are included.
- No GLB asset is required for the app to run.

## 12. Main Technical Risks and Simpler Fallback Options

- Risk: A scientifically detailed post-processing pipeline takes too long.
  Fallback: Use approximate matrix transforms or a clearly labeled canvas-level filter.

- Risk: Detailed animal modeling consumes the schedule.
  Fallback: Build a recognizable low-poly animal from grouped primitives.

- Risk: Blender scripting and GLB export introduce last-minute failures.
  Fallback: Keep Blender and GLB work as stretch goals and demonstrate the primitive scene.

- Risk: Three unique scenes take too long.
  Fallback: Deliver the forest scene first, then derive desert and grassland by changing colors, vegetation, lighting, and target placement.

- Risk: Flexible lighting controls create bugs or poor visuals.
  Fallback: Use three tested lighting presets.

- Risk: The animal is too difficult to click.
  Fallback: Use an invisible enlarged hitbox.

- Risk: UI work reduces time available for graphics and interaction.
  Fallback: Use one compact layout, simple screen-state navigation, and no router.

- Risk: Optional polish breaks the working demo.
  Fallback: Stop adding features once the complete loop passes the testing checklist.
