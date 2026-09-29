import { Canvas, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './App.css'

const ASSET_BASE = import.meta.env.BASE_URL

type Screen = 'home' | 'challenge' | 'results' | 'learn'
type VisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'grayscale'
type AnimalId = 'bear' | 'deer' | 'fox'
type SceneId = 'forest' | 'desert' | 'grassland'
type Position3 = [number, number, number]

type AnimalPlacement = {
  position: Position3
  rotationY: number
  scale: number
  coverVariant?: number
}

type RoundLayout = Record<AnimalId, AnimalPlacement>

type RoundState = {
  layout: RoundLayout
  targetAnimals: AnimalId[]
}

type GameResult = {
  elapsed: number
  misses: number
  score: number
  visionMode: VisionMode
  brightness: number
  lightAngle: number
  animalsFound: number
  targetAnimals: AnimalId[]
  sceneId: SceneId
}

const ROUND_LAYOUTS: Record<SceneId, RoundLayout[]> = {
  forest: [
    {
      bear: { position: [3.75, 0, -0.25], rotationY: -0.45, scale: 0.44 },
      deer: { position: [-3.45, 0, -1.7], rotationY: -0.12, scale: 0.43 },
      fox: { position: [2.9, 0, -2.8], rotationY: -0.4, scale: 0.63 },
    },
    {
      bear: { position: [-2.35, 0, -4.15], rotationY: 0.32, scale: 0.45 },
      deer: { position: [2.85, 0, -4.2], rotationY: -0.62, scale: 0.44 },
      fox: { position: [-2.75, 0, -3.65], rotationY: 0.35, scale: 0.64 },
    },
    {
      bear: { position: [2.75, 0, -3.7], rotationY: -0.55, scale: 0.43 },
      deer: { position: [-3.8, 0, -2.65], rotationY: 0.18, scale: 0.42 },
      fox: { position: [3.5, 0, -1.8], rotationY: -0.5, scale: 0.62 },
    },
    {
      bear: { position: [-4, 0, -0.45], rotationY: 0.5, scale: 0.43 },
      deer: { position: [0.95, 0, -2.75], rotationY: -0.24, scale: 0.42 },
      fox: { position: [-3.2, 0, -2.2], rotationY: 0.3, scale: 0.63 },
    },
    {
      bear: { position: [0.45, 0, -4.95], rotationY: -0.18, scale: 0.44 },
      deer: { position: [3.95, 0, -1.25], rotationY: -0.58, scale: 0.41 },
      fox: { position: [2.6, 0, -4.4], rotationY: -0.34, scale: 0.62 },
    },
    {
      bear: { position: [-1, 0, -2.25], rotationY: 0.2, scale: 0.42 },
      deer: { position: [4.05, 0, -4.75], rotationY: -0.46, scale: 0.42 },
      fox: { position: [-0.8, 0, -3.7], rotationY: 0.16, scale: 0.64 },
    },
    {
      bear: { position: [1.8, 0, -1.45], rotationY: -0.4, scale: 0.44 },
      deer: { position: [-4, 0, -4.7], rotationY: 0.34, scale: 0.41 },
      fox: { position: [3.8, 0, -3], rotationY: -0.5, scale: 0.63 },
    },
    {
      bear: { position: [-3.85, 0, -3.85], rotationY: 0.38, scale: 0.43 },
      deer: { position: [0.25, 0, -5.35], rotationY: -0.16, scale: 0.42 },
      fox: { position: [-2, 0, -4.8], rotationY: 0.28, scale: 0.62 },
    },
  ],
  desert: [
    {
      bear: { position: [3.85, 0, -2.25], rotationY: -0.5, scale: 0.43 },
      deer: { position: [-4.05, 0, -3.25], rotationY: 0.22, scale: 0.42 },
      fox: { position: [-3.7, 0, -2.7], rotationY: 0.24, scale: 0.64 },
    },
    {
      bear: { position: [-3.65, 0, -2.1], rotationY: 0.38, scale: 0.44 },
      deer: { position: [3.45, 0, -3.15], rotationY: -0.52, scale: 0.42 },
      fox: { position: [3.25, 0, -3.3], rotationY: -0.48, scale: 0.63 },
    },
    {
      bear: { position: [2.55, 0, -4.6], rotationY: -0.35, scale: 0.42 },
      deer: { position: [-2.85, 0, -4.35], rotationY: 0.28, scale: 0.41 },
      fox: { position: [-2.45, 0, -4.55], rotationY: 0.3, scale: 0.62 },
    },
    {
      bear: { position: [-3.8, 0, -1], rotationY: 0.36, scale: 0.43 },
      deer: { position: [3.8, 0, -4], rotationY: -0.4, scale: 0.42 },
      fox: { position: [0.4, 0, -2.7], rotationY: -0.18, scale: 0.64 },
    },
    {
      bear: { position: [3.8, 0, -1.4], rotationY: -0.48, scale: 0.43 },
      deer: { position: [-3.7, 0, -4.8], rotationY: 0.3, scale: 0.41 },
      fox: { position: [4, 0, -1.2], rotationY: -0.56, scale: 0.63 },
    },
    {
      bear: { position: [-1.2, 0, -3.5], rotationY: 0.16, scale: 0.42 },
      deer: { position: [2.1, 0, -2.2], rotationY: -0.3, scale: 0.42 },
      fox: { position: [-4, 0, -4.9], rotationY: 0.4, scale: 0.62 },
    },
    {
      bear: { position: [1.7, 0, -5], rotationY: -0.24, scale: 0.42 },
      deer: { position: [-1.8, 0, -1.5], rotationY: 0.2, scale: 0.42 },
      fox: { position: [1.5, 0, -5], rotationY: -0.26, scale: 0.63 },
    },
    {
      bear: { position: [-3.9, 0, -3.1], rotationY: 0.42, scale: 0.43 },
      deer: { position: [3.9, 0, -2], rotationY: -0.44, scale: 0.41 },
      fox: { position: [-0.9, 0, -1.2], rotationY: 0.12, scale: 0.64 },
    },
  ],
  grassland: [
    {
      bear: { position: [-3.4, 0, -2.3], rotationY: 0.3, scale: 0.44 },
      deer: { position: [3.25, 0, -3.2], rotationY: -0.48, scale: 0.42 },
      fox: { position: [-3.1, 0, -2.9], rotationY: 0.26, scale: 0.63 },
    },
    {
      bear: { position: [3.5, 0, -2.5], rotationY: -0.4, scale: 0.43 },
      deer: { position: [-3.15, 0, -3.55], rotationY: 0.2, scale: 0.42 },
      fox: { position: [3.2, 0, -3.25], rotationY: -0.42, scale: 0.63 },
    },
    {
      bear: { position: [-2.5, 0, -4.5], rotationY: 0.35, scale: 0.42 },
      deer: { position: [2.65, 0, -4.45], rotationY: -0.42, scale: 0.41 },
      fox: { position: [-2.35, 0, -4.35], rotationY: 0.32, scale: 0.62 },
    },
    {
      bear: { position: [0.65, 0, -2.5], rotationY: -0.18, scale: 0.43 },
      deer: { position: [-4, 0, -1.4], rotationY: 0.34, scale: 0.42 },
      fox: { position: [0.8, 0, -2.8], rotationY: -0.2, scale: 0.63 },
    },
    {
      bear: { position: [4, 0, -4.7], rotationY: -0.46, scale: 0.42 },
      deer: { position: [-0.7, 0, -2], rotationY: 0.18, scale: 0.42 },
      fox: { position: [3.5, 0, -4.5], rotationY: -0.42, scale: 0.62 },
    },
    {
      bear: { position: [-4, 0, -4.9], rotationY: 0.4, scale: 0.42 },
      deer: { position: [1.1, 0, -1.45], rotationY: -0.22, scale: 0.42 },
      fox: { position: [-3.6, 0, -4.6], rotationY: 0.36, scale: 0.62 },
    },
    {
      bear: { position: [2, 0, -1.7], rotationY: -0.34, scale: 0.44 },
      deer: { position: [-1.2, 0, -5], rotationY: 0.2, scale: 0.41 },
      fox: { position: [2.2, 0, -2], rotationY: -0.3, scale: 0.64 },
    },
    {
      bear: { position: [-1.4, 0, -3.2], rotationY: 0.22, scale: 0.43 },
      deer: { position: [4, 0, -1.1], rotationY: -0.5, scale: 0.42 },
      fox: { position: [-1.8, 0, -3.5], rotationY: 0.24, scale: 0.63 },
    },
  ],
}

function distanceBetween(a: Position3, b: Position3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

function randomizePlacement(placement: AnimalPlacement, animal: AnimalId): AnimalPlacement {
  return {
    position: [
      THREE.MathUtils.clamp(placement.position[0] + (Math.random() - 0.5) * 0.7, -4.15, 4.15),
      0,
      placement.position[2] + (Math.random() - 0.5) * 0.7,
    ],
    rotationY: placement.rotationY + (Math.random() - 0.5) * 0.45,
    scale: animal === 'bear'
      ? 0.42 + Math.random() * 0.035
      : animal === 'deer'
        ? 0.4 + Math.random() * 0.03
        : 0.62 + Math.random() * 0.04,
    coverVariant: Math.floor(Math.random() * 3),
  }
}

function createRandomRound(sceneId: SceneId, previous?: RoundState): RoundState {
  if (sceneId === 'desert') {
    const foxSpots = ROUND_LAYOUTS.desert.map((layout) => layout.fox)
    const previousFox = previous?.layout.fox.position
    const foxChoices = previousFox
      ? foxSpots.filter((spot) => distanceBetween(spot.position, previousFox) > 1.2)
      : foxSpots
    const foxSpot = foxChoices[Math.floor(Math.random() * foxChoices.length)]

    return {
      layout: {
        ...ROUND_LAYOUTS.desert[0],
        fox: randomizePlacement(foxSpot, 'fox'),
      },
      targetAnimals: ['fox'],
    }
  }

  const spots = ROUND_LAYOUTS[sceneId].flatMap((layout) => [layout.bear, layout.deer])
  const previousBear = previous?.layout.bear.position
  const bearChoices = previousBear
    ? spots.filter((spot) => distanceBetween(spot.position, previousBear) > 1.2)
    : spots
  const bearSpot = bearChoices[Math.floor(Math.random() * bearChoices.length)]
  const deerChoices = spots.filter(
    (spot) =>
      distanceBetween(spot.position, bearSpot.position) > 3
      && (!previous || distanceBetween(spot.position, previous.layout.deer.position) > 1.2),
  )
  const deerPool = deerChoices.length ? deerChoices : spots.filter((spot) => spot !== bearSpot)
  const deerSpot = deerPool[Math.floor(Math.random() * deerPool.length)]
  const oneAnimalRound = Math.random() < 0.45
  const targetAnimals: AnimalId[] = oneAnimalRound
    ? [Math.random() < 0.5 ? 'bear' : 'deer']
    : ['bear', 'deer']

  return {
    layout: {
      bear: randomizePlacement(bearSpot, 'bear'),
      deer: randomizePlacement(deerSpot, 'deer'),
      fox: ROUND_LAYOUTS[sceneId][0].fox,
    },
    targetAnimals,
  }
}

const INITIAL_ROUND = createRandomRound('forest')

const HOME_LAYOUT: RoundLayout = {
  bear: {
    position: [2.75, 0, -3.7],
    rotationY: -0.55,
    scale: 0.43,
    coverVariant: 2,
  },
  deer: ROUND_LAYOUTS.forest[2].deer,
  fox: ROUND_LAYOUTS.desert[0].fox,
}

const SCENE_LABELS: Record<SceneId, string> = {
  forest: 'Night forest',
  desert: 'Desert',
  grassland: 'Grassland',
}

const SCENE_COLORS: Record<
  SceneId,
  {
    sky: string
    fog: string
    hemisphere: string
    groundLight: string
    directional: string
    animalTint: string
    camouflageBlend: number
  }
> = {
  forest: {
    sky: '#0c2030',
    fog: '#0c2030',
    hemisphere: '#9cb8d4',
    groundLight: '#1d291b',
    directional: '#b9d8f2',
    animalTint: '#4b3828',
    camouflageBlend: 0.22,
  },
  desert: {
    sky: '#668594',
    fog: '#b99a6b',
    hemisphere: '#d9c89e',
    groundLight: '#765b35',
    directional: '#ffe2a6',
    animalTint: '#9a7141',
    camouflageBlend: 0.42,
  },
  grassland: {
    sky: '#789aab',
    fog: '#738468',
    hemisphere: '#b8c8bc',
    groundLight: '#34462b',
    directional: '#f0dfb0',
    animalTint: '#6c6235',
    camouflageBlend: 0.3,
  },
}

const VISION_LABELS: Record<VisionMode, string> = {
  normal: 'Normal',
  protanopia: 'Protanopia',
  deuteranopia: 'Deuteranopia',
  tritanopia: 'Tritanopia',
  grayscale: 'Grayscale',
}

const VISION_RESULT_EFFECTS: Record<VisionMode, string> = {
  normal: 'Normal mode preserved the original color relationships as a baseline for comparison.',
  protanopia: 'In this protanopia approximation, red-green differences are compressed and red contributes less separation between surfaces.',
  deuteranopia: 'In this deuteranopia approximation, green-red differences are compressed, making those hues less reliable as separate signals.',
  tritanopia: 'In this tritanopia approximation, blue-yellow relationships are remapped, changing how cool and warm surfaces separate.',
  grayscale: 'Grayscale removed hue information entirely, leaving luminance, edges, texture, and shape as the available visual signals.',
}

const SCENE_RESULT_EFFECTS: Record<VisionMode, Record<SceneId, string>> = {
  normal: {
    forest: 'The bear or deer retained its natural brown contrast against the dark green foliage, although shadows and bushes still interrupted its outline.',
    desert: 'The pale fennec retained subtle color differences from the ochre rocks and sand, while its ears and narrow outline remained the strongest clues.',
    grassland: 'The brown animal remained distinguishable from green vegetation through a combination of hue, brightness, and silhouette.',
  },
  protanopia: {
    forest: 'Brown fur, tree trunks, and dark foliage moved closer together, so the animal depended more on edge contrast and recognizable anatomy.',
    desert: 'The fennec, sand, and warm brown rocks shared more similar color cues, making its large ears, narrow muzzle, and cast shadow more useful.',
    grassland: 'Brown fur and green-yellow vegetation became less distinct by hue, increasing the importance of texture breaks and the animal\'s outline.',
  },
  deuteranopia: {
    forest: 'Green foliage and brown fur became less separated by color, so overlapping bushes could conceal more of the animal\'s form.',
    desert: 'The fox and rocky terrain remained close in warm luminance, while the reduced green-red distinction offered little extra help in separating them.',
    grassland: 'Grass, shrubs, and brown fur moved toward similar muted tones, making body shape, ears, legs, and shadow stronger search cues.',
  },
  tritanopia: {
    forest: 'The cool blue-green night palette shifted, altering the contrast between sky, foliage, lit surfaces, and the animal\'s warm fur.',
    desert: 'The blue sky and yellow-tan terrain changed relationship, while the fox still blended closely with rocks of similar brightness.',
    grassland: 'Blue sky, yellow grass, and green foliage were remapped, changing background separation around the animal without removing shape cues.',
  },
  grayscale: {
    forest: 'The animal and foliage could only be separated by brightness, texture, silhouette, and the direction of shadows.',
    desert: 'The similarly bright fox, sand, and rocks lost their hue differences, leaving its ears, muzzle, tail, and outline as the main clues.',
    grassland: 'Vegetation and fur were reduced to overlapping light and dark values, so contour and local contrast carried the search.',
  },
}

function describeResult(result: GameResult) {
  const lightEffect = result.brightness < 0.7
    ? 'At low brightness, reduced contrast made those remaining shape and shadow cues harder to detect.'
    : result.brightness > 1.25
      ? 'At high brightness, stronger highlights and cast shadows increased local contrast, although the light direction could still merge parts of the outline into nearby cover.'
      : 'At moderate brightness, color, texture, silhouette, and directional shadow all remained available as combined cues.'

  return `${VISION_RESULT_EFFECTS[result.visionMode]} ${SCENE_RESULT_EFFECTS[result.visionMode][result.sceneId]} ${lightEffect}`
}

const VISION_MATRICES: Record<VisionMode, number[]> = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  grayscale: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
}

function transformColor(hex: string, mode: VisionMode) {
  const source = new THREE.Color(hex)
  const matrix = VISION_MATRICES[mode]
  const { r, g, b } = source

  return new THREE.Color(
    THREE.MathUtils.clamp(matrix[0] * r + matrix[1] * g + matrix[2] * b, 0, 1),
    THREE.MathUtils.clamp(matrix[3] * r + matrix[4] * g + matrix[5] * b, 0, 1),
    THREE.MathUtils.clamp(matrix[6] * r + matrix[7] * g + matrix[8] * b, 0, 1),
  )
}

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => camera.lookAt(0, 1.3, 0), [camera])
  return null
}

