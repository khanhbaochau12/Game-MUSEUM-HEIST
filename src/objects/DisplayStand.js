import * as THREE from 'three'
import { assets } from '../core/AssetLoader.js'

/**
 * Wooden pedestal with marble plate, glass cover, velvet ropes, and gold plaque.
 */
export class DisplayStand {
  constructor(position, options = {}) {
    this.height = options.height || 1.0
    this.position = position.clone()
    this.item = null
    this.group = new THREE.Group()
    this.group.position.copy(position)
    this._build()
  }

  _build() {
    const wood = assets.getTexture('wood')
    wood.repeat.set(2, 2)
    const mat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6, metalness: 0.1 })

    const base = new THREE.Mesh(new THREE.BoxGeometry(2, this.height, 2), mat)
    base.position.y = this.height / 2
    base.castShadow = base.receiveShadow = true
    this.group.add(base)
    this._base = base

    const trimMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.3 })
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 2.15), trimMat)
    trim.position.y = this.height + 0.04
    trim.castShadow = true
    this.group.add(trim)

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.05, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.2 })
    )
    plate.position.y = this.height + 0.105
    plate.receiveShadow = true
    this.group.add(plate)

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.5, 1.6),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transparent: true, opacity: 0.10,
        roughness: 0.02, metalness: 0, transmission: 0.85,
        side: THREE.DoubleSide, ior: 1.5
      })
    )
    glass.position.y = this.height + 0.75
    this.group.add(glass)
    this._glass = glass

    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x9b1a1a, roughness: 0.85 })
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xc9a44a, metalness: 0.85, roughness: 0.25 })
    const corners = [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]
    const poles = []
    for (const [cx, cz] of corners) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12), poleMat)
      pole.position.set(cx, 0.425, cz)
      pole.castShadow = true
      this.group.add(pole)
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), poleMat)
      ball.position.set(cx, 0.88, cz)
      this.group.add(ball)
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 16), poleMat)
      disc.position.set(cx, 0.025, cz)
      disc.receiveShadow = true
      this.group.add(disc)
      poles.push([cx, cz])
    }
    for (let i = 0; i < poles.length; i++) {
      const a = poles[i], b = poles[(i + 1) % poles.length]
      const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 8), ropeMat)
      rope.position.set(cx, 0.74, cz)
      rope.rotation.z = Math.PI / 2
      rope.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0])
      this.group.add(rope)
    }

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, metalness: 0.8, roughness: 0.3,
        emissive: 0x332200, emissiveIntensity: 0.2
      })
    )
    plaque.position.set(0, 0.5, 1.05)
    plaque.castShadow = true
    this.group.add(plaque)

    // Lift items so their bottom edge clearly clears the plate (avoids z-fight
    // and lets the polygon base of cones/cylinders read sharply).
    this.itemSlot = new THREE.Vector3(this.position.x, this.position.y + this.height + 0.85, this.position.z)
  }

  setItem(item) {
    this.item = item
    if (!item) return
    item.mesh.position.copy(this.itemSlot)
    item.mesh.userData.standRef = this
  }

  removeItem() {
    if (this.item) {
      this.item.mesh.visible = false
      this.item.collected = true
    }
    if (this._glass) this._glass.visible = false
  }

  isPlayerNearby(playerPos, range = 3.0) {
    const dx = playerPos.x - this.position.x
    const dz = playerPos.z - this.position.z
    return Math.hypot(dx, dz) < range
  }
}
