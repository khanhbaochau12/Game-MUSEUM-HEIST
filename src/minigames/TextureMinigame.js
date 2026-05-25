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
              <canvas id="tex-preview" width="200" height="200" style="display:block;"></canvas>
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
    this._draw3DTarget()
    this._draw3DPreview()
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
        if (this.selectedShape && this.selectedShape.id === shape.id) {
          // Hủy chọn
          opt.classList.remove('selected')
          this.selectedShape = null
        } else {
          this.$shapesCol.querySelectorAll('.shape-option').forEach(el => el.classList.remove('selected'))
          opt.classList.add('selected')
          this.selectedShape = shape
        }
        this._draw3DPreview(); this._updateStatus()
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
        if (this.selectedTexture && this.selectedTexture.id === t.id) {
          opt.classList.remove('selected')
          this.selectedTexture = null
        } else {
          this.$texturesCol.querySelectorAll('.texture-option').forEach(el => el.classList.remove('selected'))
          opt.classList.add('selected')
          this.selectedTexture = t
        }
        this._draw3DPreview(); this._updateStatus()
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
  _draw3DTarget() {
    const tex = assets.getTexture(this.targetTexture.id)
    const img = (tex.image && tex.image.width) ? tex.image : null
    this._draw3DShape(this.$targetCanvas, this.targetShape.id, img, 70)
  }

  _draw3DPreview() {
    const canvas = this.$previewCanvas
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    // Chưa chọn gì
    if (!this.selectedShape && !this.selectedTexture) {
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#050510')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#666'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('— Chọn hình + họa tiết —', W / 2, H / 2 + 4)
      return
    }

    // Chỉ chọn họa tiết → fill toàn canvas bằng texture
    if (!this.selectedShape && this.selectedTexture) {
      const tex = assets.getTexture(this.selectedTexture.id)
      const img = (tex.image && tex.image.width) ? tex.image : null
      if (img) ctx.drawImage(img, 0, 0, W, H)
      else { ctx.fillStyle = '#888'; ctx.fillRect(0, 0, W, H) }
      return
    }

    // Chỉ chọn hình dạng → 3D không texture
    if (this.selectedShape && !this.selectedTexture) {
      this._draw3DShape(canvas, this.selectedShape.id, null, 70)
      return
    }

    // Chọn cả 2 → 3D có texture
    const tex = assets.getTexture(this.selectedTexture.id)
    const img = (tex.image && tex.image.width) ? tex.image : null
    this._draw3DShape(canvas, this.selectedShape.id, img, 70)
  }

  _draw3DShape(canvas, shapeId, texImg, size = 70) {
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1a1a2e'); bg.addColorStop(1, '#050510')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    ctx.save()

    switch (shapeId) {

      case 'sphere': {
        // Base sphere với texture
        ctx.beginPath()
        ctx.arc(cx, cy, size, 0, Math.PI * 2)
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - size, cy - size, size * 2, size * 2)
        else { ctx.fillStyle = '#888'; ctx.fillRect(0, 0, W, H) }
        ctx.restore(); ctx.save()
        // Shading overlay
        const shade = ctx.createRadialGradient(cx - size * 0.3, cy - size * 0.3, size * 0.05, cx, cy, size)
        shade.addColorStop(0, 'rgba(255,255,255,0.35)')
        shade.addColorStop(0.5, 'rgba(0,0,0,0)')
        shade.addColorStop(1, 'rgba(0,0,0,0.55)')
        ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2)
        ctx.fillStyle = shade; ctx.fill()
        // Specular
        ctx.restore(); ctx.save()
        const spec = ctx.createRadialGradient(cx - size * 0.35, cy - size * 0.35, 1, cx - size * 0.2, cy - size * 0.2, size * 0.45)
        spec.addColorStop(0, 'rgba(255,255,255,0.7)')
        spec.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2)
        ctx.fillStyle = spec; ctx.fill()
        break
      }

      case 'box': {
        const s = size
        // Isometric box: top / left / right faces
        const top    = [[cx, cy - s * 1.1], [cx + s, cy - s * 0.55], [cx, cy], [cx - s, cy - s * 0.55]]
        const left   = [[cx - s, cy - s * 0.55], [cx, cy], [cx, cy + s * 0.9], [cx - s, cy + s * 0.35]]
        const right  = [[cx, cy], [cx + s, cy - s * 0.55], [cx + s, cy + s * 0.35], [cx, cy + s * 0.9]]

        const drawFace = (pts, brightness) => {
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(pts[0][0], pts[0][1])
          pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]))
          ctx.closePath()
          ctx.clip()
          if (texImg) ctx.drawImage(texImg, cx - s, cy - s, s * 2, s * 2)
          else { ctx.fillStyle = '#888'; ctx.fill() }
          // brightness overlay
          ctx.fillStyle = brightness > 0
            ? `rgba(255,255,255,${brightness})`
            : `rgba(0,0,0,${-brightness})`
          ctx.beginPath()
          ctx.moveTo(pts[0][0], pts[0][1])
          pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]))
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }

        drawFace(top,   0.25)   // top: bright
        drawFace(left,  0.0)    // left: normal
        drawFace(right, -0.3)   // right: dark

        // Edges
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
        ;[top, left, right].forEach(pts => {
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
          pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]))
          ctx.closePath(); ctx.stroke()
        })
        break
      }

      case 'cone': {
        const r = size * 0.85
        const tip = [cx, cy - size]
        const baseY = cy + size * 0.7

        // Left face
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(tip[0], tip[1])
        ctx.lineTo(cx - r, baseY)
        ctx.lineTo(cx, baseY)
        ctx.closePath()
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - size, cy - size, size * 2, size * 2)
        else { ctx.fillStyle = '#aaa'; ctx.fill() }
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill()
        ctx.restore()

        // Right face (darker)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(tip[0], tip[1])
        ctx.lineTo(cx, baseY)
        ctx.lineTo(cx + r, baseY)
        ctx.closePath()
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - size, cy - size, size * 2, size * 2)
        else { ctx.fillStyle = '#888'; ctx.fill() }
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill()
        ctx.restore()

        // Base ellipse shadow
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cx, baseY, r, r * 0.28, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill()
        ctx.restore()

        // Outline
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tip[0], tip[1])
        ctx.lineTo(cx - r, baseY)
        ctx.lineTo(cx + r, baseY)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
        break
      }

      case 'cylinder': {
        const r = size * 0.7
        const top3D = cy - size
        const bot3D = cy + size * 0.85
        const ry = r * 0.28  // ellipse y-radius

        // Body left half (light)
        ctx.save()
        ctx.beginPath()
        ctx.rect(cx - r, top3D, r, bot3D - top3D)
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - r, top3D, r * 2, bot3D - top3D)
        else { ctx.fillStyle = '#aaa'; ctx.fill() }
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(cx - r, top3D, r, bot3D - top3D)
        ctx.restore()

        // Body right half (dark)
        ctx.save()
        ctx.beginPath()
        ctx.rect(cx, top3D, r, bot3D - top3D)
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - r, top3D, r * 2, bot3D - top3D)
        else { ctx.fillStyle = '#888'; ctx.fill() }
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx, top3D, r, bot3D - top3D)
        ctx.restore()

        // Bottom ellipse (shadow)
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cx, bot3D, r, ry, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill()
        ctx.restore()

        // Top ellipse (texture + highlight)
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cx, top3D, r, ry, 0, 0, Math.PI * 2)
        ctx.clip()
        if (texImg) ctx.drawImage(texImg, cx - r, top3D - ry, r * 2, ry * 2)
        else { ctx.fillStyle = '#bbb'; ctx.fill() }
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill()
        ctx.restore()

        // Outline
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
        ctx.strokeRect(cx - r, top3D, r * 2, bot3D - top3D)
        ctx.beginPath(); ctx.ellipse(cx, top3D, r, ry, 0, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
        break
      }
    }

    ctx.restore()
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
