import * as THREE from 'three'
import { cloneItemMesh } from '../objects/primitives.js'

const FONT_FAMILY = "'Playfair Display','Cinzel','Be Vietnam Pro',serif"

/**
 * Affine transform minigame — easier mode:
 *  - Ghost outline of target rendered on top of yours scene (translucent green)
 *  - Live numerical readout (position/rotation/scale) with color-coded match status
 *  - Generous tolerance values
 */
export class TransformMinigame {
  constructor({ renderer, hudUI, item, onComplete, onTimeout, hud, timeLimit = 45,
                stepIndex = 1, totalSteps = 1, itemLabel = '' }) {
    this.renderer = renderer
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

    this._W = 340
    this._H = 240

    try {
      this._buildScenes()
      this._buildUI()
      this._bindInteraction()
      this._renderTarget = new THREE.WebGLRenderTarget(this._W, this._H)
      this._pixelBuf = new Uint8Array(this._W * this._H * 4)
    } catch (e) {
      console.error('[TransformMinigame] build failed', e)
    }
  }

  _buildScene(accent) {
    const sc = new THREE.Scene()
    sc.background = new THREE.Color(0x0a0a14)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.3, metalness: 0.4 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.6
    sc.add(ground)
    sc.add(new THREE.AmbientLight(0xffffff, 0.5))
    const k = new THREE.DirectionalLight(0xffffff, 1.4); k.position.set(3, 5, 4); sc.add(k)
    const f = new THREE.DirectionalLight(0xaaccff, 0.5); f.position.set(-3, 2, -2); sc.add(f)
    const rim = new THREE.DirectionalLight(accent, 0.6); rim.position.set(0, -2, -4); sc.add(rim)
    return sc
  }

  _buildScenes() {
    this.targetScene = this._buildScene(0xd4af37)
    this.playerScene = this._buildScene(0x88ddff)

    const aspect = this._W / this._H
    this.targetCamera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
    this.targetCamera.position.set(0, 0, 5)
    this.playerCamera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
    this.playerCamera.position.set(0, 0, 5)

    // Player mesh — solid, manipulable
    this.playerMesh = cloneItemMesh(this.item.mesh)
    this.playerMesh.position.set(0, 0, 0)
    this.playerMesh.rotation.set(0, 0, 0)
    this.playerMesh.scale.set(1, 1, 1)
    this.playerMesh.traverse(o => {
      if (o.isMesh && o.material && 'emissiveIntensity' in o.material) o.material.emissiveIntensity = 0.05
    })
    this.playerScene.add(this.playerMesh)

    // Target mesh in target scene
    this.targetMesh = cloneItemMesh(this.item.mesh)
    this.targetMesh.traverse(o => {
      if (o.isMesh && o.material && 'emissiveIntensity' in o.material) o.material.emissiveIntensity = 0.05
    })
    this._applyRandomTarget(this.targetMesh)
    this.targetScene.add(this.targetMesh)

    // GHOST mesh of target overlaid in player scene (translucent green wireframe)
    this.ghostMesh = cloneItemMesh(this.item.mesh)
    this.ghostMesh.traverse(o => {
      if (o.isMesh) {
        o.material = new THREE.MeshBasicMaterial({
          color: 0x4caf50,
          transparent: true,
          opacity: 0.18,
          wireframe: false,
          depthWrite: false
        })
        // Add a wireframe overlay
      }
    })
    // Wireframe child for clarity
    this.ghostWireframe = cloneItemMesh(this.item.mesh)
    this.ghostWireframe.traverse(o => {
      if (o.isMesh) {
        o.material = new THREE.MeshBasicMaterial({
          color: 0x4caf50,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
          depthWrite: false
        })
      }
    })
    // Apply target transform to ghosts
    this.ghostMesh.position.copy(this.targetMesh.position)
    this.ghostMesh.rotation.copy(this.targetMesh.rotation)
    this.ghostMesh.scale.copy(this.targetMesh.scale)
    this.ghostWireframe.position.copy(this.targetMesh.position)
    this.ghostWireframe.rotation.copy(this.targetMesh.rotation)
    this.ghostWireframe.scale.copy(this.targetMesh.scale)
    this.playerScene.add(this.ghostMesh)
    this.playerScene.add(this.ghostWireframe)
  }

