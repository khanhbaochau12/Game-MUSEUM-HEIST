import * as THREE from 'three'
import { randRange } from '../utils/MathUtils.js'

/**
 * A group of stylized trees that gently sway with the wind.
 */
export class TreeGroup {
  constructor() {
    this.group = new THREE.Group()
    this._trees = []
  }

  /**
   * Add two rows of trees flanking a central path along Z axis.
   */
  buildAvenue(centerZRange, xLeft, xRight, count = 6) {
    const stepZ = (centerZRange[1] - centerZRange[0]) / (count - 1)
    for (let i = 0; i < count; i++) {
      const z = centerZRange[0] + stepZ * i
      this._addTree(xLeft + randRange(-0.4, 0.4), z + randRange(-0.5, 0.5))
      this._addTree(xRight + randRange(-0.4, 0.4), z + randRange(-0.5, 0.5))
    }
  }

  /**
   * Add scattered trees in a band.
   */
  scatter(zone, count) {
    for (let i = 0; i < count; i++) {
      const x = randRange(zone.xMin, zone.xMax)
      const z = randRange(zone.zMin, zone.zMax)
      this._addTree(x, z)
    }
  }

  _addTree(x, z) {
    const tree = new THREE.Group()

    const trunkH = randRange(2.5, 3.6)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.22, trunkH, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b3a1a, roughness: 0.9 })
    )
    trunk.position.y = trunkH / 2
    trunk.castShadow = true
    tree.add(trunk)

    // Multiple foliage spheres for organic shape
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.6, 0.32 + Math.random() * 0.1),
      roughness: 0.8
    })
    const foliageCount = 3
    for (let f = 0; f < foliageCount; f++) {
      const r = randRange(0.9, 1.4)
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 12),
        foliageMat
      )
      foliage.position.set(
        randRange(-0.4, 0.4),
        trunkH + randRange(-0.2, 0.5),
        randRange(-0.4, 0.4)
      )
      foliage.castShadow = true
      tree.add(foliage)
    }

    tree.position.set(x, 0, z)
    tree.userData.swayOffset = Math.random() * Math.PI * 2
    tree.userData.swayAmount = 0.02 + Math.random() * 0.02
    tree.userData.swaySpeed = 0.7 + Math.random() * 0.5
    this._trees.push(tree)
    this.group.add(tree)
  }

  /**
   * Sway trees in the wind.
   */
  update(time) {
    for (const t of this._trees) {
      const u = t.userData
      t.rotation.z = Math.sin(time * u.swaySpeed + u.swayOffset) * u.swayAmount
      t.rotation.x = Math.cos(time * u.swaySpeed * 0.8 + u.swayOffset) * u.swayAmount * 0.5
    }
  }
}
