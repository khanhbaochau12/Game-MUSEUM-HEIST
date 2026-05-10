import * as THREE from 'three'
import { assets } from '../core/AssetLoader.js'

const SHAPES = [
  { id: 'sphere',   label: 'Hình cầu' },
  { id: 'box',      label: 'Hình hộp' },
  { id: 'cone',     label: 'Hình nón' },
  { id: 'cylinder', label: 'Hình trụ' }
]

const DECOR_TEXTURES = [
  { id: 'deco_gold',    label: 'Vàng' },
  { id: 'deco_floral',  label: 'Hoa' },
  { id: 'deco_ancient', label: 'Cổ điển' },
  { id: 'deco_modern',  label: 'Hiện đại' }
]

/** Draw shape thumbnail using simple 2D canvas (no WebGL → no context-limit issues). */
function draw2DShapeThumb(canvas, shapeId, fillStyle = '#cccccc') {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(1, '#050510')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Center
  const cx = W / 2, cy = H / 2

  ctx.save()
  // Subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 4

  ctx.fillStyle = fillStyle
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 1.5

  switch (shapeId) {
    case 'sphere':
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fill()
      // Highlight
      const sphereGrad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 20)
      sphereGrad.addColorStop(0, 'rgba(255,255,255,0.6)')
      sphereGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = sphereGrad
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill()
      break
    case 'box':
      // Isometric box
      ctx.beginPath()
      ctx.moveTo(cx - 16, cy - 4)
      ctx.lineTo(cx, cy - 14)
      ctx.lineTo(cx + 16, cy - 4)
      ctx.lineTo(cx + 16, cy + 14)
      ctx.lineTo(cx, cy + 24)
      ctx.lineTo(cx - 16, cy + 14)
      ctx.closePath()
      ctx.fill()
      // Top face
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(cx - 16, cy - 4)
      ctx.lineTo(cx, cy - 14)
      ctx.lineTo(cx + 16, cy - 4)
      ctx.lineTo(cx, cy + 6)
      ctx.closePath()
      ctx.fill()
      // Right shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.moveTo(cx + 16, cy - 4)
      ctx.lineTo(cx + 16, cy + 14)
      ctx.lineTo(cx, cy + 24)
      ctx.lineTo(cx, cy + 6)
      ctx.closePath()
      ctx.fill()
      break
    case 'cone':
      ctx.beginPath()
      ctx.moveTo(cx, cy - 22)
      ctx.lineTo(cx - 18, cy + 14)
      ctx.lineTo(cx + 18, cy + 14)
      ctx.closePath()
      ctx.fill()
      // Base ellipse
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 14, 18, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'cylinder':
      // Body
      ctx.fillRect(cx - 14, cy - 14, 28, 28)
      // Top ellipse
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.ellipse(cx, cy - 14, 14, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      // Bottom shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 14, 14, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      break
  }
  ctx.restore()
}

export class TextureMinigame {
  constructor({ hudUI, item, onComplete, onTimeout, hud, timeLimit = 45,
                stepIndex = 1, totalSteps = 1, itemLabel = '' }) {
    this.hudUI = hudUI
    this.item = item
    this.onComplete = onComplete
    this.onTimeout = onTimeout
    this.hud = hud
    this.timeLimit = timeLimit
    this.stepIndex = stepIndex
    this.totalSteps = totalSteps
    this.itemLabel = itemLabel
    this.elapsed = 0
    this.finished = false

    this.targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    this.targetTexture = DECOR_TEXTURES[Math.floor(Math.random() * DECOR_TEXTURES.length)]
    this.selectedShape = null
    this.selectedTexture = null

    try { this._buildUI() } catch (e) { console.error('[TextureMinigame] build failed', e) }
  }

