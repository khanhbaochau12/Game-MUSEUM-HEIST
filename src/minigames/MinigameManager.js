import { TransformMinigame } from './TransformMinigame.js'
import { TextureMinigame } from './TextureMinigame.js'
import { MinigameUI } from '../ui/MinigameUI.js'
import { input } from '../core/InputManager.js'

const MINIGAME_TYPES = ['transform', 'texture']
const FONT_FAMILY = "'Playfair Display','Cinzel','Be Vietnam Pro',serif"

export class MinigameManager {
  constructor({ renderer, hud, onItemStolen, onCaught }) {
    this.renderer = renderer
    this.hud = hud
    this.onItemStolen = onItemStolen
    this.onCaught = onCaught
    this.ui = new MinigameUI()
    this.isActive = false
    this._queue = []
    this._current = null
    this._currentItem = null
    this._currentStand = null
    this._totalSteps = 0
    this._stepIndex = 0
  }

  startSequence(stand) {
    if (this.isActive) return
    this.isActive = true
    this._currentStand = stand
    this._currentItem = stand.item

    const n = this._currentItem.numMinigames
    const types = ['transform', 'texture']
    while (types.length < n) {
      types.push(MINIGAME_TYPES[Math.floor(Math.random() * MINIGAME_TYPES.length)])
    }
    this._queue = types.sort(() => Math.random() - 0.5)
    this._totalSteps = this._queue.length
    this._stepIndex = 0

    input.exitPointerLock()
    this.ui.open()
    this._startNext()
  }

  _startNext() {
    if (this._queue.length === 0) {
      this._showVictoryFlash(() => this._endSequence(true))
      return
    }
    this._stepIndex++
    const type = this._queue.shift()
    this.ui.clear()

    const onComplete = (success) => {
      if (this._current) { this._current.dispose(); this._current = null }
      if (success) { this._flashSuccess(); this._startNext() }
      else this._endSequence(false)
    }
    const onTimeout = () => {
      if (this._current) { this._current.dispose(); this._current = null }
      this._endSequence(false)
    }

    const opts = {
      renderer: this.renderer,
      hudUI: this.ui,
      item: this._currentItem,
      onComplete,
      onTimeout,
      hud: this.hud,
      timeLimit: 45,
      stepIndex: this._stepIndex,
      totalSteps: this._totalSteps,
      itemLabel: this._currentItem.label
    }
    if (type === 'transform') this._current = new TransformMinigame(opts)
    else this._current = new TextureMinigame(opts)

    // Always-on X button — exit minigame and forfeit the heist.
    this._addForfeitButton()
  }

  _addForfeitButton() {
    const overlay = this.ui.container
    const btn = document.createElement('button')
    btn.id = 'mg-forfeit'
    btn.type = 'button'
    btn.innerHTML = '✕'
    btn.title = 'Bỏ cuộc — thoát minigame (sẽ bị bắt)'
    btn.style.cssText = `
      position: absolute; top: 18px; right: 22px; z-index: 50;
      width: 42px; height: 42px; border-radius: 50%;
      border: 1px solid rgba(255,90,90,0.55);
      background: linear-gradient(180deg, rgba(80,18,18,0.92), rgba(40,8,8,0.92));
      color: #ffb0b0; font-size: 20px; font-weight: 700; line-height: 1;
      font-family: 'JetBrains Mono', monospace;
      cursor: pointer; backdrop-filter: blur(6px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 18px rgba(255,80,80,0.18);
      transition: transform 0.12s, box-shadow 0.15s, color 0.15s, background 0.15s;
      pointer-events: auto;
    `
    btn.onmouseenter = () => {
      btn.style.color = '#fff'
      btn.style.transform = 'scale(1.08)'
      btn.style.boxShadow = '0 4px 22px rgba(0,0,0,0.6), 0 0 28px rgba(255,80,80,0.55)'
    }
    btn.onmouseleave = () => {
      btn.style.color = '#ffb0b0'
      btn.style.transform = 'scale(1)'
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6), 0 0 18px rgba(255,80,80,0.18)'
    }
    btn.onclick = () => this._forfeit()
    overlay.appendChild(btn)
  }

  _forfeit() {
    if (!this.isActive) return
    if (this._current) { this._current.dispose(); this._current = null }
    this._endSequence(false)
  }

  _flashSuccess() {
    const overlay = this.ui.container
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: absolute; left: 50%; top: 22%; transform: translate(-50%, 0);
      padding: 12px 28px; border-radius: 99px;
      background: linear-gradient(180deg, rgba(76,175,80,0.95), rgba(46,125,50,0.95));
      color: #fff; font-family: ${FONT_FAMILY}; font-weight: 700; font-size: 16px; letter-spacing: 3px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 32px rgba(76,175,80,0.4);
      pointer-events: none; z-index: 30;
      animation: panelIn 0.25s ease-out;
    `
    flash.textContent = `✓ HOÀN THÀNH BƯỚC ${this._stepIndex}/${this._totalSteps}`
    overlay.appendChild(flash)
    setTimeout(() => {
      flash.style.transition = 'opacity 0.4s'
      flash.style.opacity = '0'
      setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash) }, 400)
    }, 800)
  }

  _showVictoryFlash(onDone) {
    const overlay = this.ui.container
    const card = document.createElement('div')
    card.style.cssText = `
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(180deg, rgba(40,30,10,0.97), rgba(14,14,22,0.97));
      border: 2px solid rgba(212,175,55,0.85); border-radius: 14px;
      padding: 32px 56px; text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 80px rgba(212,175,55,0.5);
      animation: panelIn 0.35s cubic-bezier(0.2,0.9,0.3,1.2);
      pointer-events: none; z-index: 40;
    `
    card.innerHTML = `
      <div style="font-size: 80px; line-height: 1; margin-bottom: 8px; filter: drop-shadow(0 0 24px #d4af37);">💎</div>
      <div style="font-family:${FONT_FAMILY}; font-weight:900; font-size:28px; letter-spacing:6px; color:#d4af37;">TRỘM THÀNH CÔNG</div>
      <div style="font-family:${FONT_FAMILY}; font-size:14px; color:#FFD76A; margin-top:6px; letter-spacing:3px;">
        ${this._currentItem.label.toUpperCase()} · +$${this._currentItem.value}
      </div>
    `
    overlay.appendChild(card)
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s'
      card.style.opacity = '0'
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card)
        onDone && onDone()
      }, 300)
    }, 1200)
  }

  _endSequence(success) {
    this.isActive = false
    this.ui.close()
    this.hud.hideTimer()
    if (success) {
      this._currentStand.removeItem()
      this.onItemStolen(this._currentItem)
    } else {
      this.onCaught()
    }
    this._currentStand = null
    this._currentItem = null
    this._queue = []
    this._current = null
    this._totalSteps = 0
    this._stepIndex = 0
  }

  update(delta) {
    if (!this.isActive) return
    if (this._current && this._current.update) {
      this._current.update(delta)
    }
  }

  render() { /* minigames render to private canvases */ }
}
