import type { LetterMark } from './types/game'
import type { WordLength } from './dictionary'

export const LOG_LIMIT = 8

export const KEYBOARD_ROWS: string[][] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

export const LETTER_PRIORITY: Record<LetterMark, number> = {
  correct: 2,
  present: 1,
  miss: 0,
}

export const TIER_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 6,
  3: 14,
}

export const WORD_REWARD: Record<WordLength, number> = {
  5: 1,
  6: 2,
  7: 3,
}
