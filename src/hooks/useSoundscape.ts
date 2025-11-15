import { useCallback, useRef } from 'react'

type TonePattern = {
  frequency: number
  duration?: number
  delay?: number
  volume?: number
  attack?: number
  release?: number
  type?: OscillatorType
}

const useSoundscape = () => {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!contextRef.current) {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return null
      contextRef.current = new AudioCtor()
    }
    const context = contextRef.current
    if (context?.state === 'suspended') {
      void context.resume().catch(() => undefined)
    }
    return context
  }, [])

  const playTone = useCallback(
    (patterns: TonePattern | TonePattern[]) => {
      const context = getContext()
      if (!context) return
      const queue = Array.isArray(patterns) ? patterns : [patterns]
      const startTime = context.currentTime
      queue.forEach((pattern, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const duration = pattern.duration ?? 0.16
        const attack = pattern.attack ?? 0.02
        const release = pattern.release ?? 0.12
        const delay = pattern.delay ?? 0
        const playAt = startTime + index * 0.02 + delay
        const stopAt = playAt + duration + release
        oscillator.type = pattern.type ?? 'sine'
        oscillator.frequency.value = pattern.frequency
        oscillator.connect(gain)
        gain.connect(context.destination)
        const volume = pattern.volume ?? 0.15
        gain.gain.setValueAtTime(0, playAt)
        gain.gain.linearRampToValueAtTime(volume, playAt + attack)
        gain.gain.linearRampToValueAtTime(0, stopAt)
        oscillator.start(playAt)
        oscillator.stop(stopAt + 0.02)
      })
    },
    [getContext],
  )

  const playKey = useCallback(() => {
    const base = 240 + Math.random() * 60
    playTone({
      frequency: base,
      duration: 0.07,
      volume: 0.1,
      type: 'triangle',
    })
  }, [playTone])

  const playErase = useCallback(() => {
    playTone({
      frequency: 120,
      duration: 0.08,
      volume: 0.09,
      type: 'sawtooth',
    })
  }, [playTone])

  const playReveal = useCallback(() => {
    playTone([
      { frequency: 280, duration: 0.1, type: 'triangle', volume: 0.12 },
      { frequency: 360, duration: 0.12, delay: 0.04, type: 'triangle', volume: 0.12 },
      { frequency: 420, duration: 0.14, delay: 0.08, type: 'triangle', volume: 0.13 },
    ])
  }, [playTone])

  const playSuccess = useCallback(() => {
    playTone([
      { frequency: 420, duration: 0.14, type: 'sine', volume: 0.16 },
      { frequency: 520, duration: 0.16, delay: 0.08, type: 'triangle', volume: 0.18 },
      { frequency: 640, duration: 0.2, delay: 0.16, type: 'triangle', volume: 0.18 },
    ])
  }, [playTone])

  const playFail = useCallback(() => {
    playTone([
      { frequency: 160, duration: 0.18, type: 'square', volume: 0.14 },
      { frequency: 110, duration: 0.2, delay: 0.12, type: 'square', volume: 0.12 },
    ])
  }, [playTone])

  const playUpgrade = useCallback(() => {
    playTone([
      { frequency: 500, duration: 0.12, type: 'triangle', volume: 0.13 },
      { frequency: 640, duration: 0.12, delay: 0.05, type: 'triangle', volume: 0.15 },
    ])
  }, [playTone])

  const playGenerator = useCallback(() => {
    playTone([
      { frequency: 200, duration: 0.12, type: 'square', volume: 0.12 },
      { frequency: 260, duration: 0.12, delay: 0.04, type: 'square', volume: 0.12 },
    ])
  }, [playTone])

  return {
    playKey,
    playErase,
    playReveal,
    playSuccess,
    playFail,
    playUpgrade,
    playGenerator,
  }
}

export { useSoundscape }