type BearModelProps = {
  visionMode: VisionMode
  found: boolean
  position: Position3
  rotationY: number
  scale: number
  camouflageTint: string
  camouflageBlend: number
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

function BearModel({ visionMode, found, position, rotationY, scale, camouflageTint, camouflageBlend, onClick }: BearModelProps) {
  const gltf = useLoader(GLTFLoader, `${ASSET_BASE}models/forest/sitting_bear.glb`)
  const bear = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true

      const cloneMaterial = (material: THREE.Material) => {
        const copy = material.clone()
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.userData.baseColor = copy.color.clone()
        }
        return copy
      }

      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material)
    })
    return clone
  }, [gltf.scene])

  useEffect(() => {
    bear.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        const baseColor = material.userData.baseColor as THREE.Color
        const adjusted = transformColor(`#${baseColor.getHexString()}`, visionMode)
        adjusted.lerp(transformColor(camouflageTint, visionMode), camouflageBlend)
        material.color.copy(found ? adjusted.lerp(new THREE.Color('#d6a437'), 0.55) : adjusted)
        material.needsUpdate = true
      })
    })
  }, [bear, camouflageBlend, camouflageTint, found, visionMode])

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale} onClick={onClick}>
      <primitive object={bear} />
      <mesh position={[0, 2.15, 0]} scale={[3.5, 4.8, 2.6]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

type DeerModelProps = {
  visionMode: VisionMode
  found: boolean
  position: Position3
  rotationY: number
  scale: number
  camouflageTint: string
  camouflageBlend: number
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

function DeerModel({ visionMode, found, position, rotationY, scale, camouflageTint, camouflageBlend, onClick }: DeerModelProps) {
  const gltf = useLoader(GLTFLoader, `${ASSET_BASE}models/forest/wild_deer.glb`)
  const deer = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true

      const cloneMaterial = (material: THREE.Material) => {
        const copy = material.clone()
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.userData.baseColor = copy.color.clone()
        }
        return copy
      }

      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material)
    })
    return clone
  }, [gltf.scene])

  useEffect(() => {
    deer.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        const baseColor = material.userData.baseColor as THREE.Color
        const adjusted = transformColor(`#${baseColor.getHexString()}`, visionMode)
        adjusted.lerp(transformColor(camouflageTint, visionMode), camouflageBlend)
        material.color.copy(found ? adjusted.lerp(new THREE.Color('#d6a437'), 0.55) : adjusted)
        material.needsUpdate = true
      })
    })
  }, [deer, camouflageBlend, camouflageTint, found, visionMode])

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale} onClick={onClick}>
      <primitive object={deer} />
      <mesh position={[0.35, 2.05, 0]} scale={[4.4, 4.25, 1.75]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

type FoxModelProps = DeerModelProps

function FoxModel({ visionMode, found, position, rotationY, scale, camouflageTint, camouflageBlend, onClick }: FoxModelProps) {
  const gltf = useLoader(GLTFLoader, `${ASSET_BASE}models/desert/fennec_fox.glb`)
  const fox = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true

      const cloneMaterial = (material: THREE.Material) => {
        const copy = material.clone()
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.userData.baseColor = copy.color.clone()
        }
        return copy
      }

      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material)
    })
    return clone
  }, [gltf.scene])

  useEffect(() => {
    fox.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        const baseColor = material.userData.baseColor as THREE.Color
        const adjusted = transformColor(`#${baseColor.getHexString()}`, visionMode)
        adjusted.lerp(transformColor(camouflageTint, visionMode), camouflageBlend)
        material.color.copy(found ? adjusted.lerp(new THREE.Color('#d6a437'), 0.55) : adjusted)
        material.needsUpdate = true
      })
    })
  }, [fox, camouflageBlend, camouflageTint, found, visionMode])

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale} onClick={onClick}>
      <primitive object={fox} />
      <mesh position={[-0.2, 1.3, 0]} scale={[5, 2.8, 1.45]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

type NightForestModelProps = {
  visionMode: VisionMode
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

const FOREST_EXTRA_TREES: Array<{ position: Position3; scale: number }> = [
  { position: [-7.2, 0, -7.1], scale: 1.05 }, { position: [-5.7, 0, -9.5], scale: 0.92 },
  { position: [-4.1, 0, -7.8], scale: 1.12 }, { position: [-2.3, 0, -10.4], scale: 0.86 },
  { position: [-0.2, 0, -8.8], scale: 1.05 }, { position: [2.1, 0, -10.2], scale: 0.9 },
  { position: [4.15, 0, -8.1], scale: 1.14 }, { position: [5.9, 0, -10], scale: 0.88 },
  { position: [7.25, 0, -7.2], scale: 1.02 }, { position: [-6.8, 0, -12.2], scale: 0.78 },
  { position: [-1, 0, -12.6], scale: 0.82 }, { position: [6.55, 0, -12.1], scale: 0.76 },
]

const FOREST_BACKGROUND_TREES: Array<{ position: Position3; scale: number }> = Array.from(
  { length: 36 },
  (_, index) => {
    const row = Math.floor(index / 12)
    const column = index % 12
    return {
      position: [
        -8.8 + column * 1.6 + (row % 2) * 0.8,
        0,
        -6.9 - row * 2.65 - (column % 3) * 0.22,
      ],
      scale: 1.05 + ((column * 3 + row) % 5) * 0.1 - row * 0.08,
    }
  },
)

const FOREST_EXTRA_SHRUBS: Position3[] = [
  [-5.4, 0, -3.2], [-4.2, 0, -5.4], [-2.8, 0, -2.2], [-1.35, 0, -5.8],
  [0.2, 0, -3.8], [1.65, 0, -6.1], [2.75, 0, -2.4], [4.1, 0, -5.5],
  [5.3, 0, -3], [-4.8, 0, 0.4], [4.7, 0, 0.55], [0.3, 0, 1.5],
]

const FOREST_MIDGROUND_SHRUBS: Position3[] = Array.from({ length: 30 }, (_, index) => {
  const row = Math.floor(index / 10)
  const column = index % 10
  return [
    -6.1 + column * 1.35 + (row % 2) * 0.52,
    0,
    0.65 - row * 2.15 - (column % 3) * 0.28,
  ]
})

const FOREST_EXTRA_ROCKS: Array<{ position: Position3; scale: Position3 }> = [
  { position: [-5.8, 0.22, -4.4], scale: [0.72, 0.45, 0.58] },
  { position: [-3.2, 0.18, -6.4], scale: [0.55, 0.36, 0.46] },
  { position: [-1.7, 0.15, -2.7], scale: [0.44, 0.3, 0.38] },
  { position: [1.2, 0.2, -5.1], scale: [0.62, 0.4, 0.5] },
  { position: [3.4, 0.16, -6.5], scale: [0.5, 0.32, 0.42] },
  { position: [5.7, 0.24, -4], scale: [0.76, 0.48, 0.62] },
  { position: [-3.9, 0.14, 1], scale: [0.42, 0.28, 0.36] },
  { position: [3.6, 0.15, 1.2], scale: [0.48, 0.3, 0.4] },
]

function NightForestModel({ visionMode, onClick }: NightForestModelProps) {
  const gltf = useLoader(GLTFLoader, `${ASSET_BASE}models/forest/night_forest.glb`)
  const forest = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = !object.name.includes('Terrain') && !object.name.includes('Clearing')
      object.receiveShadow = true

      const cloneMaterial = (material: THREE.Material) => {
        const copy = material.clone()
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.userData.baseColor = copy.color.clone()
        }
        return copy
      }

      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material)
    })
    return clone
  }, [gltf.scene])

  useEffect(() => {
    forest.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        const baseColor = material.userData.baseColor as THREE.Color
        material.color.copy(transformColor(`#${baseColor.getHexString()}`, visionMode))
        material.needsUpdate = true
      })
    })
  }, [forest, visionMode])

  const colors = useMemo(
    () => ({
      trunk: transformColor('#241b16', visionMode),
      needles: transformColor('#10291f', visionMode),
      needlesLight: transformColor('#173629', visionMode),
      backgroundTrunk: transformColor('#161411', visionMode),
      backgroundNeedles: transformColor('#07150f', visionMode),
      backgroundNeedlesLight: transformColor('#0b1d15', visionMode),
      shrub: transformColor('#183b29', visionMode),
      rock: transformColor('#26312e', visionMode),
    }),
    [visionMode],
  )

  return (
    <group onClick={onClick}>
      <primitive object={forest} />
      {FOREST_BACKGROUND_TREES.map((tree, index) => (
        <group key={`forest-background-tree-${index}`} position={tree.position} scale={tree.scale}>
          <mesh castShadow position={[0, 2.7, 0]}>
            <cylinderGeometry args={[0.2, 0.36, 5.4, 7]} />
            <meshStandardMaterial color={colors.backgroundTrunk} roughness={1} flatShading />
          </mesh>
          {[3, 3.85, 4.65, 5.4].map((height, layer) => (
            <mesh key={height} castShadow position={[0, height, 0]}>
              <coneGeometry args={[1.35 - layer * 0.16, 1.7, 7]} />
              <meshStandardMaterial
                color={layer % 2 === 0 ? colors.backgroundNeedles : colors.backgroundNeedlesLight}
                roughness={1}
                flatShading
              />
            </mesh>
          ))}
        </group>
      ))}
      {FOREST_EXTRA_TREES.map((tree, index) => (
        <group key={`forest-tree-${index}`} position={tree.position} scale={tree.scale}>
          <mesh castShadow position={[0, 1.65, 0]}>
            <cylinderGeometry args={[0.2, 0.32, 3.3, 7]} />
            <meshStandardMaterial color={colors.trunk} roughness={1} flatShading />
          </mesh>
          {[1.75, 2.55, 3.3].map((height, layer) => (
            <mesh key={height} castShadow position={[0, height, 0]}>
              <coneGeometry args={[1.25 - layer * 0.18, 1.75, 7]} />
              <meshStandardMaterial
                color={layer % 2 === 0 ? colors.needles : colors.needlesLight}
                roughness={1}
                flatShading
              />
            </mesh>
          ))}
        </group>
      ))}
      {[...FOREST_MIDGROUND_SHRUBS, ...FOREST_EXTRA_SHRUBS].map((position, index) => (
        <group key={`forest-shrub-${index}`} position={position} rotation={[0, index * 0.71, 0]}>
          <mesh castShadow position={[-0.28, 0.44, 0]} scale={[0.62, 0.52, 0.5]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.shrub} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.3, 0.41, 0.05]} scale={[0.56, 0.47, 0.46]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.needlesLight} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.02, 0.76, -0.03]} scale={[0.4, 0.35, 0.4]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={index % 2 === 0 ? colors.shrub : colors.needles} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      {FOREST_EXTRA_ROCKS.map((rock, index) => (
        <mesh key={`forest-rock-${index}`} castShadow receiveShadow position={rock.position} scale={rock.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={colors.rock} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

const DESERT_ROCKS: Array<{ position: Position3; scale: Position3; rotation: Position3 }> = [
  { position: [-4.6, 0.45, -2.8], scale: [1.5, 0.9, 1.1], rotation: [0.1, 0.5, -0.08] },
  { position: [4.4, 0.35, -1.7], scale: [1.1, 0.7, 0.9], rotation: [-0.1, 0.2, 0.06] },
  { position: [-1.8, 0.3, -4.7], scale: [0.85, 0.58, 0.7], rotation: [0.12, -0.35, 0.04] },
  { position: [1.25, 0.25, -3.8], scale: [0.72, 0.5, 0.62], rotation: [-0.05, 0.7, 0.08] },
  { position: [-5.25, 0.3, -5.6], scale: [1.15, 0.62, 0.8], rotation: [0.06, 0.3, -0.04] },
  { position: [5.2, 0.38, -4.9], scale: [1.2, 0.76, 0.88], rotation: [-0.08, -0.4, 0.06] },
  { position: [-2.15, 0.2, 0.65], scale: [0.62, 0.4, 0.52], rotation: [0.08, 0.9, 0.1] },
  { position: [1.9, 0.18, 1.1], scale: [0.55, 0.36, 0.48], rotation: [-0.1, 0.35, -0.06] },
  { position: [-3.7, 0.2, 2.1], scale: [0.65, 0.42, 0.55], rotation: [0, 0.8, 0.12] },
  { position: [3.25, 0.18, 2.6], scale: [0.6, 0.36, 0.5], rotation: [0.1, -0.4, 0] },
  { position: [-0.2, 0.22, -6.1], scale: [0.72, 0.46, 0.58], rotation: [0.05, 0.45, -0.08] },
  { position: [3.2, 0.28, -6.4], scale: [0.88, 0.54, 0.7], rotation: [-0.06, -0.2, 0.08] },
  { position: [-4.7, 0.16, -0.2], scale: [0.52, 0.34, 0.46], rotation: [0.08, 0.25, 0.05] },
  { position: [4.8, 0.22, 0.35], scale: [0.74, 0.46, 0.58], rotation: [-0.08, 0.65, -0.04] },
  { position: [-0.55, 0.15, 2.55], scale: [0.48, 0.3, 0.4], rotation: [0.04, -0.55, 0.08] },
  { position: [5.5, 0.28, -7], scale: [0.9, 0.58, 0.72], rotation: [0.08, 0.3, -0.05] },
  { position: [-6.15, 0.2, -1.35], scale: [0.64, 0.4, 0.52], rotation: [0.04, 0.45, -0.06] },
  { position: [6.1, 0.23, -2.6], scale: [0.7, 0.46, 0.56], rotation: [-0.06, -0.25, 0.05] },
  { position: [-3, 0.17, -3.8], scale: [0.5, 0.34, 0.42], rotation: [0.08, 0.7, 0.04] },
  { position: [2.8, 0.15, -0.35], scale: [0.46, 0.3, 0.4], rotation: [-0.04, 0.3, -0.08] },
  { position: [-1.1, 0.13, -1.2], scale: [0.4, 0.26, 0.34], rotation: [0.05, -0.5, 0.06] },
  { position: [0.65, 0.18, -5.15], scale: [0.58, 0.36, 0.46], rotation: [-0.08, 0.55, -0.03] },
  { position: [-5.7, 0.16, 1.8], scale: [0.48, 0.31, 0.4], rotation: [0.06, 0.2, 0.08] },
  { position: [5.65, 0.18, 2.1], scale: [0.56, 0.35, 0.44], rotation: [-0.05, -0.45, 0.04] },
]

const DESERT_MOUNTAINS: Array<{ position: Position3; scale: Position3; rotationY: number }> = [
  { position: [-7.8, 1.2, -11.5], scale: [3.6, 2.3, 2.5], rotationY: 0.18 },
  { position: [-3.7, 0.95, -12.5], scale: [2.7, 1.85, 2.1], rotationY: -0.22 },
  { position: [0.2, 1.35, -13.2], scale: [4.1, 2.65, 2.8], rotationY: 0.12 },
  { position: [4.7, 1.05, -12.1], scale: [3.1, 2.05, 2.35], rotationY: -0.16 },
  { position: [8.2, 1.3, -11.7], scale: [3.8, 2.45, 2.6], rotationY: 0.2 },
]

const DESERT_BACKGROUND_FORMATIONS: Array<{
  position: Position3
  scale: Position3
  rotationY: number
}> = Array.from({ length: 16 }, (_, index) => ({
  position: [
    -8.2 + index * 1.08,
    0.8 + (index % 4) * 0.18,
    -8.4 - (index % 3) * 0.65,
  ],
  scale: [
    1.35 + (index % 3) * 0.38,
    1.05 + (index % 4) * 0.24,
    1.05 + (index % 2) * 0.34,
  ],
  rotationY: (index % 5) * 0.24,
}))

const DESERT_SCATTERED_ROCKS: Array<{
  position: Position3
  scale: Position3
  rotation: Position3
}> = Array.from({ length: 42 }, (_, index) => {
  const row = Math.floor(index / 14)
  const column = index % 14
  const height = 0.22 + ((column * 2 + row) % 5) * 0.055

  return {
    position: [
      -7.15 + column * 1.1 + (row % 2) * 0.48,
      height * 0.78,
      2.7 - row * 3.15 - (column % 3) * 0.34,
    ],
    scale: [
      0.34 + ((column + row * 2) % 5) * 0.09,
      height,
      0.3 + ((column * 3 + row) % 4) * 0.08,
    ],
    rotation: [
      ((column + row) % 3 - 1) * 0.08,
      (column * 0.47 + row * 0.31) % Math.PI,
      ((column * 2 + row) % 3 - 1) * 0.07,
    ],
  }
})

const DESERT_SHRUBS: Position3[] = [
  [-3.1, 0, -0.7],
  [3.4, 0, -3.2],
  [-1.05, 0, -2.75],
  [1.95, 0, -1.55],
  [-5.25, 0, -3.8],
  [5.15, 0, -0.45],
  [-2.45, 0, -5.35],
  [2.7, 0, -5.55],
  [-4.8, 0, 1.1],
  [4.7, 0, 1.5],
  [-5.8, 0, -1.9],
  [5.75, 0, -2.15],
  [-3.9, 0, -6.25],
  [4.15, 0, -6.4],
  [-0.35, 0, -5.8],
  [0.6, 0, -0.45],
  [-2.7, 0, 2.4],
  [2.55, 0, 2.65],
  [-7.2, 0, -7.4], [-5.9, 0, -8.15], [-4.55, 0, -7.65], [-3.2, 0, -8.55],
  [-1.75, 0, -7.8], [-0.35, 0, -8.7], [1.1, 0, -7.7], [2.55, 0, -8.45],
  [3.95, 0, -7.55], [5.35, 0, -8.35], [6.75, 0, -7.5],
]

const GRASS_TUFTS: Position3[] = [
  [-4.5, 0, -2.5], [-3.4, 0, -0.6], [-2.2, 0, -3.2], [-1.2, 0, 1.9],
  [0.1, 0, -3.4], [1.1, 0, 2.2], [2.4, 0, -2.7], [3.5, 0, -0.4],
  [4.6, 0, -2], [-4.2, 0, 2.5], [2.9, 0, 2.7], [4.7, 0, 1.8],
  [-5.2, 0, -4.5], [-3.2, 0, -4.8], [-1.4, 0, -5.2], [0.8, 0, -5.4],
  [2.1, 0, -4.6], [4.2, 0, -4.3], [-5.1, 0, 0.4], [-2.7, 0, 0.8],
  [0.3, 0, 0.7], [2.2, 0, 0.5], [4.8, 0, 0.2], [0, 0, 3.1],
  [-5.7, 0, -1.1], [-4.1, 0, -1.45], [-3.6, 0, 2.05], [-2.1, 0, -0.3],
  [-0.9, 0, -1.7], [0.9, 0, -1.4], [1.8, 0, 1.5], [3.3, 0, 1.1],
  [4.1, 0, -4.9], [5.55, 0, -3.5], [-0.2, 0, -6.2], [5.65, 0, 2.8],
]

const GRASS_SHRUBS: Position3[] = [
  [-4, 0, -3.1], [4.1, 0, -2.8], [-1.8, 0, -5.5], [1.7, 0, -5.7],
  [-5, 0, 1.2], [5, 0, 1.1], [-3, 0, -1.8], [3.1, 0, -1.55],
  [-0.8, 0, -3.9], [0.75, 0, -4.35], [-4.7, 0, -5.1], [4.65, 0, -5.25],
  [-2.25, 0, 1.25], [2.45, 0, 1.4],
  [-5.65, 0, -2.2], [5.7, 0, -2.05], [-4.35, 0, -0.15], [4.3, 0, 0.05],
  [-3.55, 0, -6.2], [3.65, 0, -6.05], [-1.3, 0, -2.15], [1.4, 0, -2.35],
  [-0.15, 0, 1.65], [0.2, 0, -6.35],
]

const GRASS_TREES: Array<{ position: Position3; scale: number }> = [
  { position: [-5.2, 0, -4.8], scale: 1 },
  { position: [5.1, 0, -4.2], scale: 0.95 },
  { position: [-3.2, 0, -7], scale: 0.82 },
  { position: [3.45, 0, -6.7], scale: 0.78 },
  { position: [-6.1, 0, 0.4], scale: 0.72 },
  { position: [6.15, 0, 0.2], scale: 0.68 },
  { position: [-4.4, 0, -8.9], scale: 0.7 },
  { position: [-1.45, 0, -8.3], scale: 0.76 },
  { position: [1.25, 0, -8.7], scale: 0.72 },
  { position: [4.65, 0, -8.5], scale: 0.74 },
  { position: [-6.4, 0, -2.7], scale: 0.66 },
  { position: [6.45, 0, -2.5], scale: 0.64 },
]

const GRASS_BACKGROUND_TREES: Array<{ position: Position3; scale: number }> = Array.from(
  { length: 48 },
  (_, index) => {
    const row = Math.floor(index / 16)
    const column = index % 16
    return {
      position: [
        -9.3 + column * 1.25 + (row % 2) * 0.62,
        0,
        -8.4 - row * 2.25 - (column % 4) * 0.18,
      ],
      scale: 0.58 + ((column * 2 + row) % 5) * 0.07 - row * 0.025,
    }
  },
)

const GRASS_BACKGROUND_SHRUBS: Position3[] = [
  [-7.3, 0, -7.2], [-6.1, 0, -8], [-4.9, 0, -7.4], [-3.7, 0, -8.2],
  [-2.45, 0, -7.5], [-1.25, 0, -8.1], [0, 0, -7.35], [1.3, 0, -8.15],
  [2.55, 0, -7.45], [3.8, 0, -8.2], [5, 0, -7.5], [6.25, 0, -8.1],
  [7.4, 0, -7.25], [-5.45, 0, -9.4], [0.5, 0, -9.65], [5.7, 0, -9.35],
]

function DesertModel({ visionMode, onClick }: NightForestModelProps) {
  const colors = useMemo(
    () => ({
      ground: transformColor('#a88453', visionMode),
      dune: transformColor('#b79460', visionMode),
      rock: transformColor('#68513d', visionMode),
      rockLight: transformColor('#806344', visionMode),
      shrub: transformColor('#55452d', visionMode),
    }),
    [visionMode],
  )

  return (
    <group onClick={onClick}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={colors.ground} roughness={1} />
      </mesh>
      <mesh receiveShadow position={[-5.8, -0.1, -7]} scale={[5.5, 1.05, 2.6]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color={colors.dune} roughness={1} flatShading />
      </mesh>
      <mesh receiveShadow position={[5.7, -0.2, -7.8]} scale={[6, 1.15, 2.8]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color={colors.dune} roughness={1} flatShading />
      </mesh>
      {DESERT_MOUNTAINS.map((mountain, index) => (
        <mesh
          key={`mountain-${index}`}
          castShadow
          receiveShadow
          position={mountain.position}
          rotation={[0, mountain.rotationY, 0]}
          scale={mountain.scale}
        >
          <coneGeometry args={[1, 2.5, 5]} />
          <meshStandardMaterial color={index % 2 === 0 ? colors.rock : colors.dune} roughness={1} flatShading />
        </mesh>
      ))}
      {DESERT_BACKGROUND_FORMATIONS.map((formation, index) => (
        <mesh
          key={`desert-formation-${index}`}
          castShadow
          receiveShadow
          position={formation.position}
          rotation={[0, formation.rotationY, 0]}
          scale={formation.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={index % 3 === 0 ? colors.rock : colors.dune} roughness={1} flatShading />
        </mesh>
      ))}
      {DESERT_ROCKS.map((rock, index) => (
        <mesh
          key={index}
          castShadow
          receiveShadow
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={colors.rock} roughness={0.96} flatShading />
        </mesh>
      ))}
      {DESERT_SCATTERED_ROCKS.map((rock, index) => (
        <mesh
          key={`desert-scattered-rock-${index}`}
          castShadow
          receiveShadow
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={index % 4 === 0 ? colors.rockLight : colors.rock}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
      {DESERT_SHRUBS.map((position, index) => (
        <group key={index} position={position}>
          <mesh castShadow position={[0, 0.36, 0]} rotation={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.035, 0.06, 0.75, 5]} />
            <meshStandardMaterial color={colors.shrub} roughness={1} />
          </mesh>
          <mesh castShadow position={[-0.18, 0.32, 0]} rotation={[0, 0, -0.75]}>
            <cylinderGeometry args={[0.025, 0.045, 0.55, 5]} />
            <meshStandardMaterial color={colors.shrub} roughness={1} />
          </mesh>
          <mesh castShadow position={[0.2, 0.26, 0.06]} rotation={[0.25, 0, 0.8]}>
            <cylinderGeometry args={[0.025, 0.045, 0.48, 5]} />
            <meshStandardMaterial color={colors.shrub} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function GrasslandModel({ visionMode, onClick }: NightForestModelProps) {
  const colors = useMemo(
    () => ({
      ground: transformColor('#52633a', visionMode),
      hill: transformColor('#65734a', visionMode),
      grass: transformColor('#7c7b3d', visionMode),
      grassDark: transformColor('#526238', visionMode),
      trunk: transformColor('#59442f', visionMode),
      canopy: transformColor('#465737', visionMode),
      canopyLight: transformColor('#596843', visionMode),
    }),
    [visionMode],
  )

  return (
    <group onClick={onClick}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={colors.ground} roughness={1} />
      </mesh>
      <mesh receiveShadow position={[-5.5, -0.15, -7]} scale={[5, 1.15, 2.8]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color={colors.hill} roughness={1} flatShading />
      </mesh>
      <mesh receiveShadow position={[5.2, -0.25, -8]} scale={[6, 1.3, 3]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color={colors.hill} roughness={1} flatShading />
      </mesh>
      {GRASS_TUFTS.map((position, index) => (
        <group key={index} position={position} rotation={[0, index * 0.7, 0]}>
          {[-0.22, -0.11, 0, 0.11, 0.22].map((offset, bladeIndex) => (
            <mesh
              key={bladeIndex}
              castShadow
              position={[offset, 0.38 + (bladeIndex % 3) * 0.05, (bladeIndex % 2) * 0.06]}
              rotation={[0, 0, offset * 1.8]}
            >
              <coneGeometry args={[0.065, 0.8 + (bladeIndex % 3) * 0.1, 4]} />
              <meshStandardMaterial
                color={index % 2 === 0 ? colors.grass : colors.grassDark}
                roughness={1}
                flatShading
              />
            </mesh>
          ))}
        </group>
      ))}
      {[...GRASS_BACKGROUND_SHRUBS, ...GRASS_SHRUBS].map((position, index) => (
        <group key={index} position={position} rotation={[0, index * 0.63, 0]} scale={0.88 + (index % 4) * 0.08}>
          <mesh castShadow position={[-0.28, 0.38, 0]} scale={[0.62, 0.46, 0.52]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.grassDark} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.32, 0.34, 0.05]} scale={[0.56, 0.42, 0.48]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.canopy} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.02, 0.58, -0.08]} scale={[0.48, 0.38, 0.44]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={index % 2 === 0 ? colors.canopyLight : colors.grassDark} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      {[...GRASS_BACKGROUND_TREES, ...GRASS_TREES].map((tree, index) => (
        <group key={index} position={tree.position} scale={tree.scale}>
          <mesh castShadow position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 2.4, 7]} />
            <meshStandardMaterial color={colors.trunk} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[-0.38, 2.5, 0]} scale={[1.05, 0.85, 0.95]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.canopy} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.45, 2.58, 0.04]} scale={[0.95, 0.78, 0.9]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.canopyLight} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.05, 3.15, 0]} scale={[0.85, 0.76, 0.8]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.canopy} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

type AnimalCoverProps = {
  animal: AnimalId
  placement: AnimalPlacement
  sceneId: SceneId
  visionMode: VisionMode
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

function AnimalCover({ animal, placement, sceneId, visionMode, onClick }: AnimalCoverProps) {
  const [x, , z] = placement.position
  const width = animal === 'bear' ? 1 : animal === 'deer' ? 0.82 : 0.68
  const colors = useMemo(
    () => ({
      forestA: transformColor('#183b29', visionMode),
      forestB: transformColor('#29482d', visionMode),
      forestTrunk: transformColor('#33261c', visionMode),
      desertRock: transformColor('#745a3e', visionMode),
      desertStem: transformColor('#58462d', visionMode),
      grassA: transformColor('#66703b', visionMode),
      grassB: transformColor('#858044', visionMode),
    }),
    [visionMode],
  )

  if (sceneId === 'forest') {
    const variant = placement.coverVariant ?? 0
    return (
      <group position={[x, 0, z + 0.72]} onClick={onClick}>
        {variant === 1 && (
          <group position={[-0.3 * width, 0, 0.12]}>
            <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.23, 0.34, 2.4, 7]} />
              <meshStandardMaterial color={colors.forestTrunk} roughness={1} flatShading />
            </mesh>
            <mesh castShadow position={[-0.34, 2.38, 0]} scale={[0.9, 0.72, 0.72]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={colors.forestA} roughness={1} flatShading />
            </mesh>
            <mesh castShadow position={[0.38, 2.48, 0.02]} scale={[0.82, 0.68, 0.7]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={colors.forestB} roughness={1} flatShading />
            </mesh>
            <mesh castShadow position={[0.02, 3.05, 0]} scale={[0.76, 0.7, 0.68]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={colors.forestA} roughness={1} flatShading />
            </mesh>
          </group>
        )}
        {[-0.55, 0, 0.52].map((offset, index) => (
          <mesh
            key={offset}
            castShadow
            receiveShadow
            position={[offset * width, 0.39 + (index % 2) * 0.06, index === 1 ? 0.08 : 0]}
            scale={[0.65 * width, 0.46, 0.48]}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? colors.forestA : colors.forestB}
              roughness={1}
              flatShading
            />
          </mesh>
        ))}
        {variant === 2 && (
          <mesh castShadow position={[0.18 * width, 0.67, 0.04]} scale={[0.7 * width, 0.42, 0.46]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.forestB} roughness={1} flatShading />
          </mesh>
        )}
      </group>
    )
  }

  if (sceneId === 'desert') {
    const variant = placement.coverVariant ?? 0
    const height = animal === 'fox' ? 0.68 : 1
    return (
      <group position={[x, 0, z + 0.68]} onClick={onClick}>
        <mesh
          castShadow
          receiveShadow
          position={[-0.18 * width, 0.46 * height, 0]}
          rotation={[0.08, 0.5, -0.08]}
          scale={[0.95 * width, 0.64 * height, 0.56]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={colors.desertRock} roughness={1} flatShading />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[0.52 * width, 0.38 * height, 0.08]}
          rotation={[-0.06, -0.38, 0.1]}
          scale={[0.68 * width, 0.48 * height, 0.48]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={colors.desertRock} roughness={1} flatShading />
        </mesh>
        <mesh castShadow position={[0.62 * width, 0.45, 0.02]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.035, 0.065, 0.9, 5]} />
          <meshStandardMaterial color={colors.desertStem} roughness={1} />
        </mesh>
        <mesh castShadow position={[0.78 * width, 0.42, 0.02]} rotation={[0, 0, 0.75]}>
          <cylinderGeometry args={[0.025, 0.05, 0.62, 5]} />
          <meshStandardMaterial color={colors.desertStem} roughness={1} />
        </mesh>
        {variant > 0 && (
          <mesh
            castShadow
            receiveShadow
            position={[0.55 * width, (0.29 + variant * 0.05) * height, 0.06]}
            rotation={[0.1, -0.35, 0.08]}
            scale={[0.55 * width, (0.38 + variant * 0.05) * height, 0.42]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={colors.desertRock} roughness={1} flatShading />
          </mesh>
        )}
        {variant === 2 && (
          <mesh
            castShadow
            receiveShadow
            position={[-0.62 * width, 0.28, 0.12]}
            rotation={[0.08, 0.28, -0.05]}
            scale={[0.46 * width, 0.34, 0.38]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={colors.desertRock} roughness={1} flatShading />
          </mesh>
        )}
      </group>
    )
  }

  return (
    <group position={[x, 0, z + 0.7]} onClick={onClick}>
      <mesh position={[-0.42 * width, 0.34, 0.08]} scale={[0.62 * width, 0.42, 0.42]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={colors.grassA} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.42 * width, 0.31, 0.04]} scale={[0.58 * width, 0.38, 0.4]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={colors.grassB} roughness={1} flatShading />
      </mesh>
      {[-0.9, -0.74, -0.58, -0.42, -0.26, -0.1, 0.08, 0.25, 0.42, 0.58, 0.74, 0.9].map((offset, index) => (
        <mesh
          key={offset}
          castShadow
          position={[offset * width, 0.54 + (index % 3) * 0.08, (index % 2) * 0.09]}
          rotation={[0, index * 0.35, offset * 0.24]}
        >
          <coneGeometry args={[0.13, 1.18 + (index % 3) * 0.13, 4]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? colors.grassA : colors.grassB}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

type ForestSceneProps = {
  sceneId?: SceneId
  visionMode: VisionMode
  brightness: number
  lightAngle: number
  interactive?: boolean
  foundAnimals?: AnimalId[]
  activeAnimals?: AnimalId[]
  layout?: RoundLayout
  onFound?: (animal: AnimalId) => void
  onMiss?: () => void
}

function ForestScene({
  sceneId = 'forest',
  visionMode,
  brightness,
  lightAngle,
  interactive = true,
  foundAnimals = [],
  activeAnimals = ['bear', 'deer'],
  layout = ROUND_LAYOUTS.forest[0],
  onFound,
  onMiss,
}: ForestSceneProps) {
  const sceneColors = SCENE_COLORS[sceneId]
  const colors = useMemo(
    () => ({
      sky: transformColor(sceneColors.sky, visionMode),
      fog: transformColor(sceneColors.fog, visionMode),
    }),
    [sceneColors, visionMode],
  )

  const lightRadians = THREE.MathUtils.degToRad(lightAngle)
  const lightPosition: [number, number, number] = [
    Math.cos(lightRadians) * 7,
    8,
    Math.sin(lightRadians) * 7,
  ]
  const roundComplete = foundAnimals.length === activeAnimals.length
  const animalScaleMultiplier = 0.78
  const bearPlacement = {
    ...layout.bear,
    scale: layout.bear.scale * animalScaleMultiplier,
  }
  const deerPlacement = {
    ...layout.deer,
    scale: layout.deer.scale * animalScaleMultiplier,
  }
  const foxPlacement = {
    ...layout.fox,
    scale: layout.fox.scale * animalScaleMultiplier,
  }
  const handleAnimalClick = (animal: AnimalId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (interactive && !foundAnimals.includes(animal)) onFound?.(animal)
  }

  const handleMiss = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (interactive && !roundComplete) onMiss?.()
  }

  return (
    <>
      <CameraRig />
      <color attach="background" args={[colors.sky]} />
      <fog attach="fog" args={[colors.fog, 10, 28]} />
      <hemisphereLight
        color={sceneColors.hemisphere}
        groundColor={sceneColors.groundLight}
        intensity={brightness * 0.48}
      />
      <ambientLight color={sceneColors.hemisphere} intensity={brightness * 0.5} />
      <directionalLight
        castShadow
        color={sceneColors.directional}
        intensity={brightness * 1.75}
        position={lightPosition}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={24}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <Suspense fallback={null}>
        {sceneId === 'forest' && <NightForestModel visionMode={visionMode} onClick={handleMiss} />}
        {sceneId === 'desert' && <DesertModel visionMode={visionMode} onClick={handleMiss} />}
        {sceneId === 'grassland' && <GrasslandModel visionMode={visionMode} onClick={handleMiss} />}
        {activeAnimals.includes('bear') && (
          <>
            <BearModel
              visionMode={visionMode}
              found={foundAnimals.includes('bear')}
              position={bearPlacement.position}
              rotationY={bearPlacement.rotationY}
              scale={bearPlacement.scale}
              camouflageTint={sceneColors.animalTint}
              camouflageBlend={sceneColors.camouflageBlend}
              onClick={handleAnimalClick('bear')}
            />
            <AnimalCover
              animal="bear"
              placement={layout.bear}
              sceneId={sceneId}
              visionMode={visionMode}
              onClick={handleMiss}
            />
          </>
        )}
        {activeAnimals.includes('deer') && (
          <>
            <DeerModel
              visionMode={visionMode}
              found={foundAnimals.includes('deer')}
              position={deerPlacement.position}
              rotationY={deerPlacement.rotationY}
              scale={deerPlacement.scale}
              camouflageTint={sceneColors.animalTint}
              camouflageBlend={sceneColors.camouflageBlend}
              onClick={handleAnimalClick('deer')}
            />
            <AnimalCover
              animal="deer"
              placement={layout.deer}
              sceneId={sceneId}
              visionMode={visionMode}
              onClick={handleMiss}
            />
          </>
        )}
        {activeAnimals.includes('fox') && (
          <>
            <FoxModel
              visionMode={visionMode}
              found={foundAnimals.includes('fox')}
              position={foxPlacement.position}
              rotationY={foxPlacement.rotationY}
              scale={foxPlacement.scale}
              camouflageTint={sceneColors.animalTint}
              camouflageBlend={sceneColors.camouflageBlend}
              onClick={handleAnimalClick('fox')}
            />
            <AnimalCover
              animal="fox"
              placement={layout.fox}
              sceneId={sceneId}
              visionMode={visionMode}
              onClick={handleMiss}
            />
          </>
        )}
      </Suspense>
    </>
  )
}

function SceneCanvas({ className = '', ...sceneProps }: ForestSceneProps & { className?: string }) {
  return (
    <div className={`scene-canvas ${className}`} aria-label="Interactive low-poly forest scene">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.6, 10], fov: 47, near: 0.1, far: 60 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ForestScene {...sceneProps} />
      </Canvas>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    window.location.hash === '#challenge' ? 'challenge' : 'home',
  )
  const [sceneId, setSceneId] = useState<SceneId>('forest')
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  const [brightness, setBrightness] = useState(1)
  const [lightAngle, setLightAngle] = useState(35)
  const [elapsed, setElapsed] = useState(0)
  const [misses, setMisses] = useState(0)
  const [foundAnimals, setFoundAnimals] = useState<AnimalId[]>([])
  const [round, setRound] = useState<RoundState>(INITIAL_ROUND)
  const [result, setResult] = useState<GameResult | null>(null)
  const startedAt = useRef(0)
  const roundComplete = foundAnimals.length === round.targetAnimals.length
  const currentLayout = round.layout

  useEffect(() => {
    if (screen !== 'challenge' || roundComplete) return
    if (startedAt.current === 0) startedAt.current = Date.now()
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      250,
    )
    return () => window.clearInterval(timer)
  }, [screen, roundComplete])

  const startChallenge = () => {
    const nextRound = createRandomRound(sceneId, round)
    startedAt.current = Date.now()
    setElapsed(0)
    setMisses(0)
    setFoundAnimals([])
    setRound(nextRound)
    setResult(null)
    setScreen('challenge')
  }

  const replaySameConditions = () => {
    if (!result) return
    startedAt.current = Date.now()
    setSceneId(result.sceneId)
    setVisionMode(result.visionMode)
    setBrightness(result.brightness)
    setLightAngle(result.lightAngle)
    setElapsed(0)
    setMisses(0)
    setFoundAnimals([])
    setResult(null)
    setScreen('challenge')
  }

  const handleSceneSelect = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const nextSceneId = event.currentTarget.dataset.scene as SceneId
    if (nextSceneId === sceneId) return
    const nextRound = createRandomRound(nextSceneId)
    startedAt.current = Date.now()
    setSceneId(nextSceneId)
    setElapsed(0)
    setMisses(0)
    setFoundAnimals([])
    setRound(nextRound)
    setResult(null)
  }

  const handleAnimalFound = (animal: AnimalId) => {
    if (foundAnimals.includes(animal)) return
    const nextFoundAnimals = [...foundAnimals, animal]
    setFoundAnimals(nextFoundAnimals)
    if (nextFoundAnimals.length < round.targetAnimals.length) return

    const finalScore = Math.max(0, 1000 - elapsed * 12 - misses * 60)
    setResult({
      elapsed,
      misses,
      score: finalScore,
      visionMode,
      brightness,
      lightAngle,
      animalsFound: nextFoundAnimals.length,
      targetAnimals: round.targetAnimals,
      sceneId,
    })
    window.setTimeout(() => setScreen('results'), 650)
  }

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => setScreen('home')}>
          <span className="brand-mark" aria-hidden="true" />
          <span>Beyond Color</span>
        </button>
        <nav aria-label="Primary navigation">
          <button className={screen === 'challenge' ? 'nav-active' : ''} type="button" onClick={startChallenge}>
            Challenge
          </button>
          <button className={screen === 'learn' ? 'nav-active' : ''} type="button" onClick={() => setScreen('learn')}>
            Learn
          </button>
        </nav>
      </header>

      {screen === 'home' && (
        <section className="home-screen">
          <SceneCanvas
            visionMode="normal"
            brightness={1.05}
            lightAngle={35}
            interactive={false}
            activeAnimals={['bear']}
            layout={HOME_LAYOUT}
            className="home-scene"
          />
          <div className="home-overlay">
            <p className="eyebrow">Interactive computer graphics experiment</p>
            <h1>
              Beyond Color
              <span>Camouflage Vision Challenge</span>
            </h1>
            <p className="home-intro">
              How does color vision affect the search for camouflaged animals? Explore a 3D forest through
              simulations of different types of color vision deficiency. Change the lighting and see how each
              viewing condition affects your ability to find wildlife.
            </p>
            <div className="home-actions">
              <button className="primary-button" type="button" onClick={startChallenge}>Start exploring</button>
            </div>
            <p className="home-disclaimer">
              These viewing modes are approximations designed for exploration, not exact representations of anyone's vision.
            </p>
          </div>
          <div className="home-cue" aria-hidden="true">Look closely: a bear is partly hidden in the forest</div>
        </section>
      )}

      {screen === 'challenge' && (
        <section className="challenge-screen">
          <div className="scene-stage">
            <div className="challenge-hud">
              <div><span>Time</span><strong>{formatTime(elapsed)}</strong></div>
              <div><span>Misses</span><strong>{misses}</strong></div>
              <div><span>Found</span><strong>{foundAnimals.length}/{round.targetAnimals.length}</strong></div>
              <div><span>Live score</span><strong>{Math.max(0, 1000 - elapsed * 12 - misses * 60)}</strong></div>
            </div>
            <div className="condition-readout" aria-live="polite">
              <span>Current conditions</span>
              <strong>
                {SCENE_LABELS[sceneId]} / {VISION_LABELS[visionMode]} / {Math.round(brightness * 100)}% light
              </strong>
            </div>
            <SceneCanvas
              sceneId={sceneId}
              visionMode={visionMode}
              brightness={brightness}
              lightAngle={lightAngle}
              foundAnimals={foundAnimals}
              activeAnimals={round.targetAnimals}
              layout={currentLayout}
              onFound={handleAnimalFound}
              onMiss={() => setMisses((value) => value + 1)}
            />
            <div className="scene-instruction">
              {round.targetAnimals.length === 1 ? 'Find and click the hidden animal' : 'Find and click both hidden animals'}
              <span>{foundAnimals.length}/{round.targetAnimals.length} found</span>
            </div>
          </div>

          <aside className="control-panel" aria-label="Vision and lighting controls">
            <div className="panel-heading">
              <p className="eyebrow">Visual experiment</p>
              <h2>Compare the scene</h2>
              <p>Change vision mode or lighting, then notice whether the animal becomes easier or harder to spot.</p>
            </div>
            <fieldset>
              <legend>Environment</legend>
              <div className="scene-grid">
                {(Object.keys(SCENE_LABELS) as SceneId[]).map((id) => (
                  <button
                    className={sceneId === id ? 'scene-active' : ''}
                    key={id}
                    type="button"
                    data-scene={id}
                    aria-pressed={sceneId === id}
                    onClick={handleSceneSelect}
                  >
                    <span className={`scene-swatch scene-swatch-${id}`} aria-hidden="true" />
                    {SCENE_LABELS[id]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Vision mode</legend>
              <div className="mode-grid">
                {(Object.keys(VISION_LABELS) as VisionMode[]).map((mode) => (
                  <button
                    className={visionMode === mode ? 'mode-active' : ''}
                    key={mode}
                    type="button"
                    aria-pressed={visionMode === mode}
                    onClick={() => setVisionMode(mode)}
                  >
                    <span className={`mode-swatch swatch-${mode}`} aria-hidden="true" />
                    {VISION_LABELS[mode]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Lighting</legend>
              <label className="range-control">
                <span>Brightness <output>{Math.round(brightness * 100)}%</output></span>
                <input
                  type="range"
                  min="0.35"
                  max="1.6"
                  step="0.05"
                  value={brightness}
                  onChange={(event) => setBrightness(Number(event.target.value))}
                />
              </label>
              <label className="range-control">
                <span>Light direction <output>{lightAngle}&deg;</output></span>
                <input
                  type="range"
                  min="-90"
                  max="180"
                  step="5"
                  value={lightAngle}
                  onChange={(event) => setLightAngle(Number(event.target.value))}
                />
              </label>
            </fieldset>
            <div className="science-note">
              These viewing modes are approximations designed for exploration, not exact representations of anyone's vision.
            </div>
          </aside>
        </section>
      )}

      {screen === 'results' && result && (
        <section className="results-screen">
          <div className="results-summary">
            <p className="eyebrow">{result.targetAnimals.length === 1 ? 'Target found' : 'Targets found'}</p>
            <h1>{result.score}</h1>
            <p className="score-label">final score</p>
            <div className="result-stats">
              <div><span>Time</span><strong>{formatTime(result.elapsed)}</strong></div>
              <div><span>Misses</span><strong>{result.misses}</strong></div>
              <div><span>Animals</span><strong>{result.animalsFound}/{result.targetAnimals.length}</strong></div>
              <div><span>Scene</span><strong>{SCENE_LABELS[result.sceneId]}</strong></div>
              <div><span>Vision</span><strong>{VISION_LABELS[result.visionMode]}</strong></div>
            </div>
            <p className="result-insight">
              {describeResult(result)}
            </p>
            <div className="home-actions">
              <button className="primary-button" type="button" onClick={replaySameConditions}>Replay same conditions</button>
              <button className="secondary-button" type="button" onClick={startChallenge}>New random challenge</button>
            </div>
          </div>
          <SceneCanvas
            sceneId={result.sceneId}
            visionMode={result.visionMode}
            brightness={result.brightness}
            lightAngle={result.lightAngle}
            interactive={false}
            foundAnimals={result.targetAnimals}
            activeAnimals={result.targetAnimals}
            layout={currentLayout}
            className="results-scene"
          />
        </section>
      )}

      {screen === 'learn' && (
        <section className="learn-screen">
          <div className="learn-heading">
            <p className="eyebrow">The graphics behind the challenge</p>
            <h1>Visibility is more than color.</h1>
            <p>Camouflage depends on several visual signals working together.</p>
          </div>
          <div className="learn-grid">
            <article><span>01</span><h2>Scene construction</h2><p>Repeated low-poly shapes create visual complexity and break up the animal's silhouette.</p></article>
            <article><span>02</span><h2>Light and shadow</h2><p>Directional light changes contrast. Shadows can reveal form or merge it into nearby foliage.</p></article>
            <article><span>03</span><h2>Color perception</h2><p>Color transforms reduce or remap differences between surfaces, changing how easily they separate.</p></article>
            <article><span>04</span><h2>Interactive detection</h2><p>Your search time and misses turn visual changes into a simple, measurable task.</p></article>
          </div>
          <div className="disclaimer">
            <strong>Scientific disclaimer</strong>
            <p>
              The vision modes are approximate educational simulations. Individual perception varies, and this experience must not be used for diagnosis or clinical assessment.
            </p>
          </div>
          <button className="primary-button" type="button" onClick={startChallenge}>Test the scene</button>
        </section>
      )}
    </main>
  )
}

export default App
