import * as THREE from 'three'

const _ray = new THREE.Raycaster()
const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()

/**
 * Test movement against an array of collidable meshes using raycasting.
 * Returns the desired movement clipped so we don't penetrate walls.
 *
 * @param {THREE.Vector3} position - current position (will not be mutated)
 * @param {THREE.Vector3} delta    - desired translation this frame
 * @param {THREE.Object3D[]} colliders - meshes that block movement
 * @param {number} radius - capsule radius
 * @returns {THREE.Vector3} clipped delta
 */
export function clipMovement(position, delta, colliders, radius = 0.4) {
  if (delta.lengthSq() < 1e-8) return delta
  const out = delta.clone()

  // Try axis-separated raycasts (X then Z) so sliding works smoothly along walls.
  for (const axis of ['x', 'z']) {
    if (Math.abs(out[axis]) < 1e-6) continue
    _origin.copy(position)
    _origin.y += 0.9 // mid-body
    _dir.set(0, 0, 0)
    _dir[axis] = Math.sign(out[axis])
    _ray.set(_origin, _dir)
    _ray.far = Math.abs(out[axis]) + radius
    const hits = _ray.intersectObjects(colliders, true)
    if (hits.length > 0 && hits[0].distance < Math.abs(out[axis]) + radius) {
      out[axis] = 0
    }
  }  
  return out
}

/**
 * Check if a point in XZ is within a rectangular zone (e.g. exit door).
 */
export function pointInRect(point, rect) {
  return point.x >= rect.x1 && point.x <= rect.x2 && point.z >= rect.z1 && point.z <= rect.z2
}
