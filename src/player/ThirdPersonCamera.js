import * as THREE from 'three'
import { input } from '../core/InputManager.js'
import { clamp } from '../utils/MathUtils.js'

const MOUSE_SENSITIVITY = 0.0022

/**
 * Third person camera. Orbits behind the player.
 * Yaw is the player heading; the camera sits behind+above and looks at the player.
 */
export class ThirdPersonCamera {
  constructor(camera, player) {
    this.camera = camera
    this.player = player
    this.yaw = 0
    this.pitch = -0.15
    this.distance = 6
    this._enabled = false

    input.onMouseMove(({ dx, dy, locked }) => {
      if (!this._enabled || !locked) return
      this.yaw -= dx * MOUSE_SENSITIVITY
      this.pitch -= dy * MOUSE_SENSITIVITY
      this.pitch = clamp(this.pitch, -1.0, 0.5)
    })
  }

  setEnabled(enabled) { this._enabled = enabled }

  syncFrom(yaw, pitch = -0.15) {
    this.yaw = yaw
    this.pitch = pitch
  }

  update() {
    // Player faces yaw direction
    this.player.object.rotation.y = this.yaw

    // Spherical orbit position
    const cosP = Math.cos(this.pitch)
    const offset = new THREE.Vector3(
      -Math.sin(this.yaw) * cosP,
      Math.sin(-this.pitch) + 0.5,
      -Math.cos(this.yaw) * cosP
    ).multiplyScalar(this.distance)

    const focus = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight - 0.2,
      this.player.position.z
    )
    this.camera.position.copy(focus).add(offset)
    this.camera.lookAt(focus)
  }

  /** What direction is "forward" relative to the camera? */
  getForward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
  }
}
