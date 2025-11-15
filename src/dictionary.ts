import dictionaryUrl from './data/dictionary.json?url'

export const WORD_LENGTHS = [5, 6, 7] as const
export type WordLength = (typeof WORD_LENGTHS)[number]

type WordBuckets = Record<WordLength, string[]>

type WordSets = Record<WordLength, Set<string>>

const response = await fetch(dictionaryUrl)
if (!response.ok) {
  throw new Error('Failed to load dictionary.')
}
const dictionaryData = (await response.json()) as WordBuckets

const bucketed = dictionaryData

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
