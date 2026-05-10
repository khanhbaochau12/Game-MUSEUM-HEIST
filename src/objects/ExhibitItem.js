import * as THREE from 'three'

/**
 * ExhibitItem - represents a stealable item.
 *
 * Each item has:
 *  - type: which primitive/model it is
 *  - value: money rewarded
 *  - numMinigames: how many minigames must be solved (2..4)
 *  - mesh: the actual Three.js mesh
 */
export class ExhibitItem {
  constructor({ type, value, numMinigames, mesh, label = '' }) {
    this.type = type
    this.value = value
    this.numMinigames = Math.max(2, Math.min(4, numMinigames || 2))
    this.mesh = mesh
    this.label = label
    this.collected = false
    this._time = 0

    // Track materials so we can flicker emissive
    this._materials = []
    mesh.traverse(o => {
      if (o.isMesh && o.material && 'emissive' in o.material) {
        // Ensure each mesh has its own material instance
        if (!o.material._heistTagged) {
          o.material = o.material.clone()
          o.material._heistTagged = true
        }
        o.material.emissive = new THREE.Color(0x332200)
        o.material.emissiveIntensity = 0.2
        this._materials.push(o.material)
      }
    })
  }

  update(delta) {
    if (this.collected) return
    this._time += delta
    this.mesh.rotation.y += delta * 0.8
    const pulse = 0.3 + 0.2 * Math.sin(this._time * 2)
    for (const m of this._materials) {
      m.emissiveIntensity = pulse
    }
  }
}