  _buildUI() {
    const c = this.hudUI.container
    const panel = document.createElement('div')
    panel.className = 'minigame-panel'
    panel.style.cssText = `width: 86vw; max-width: 760px;`
    panel.innerHTML = `
      <div class="mg-header">
        <div style="display:flex; align-items:center; justify-content:center; gap:14px;">
          <span style="padding:4px 12px; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; letter-spacing:1px; color:#1a1a2e; background:linear-gradient(180deg,#FFD76A,#d4af37); border-radius:99px;">BƯỚC ${this.stepIndex}/${this.totalSteps}</span>
          <div class="minigame-title">⚜ TEXTURE MAPPING ⚜</div>
        </div>
        <div class="minigame-instruction">
          ${this.itemLabel ? `Đang trộm: <b>${this.itemLabel}</b><br>` : ''}
          Quan sát mục tiêu rồi chọn đúng <b>hình dạng</b> và <b>họa tiết trang trí</b> tương ứng.
        </div>
      </div>
      <div class="mg-timer-row">
        <span class="mg-timer-label">⏱ Time</span>
        <div class="mg-timer-bar"><div class="mg-timer-fill" id="tex-timer-fill"></div></div>
        <span class="mg-timer-text" id="tex-timer-text">45s</span>
      </div>
      <div class="mg-body">
        <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
          <div style="text-align:center; flex-shrink:0;">
            <div class="mg-section-title" style="color:#FFD76A;">🎯 Mục tiêu</div>
            <div class="mg-canvas-frame target">
              <span class="mg-canvas-label">TARGET</span>
              <canvas id="tex-target" width="200" height="200" style="display:block;"></canvas>
            </div>
            <div class="mg-section-title" style="color:#88ddff; margin-top:14px;">👁 Xem trước</div>
            <div class="mg-canvas-frame player">
              <span class="mg-canvas-label" style="color:#88ddff;">PREVIEW</span>
              <canvas id="tex-preview" width="200" height="130" style="display:block;"></canvas>
            </div>
          </div>
          <div style="flex:1; min-width:280px;">
            <div style="margin-bottom:14px;">
              <div class="mg-section-title">① Chọn hình dạng</div>
              <div id="tex-shapes" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
            </div>
            <div>
              <div class="mg-section-title">② Chọn họa tiết trang trí</div>
              <div id="tex-textures" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
            </div>
            <div id="tex-status" style="margin-top:14px; font-size:12px; color:#888; min-height:18px; font-family:'JetBrains Mono', monospace;">Chưa chọn gì.</div>
          </div>
        </div>
        <div style="display:flex; justify-content:center; gap:6px; margin-top:18px;">
          <button class="minigame-button" id="tex-confirm">✓ Xác nhận</button>
        </div>
      </div>
    `
    c.appendChild(panel)
    this.panel = panel
    this.$timerFill = panel.querySelector('#tex-timer-fill')
    this.$timerText = panel.querySelector('#tex-timer-text')
    this.$status = panel.querySelector('#tex-status')
    this.$shapesCol = panel.querySelector('#tex-shapes')
    this.$texturesCol = panel.querySelector('#tex-textures')
    this.$targetCanvas = panel.querySelector('#tex-target')
    this.$previewCanvas = panel.querySelector('#tex-preview')

    panel.querySelector('#tex-confirm').addEventListener('click', () => this._confirm())

    this._buildShapeOptions()
    this._buildTextureOptions()
    this._draw2DTarget()
    this._draw2DPreview()
  }

  _buildShapeOptions() {
    for (const shape of SHAPES) {
      const opt = document.createElement('div')
      opt.className = 'shape-option'
      const c = document.createElement('canvas')
      c.width = c.height = 64
      opt.appendChild(c)
      const lbl = document.createElement('div')
      lbl.className = 'label'
      lbl.textContent = shape.label
      opt.appendChild(lbl)
      this.$shapesCol.appendChild(opt)
      draw2DShapeThumb(c, shape.id, '#cccccc')
      opt.addEventListener('click', () => {
        this.$shapesCol.querySelectorAll('.shape-option').forEach(el => el.classList.remove('selected'))
        opt.classList.add('selected')
        this.selectedShape = shape
        this._draw2DPreview(); this._updateStatus()
      })
    }
  }

  _buildTextureOptions() {
    for (const t of DECOR_TEXTURES) {
      const opt = document.createElement('div')
      opt.className = 'texture-option'
      const c = document.createElement('canvas')
      c.width = c.height = 64
      opt.appendChild(c)
      const lbl = document.createElement('div')
      lbl.className = 'label'
      lbl.textContent = t.label
      opt.appendChild(lbl)
      this.$texturesCol.appendChild(opt)
      this._drawTextureThumb(c, t.id)
      opt.addEventListener('click', () => {
        this.$texturesCol.querySelectorAll('.texture-option').forEach(el => el.classList.remove('selected'))
        opt.classList.add('selected')
        this.selectedTexture = t
        this._draw2DPreview(); this._updateStatus()
      })
    }
  }

  _updateStatus() {
    if (!this.$status) return
    const s = this.selectedShape ? this.selectedShape.label : '—'
    const t = this.selectedTexture ? this.selectedTexture.label : '—'
    this.$status.textContent = `Đã chọn: ${s}  +  ${t}`
    this.$status.style.color = (this.selectedShape && this.selectedTexture) ? '#FFD76A' : '#888'
  }

