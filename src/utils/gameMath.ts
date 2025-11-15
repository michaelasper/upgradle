import type { GameState, Generator, Upgrade } from '../types/game'

export const getGeneratorCost = (generator: Generator, owned: number) =>
  Math.ceil(generator.baseCost * Math.pow(generator.costGrowth, owned))

export const getUpgradeCost = (upgrade: Upgrade, level: number) =>
  Math.ceil(upgrade.baseCost * Math.pow(upgrade.costGrowth, level))

export const getTotalUpgradeLevels = (state: GameState) =>
  Object.values(state.upgradeLevels).reduce((sum, level) => sum + level, 0)

export const getPassiveIncome = (state: GameState, generatorList: Generator[]) => {
  const base = generatorList.reduce((total, generator) => {
    const owned = state.generatorLevels[generator.id] ?? 0
    if (!owned) return total
    return total + owned * generator.baseIncome
  }, 0)
  return base * state.idleMultiplier
}
