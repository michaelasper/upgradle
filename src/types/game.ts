import type { WordLength as DictionaryWordLength } from '../dictionary'

export type WordLength = DictionaryWordLength

export type LetterMark = 'correct' | 'present' | 'miss'

export type GuessRow = {
  id: string
  word: string
  marks: LetterMark[]
  payout: number
}

export type UpgradeEffect = {
  payoutBonus?: number
  payoutMultiplier?: number
  guessLimit?: number
  unlockLength?: WordLength
  showHotCold?: boolean
}

export type Upgrade = {
  id: string
  name: string
  description: string
  baseCost: number
  costGrowth: number
  maxLevel: number | null
  tier: number
  wordCost?: number
  requires?: string
  effect: UpgradeEffect
}

export type Generator = {
  id: string
  name: string
  description: string
  baseCost: number
  costGrowth: number
  baseIncome: number
  tier: number
  requires?: string
}

export type GameState = {
  money: number
  totalEarned: number
  words: number
  unlockedLengths: WordLength[]
  selectedLength: WordLength
  guesses: GuessRow[]
  currentWord: string
  currentInput: string
  guessLimit: number
  puzzleComplete: boolean
  solved: boolean
  upgradeLevels: Record<string, number>
  payoutBonus: number
  payoutMultiplier: number
  showHotCold: boolean
  log: string[]
  puzzleNumber: number
  puzzlesSolved: number
  puzzleStatus: string | null
  generatorLevels: Record<string, number>
  hintReveals: Record<number, string>
}

export type GameAction =
  | { type: 'setLength'; length: WordLength }
  | { type: 'inputLetter'; letter: string }
  | { type: 'removeLetter' }
  | { type: 'submitGuess' }
  | { type: 'startNextPuzzle' }
  | { type: 'buyUpgrade'; id: string }
  | { type: 'buyGenerator'; id: string }
  | { type: 'tick' }
