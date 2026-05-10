import * as THREE from 'three'
import { input } from '../core/InputManager.js'
import { clamp } from '../utils/MathUtils.js'

const MOUSE_SENSITIVITY = 0.0022

/**
 * First person camera controller.
 * Yaw is on the player object; pitch is on the camera itself (so movement uses player yaw).
 */
export class FirstPersonCamera {
  constructor(camera, player) {
    this.camera = camera
    this.player = player
    this.pitch = 0
    this.yaw = 0
    this._enabled = true

    input.onMouseMove(({ dx, dy, locked }) => {
      if (!this._enabled || !locked) return
      this.yaw -= dx * MOUSE_SENSITIVITY
      this.pitch -= dy * MOUSE_SENSITIVITY
      this.pitch = clamp(this.pitch, -Math.PI / 2.2, Math.PI / 2.2)
    })
  }

  setEnabled(enabled) { this._enabled = enabled }

  /**
   * Update camera each frame. Keeps camera at eye level on player.
   */
  update() {
    // Yaw lives on the player Object3D so movement uses its forward.
    this.player.object.rotation.y = this.yaw

    // Position camera at eye level
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    )
    // Set camera orientation: yaw + pitch
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
    this.camera.rotation.z = 0
  }

  /** Initialize from current player rotation. */
  syncFrom(yaw, pitch = 0) {
    this.yaw = yaw
    this.pitch = pitch
  }
}
