import * as THREE from 'three'
import { assets } from '../core/AssetLoader.js'
import { TreeGroup } from '../objects/TreeGroup.js'
import { Fountain } from './Fountain.js'

/**
 * Outdoor scene: ground, museum facade, columns, steps, trees, fountain,
 * lampposts, flower beds, banners, statues, and skybox.
 */
export class Exterior {
  constructor() {
    this.group = new THREE.Group()
    this.colliders = []
    this._build()
  }

  _build() {
    this._buildGround()
    this._buildFacade()
    this._buildSteps()
    this._buildSurroundingWall()
    this._buildLampposts()
    this._buildFlowerBeds()
    this._buildStatues()
    this._buildTrees()
    this._buildFountain()
  }

  _buildGround() {
    const grass = assets.getTexture('grass')
    grass.repeat.set(20, 20)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ map: grass, roughness: 0.9 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.group.add(ground)

    const stone = assets.getTexture('stone')
    stone.repeat.set(2, 8)
    const pavement = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 30),
      new THREE.MeshStandardMaterial({ map: stone, roughness: 0.85 })
    )
    pavement.rotation.x = -Math.PI / 2
    pavement.position.set(0, 0.01, 22)
    pavement.receiveShadow = true
    this.group.add(pavement)
  }

  _buildFacade() {
    const brick = assets.getTexture('brick')
    brick.repeat.set(8, 3)
    const m = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.85 })
    const facadeZ = 5

    const wingW = 30, h = 14, d = 1
    for (const x of [-25, 25]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, h, d), m)
      wing.position.set(x, h / 2, facadeZ)
      wing.castShadow = wing.receiveShadow = true
      this.group.add(wing)
      this.colliders.push(wing)
    }

    const crown = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1.4), m)
    crown.position.set(0, 13, facadeZ)
    crown.castShadow = true
    this.group.add(crown)

    const pediShape = new THREE.Shape()
    pediShape.moveTo(-8, 0); pediShape.lineTo(8, 0); pediShape.lineTo(0, 4); pediShape.lineTo(-8, 0)
    const pediment = new THREE.Mesh(
      new THREE.ExtrudeGeometry(pediShape, { depth: 0.6, bevelEnabled: false }), m
    )
    pediment.position.set(0, 14, facadeZ - 0.3)
    pediment.castShadow = true
    this.group.add(pediment)

    const colMat = new THREE.MeshStandardMaterial({ color: 0xeee8d5, roughness: 0.5 })
    for (const x of [-8, -4, 4, 8]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 13, 24), colMat)
      col.position.set(x, 6.5, facadeZ - 0.5)
      col.castShadow = col.receiveShadow = true
      this.group.add(col)

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), colMat)
      cap.position.set(x, 13.2, facadeZ - 0.5)
      cap.castShadow = true
      this.group.add(cap)

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), colMat)
      base.position.set(x, 0.2, facadeZ - 0.5)
      base.castShadow = true
      this.group.add(base)

      this.colliders.push(col)
    }

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.8, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xFFD700, emissive: 0x554400, emissiveIntensity: 0.4,
        metalness: 0.6, roughness: 0.3
      })
    )
    sign.position.set(0, 11.5, facadeZ - 0.6)
    sign.castShadow = true
    this.group.add(sign)
  }

  _buildSteps() {
    const stone = assets.getTexture('stone')
    stone.repeat.set(4, 1)
    const stepMat = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.7 })
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(12 + i * 1.2, 0.3, 6 + i * 0.6), stepMat
      )
      step.position.set(0, 0.15 + i * 0.3, 6 + i * 0.6)
      step.receiveShadow = step.castShadow = true
      this.group.add(step)
    }
  }

  _buildSurroundingWall() {
    const brick = assets.getTexture('brick')
    brick.repeat.set(20, 1)
    const m = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.85 })
    const h = 3, S = 100, t = 1
    // Walls hugging the edge of the 200x200 grass plane.
    // Wall thickness (t=1) is positioned just inside the grass edge so its
    // outer face sits flush at ±S.
    const positions = [
      { p: [0, h / 2,  S - t / 2], s: [S * 2, h, t] },   // north
      { p: [0, h / 2, -S + t / 2], s: [S * 2, h, t] },   // south
      { p: [ S - t / 2, h / 2, 0], s: [t, h, S * 2] },   // east
      { p: [-S + t / 2, h / 2, 0], s: [t, h, S * 2] }    // west
    ]
    for (const w of positions) {
      const x = new THREE.Mesh(new THREE.BoxGeometry(...w.s), m)
      x.position.set(...w.p)
      x.castShadow = x.receiveShadow = true
      this.group.add(x)
      this.colliders.push(x)
    }
  }

  _buildLampposts() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 })
    for (const [x, z] of [[-6, 8], [6, 8], [-6, 18], [6, 18], [-6, 30], [6, 30]]) {
      const g = new THREE.Group()
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.5, 12), poleMat)
      pole.position.y = 2.25
      pole.castShadow = true
      g.add(pole)
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffeeaa, emissive: 0xffaa44, emissiveIntensity: 1.5
        })
      )
      globe.position.y = 4.6
      g.add(globe)
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 8), poleMat)
      cap.position.y = 4.95
      g.add(cap)
      g.position.set(x, 0, z)
      this.group.add(g)
      const pl = new THREE.PointLight(0xffcc66, 0.8, 8, 1.5)
      pl.position.set(x, 4.6, z)
      this.group.add(pl)
    }
  }

  _buildFlowerBeds() {
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.95 })
    for (const beds of [
      { p: [-7, 0.05, 22], s: [3, 0.1, 26] },
      { p: [7, 0.05, 22], s: [3, 0.1, 26] }
    ]) {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(...beds.s), bedMat)
      bed.position.set(...beds.p)
      bed.receiveShadow = true
      this.group.add(bed)
      const cols = [0xff4477, 0xffaa33, 0xffffff, 0xaa44ff, 0xff7733]
      for (let i = 0; i < 30; i++) {
        const col = cols[Math.floor(Math.random() * cols.length)]
        const f = new THREE.Mesh(
          new THREE.SphereGeometry(0.12 + Math.random() * 0.06, 8, 8),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, emissive: col, emissiveIntensity: 0.05 })
        )
        const fx = beds.p[0] + (Math.random() - 0.5) * (beds.s[0] - 0.4)
        const fz = beds.p[2] + (Math.random() - 0.5) * (beds.s[2] - 0.4)
        f.position.set(fx, 0.25, fz)
        this.group.add(f)
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x2d6b2d })
        )
        stem.position.set(fx, 0.15, fz)
        this.group.add(stem)
      }
    }
  }

  _buildStatues() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd0c8b8, roughness: 0.65, metalness: 0.1 })
    for (const x of [-7.5, 7.5]) {
      const g = new THREE.Group()
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xaaa090, roughness: 0.7 })
      )
      ped.position.y = 0.7
      ped.castShadow = ped.receiveShadow = true
      g.add(ped)
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 8, 16), stoneMat)
      body.position.y = 2.05
      body.castShadow = true
      g.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), stoneMat)
      head.position.y = 3.0
      head.castShadow = true
      g.add(head)
      for (const ax of [-0.5, 0.5]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 6, 12), stoneMat)
        arm.position.set(ax, 2.2, 0)
        arm.rotation.z = ax > 0 ? -Math.PI / 4 : Math.PI / 4
        arm.castShadow = true
        g.add(arm)
      }
      g.position.set(x, 0, 9)
      this.group.add(g)
      this.colliders.push(ped)
    }
  }

  _buildTrees() {
    this.trees = new TreeGroup()
    this.trees.buildAvenue([10, 35], -10, 10, 6)
    this.trees.scatter({ xMin: -80, xMax: -30, zMin: 10, zMax: 80 }, 12)
    this.trees.scatter({ xMin: 30, xMax: 80, zMin: 10, zMax: 80 }, 12)
    this.trees.scatter({ xMin: -60, xMax: 60, zMin: 50, zMax: 80 }, 10)
    this.group.add(this.trees.group)
  }

  _buildFountain() {
    this.fountain = new Fountain(new THREE.Vector3(0, 0, 25))
    this.group.add(this.fountain.group)
  }

  applySky(scene) {
    scene.background = assets.cubeTexture
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0035)
  }

  update(time, delta) {
    if (this.trees) this.trees.update(time)
    if (this.fountain) this.fountain.update(delta)
  }
}
