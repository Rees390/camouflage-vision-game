export type GameAnimalId = 'bear' | 'deer' | 'fox'
export type GameSceneId = 'forest' | 'desert' | 'grassland'

type RandomSource = () => number

export function calculateScore(elapsedSeconds: number, misses: number) {
  return Math.max(0, 1000 - elapsedSeconds * 12 - misses * 60)
}

export function chooseTargetAnimals(
  sceneId: GameSceneId,
  random: RandomSource = Math.random,
): GameAnimalId[] {
  if (sceneId === 'desert') return ['fox']
  if (random() >= 0.45) return ['bear', 'deer']
  return [random() < 0.5 ? 'bear' : 'deer']
}