  _drawTextureThumb(canvas, texId) {
    const tex = assets.getTexture(texId)
    const ctx = canvas.getContext('2d')
    if (tex.image && tex.image.width) ctx.drawImage(tex.image, 0, 0, canvas.width, canvas.height)
    else { ctx.fillStyle = '#444'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
  }

  /** Draw target as a textured 2D shape (large, centered). */
  _draw2DTarget() {
    const canvas = this.$targetCanvas
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#050510')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    this._drawTexturedShape(ctx, W, H, this.targetShape.id, this.targetTexture.id, 70)
  }

  _draw2DPreview() {
    const canvas = this.$previewCanvas
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#050510')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    if (!this.selectedShape || !this.selectedTexture) {
      ctx.fillStyle = '#666'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('— Chọn hình + họa tiết —', W / 2, H / 2 + 4)
      return
    }
    this._drawTexturedShape(ctx, W, H, this.selectedShape.id, this.selectedTexture.id, 50)
  }

  _drawTexturedShape(ctx, W, H, shapeId, texId, size) {
    const cx = W / 2, cy = H / 2
    const tex = assets.getTexture(texId)
    const img = (tex.image && tex.image.width) ? tex.image : null

    // Build a clip path for the shape, then fill with the texture
    ctx.save()
    ctx.beginPath()
    switch (shapeId) {
      case 'sphere':
        ctx.arc(cx, cy, size, 0, Math.PI * 2)
        break
      case 'box':
        ctx.moveTo(cx - size, cy - size * 0.3)
        ctx.lineTo(cx, cy - size * 0.85)
        ctx.lineTo(cx + size, cy - size * 0.3)
        ctx.lineTo(cx + size, cy + size * 0.85)
        ctx.lineTo(cx, cy + size * 1.4)
        ctx.lineTo(cx - size, cy + size * 0.85)
        ctx.closePath()
        break
      case 'cone':
        ctx.moveTo(cx, cy - size)
        ctx.lineTo(cx - size * 0.85, cy + size * 0.7)
        ctx.lineTo(cx + size * 0.85, cy + size * 0.7)
        ctx.closePath()
        break
      case 'cylinder':
        ctx.rect(cx - size * 0.7, cy - size, size * 1.4, size * 1.85)
        break
    }
    ctx.clip()
    if (img) {
      const sz = size * 2.5
      ctx.drawImage(img, cx - sz / 2, cy - sz / 2, sz, sz)
    } else {
      ctx.fillStyle = '#888'
      ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()

    // Outline
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    switch (shapeId) {
      case 'sphere':
        ctx.arc(cx, cy, size, 0, Math.PI * 2)
        break
      case 'box':
        ctx.moveTo(cx - size, cy - size * 0.3)
        ctx.lineTo(cx, cy - size * 0.85)
        ctx.lineTo(cx + size, cy - size * 0.3)
        ctx.lineTo(cx + size, cy + size * 0.85)
        ctx.lineTo(cx, cy + size * 1.4)
        ctx.lineTo(cx - size, cy + size * 0.85)
        ctx.closePath()
        break
      case 'cone':
        ctx.moveTo(cx, cy - size)
        ctx.lineTo(cx - size * 0.85, cy + size * 0.7)
        ctx.lineTo(cx + size * 0.85, cy + size * 0.7)
        ctx.closePath()
        break
      case 'cylinder':
        ctx.rect(cx - size * 0.7, cy - size, size * 1.4, size * 1.85)
        break
    }
    ctx.stroke()
    ctx.restore()
  }

  _confirm() {
    if (!this.selectedShape || !this.selectedTexture) {
      this.hudUI.flashError(this.panel)
      return
    }
    const ok = this.selectedShape.id === this.targetShape.id &&
               this.selectedTexture.id === this.targetTexture.id
    if (ok) this._finish(true)
    else { this.hudUI.flashError(this.panel); this.elapsed += 8 }
  }

  _finish(success) {
    if (this.finished) return
    this.finished = true
    if (success) this.onComplete && this.onComplete(true)
    else this.onTimeout && this.onTimeout()
  }

  update(delta) {
    if (this.finished) return
    this.elapsed += delta
    const remaining = Math.max(0, this.timeLimit - this.elapsed)
    if (this.hud) this.hud.showTimer(remaining)
    if (this.$timerFill && this.$timerText) {
      const pct = remaining / this.timeLimit
      this.$timerFill.style.transform = `scaleX(${pct})`
      this.$timerText.textContent = Math.ceil(remaining) + 's'
      if (remaining <= 10) this.$timerFill.classList.add('urgent')
      else this.$timerFill.classList.remove('urgent')
    }
    if (remaining <= 0) { this._finish(false); return }
  }

  dispose() {
    if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel)
  }
}
