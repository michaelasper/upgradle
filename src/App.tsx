import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { KEYBOARD_ROWS, TIER_REQUIREMENTS } from './constants'
import { WORD_LENGTHS } from './dictionary'
import { useGameEngine } from './hooks/useGameEngine'
import { generators } from './config/generators'
import { getGeneratorCost, getUpgradeCost } from './utils/gameMath'
import { useSoundscape } from './hooks/useSoundscape'

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 0 })

const getHeatClass = (letter: string, index: number, target: string) => {
  const targetLetter = target[index]
  if (!targetLetter || !letter) return 'heat-cold'
  const diff = Math.abs(letter.charCodeAt(0) - targetLetter.charCodeAt(0))
  if (diff <= 2) return 'heat-hot'
  if (diff <= 5) return 'heat-warm'
  return 'heat-cold'
}

function App() {
  const { playKey, playErase, playReveal, playSuccess, playFail, playUpgrade, playGenerator } =
    useSoundscape()
  const {
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
  } = useGameEngine()
  const generatorUnits = Object.values(state.generatorLevels).reduce((sum, level) => sum + level, 0)
  const appStyle = {
    '--tile-flip-speed': `${state.tileFlipDuration}ms`,
  } as CSSProperties

  const inputLengthRef = useRef(state.currentInput.length)
  const guessCountRef = useRef(state.guesses.length)
  const puzzleCompleteRef = useRef(state.puzzleComplete)
  const upgradeLevelRef = useRef(totalUpgradeLevels)
  const generatorCountRef = useRef(generatorUnits)
  const [isCompact, setIsCompact] = useState(false)
  const [activeView, setActiveView] = useState<'game' | 'generators' | 'upgrades'>('game')

  useEffect(() => {
    window.addEventListener('keydown', handlePhysicalKey)
    return () => window.removeEventListener('keydown', handlePhysicalKey)
  }, [handlePhysicalKey])

  useEffect(() => {
    const prev = inputLengthRef.current
    const current = state.currentInput.length
    if (current > prev) {
      playKey()
    } else if (current < prev) {
      playErase()
    }
    inputLengthRef.current = current
  }, [state.currentInput.length, playErase, playKey])

  useEffect(() => {
    const prev = guessCountRef.current
    const current = state.guesses.length
    if (current > prev) {
      playReveal()
    }
    guessCountRef.current = current
  }, [state.guesses.length, playReveal])

  useEffect(() => {
    if (!puzzleCompleteRef.current && state.puzzleComplete) {
      if (state.solved) playSuccess()
      else playFail()
    }
    puzzleCompleteRef.current = state.puzzleComplete
  }, [state.puzzleComplete, state.solved, playFail, playSuccess])

  useEffect(() => {
    if (totalUpgradeLevels > upgradeLevelRef.current) {
      playUpgrade()
    }
    upgradeLevelRef.current = totalUpgradeLevels
  }, [playUpgrade, totalUpgradeLevels])

  useEffect(() => {
    if (generatorUnits > generatorCountRef.current) {
      playGenerator()
    }
    generatorCountRef.current = generatorUnits
  }, [generatorUnits, playGenerator])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const query = window.matchMedia('(max-width: 960px)')
    const update = (event?: MediaQueryListEvent) => {
      setIsCompact(event ? event.matches : query.matches)
    }
    update()
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }
    query.addListener(update)
    return () => query.removeListener(update)
  }, [])

  useEffect(() => {
    if (!isCompact) {
      setActiveView('game')
    }
  }, [isCompact])

  const getUpgradeRequirementName = (id?: string) =>
    id ? sortedUpgrades.find((upgrade) => upgrade.id === id)?.name ?? id : null

  const getGeneratorRequirementName = (id?: string) =>
    id ? generators.find((generator) => generator.id === id)?.name ?? id : null

  const renderGeneratorPanel = () => (
    <>
      <div className="section-header">
        <h2>Foundry lines</h2>
        <span>${formatMoney(passiveIncome)}/s</span>
      </div>
      <div className="tier-stack">
        {visibleGeneratorTiers.map((tier) => (
          <section className={`tier-section tier-${tier}`} key={`generator-tier-${tier}`}>
            <header className="tier-section__header">
              <span>Tier {tier}</span>
              <span className="tier-section__subhead">Unlock sequential foundries</span>
            </header>
            <div className="tile-list">
              {generators
                .filter((generator) => generator.tier === tier)
                .map((generator) => {
                  const owned = state.generatorLevels[generator.id] ?? 0
                  const nextCost = getGeneratorCost(generator, owned)
                  const totalIncome = owned * generator.baseIncome
                  const requirementMet = !generator.requires
                    ? true
                    : (state.generatorLevels[generator.requires] ?? 0) > 0
                  const disabled = state.money < nextCost || !requirementMet
                  const requirementLabel = getGeneratorRequirementName(generator.requires)
                  return (
                    <button
                      key={generator.id}
                      className={`info-tile tier-${generator.tier}`}
                      onClick={() => dispatch({ type: 'buyGenerator', id: generator.id })}
                      disabled={disabled}
                      type="button"
                    >
                      <div className="info-tile__top">
                        <div>
                          <p className="eyebrow">Lv {owned}</p>
                          <h3>{generator.name}</h3>
                        </div>
                        <span className="info-tile__value">+${formatMoney(totalIncome)}/s</span>
                      </div>
                      <p className="info-tile__desc">{generator.description}</p>
                      {!requirementMet && requirementLabel && (
                        <p className="info-tile__note">Requires {requirementLabel}.</p>
                      )}
                      <div className="info-tile__foot">
                        <span>+${formatMoney(generator.baseIncome)}/s</span>
                        <span>${formatMoney(nextCost)}</span>
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  )

  const renderUpgradePanel = () => (
    <>
      <div className="section-header">
        <h2>Upgrades</h2>
        <span>Balance: ${formatMoney(state.money)}</span>
      </div>
      <div className="tier-stack">
        {upgradeTierOrder.map((tier) => (
          <section className={`tier-section tier-${tier}`} key={`upgrade-tier-${tier}`}>
            <header className="tier-section__header">
              <span>Tier {tier}</span>
              <span className="tier-section__subhead">Spend words to reach new perks</span>
            </header>
            <div className="tile-list">
              {sortedUpgrades
                .filter((upgrade) => upgrade.tier === tier)
                .map((upgrade) => {
                  const level = state.upgradeLevels[upgrade.id] ?? 0
                  const requirementMet =
                    !upgrade.requires || (state.upgradeLevels[upgrade.requires] ?? 0) > 0
                  const tierRequirement = TIER_REQUIREMENTS[upgrade.tier] ?? 0
                  const tierMet = totalUpgradeLevels >= tierRequirement
                  const locked = !requirementMet || !tierMet
                  const capped = upgrade.maxLevel !== null && level >= upgrade.maxLevel
                  const cost = getUpgradeCost(upgrade, level)
                  const wordsNeeded = upgrade.wordCost ?? 0
                  const wordsMet = wordsNeeded === 0 || state.words >= wordsNeeded
                  const disabled = locked || capped || state.money < cost || !wordsMet
                  const requirementLabel = getUpgradeRequirementName(upgrade.requires)
                  return (
                    <button
                      key={upgrade.id}
                      className={`info-tile tier-${upgrade.tier}`}
                      onClick={() => dispatch({ type: 'buyUpgrade', id: upgrade.id })}
                      disabled={disabled}
                      type="button"
                    >
                      <div className="info-tile__top">
                        <div>
                          <p className="eyebrow">Lv {level}</p>
                          <h3>{upgrade.name}</h3>
                        </div>
                        <span className="info-tile__value">
                          {upgrade.maxLevel !== null ? `${level}/${upgrade.maxLevel}` : '∞'}
                        </span>
                      </div>
                      <p className="info-tile__desc">{upgrade.description}</p>
                      {!requirementMet && requirementLabel && (
                        <p className="info-tile__note">Requires {requirementLabel}.</p>
                      )}
                      {!tierMet && tierRequirement > 0 && (
                        <p className="info-tile__note">
                          Spend {tierRequirement} upgrade levels to enter Tier {upgrade.tier}.
                        </p>
                      )}
                      {!wordsMet && wordsNeeded > 0 && (
                        <p className="info-tile__note">Need {wordsNeeded} words.</p>
                      )}
                      {capped && <p className="info-tile__note">Maxed out.</p>}
                      <div className="info-tile__foot">
                        <span>{wordsNeeded > 0 ? `${wordsNeeded} words` : '0 words'}</span>
                        {capped ? <span>Complete</span> : <span>${formatMoney(cost)}</span>}
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  )

  const layoutClass = ['game-layout']
  if (isCompact) layoutClass.push('compact-layout')

  const boardStackContent = (
    <>
      <section className="board-section">
        <div className="board-header">
          <span>Word #{state.puzzleNumber}</span>
          <span>{state.guessLimit - state.guesses.length} guesses left</span>
        </div>
        <p className="word-count">Words solved: {state.puzzlesSolved}</p>
        <div className="board">
          {boardRows.map((row, rowIndex) => {
            const isCurrent = row.id === 'current'
            const isEmpty = row.id.startsWith('empty-')
            return (
              <div
                className="guess-row"
                key={`${row.id}-${rowIndex}`}
                style={{ gridTemplateColumns: `repeat(${state.selectedLength}, 1fr)` }}
              >
                {Array.from({ length: state.selectedLength }).map((_, index) => {
                  const letter = row.word[index] ?? ''
                  const mark = row.marks[index]
                  const tileClasses = ['tile']
                  if (!isCurrent && !isEmpty) {
                    tileClasses.push('tile-revealed')
                    if (state.showHotCold) {
                      tileClasses.push(getHeatClass(letter, index, state.currentWord))
                    } else {
                      tileClasses.push(mark)
                    }
                  } else if (letter.trim().length === 0) {
                    tileClasses.push('inactive')
                  }
                  if (row.id === 'current' && state.hintReveals[index]) {
                    tileClasses.push('tile-hint')
                  }

                  const tileStyle: CSSProperties | undefined =
                    !isCurrent && !isEmpty ? { animationDelay: `${index * 80}ms` } : undefined

                  return (
                    <span
                      key={index}
                      className={tileClasses.join(' ')}
                      data-letter={letter.trim().length ? letter : ''}
                      style={tileStyle}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="board-meta">
          {state.puzzleComplete && state.puzzleStatus && <p>{state.puzzleStatus}</p>}
          {state.showHotCold && (
            <p className="hint">
              Thermal hints replace colors: hot tiles mean close alphabetically.
            </p>
          )}
          {Object.keys(state.hintReveals).length > 0 && (
            <ul className="hint-list">
              {Object.entries(state.hintReveals)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([index, letter]) => (
                  <li key={index}>
                    Slot {Number(index) + 1}: {letter}
                  </li>
                ))}
            </ul>
          )}
          {state.puzzleComplete && (
            <button
              className="secondary-button"
              onClick={() => dispatch({ type: 'startNextPuzzle' })}
            >
              Next word
            </button>
          )}
        </div>
      </section>

      <section className="keyboard">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div className="key-row" key={`row-${rowIndex}`}>
            {row.map((key) => {
              const label = key === 'BACKSPACE' ? '⌫' : key
              const statusClass = key.length === 1 ? keyboardState[key] ?? '' : ''
              return (
                <button
                  key={key}
                  className={`key ${statusClass}`.trim()}
                  type="button"
                  onClick={() => handleVirtualKey(key)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </section>

      <section className="controls">
        <div className="length-buttons">
          {WORD_LENGTHS.map((length) => (
            <button
              key={length}
              className={`length-button ${state.selectedLength === length ? 'active' : ''}`}
              disabled={!state.unlockedLengths.includes(length)}
              onClick={() => dispatch({ type: 'setLength', length })}
              type="button"
            >
              {length}-letter
            </button>
          ))}
        </div>
        <p className="control-hint">
          Use your keyboard: letters fill the row, Backspace deletes, Enter submits.
        </p>
      </section>
    </>
  )

  return (
    <main className="wordle-app" style={appStyle}>
      <header className="top-bar">
        <h1>Upgradle</h1>
        <div className="top-stats">
          <div>
            <span>Money</span>
            <strong>${formatMoney(state.money)}</strong>
          </div>
          <div>
            <span>Words</span>
            <strong>{state.words}</strong>
          </div>
          <div>
            <span>Idle $/s</span>
            <strong>${formatMoney(passiveIncome)}</strong>
          </div>
        </div>
      </header>

      {isCompact ? (
        <div className="mobile-shell">
          {activeView === 'game' ? (
            <section className="board-stack">{boardStackContent}</section>
          ) : (
            <div className="mobile-panel-scroll">
              {activeView === 'generators' ? renderGeneratorPanel() : renderUpgradePanel()}
            </div>
          )}
          <nav className="mobile-nav">
            <button
              type="button"
              className={activeView === 'game' ? 'active' : ''}
              onClick={() => setActiveView('game')}
              aria-label="Play"
            >
              🎯
            </button>
            <button
              type="button"
              className={activeView === 'generators' ? 'active' : ''}
              onClick={() => setActiveView('generators')}
              aria-label="Foundry lines"
            >
              🏭
            </button>
            <button
              type="button"
              className={activeView === 'upgrades' ? 'active' : ''}
              onClick={() => setActiveView('upgrades')}
              aria-label="Upgrades"
            >
              ⬆️
            </button>
          </nav>
        </div>
      ) : (
        <div className={layoutClass.join(' ').trim()}>
          <aside className="sidebar-panel generators-panel">{renderGeneratorPanel()}</aside>
          <section className="board-stack">{boardStackContent}</section>
          <aside className="sidebar-panel upgrades-panel">{renderUpgradePanel()}</aside>
        </div>
      )}
    </main>
  )
}

export default App