  _applyRandomTarget(mesh) {
    // Slightly smaller random range to make it more achievable
    mesh.position.set(
      THREE.MathUtils.randFloat(-1.0, 1.0),
      THREE.MathUtils.randFloat(-0.5, 0.5),
      0  // keep z=0 to simplify
    )
    mesh.rotation.set(
      THREE.MathUtils.randFloat(-Math.PI / 2, Math.PI / 2),
      THREE.MathUtils.randFloat(0, Math.PI * 2),
      THREE.MathUtils.randFloat(-Math.PI / 4, Math.PI / 4)
    )
    const s = THREE.MathUtils.randFloat(0.8, 1.2)
    mesh.scale.set(s, s, s) // uniform scale, simpler
    this.targetData = {
      position: mesh.position.clone(),
      rotation: new THREE.Euler().copy(mesh.rotation),
      scale: mesh.scale.clone()
    }
  }

  _buildUI() {
    const c = this.hudUI.container
    const panel = document.createElement('div')
    panel.className = 'minigame-panel'
    panel.style.cssText = `width: 86vw; max-width: 820px;`
    panel.innerHTML = `
      <div class="mg-header">
        <div style="display:flex; align-items:center; justify-content:center; gap:14px;">
          <span style="padding:4px 12px; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; letter-spacing:1px; color:#1a1a2e; background:linear-gradient(180deg,#FFD76A,#d4af37); border-radius:99px;">BƯỚC ${this.stepIndex}/${this.totalSteps}</span>
          <div class="minigame-title">⚜ BIẾN ĐỔI AFFINE ⚜</div>
        </div>
        <div class="minigame-instruction">
          ${this.itemLabel ? `Đang trộm: <b>${this.itemLabel}</b><br>` : ''}
          Vùng <b style="color:#4caf50">khung xanh ma</b> bên phải là vị trí mục tiêu — kéo vật phẩm vào đó.<br>
          <b>Kéo chuột</b> xoay · <b>Shift + kéo</b> tịnh tiến · <b>Lăn chuột</b> phóng to/thu nhỏ
        </div>
      </div>
      <div class="mg-timer-row">
        <span class="mg-timer-label">⏱ Time</span>
        <div class="mg-timer-bar"><div class="mg-timer-fill" id="tm-timer-fill"></div></div>
        <span class="mg-timer-text" id="tm-timer-text">45s</span>
      </div>
      <div class="mg-body">
        <div style="display:flex; gap:14px; align-items:stretch; justify-content:center; flex-wrap:wrap;">
          <div style="flex:1; min-width:280px; max-width:370px;">
            <div class="mg-section-title" style="color:#FFD76A;">🎯 Mục tiêu</div>
            <div class="mg-canvas-frame target" style="width:100%;">
              <span class="mg-canvas-label">TARGET</span>
              <canvas id="tm-target" width="340" height="240" style="width:100%; display:block;"></canvas>
            </div>
          </div>
          <div style="flex:1; min-width:280px; max-width:370px;">
            <div class="mg-section-title" style="color:#88ddff;">✋ Bản của bạn (có khung xanh hướng dẫn)</div>
            <div class="mg-canvas-frame player" style="width:100%; position:relative;">
              <span class="mg-canvas-label" style="color:#88ddff;">YOURS</span>
              <canvas id="tm-player" width="340" height="240" style="width:100%; display:block; cursor:grab;"></canvas>
            </div>
          </div>
        </div>

        <!-- Live readout -->
        <div id="tm-readout" style="margin-top:12px; padding:8px 14px; background:rgba(0,0,0,0.35); border:1px solid rgba(212,175,55,0.25); border-radius:8px; font-family:'JetBrains Mono', monospace; font-size:12px; line-height:1.7;">
          <div style="display:flex; justify-content:space-around; gap:10px; flex-wrap:wrap;">
            <div><span style="color:#888">POS</span> <span id="tm-pos" style="color:#fff">—</span></div>
            <div><span style="color:#888">ROT</span> <span id="tm-rot" style="color:#fff">—</span></div>
            <div><span style="color:#888">SCALE</span> <span id="tm-scl" style="color:#fff">—</span></div>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:6px; margin-top:14px;">
          <button class="minigame-button" id="tm-check">✓ Kiểm tra</button>
          <button class="minigame-button secondary" id="tm-reset">↻ Reset</button>
        </div>
      </div>
    `
    c.appendChild(panel)
    this.panel = panel

    this.$targetCanvas = panel.querySelector('#tm-target')
    this.$playerCanvas = panel.querySelector('#tm-player')
    this.$timerFill = panel.querySelector('#tm-timer-fill')
    this.$timerText = panel.querySelector('#tm-timer-text')
    this.$pos = panel.querySelector('#tm-pos')
    this.$rot = panel.querySelector('#tm-rot')
    this.$scl = panel.querySelector('#tm-scl')

    panel.querySelector('#tm-check').addEventListener('click', () => this._check())
    panel.querySelector('#tm-reset').addEventListener('click', () => this._reset())

    this._targetCtx = this.$targetCanvas.getContext('2d')
    this._playerCtx = this.$playerCanvas.getContext('2d')
  }

