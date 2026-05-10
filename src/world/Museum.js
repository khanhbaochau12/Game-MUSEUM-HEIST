import * as THREE from 'three'
import { Exterior } from './Exterior.js'
import { Interior, INTERIOR_LAYOUT } from './Interior.js'

/**
 * Museum is the union of Exterior + Interior.
 */
export class Museum {
  constructor() {
    this.group = new THREE.Group()
    this.exterior = new Exterior()
    this.interior = new Interior()
    this.group.add(this.exterior.group)
    this.group.add(this.interior.group)
  }

  get colliders() {
    return [...this.exterior.colliders, ...this.interior.colliders]
  }

  get displayStands() { return this.interior.displayStands }
  get exhibitItems()  { return this.interior.exhibitItems }
  get exitZone()      { return this.interior.exitZone }
  get layout()        { return INTERIOR_LAYOUT }

  applySky(scene) {
    this.exterior.applySky(scene)
  }

  update(time, delta) {
    this.exterior.update(time, delta)
    if (this.interior.update) this.interior.update(delta)
  }
}
