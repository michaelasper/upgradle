import { describe, it, expect, vi } from 'vitest'
import { createInitialState, reducer } from './useGameEngine'

vi.mock('../dictionary', () => ({
  pickWord: () => 'APPLE',
  isValidWord: () => true,
}))

describe('submitGuess reducer', () => {
  it('initializes with a live puzzle word', () => {
    const initial = createInitialState()
    expect(initial.currentWord.length).toBe(initial.selectedLength)
    expect(initial.puzzleComplete).toBe(false)
  })

  it('marks puzzle as complete when submitting a full word', () => {
    const base = {
      ...createInitialState(),
      currentWord: 'APPLE',
      selectedLength: 5 as const,
      currentInput: 'APPLE',
    }

    const next = reducer(base, { type: 'submitGuess' })

    expect(next.puzzleComplete).toBe(true)
    expect(next.guesses).toHaveLength(1)
    expect(next.words).toBeGreaterThan(base.words)
  })

  it('rejects submission when letters are missing', () => {
    const base = {
      ...createInitialState(),
      currentWord: 'APPLE',
      selectedLength: 5 as const,
      currentInput: 'APP',
    }

    const next = reducer(base, { type: 'submitGuess' })

    expect(next.puzzleComplete).toBe(false)
    expect(next.guesses).toHaveLength(0)
  })
})