  _bindInteraction() {
    const canvas = this.$playerCanvas
    let dragging = false, lastX = 0, lastY = 0
    canvas.addEventListener('mousedown', (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY
      canvas.style.cursor = 'grabbing'
    })
    window.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'grab' })
    canvas.addEventListener('mousemove', (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      lastX = e.clientX; lastY = e.clientY
      if (e.shiftKey) {
        this.playerMesh.position.x += dx * 0.005
        this.playerMesh.position.y -= dy * 0.005
      } else {
        this.playerMesh.rotation.y += dx * 0.012
        this.playerMesh.rotation.x += dy * 0.012
      }
    })
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.95 : 1.05
      this.playerMesh.scale.multiplyScalar(factor)
      this.playerMesh.scale.clampScalar(0.2, 3.0)
    }, { passive: false })
  }

  _reset() {
    this.playerMesh.position.set(0, 0, 0)
    this.playerMesh.rotation.set(0, 0, 0)
    this.playerMesh.scale.set(1, 1, 1)
  }

  _wrap(a) {
    while (a > Math.PI) a -= Math.PI * 2
    while (a < -Math.PI) a += Math.PI * 2
    return a
  }

  /** Compute closeness factors 0..1 (1 = perfect). */
  _matchScores() {
    const a = this.playerMesh, b = this.targetData
    const posDist = a.position.distanceTo(b.position)
    const rotDiff = Math.max(
      Math.abs(this._wrap(a.rotation.x - b.rotation.x)),
      Math.abs(this._wrap(a.rotation.y - b.rotation.y)),
      Math.abs(this._wrap(a.rotation.z - b.rotation.z))
    )
    const scaleDist = a.scale.distanceTo(b.scale)
    return { posDist, rotDiff, scaleDist }
  }

  _check() {
    const { posDist, rotDiff, scaleDist } = this._matchScores()
    // Generous tolerances:
    const POS_OK = 0.6
    const ROT_OK = 0.55
    const SCALE_OK = 0.4
    if (posDist < POS_OK && rotDiff < ROT_OK && scaleDist < SCALE_OK) {
      this._finish(true)
    } else {
      this.hudUI.flashError(this.panel)
      this.elapsed += 4
    }
  }

  _finish(success) {
    if (this.finished) return
    this.finished = true
    if (success) this.onComplete && this.onComplete(true)
    else this.onTimeout && this.onTimeout()
  }

  _renderToCtx(scene, camera, ctx) {
    if (!this.renderer || !this._renderTarget) return
    const prevTarget = this.renderer.getRenderTarget()
    try {
      this.renderer.setRenderTarget(this._renderTarget)
      this.renderer.render(scene, camera)
      this.renderer.readRenderTargetPixels(this._renderTarget, 0, 0, this._W, this._H, this._pixelBuf)
    } finally {
      this.renderer.setRenderTarget(prevTarget)
    }
    const img = ctx.createImageData(this._W, this._H)
    const W4 = this._W * 4
    const data = img.data
    const buf = this._pixelBuf
    for (let y = 0; y < this._H; y++) {
      const srcRow = (this._H - 1 - y) * W4
      const dstRow = y * W4
      for (let x = 0; x < W4; x++) data[dstRow + x] = buf[srcRow + x]
    }
    ctx.putImageData(img, 0, 0)
  }

  /** Update the live readout below the canvases. */
  _updateReadout() {
    if (!this.$pos) return
    const { posDist, rotDiff, scaleDist } = this._matchScores()
    const colorize = (val, threshold) => {
      if (val < threshold * 0.5) return '#4caf50'   // very close — green
      if (val < threshold) return '#FFD76A'         // close — gold
      return '#ff8a8a'                              // far — red
    }
    const a = this.playerMesh
    this.$pos.innerHTML = `<span style="color:${colorize(posDist, 0.6)}">${posDist.toFixed(2)}</span> / 0.6`
    this.$rot.innerHTML = `<span style="color:${colorize(rotDiff, 0.55)}">${rotDiff.toFixed(2)}</span> / 0.55`
    this.$scl.innerHTML = `<span style="color:${colorize(scaleDist, 0.4)}">${scaleDist.toFixed(2)}</span> / 0.4`
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
    this._updateReadout()
    if (this._targetCtx && this._playerCtx) {
      try {
        this._renderToCtx(this.targetScene, this.targetCamera, this._targetCtx)
        this._renderToCtx(this.playerScene, this.playerCamera, this._playerCtx)
      } catch (e) {
        console.error('[TransformMinigame] render error', e)
      }
    }
  }

  dispose() {
    if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel)
    if (this._renderTarget) { this._renderTarget.dispose(); this._renderTarget = null }
  }
}
