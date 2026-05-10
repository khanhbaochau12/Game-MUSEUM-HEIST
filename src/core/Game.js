import * as THREE from 'three'
import { assets } from './AssetLoader.js'
import { input } from './InputManager.js'
import { Museum } from '../world/Museum.js'
import { LightingSystem } from '../lighting/LightingSystem.js'
import { Player } from '../player/Player.js'
import { Visitor } from '../npc/Visitor.js'
import { HUD } from '../ui/HUD.js'
import { CameraToolbar } from '../ui/CameraToolbar.js'
import { MinigameManager } from '../minigames/MinigameManager.js'
import { pointInRect } from '../utils/CollisionUtils.js'

export class Game {
  constructor() {
    this.renderer = null
    this.scene = null
    this.camera = null
    this.clock = new THREE.Clock()
    this.totalMoney = 0
    this.gameOver = false
    this.collectedAny = false
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    document.getElementById('app').appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300)

    const $bar = document.getElementById('loading-bar')
    const $text = document.getElementById('loading-text')
    await assets.loadAll(p => {
      $bar.style.width = p.toFixed(0) + '%'
      $text.textContent = p.toFixed(0) + '%'
    })

    this.museum = new Museum()
    this.scene.add(this.museum.group)
    this.museum.applySky(this.scene)

    this.lights = new LightingSystem()
    this.lights.setupExterior(this.scene)
    this.lights.setupInterior(this.scene, this.museum.exhibitItems)

    this.player = new Player(this.camera)
    this.scene.add(this.player.object)

    this.npcs = []
    this._createNpcs()

    this.hud = new HUD()
    this.hud.showMoney(0)
    this.cameraToolbar = new CameraToolbar(this.camera)

    this.minigameManager = new MinigameManager({
      renderer: this.renderer,
      hud: this.hud,
      onItemStolen: (item) => {
        this.totalMoney += item.value
        this.hud.showMoney(this.totalMoney)
        this.collectedAny = true
        setTimeout(() => {
          input.requestPointerLock(this.renderer.domElement)
        }, 50)
      },
      onCaught: () => this.endGame('caught')
    })

    this.renderer.domElement.addEventListener('click', () => {
      if (!this.minigameManager.isActive && !this.gameOver) {
        input.requestPointerLock(this.renderer.domElement)
      }
    })

    input.onKeyPress('KeyE', () => this._handleInteract())
    window.addEventListener('resize', () => this._onResize())

    setTimeout(() => {
      const ls = document.getElementById('loading-screen')
      if (ls) ls.classList.add('hidden')
    }, 200)
  }

  _createNpcs() {
    const waypointSets = [
      [
        new THREE.Vector3(-22, 0, -3),
        new THREE.Vector3(-22, 0, -25),
        new THREE.Vector3(-5, 0, -25),
        new THREE.Vector3(-5, 0, -3)
      ],
      [
        new THREE.Vector3(22, 0, -3),
        new THREE.Vector3(22, 0, -28),
        new THREE.Vector3(5, 0, -28),
        new THREE.Vector3(5, 0, -8)
      ],
      [
        new THREE.Vector3(-8, 0, -32),
        new THREE.Vector3(4, 0, -32),
        new THREE.Vector3(4, 0, -15),
        new THREE.Vector3(-14, 0, -15)
      ],
      [
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, -32)
      ]
    ]
    const hues = [0.05, 0.55, 0.75, 0.15]
    for (let i = 0; i < waypointSets.length; i++) {
      const npc = new Visitor(waypointSets[i], hues[i])
      this.npcs.push(npc)
      this.scene.add(npc.group)
    }
  }

  _handleInteract() {
    if (this.gameOver || this.minigameManager.isActive) return
    const stand = this.player.canInteract(this.museum.displayStands)
    if (stand) {
      this.minigameManager.startSequence(stand)
    }
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }

  start() {
    this.clock.start()
    this.renderer.setAnimationLoop(() => this._tick())
  }

  _tick() {
    const delta = Math.min(this.clock.getDelta(), 0.05)
    const elapsed = this.clock.elapsedTime

    try {
      if (!this.gameOver) {
        this.update(delta, elapsed)
      }
      this.render()
    } catch (e) {
      console.error('[Game._tick] error', e)
    }
  }

  update(delta, elapsed) {
    if (this.minigameManager.isActive) {
      this.minigameManager.update(delta)
      return
    }

    this.player.update(delta, this.museum.colliders)
    this.museum.update(elapsed, delta)
    for (const item of this.museum.exhibitItems) item.update(delta)
    for (const npc of this.npcs) npc.update(delta)
    this.lights.update(elapsed)

    const stand = this.player.canInteract(this.museum.displayStands)
    if (stand) {
      const it = stand.item
      this.hud.showInteractHint(true,
        `Nhấn <span class="key">E</span> để trộm <b>${it.label}</b> ($${it.value} • ${it.numMinigames} minigame)`)
    } else {
      this.hud.showInteractHint(false)
    }

    if (this.collectedAny && pointInRect(this.player.position, this.museum.exitZone) &&
        this.player.position.z > this.museum.exitZone.z1) {
      if (this.player.position.z >= this.museum.layout.frontZ) {
        this.endGame('escaped')
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  endGame(reason) {
    if (this.gameOver) return
    this.gameOver = true
    input.exitPointerLock()
    input.setEnabled(false)
    this.hud.hideTimer()
    this.hud.showInteractHint(false)
    this.hud.showGameOver(reason, this.totalMoney)
  }
}
