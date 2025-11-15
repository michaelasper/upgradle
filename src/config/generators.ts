import type { Generator } from '../types/game'

export const generators: Generator[] = [
  {
    id: 'ink-lathe',
    name: 'Ink Lathe',
    description: 'Prints $2/s with automated chisel arms.',
    baseCost: 260,
    costGrowth: 1.35,
    baseIncome: 2,
    tier: 1,
  },
  {
    id: 'glyph-furnace',
    name: 'Glyph Furnace',
    description: 'Refines sigils for $6/s.',
    baseCost: 520,
    costGrowth: 1.4,
    baseIncome: 6,
    tier: 2,
    requires: 'ink-lathe',
  },
  {
    id: 'vault-anvil',
    name: 'Vault Anvil',
    description: 'Heavy forge yields $14/s.',
    baseCost: 980,
    costGrowth: 1.45,
    baseIncome: 14,
    tier: 3,
    requires: 'glyph-furnace',
  },
  {
    id: 'chronicle-engine',
    name: 'Chronicle Engine',
    description: 'Narrates profits for $30/s.',
    baseCost: 1600,
    costGrowth: 1.5,
    baseIncome: 30,
    tier: 4,
    requires: 'vault-anvil',
  },
]
