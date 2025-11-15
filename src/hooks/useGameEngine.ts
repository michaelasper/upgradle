import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { isValidWord, pickWord } from '../dictionary'
import { generators } from '../config/generators'
import { upgrades } from '../config/upgrades'
import { LETTER_PRIORITY, LOG_LIMIT, TIER_REQUIREMENTS, WORD_REWARD } from '../constants'
import type {
  GameAction,
  GameState,
  LetterMark,
  Upgrade,
  WordLength,
} from '../types/game'
import {
  getGeneratorCost,
  getPassiveIncome,
  getTotalUpgradeLevels,
  getUpgradeCost,
} from '../utils/gameMath'

const STORAGE_KEY = 'upgradle-state'

const pushLog = (log: string[], entry: string) => [entry, ...log].slice(0, LOG_LIMIT)

const createInitialState = (): GameState => {
  const base: GameState = {
    money: 0,
    totalEarned: 0,
    words: 0,
    unlockedLengths: [5],
    selectedLength: 5,
    guesses: [],
    currentWord: '',
    currentInput: '',
    guessLimit: 6,
    puzzleComplete: false,
    solved: false,
    upgradeLevels: {},
    payoutBonus: 0,
    payoutMultiplier: 1,
    showHotCold: false,
    log: ['Welcome to Upgradle. Enter words to mint cash.'],
    puzzleNumber: 0,
    puzzlesSolved: 0,
    puzzleStatus: null,
    generatorLevels: {},
    hintReveals: {},
  }

  return startPuzzle(base, base.selectedLength, 'New 5-letter word active.')
}

const loadPersistedState = (): GameState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const fallback = createInitialState()
    return {
      ...fallback,
      ...parsed,
      upgradeLevels: parsed.upgradeLevels ?? fallback.upgradeLevels,
      generatorLevels: parsed.generatorLevels ?? fallback.generatorLevels,
      hintReveals: parsed.hintReveals ?? fallback.hintReveals,
      log: parsed.log ?? fallback.log,
    }
  } catch (error) {
    console.warn('Failed to load save state', error)
    return null
  }
}

const startPuzzle = (state: GameState, length: WordLength, message?: string): GameState => {
  const word = pickWord(length)
  return {
    ...state,
    selectedLength: length,
    currentWord: word,
    guesses: [],
    currentInput: '',
    puzzleComplete: false,
    solved: false,
    puzzleStatus: null,
    puzzleNumber: state.puzzleNumber + 1,
    log: message ? pushLog(state.log, message) : state.log,
    hintReveals: {},
  }
}

const evaluateGuess = (guess: string, target: string) => {
  const marks: LetterMark[] = Array(target.length).fill('miss')
  const remaining: Record<string, number> = {}

  for (let i = 0; i < target.length; i += 1) {
    if (guess[i] === target[i]) {
      marks[i] = 'correct'
    } else {
      const letter = target[i]
      remaining[letter] = (remaining[letter] ?? 0) + 1
    }
  }

  for (let i = 0; i < target.length; i += 1) {
    if (marks[i] === 'correct') continue
    const letter = guess[i]
    if (remaining[letter]) {
      marks[i] = 'present'
      remaining[letter] -= 1
    }
  }

  let basePayout = 5
  let correctCount = 0
  marks.forEach((mark) => {
    if (mark === 'correct') {
      basePayout += 6
      correctCount += 1
    } else if (mark === 'present') basePayout += 3
    else basePayout += 1
  })

  const solved = guess === target
  if (solved) {
    basePayout += 40 + target.length * 4
  }
  basePayout += correctCount * 6

  return { marks, basePayout, solved }
}

