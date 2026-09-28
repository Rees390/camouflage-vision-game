import { Canvas, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './App.css'

type Screen = 'home' | 'challenge' | 'results' | 'learn'
type VisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'grayscale'
type AnimalId = 'bear' | 'deer'
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
  animalsFound: number
  targetAnimals: AnimalId[]
  sceneId: SceneId
}

const ROUND_LAYOUTS: Record<SceneId, RoundLayout[]> = {
  forest: [
    {
      bear: { position: [3.75, 0, -0.25], rotationY: -0.45, scale: 0.44 },
      deer: { position: [-3.45, 0, -1.7], rotationY: -0.12, scale: 0.43 },
    },
    {
      bear: { position: [-2.35, 0, -4.15], rotationY: 0.32, scale: 0.45 },
      deer: { position: [2.85, 0, -4.2], rotationY: -0.62, scale: 0.44 },
    },
    {
      bear: { position: [2.75, 0, -3.7], rotationY: -0.55, scale: 0.43 },
      deer: { position: [-3.8, 0, -2.65], rotationY: 0.18, scale: 0.42 },
    },
  ],
  desert: [
    {
      bear: { position: [3.85, 0, -2.25], rotationY: -0.5, scale: 0.43 },
      deer: { position: [-4.05, 0, -3.25], rotationY: 0.22, scale: 0.42 },
    },
    {
      bear: { position: [-3.65, 0, -2.1], rotationY: 0.38, scale: 0.44 },
      deer: { position: [3.45, 0, -3.15], rotationY: -0.52, scale: 0.42 },
    },
    {
      bear: { position: [2.55, 0, -4.6], rotationY: -0.35, scale: 0.42 },
      deer: { position: [-2.85, 0, -4.35], rotationY: 0.28, scale: 0.41 },
    },
  ],
  grassland: [
    {
      bear: { position: [-3.4, 0, -2.3], rotationY: 0.3, scale: 0.44 },
      deer: { position: [3.25, 0, -3.2], rotationY: -0.48, scale: 0.42 },
    },
    {
      bear: { position: [3.5, 0, -2.5], rotationY: -0.4, scale: 0.43 },
      deer: { position: [-3.15, 0, -3.55], rotationY: 0.2, scale: 0.42 },
    },
    {
      bear: { position: [-2.5, 0, -4.5], rotationY: 0.35, scale: 0.42 },
      deer: { position: [2.65, 0, -4.45], rotationY: -0.42, scale: 0.41 },
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
    scale: animal === 'bear' ? 0.42 + Math.random() * 0.035 : 0.4 + Math.random() * 0.03,
    coverVariant: Math.floor(Math.random() * 3),
  }
}

function createRandomRound(sceneId: SceneId, previous?: RoundState): RoundState {
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
    },
    targetAnimals,
  }
}

const INITIAL_ROUND = createRandomRound('forest')

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
    camouflageBlend: 0.34,
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
  useEffect(() => camera.lookAt(0, 1, 0), [camera])
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
  const gltf = useLoader(GLTFLoader, '/models/forest/sitting_bear.glb')
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
  const gltf = useLoader(GLTFLoader, '/models/forest/wild_deer.glb')
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

type NightForestModelProps = {
  visionMode: VisionMode
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

function NightForestModel({ visionMode, onClick }: NightForestModelProps) {
  const gltf = useLoader(GLTFLoader, '/models/forest/night_forest.glb')
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

  return <primitive object={forest} onClick={onClick} />
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
]

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
]

const GRASS_TUFTS: Position3[] = [
  [-4.5, 0, -2.5], [-3.4, 0, -0.6], [-2.2, 0, -3.2], [-1.2, 0, 1.9],
  [0.1, 0, -3.4], [1.1, 0, 2.2], [2.4, 0, -2.7], [3.5, 0, -0.4],
  [4.6, 0, -2], [-4.2, 0, 2.5], [2.9, 0, 2.7], [4.7, 0, 1.8],
  [-5.2, 0, -4.5], [-3.2, 0, -4.8], [-1.4, 0, -5.2], [0.8, 0, -5.4],
  [2.1, 0, -4.6], [4.2, 0, -4.3], [-5.1, 0, 0.4], [-2.7, 0, 0.8],
  [0.3, 0, 0.7], [2.2, 0, 0.5], [4.8, 0, 0.2], [0, 0, 3.1],
]

const GRASS_SHRUBS: Position3[] = [
  [-4, 0, -3.1], [4.1, 0, -2.8], [-1.8, 0, -5.5], [1.7, 0, -5.7],
  [-5, 0, 1.2], [5, 0, 1.1],
]

