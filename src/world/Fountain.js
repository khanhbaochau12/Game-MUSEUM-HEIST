import * as THREE from 'three'
import { assets } from '../core/AssetLoader.js'

/**
 * A fountain with animated water particles.
 */
export class Fountain {
  constructor(position = new THREE.Vector3(0, 0, 0)) {
    this.group = new THREE.Group()
    this.group.position.copy(position)
    this._build()
  }

  _build() {
    const stoneTex = assets.getTexture('stone')

    // Outer basin
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.7, 0.5, 32),
      new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.7 })
    )
    basin.position.y = 0.25
    basin.receiveShadow = true
    this.group.add(basin)

    // Water surface
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.05, 32),
      new THREE.MeshStandardMaterial({
        color: 0x4a90e2, transparent: true, opacity: 0.7,
        metalness: 0.4, roughness: 0.1
      })
    )
    water.position.y = 0.5
    this.group.add(water)
    this._water = water

    // Center pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.2, 16),
      new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.6 })
    )
    pillar.position.y = 1.1
    pillar.castShadow = true
    this.group.add(pillar)

    // Top spout sphere
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.5 })
    )
    top.position.y = 1.85
    top.castShadow = true
    this.group.add(top)

    // Particle system - water droplets
    this._buildParticles()
  }

  _buildParticles() {
    const PARTICLE_COUNT = 200
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    this._velocities = new Float32Array(PARTICLE_COUNT * 3)
    this._lifetimes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._resetParticle(i, positions)
      this._lifetimes[i] = Math.random() * 1.5
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0x88ccff, size: 0.08, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
    this._particles = new THREE.Points(geom, mat)
    this.group.add(this._particles)
  }

  _resetParticle(i, positions) {
    const idx = i * 3
    positions[idx + 0] = (Math.random() - 0.5) * 0.1
    positions[idx + 1] = 1.85
    positions[idx + 2] = (Math.random() - 0.5) * 0.1

    const angle = Math.random() * Math.PI * 2
    const speed = 0.5 + Math.random() * 0.8
    this._velocities[i * 3 + 0] = Math.cos(angle) * speed * 0.4
    this._velocities[i * 3 + 1] = 2.5 + Math.random() * 1.5
    this._velocities[i * 3 + 2] = Math.sin(angle) * speed * 0.4
  }

  update(delta) {
    if (!this._particles) return
    const positions = this._particles.geometry.attributes.position.array
    const gravity = -6.0
    const PARTICLE_COUNT = positions.length / 3
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._lifetimes[i] += delta
      const idx = i * 3
      positions[idx + 0] += this._velocities[idx + 0] * delta
      positions[idx + 1] += this._velocities[idx + 1] * delta
      positions[idx + 2] += this._velocities[idx + 2] * delta
      this._velocities[idx + 1] += gravity * delta

      if (positions[idx + 1] < 0.5 || this._lifetimes[i] > 2.5) {
        this._resetParticle(i, positions)
        this._lifetimes[i] = 0
      }
    }
    this._particles.geometry.attributes.position.needsUpdate = true

    // Subtle water ripple
    if (this._water) {
      this._water.position.y = 0.5 + Math.sin(performance.now() * 0.002) * 0.01
    }
  }
}