const applyUpgradeEffect = (
  state: GameState,
  upgrade: Upgrade,
  previousLevel: number,
): GameState => {
  let next = { ...state }
  const effect = upgrade.effect

  if (effect.unlockLength && previousLevel === 0) {
    if (!next.unlockedLengths.includes(effect.unlockLength)) {
      next = {
        ...next,
        unlockedLengths: [...next.unlockedLengths, effect.unlockLength].sort((a, b) => a - b) as (
          5 | 6 | 7
        )[],
      }
    }
  }

  if (effect.showHotCold && previousLevel === 0) {
    next = {
      ...next,
      showHotCold: true,
      log: pushLog(next.log, 'Heat signatures now online.'),
    }
  }

  if (effect.payoutBonus) {
    next = {
      ...next,
      payoutBonus: next.payoutBonus + effect.payoutBonus,
    }
  }

  if (effect.payoutMultiplier && previousLevel === 0) {
    next = {
      ...next,
      payoutMultiplier: next.payoutMultiplier * effect.payoutMultiplier,
    }
  }

  if (effect.guessLimit) {
    next = {
      ...next,
      guessLimit: next.guessLimit + effect.guessLimit,
    }
  }

  return next
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'setLength': {
      if (!state.unlockedLengths.includes(action.length)) return state
      const message = `Switched to ${action.length}-letter words.`
      return startPuzzle({ ...state }, action.length, message)
    }
    case 'inputLetter': {
      if (state.puzzleComplete || state.currentInput.length >= state.selectedLength) return state
      return {
        ...state,
        currentInput: `${state.currentInput}${action.letter}`,
      }
    }
    case 'removeLetter': {
      if (state.puzzleComplete || !state.currentInput.length) return state
      return {
        ...state,
        currentInput: state.currentInput.slice(0, -1),
      }
    }
    case 'submitGuess': {
      if (state.puzzleComplete) return state
      if (state.currentInput.length !== state.selectedLength) {
        return {
          ...state,
          log: pushLog(state.log, 'Need a full-length word to submit.'),
        }
      }

      const guess = state.currentInput
      if (!isValidWord(guess, state.selectedLength)) {
        return {
          ...state,
          log: pushLog(state.log, 'Ledger rejects unknown words.'),
        }
      }

      let hintReveals = state.hintReveals
      let wordsBalance = state.words
      let logSeed = state.log
      if (Math.random() < 0.01) {
        const availableSlots = Array.from({ length: state.selectedLength })
          .map((_, index) => index)
          .filter((index) => !hintReveals[index])
        if (availableSlots.length) {
          const revealIndex = availableSlots[Math.floor(Math.random() * availableSlots.length)]
          const revealLetter = state.currentWord[revealIndex]
          hintReveals = {
            ...hintReveals,
            [revealIndex]: revealLetter,
          }
          const slotLabel = `slot ${revealIndex + 1}`
          logSeed = pushLog(logSeed, `Lucky spark! ${slotLabel} revealed as ${revealLetter}.`)
        }
      }

      const evaluation = evaluateGuess(guess, state.currentWord)
      const payout = (evaluation.basePayout + state.payoutBonus) * state.payoutMultiplier

      const guessRow = {
        id: `${state.puzzleNumber}-${state.guesses.length}`,
        word: guess,
        marks: evaluation.marks,
        payout,
      }

      let log = pushLog(logSeed, `Guess ${guess} minted $${payout.toFixed(0)}.`)

      const guesses = [...state.guesses, guessRow]
      const money = state.money + payout
      const totalEarned = state.totalEarned + payout

      let puzzleComplete: boolean = state.puzzleComplete
      let solvedFlag: boolean = state.solved
      let puzzleStatus = state.puzzleStatus
      let puzzlesSolved = state.puzzlesSolved

      if (evaluation.solved) {
        puzzleComplete = true
        solvedFlag = true
        puzzlesSolved += 1
        const wordReward = WORD_REWARD[state.selectedLength as 5 | 6 | 7] ?? 1
        wordsBalance += wordReward
        puzzleStatus = `Solved in ${guesses.length} guesses.`
        log = pushLog(
          log,
          `Word minted! Earned ${wordReward} word${wordReward > 1 ? 's' : ''}. Bank the payout and grab another.`,
        )
      } else if (guesses.length >= state.guessLimit) {
        puzzleComplete = true
        puzzleStatus = `Word collapsed. The answer was ${state.currentWord}.`
        log = pushLog(log, `Word revealed: ${state.currentWord}.`)
      }

      return {
        ...state,
        guesses,
        money,
        totalEarned,
        currentInput: '',
        log,
        puzzleComplete,
        solved: solvedFlag,
        puzzleStatus,
        puzzlesSolved,
        hintReveals,
        words: wordsBalance,
      }
    }
    case 'startNextPuzzle': {
      const message = `New ${state.selectedLength}-letter word ready.`
      return startPuzzle({ ...state, solved: false }, state.selectedLength, message)
    }
    case 'buyUpgrade': {
      const upgrade = upgrades.find((u) => u.id === action.id)
      if (!upgrade) return state
      const currentLevel = state.upgradeLevels[upgrade.id] ?? 0
      if (upgrade.maxLevel !== null && currentLevel >= upgrade.maxLevel) return state

      if (upgrade.requires) {
        const reqLevel = state.upgradeLevels[upgrade.requires] ?? 0
        if (reqLevel <= 0) return state
      }
      const tierRequirement = TIER_REQUIREMENTS[upgrade.tier] ?? 0
      if (getTotalUpgradeLevels(state) < tierRequirement) return state
      const cost = getUpgradeCost(upgrade, currentLevel)
      if (state.money < cost) return state
      let wordsBalance = state.words
      if (upgrade.wordCost) {
        if (wordsBalance < upgrade.wordCost) return state
        wordsBalance -= upgrade.wordCost
      }

      let nextState: GameState = {
        ...state,
        money: state.money - cost,
        upgradeLevels: {
          ...state.upgradeLevels,
          [upgrade.id]: currentLevel + 1,
        },
        words: wordsBalance,
        log: pushLog(state.log, `Tiered ${upgrade.name} to Lv.${currentLevel + 1}.`),
      }

      nextState = applyUpgradeEffect(nextState, upgrade, currentLevel)
      return nextState
    }
    case 'buyGenerator': {
      const generator = generators.find((g) => g.id === action.id)
      if (!generator) return state
      if (generator.requires) {
        const priorLevel = state.generatorLevels[generator.requires] ?? 0
        if (priorLevel === 0) return state
      }
      const owned = state.generatorLevels[generator.id] ?? 0
      const price = getGeneratorCost(generator, owned)
      if (state.money < price) return state
      return {
        ...state,
        money: state.money - price,
        generatorLevels: {
          ...state.generatorLevels,
          [generator.id]: owned + 1,
        },
        log: pushLog(state.log, `Expanded ${generator.name}.`),
      }
    }
    case 'tick': {
      const passive = getPassiveIncome(state, generators)
      if (passive <= 0) return state
      return {
        ...state,
        money: state.money + passive,
        totalEarned: state.totalEarned + passive,
      }
    }
    default:
      return state
  }
}