const GRASS_TREES: Array<{ position: Position3; scale: number }> = [
  { position: [-5.2, 0, -4.8], scale: 1 },
  { position: [5.1, 0, -4.2], scale: 0.95 },
  { position: [-3.2, 0, -7], scale: 0.82 },
  { position: [3.45, 0, -6.7], scale: 0.78 },
  { position: [-6.1, 0, 0.4], scale: 0.72 },
  { position: [6.15, 0, 0.2], scale: 0.68 },
]

function DesertModel({ visionMode, onClick }: NightForestModelProps) {
  const colors = useMemo(
    () => ({
      ground: transformColor('#a88453', visionMode),
      dune: transformColor('#b79460', visionMode),
      rock: transformColor('#68513d', visionMode),
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
      {GRASS_SHRUBS.map((position, index) => (
        <group key={index} position={position}>
          <mesh castShadow position={[-0.28, 0.38, 0]} scale={[0.62, 0.46, 0.52]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.grassDark} roughness={1} flatShading />
          </mesh>
          <mesh castShadow position={[0.32, 0.34, 0.05]} scale={[0.56, 0.42, 0.48]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.canopy} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      {GRASS_TREES.map((tree, index) => (
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
  const width = animal === 'bear' ? 1 : 0.82
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
            position={[offset * width, 0.45 + (index % 2) * 0.08, index === 1 ? 0.08 : 0]}
            scale={[0.65 * width, 0.55, 0.48]}
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
          <mesh castShadow position={[0.18 * width, 0.78, 0.04]} scale={[0.7 * width, 0.5, 0.46]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={colors.forestB} roughness={1} flatShading />
          </mesh>
        )}
      </group>
    )
  }

  if (sceneId === 'desert') {
    const variant = placement.coverVariant ?? 0
    return (
      <group position={[x, 0, z + 0.68]} onClick={onClick}>
        <mesh
          castShadow
          receiveShadow
          position={[-0.18 * width, 0.46, 0]}
          rotation={[0.08, 0.5, -0.08]}
          scale={[0.95 * width, 0.64, 0.56]}
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
            position={[0.55 * width, 0.29 + variant * 0.05, 0.06]}
            rotation={[0.1, -0.35, 0.08]}
            scale={[0.55 * width, 0.38 + variant * 0.05, 0.42]}
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
              position={layout.bear.position}
              rotationY={layout.bear.rotationY}
              scale={layout.bear.scale}
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
              position={layout.deer.position}
              rotationY={layout.deer.rotationY}
              scale={layout.deer.scale}
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
        camera={{ position: [0, 5.3, 10], fov: 47, near: 0.1, far: 60 }}
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
            className="home-scene"
          />
          <div className="home-overlay">
            <p className="eyebrow">Camouflage vision challenge</p>
            <h1>Beyond Color</h1>
            <p className="home-intro">
              Change light and color perception, then test whether camouflage still works.
            </p>
            <div className="home-actions">
              <button className="primary-button" type="button" onClick={startChallenge}>Start challenge</button>
              <button className="secondary-button" type="button" onClick={() => setScreen('learn')}>
                Explore the science
              </button>
            </div>
          </div>
          <div className="home-cue" aria-hidden="true">Lighting / Color / Contrast / Detection</div>
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
              {round.targetAnimals.length === 1 ? 'Find the hidden animal' : 'Find both hidden animals'}
              {' - '}{foundAnimals.length}/{round.targetAnimals.length} found
            </div>
          </div>

          <aside className="control-panel" aria-label="Vision and lighting controls">
            <div className="panel-heading">
              <p className="eyebrow">Vision lab</p>
              <h2>Change what you see</h2>
              <p>Compare how color and illumination alter the same scene.</p>
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
              <legend>Color display</legend>
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
                <span>Light direction <output>{lightAngle}°</output></span>
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
              These filters are approximate educational simulations, not diagnostic tools.
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
              Changes in hue, luminance, and shadow can separate an animal from its background or make its outline harder to detect.
            </p>
            <div className="home-actions">
              <button className="primary-button" type="button" onClick={startChallenge}>Try again</button>
              <button className="secondary-button" type="button" onClick={() => setScreen('learn')}>Learn why</button>
            </div>
          </div>
          <SceneCanvas
            sceneId={result.sceneId}
            visionMode={result.visionMode}
            brightness={brightness}
            lightAngle={lightAngle}
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
