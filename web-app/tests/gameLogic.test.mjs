import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateScore, chooseTargetAnimals } from '../src/gameLogic.ts'

function sequenceRandom(...values) {
  let index = 0
  return () => values[index++]
}

test('score starts at 1000 and applies time and miss penalties', () => {
  assert.equal(calculateScore(0, 0), 1000)
  assert.equal(calculateScore(10, 2), 760)
})

test('score never becomes negative', () => {
  assert.equal(calculateScore(100, 20), 0)
})

test('desert rounds always target the fennec fox', () => {
  assert.deepEqual(chooseTargetAnimals('desert'), ['fox'])
})

test('forest and grassland rounds can target either animal or both', () => {
  assert.deepEqual(chooseTargetAnimals('forest', sequenceRandom(0.2, 0.2)), ['bear'])
  assert.deepEqual(chooseTargetAnimals('grassland', sequenceRandom(0.2, 0.8)), ['deer'])
  assert.deepEqual(chooseTargetAnimals('forest', sequenceRandom(0.8)), ['bear', 'deer'])
})
