import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { GameState } from '../../src/types/game'

const STORAGE_KEY = 'upgradle-state'

const createSeedState = (overrides: Partial<GameState> = {}): GameState => ({
  money: 0,
  totalEarned: 0,
  words: 0,
  unlockedLengths: [5],
  selectedLength: 5,
  guesses: [],
  currentWord: 'CRANE',
  currentInput: '',
  guessLimit: 6,
  puzzleComplete: false,
  solved: false,
  upgradeLevels: {},
  payoutBonus: 0,
  payoutMultiplier: 1,
  showHotCold: false,
  log: ['E2E seed ready.'],
  puzzleNumber: 1,
  puzzlesSolved: 0,
  puzzleStatus: null,
  generatorLevels: {},
  hintReveals: {},
  tileFlipDuration: 1000,
  ...overrides,
})

const seedAndVisit = async (page: Page, overrides: Partial<GameState>) => {
  const state = createSeedState(overrides)
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(state)],
  )
  await page.goto('/')
}

test('solving a word updates the board state', async ({ page }) => {
  const targetWord = 'APPLE'
  await seedAndVisit(page, {
    currentWord: targetWord,
    selectedLength: 5,
    unlockedLengths: [5],
    guesses: [],
    currentInput: '',
    puzzleComplete: false,
    solved: false,
    puzzleStatus: null,
  })

  await expect(page.getByRole('heading', { name: 'Upgradle' })).toBeVisible()
  await page.keyboard.type(targetWord)
  await page.keyboard.press('Enter')

  await expect(page.getByText('Solved in 1 guesses.')).toBeVisible()
  const firstRow = page.locator('.guess-row').first()
  await expect(firstRow.locator('.tile.correct')).toHaveCount(targetWord.length)
})

test('idle income accrues when generators are owned', async ({ page }) => {
  await seedAndVisit(page, {
    generatorLevels: { 'ink-lathe': 1 },
    money: 0,
    totalEarned: 0,
  })

  const moneyValue = page.locator('.top-stats > div').first().locator('strong')
  await expect(moneyValue).toHaveText('$0')
  await expect(moneyValue).toHaveText('$2', { timeout: 4000 })
})
