import * as THREE from 'three'

const NPC_SPEED = 1.4
const ARRIVE_THRESHOLD = 0.4

/**
 * NPC visitor - patrols a list of waypoints in the museum.
 */
export class Visitor {
  /**
   * @param {THREE.Vector3[]} waypoints
   * @param {number} colorHsl - hue 0..1
   */
  constructor(waypoints, colorHsl = 0.6) {
    if (!waypoints || waypoints.length < 2) {
      throw new Error('Visitor requires at least 2 waypoints')
    }
    this.waypoints = waypoints.map(w => w.clone())
    this._currentIndex = 0
    this._wait = 0

    this.group = new THREE.Group()
    this.group.position.copy(this.waypoints[0])

    const color = new THREE.Color().setHSL(colorHsl, 0.5, 0.5)

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.9, 6, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    )
    torso.position.y = 0.85
    this.group.add(torso)

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xddbb99, roughness: 0.7 })
    )
    head.position.y = 1.6
    this.group.add(head)
  }

  update(delta) {
    const target = this.waypoints[this._currentIndex]
    const pos = this.group.position
    const dx = target.x - pos.x
    const dz = target.z - pos.z
    const dist = Math.hypot(dx, dz)

    if (dist < ARRIVE_THRESHOLD) {
      // Wait briefly at each waypoint
      this._wait += delta
      if (this._wait > 1.5) {
        this._wait = 0
        this._currentIndex = (this._currentIndex + 1) % this.waypoints.length
      }
      return
    }

    const step = Math.min(NPC_SPEED * delta, dist)
    pos.x += (dx / dist) * step
    pos.z += (dz / dist) * step

    // Face direction of travel
    this.group.rotation.y = Math.atan2(dx, dz)
  }
}
