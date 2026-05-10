import * as THREE from 'three'

export const TAU = Math.PI * 2

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function randRange(a, b) {
  return a + Math.random() * (b - a)
}

export function angleDiff(a, b) {
  let d = (b - a) % TAU
  if (d < -Math.PI) d += TAU
  if (d > Math.PI) d -= TAU
  return d
}

/**
 * Compute distance from point to point (XZ plane only).
 */
export function distXZ(a, b) {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.hypot(dx, dz)
}

export function vec3(x = 0, y = 0, z = 0) {
  return new THREE.Vector3(x, y, z)
}