export const useGameEngine = () => {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadPersistedState() ?? createInitialState())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const boardRows = useMemo(() => {
    const rows = [...state.guesses]
    if (!state.puzzleComplete) {
      rows.push({
        id: 'current',
        word: state.currentInput.padEnd(state.selectedLength, ' '),
        marks: Array(state.selectedLength).fill('miss'),
        payout: 0,
      })
    }
    while (rows.length < state.guessLimit) {
      rows.push({
        id: `empty-${rows.length}`,
        word: ''.padEnd(state.selectedLength, ' '),
        marks: Array(state.selectedLength).fill('miss'),
        payout: 0,
      })
    }
    return rows
  }, [state])

  const sortedUpgrades = useMemo(() => {
    const clone = [...upgrades]
    clone.sort((a, b) => {
      const wordDiff = (a.wordCost ?? 0) - (b.wordCost ?? 0)
      if (wordDiff !== 0) return wordDiff
      return a.baseCost - b.baseCost
    })
    return clone
  }, [])

  const upgradeTierOrder = useMemo(
    () => Array.from(new Set(sortedUpgrades.map((upgrade) => upgrade.tier))).sort((a, b) => a - b),
    [sortedUpgrades],
  )

  const generatorTierOrder = useMemo(
    () => Array.from(new Set(generators.map((generator) => generator.tier))).sort((a, b) => a - b),
    [],
  )

  const highestGeneratorTierUnlocked = useMemo(() => {
    return generators.reduce((max, generator) => {
      const level = state.generatorLevels[generator.id] ?? 0
      if (level > 0) return Math.max(max, generator.tier)
      return max
    }, 0)
  }, [state.generatorLevels])

  const visibleGeneratorTiers = useMemo(() => {
    const highestVisible = Math.max(1, highestGeneratorTierUnlocked + 1)
    return generatorTierOrder.filter((tier) => tier <= highestVisible)
  }, [generatorTierOrder, highestGeneratorTierUnlocked])

  const keyboardState = useMemo(() => {
    const status: Record<string, LetterMark> = {}
    state.guesses.forEach((guess) => {
      guess.word.split('').forEach((letter, index) => {
        const upper = letter.toUpperCase()
        if (!upper.trim()) return
        const mark = guess.marks[index]
        const prev = status[upper]
        if (!prev || LETTER_PRIORITY[mark] > LETTER_PRIORITY[prev]) {
          status[upper] = mark
        }
      })
    })
    return status
  }, [state.guesses])

  const handlePhysicalKey = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key
      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault()
        dispatch({ type: 'inputLetter', letter: key.toUpperCase() })
        return
      }
      if (key === 'Backspace') {
        event.preventDefault()
        dispatch({ type: 'removeLetter' })
        return
      }
      if (key === 'Enter') {
        event.preventDefault()
        dispatch({ type: 'submitGuess' })
      }
    },
    [dispatch],
  )

  const handleVirtualKey = useCallback(
    (key: string) => {
      if (key === 'ENTER') {
        dispatch({ type: 'submitGuess' })
        return
      }
      if (key === 'BACKSPACE') {
        dispatch({ type: 'removeLetter' })
        return
      }
      if (/^[A-Z]$/.test(key)) {
        dispatch({ type: 'inputLetter', letter: key })
      }
    },
    [dispatch],
  )

  const passiveIncome = useMemo(() => getPassiveIncome(state, generators), [state])
  const totalUpgradeLevels = useMemo(() => getTotalUpgradeLevels(state), [state.upgradeLevels])

  return {
    state,
    dispatch,
    boardRows,
    sortedUpgrades,
    upgradeTierOrder,
    visibleGeneratorTiers,
    keyboardState,
    handlePhysicalKey,
    handleVirtualKey,
    passiveIncome,
    totalUpgradeLevels,
  }
}

export { createInitialState, reducer }
