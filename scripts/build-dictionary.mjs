import { mkdirSync, writeFileSync } from 'node:fs'
import words from 'word-list-json'

const LENGTHS = [5, 6, 7]

const uppercaseWords = words
  .map((word) => word.trim().toUpperCase())
  .filter((word) => /^[A-Z]+$/.test(word))

const dictionarySet = new Set(uppercaseWords)

const isSimplePlural = (word) => {
  if (word.length <= 3) return false
  if (word.endsWith('IES')) {
    const singular = `${word.slice(0, -3)}Y`
    if (dictionarySet.has(singular)) return true
  }
  if (word.endsWith('ES')) {
    const singular = word.slice(0, -2)
    if (dictionarySet.has(singular)) return true
  }
  if (word.endsWith('S')) {
    const singular = word.slice(0, -1)
    if (dictionarySet.has(singular)) return true
  }
  return false
}

const result = LENGTHS.reduce((acc, length) => {
  const seen = new Set()
  acc[length] = uppercaseWords
    .filter((word) => word.length === length)
    .filter((word) => !isSimplePlural(word))
    .filter((word) => {
      if (seen.has(word)) return false
      seen.add(word)
      return true
    })
  return acc
}, {})

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/dictionary.json', JSON.stringify(result))

console.log(
  `Dictionary generated: ${LENGTHS.map((len) => `${len} letters = ${result[len].length}`).join(', ')}`,
)
