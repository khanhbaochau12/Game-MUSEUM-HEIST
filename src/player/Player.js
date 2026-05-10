import * as THREE from 'three'
import { input } from '../core/InputManager.js'
import { clipMovement } from '../utils/CollisionUtils.js'
import { FirstPersonCamera } from './FirstPersonCamera.js'
import { ThirdPersonCamera } from './ThirdPersonCamera.js'

const MOVE_SPEED = 5
const RUN_SPEED = 9
const EYE_HEIGHT = 1.7

export class Player {
  constructor(camera) {
    this.position = new THREE.Vector3(0, 0, 18) // start outside the museum near pavement
    this.eyeHeight = EYE_HEIGHT
    this.object = new THREE.Object3D()
    this.object.position.copy(this.position)

    // Visible TPS body (capsule with simple head)
    this.body = new THREE.Group()
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.0, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })
    )
    torso.position.y = 0.9
    torso.castShadow = true
    this.body.add(torso)

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xddbb99, roughness: 0.6 })
    )
    head.position.y = 1.7
    head.castShadow = true
    this.body.add(head)

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
    )
    hat.position.y = 1.96
    this.body.add(hat)

    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
    )
    brim.position.y = 1.88
    this.body.add(brim)

    // Forward marker (front of body) so player visually faces direction
    this.body.rotation.y = 0
    this.object.add(this.body)

    this._camera = camera
    this.fpsCam = new FirstPersonCamera(camera, this)
    this.tpsCam = new ThirdPersonCamera(camera, this)
    this.mode = 'fps'
    this.fpsCam.setEnabled(true)
    this.body.visible = false // hidden in FPS

    input.onKeyPress('KeyV', () => this.toggleCamera())
  }

  toggleCamera() {
    if (this.mode === 'fps') {
      this.mode = 'tps'
      this.fpsCam.setEnabled(false)
      this.tpsCam.setEnabled(true)
      this.tpsCam.syncFrom(this.fpsCam.yaw, -0.15)
      this.body.visible = true
    } else {
      this.mode = 'fps'
      this.tpsCam.setEnabled(false)
      this.fpsCam.setEnabled(true)
      this.fpsCam.syncFrom(this.tpsCam.yaw, 0)
      this.body.visible = false
    }
  }

  /** Get the camera yaw used for movement direction (always available). */
  _activeYaw() {
    return this.mode === 'fps' ? this.fpsCam.yaw : this.tpsCam.yaw
  }

  update(delta, colliders) {
    // 1. Read movement intent
    let forward = 0, right = 0
    if (input.anyDown('KeyW', 'ArrowUp'))    forward += 1
    if (input.anyDown('KeyS', 'ArrowDown'))  forward -= 1
    if (input.anyDown('KeyA', 'ArrowLeft'))  right   -= 1
    if (input.anyDown('KeyD', 'ArrowRight')) right   += 1

    const running = input.anyDown('ShiftLeft', 'ShiftRight')
    const speed = running ? RUN_SPEED : MOVE_SPEED

    // 2. Convert intent to world-space delta using yaw
    const yaw = this._activeYaw()
    const sin = Math.sin(yaw), cos = Math.cos(yaw)
    // Forward direction in world: (-sin, 0, -cos); Right: (cos, 0, -sin)
    const dx = (-sin * forward + cos * right) * speed * delta
    const dz = (-cos * forward - sin * right) * speed * delta

    let move = new THREE.Vector3(dx, 0, dz)
    if (move.lengthSq() > 0) {
      move = clipMovement(this.position, move, colliders, 0.4)
    }

    this.position.add(move)
    // Keep on the ground (no physics, just clamp y)
    this.position.y = 0
    this.object.position.copy(this.position)

    // 3. Update camera
    if (this.mode === 'fps') this.fpsCam.update()
    else this.tpsCam.update()
  }

  /**
   * Among an array of DisplayStand, return the first one in interaction range.
   */
  canInteract(stands) {
    for (const s of stands) {
      if (s.item && !s.item.collected && s.isPlayerNearby(this.position)) {
        return s
      }
    }
    return null
  }
}
