import dictionaryUrl from './data/dictionary.json?url'

export const WORD_LENGTHS = [5, 6, 7] as const
export type WordLength = (typeof WORD_LENGTHS)[number]

type WordBuckets = Record<WordLength, string[]>

type WordSets = Record<WordLength, Set<string>>

const fallbackDictionary: WordBuckets = {
  5: ['CRANE', 'SLATE', 'PRIZE', 'CHORD', 'MONTH'],
  6: ['PLANET', 'STREAM', 'GARNET', 'THRIVE', 'BUNDLE'],
  7: ['CAPTURE', 'VICTORY', 'ANALOG', 'PRAISED', 'MYSTERY'],
}

let bucketed: WordBuckets
try {
  const response = await fetch(dictionaryUrl)
  if (!response.ok) {
    throw new Error(`Failed to load dictionary: ${response.status}`)
  }
  bucketed = (await response.json()) as WordBuckets
} catch (error) {
  console.error('Failed to load dictionary, falling back to minimal list.', error)
  bucketed = fallbackDictionary
}

const bucketSets: WordSets = WORD_LENGTHS.reduce((acc, length) => {
  acc[length] = new Set(bucketed[length])
  return acc
}, {} as WordSets)

export const pickWord = (length: WordLength) => {
  const list = bucketed[length]
  return list[Math.floor(Math.random() * list.length)]
}

export const isValidWord = (word: string, length: WordLength) =>
  bucketSets[length].has(word.toUpperCase())

export const getWordList = (length: WordLength) => bucketed[length]
