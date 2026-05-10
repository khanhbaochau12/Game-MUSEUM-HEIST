import * as THREE from 'three'
import { assets } from '../core/AssetLoader.js'
import { DisplayStand } from '../objects/DisplayStand.js'
import { ExhibitItem } from '../objects/ExhibitItem.js'
import {
  createBox, createSphere, createCone, createCylinder, createTorus, createTeapot,
  createTrophy, createVase
} from '../objects/primitives.js'

const INTERIOR = {
  width: 60, depth: 40, height: 8,
  centerZ: -15, frontZ: 5, backZ: -35,
  leftX: -30, rightX: 30, doorwayWidth: 5
}

export class Interior {
  constructor() {
    this.group = new THREE.Group()
    this.colliders = []
    this.displayStands = []
    this.exhibitItems = []
    this.exitZone = { x1: -3, x2: 3, z1: INTERIOR.frontZ - 0.5, z2: INTERIOR.frontZ + 2 }
    this._build()
  }

  _build() {
    this._buildFloor()
    this._buildCeiling()
    this._buildWalls()
    this._buildPartitions()
    this._buildExhibits()
    this._buildPaintings()
    this._buildBenches()
    this._buildDust()
  }

  _buildFloor() {
    const marble = assets.getTexture('marble')
    marble.repeat.set(10, 10)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(INTERIOR.width, INTERIOR.depth),
      new THREE.MeshStandardMaterial({ map: marble, roughness: 0.15, metalness: 0.35 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0.001, INTERIOR.centerZ)
    floor.receiveShadow = true
    this.group.add(floor)

    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 38),
      new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.85, metalness: 0.05 })
    )
    carpet.rotation.x = -Math.PI / 2
    carpet.position.set(0, 0.012, -14)
    carpet.receiveShadow = true
    this.group.add(carpet)
    for (const xOff of [-1.85, 1.85]) {
      const trim = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 38),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.6, roughness: 0.4 })
      )
      trim.rotation.x = -Math.PI / 2
      trim.position.set(xOff, 0.014, -14)
      this.group.add(trim)
    }
  }

  _buildCeiling() {
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(INTERIOR.width, INTERIOR.depth),
      new THREE.MeshStandardMaterial({
        color: 0xe8dfc8, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide
      })
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(0, INTERIOR.height, INTERIOR.centerZ)
    ceil.receiveShadow = true
    this.group.add(ceil)

    // Coffered gold beams
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b, metalness: 0.7, roughness: 0.35
    })
    for (const z of [-2, -10, -18, -26, -34]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(INTERIOR.width, 0.18, 0.35), beamMat)
      beam.position.set(0, INTERIOR.height - 0.09, z)
      beam.castShadow = beam.receiveShadow = true
      this.group.add(beam)
    }
    for (const x of [-22, -11, 0, 11, 22]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, INTERIOR.depth), beamMat)
      beam.position.set(x, INTERIOR.height - 0.09, INTERIOR.centerZ)
      beam.castShadow = beam.receiveShadow = true
      this.group.add(beam)
    }
  }

  _buildWalls() {
    const wall = assets.getTexture('wall')
    wall.repeat.set(8, 2)
    const m = new THREE.MeshStandardMaterial({ map: wall, roughness: 0.85 })
    const t = 0.5

    const back = new THREE.Mesh(new THREE.BoxGeometry(INTERIOR.width, INTERIOR.height, t), m)
    back.position.set(0, INTERIOR.height / 2, INTERIOR.backZ)
    back.castShadow = back.receiveShadow = true
    this.group.add(back); this.colliders.push(back)

    const dwHalf = INTERIOR.doorwayWidth / 2
    const fpw = INTERIOR.width / 2 - dwHalf
    const fL = new THREE.Mesh(new THREE.BoxGeometry(fpw, INTERIOR.height, t), m)
    fL.position.set(-(dwHalf + fpw / 2), INTERIOR.height / 2, INTERIOR.frontZ)
    fL.castShadow = fL.receiveShadow = true
    this.group.add(fL); this.colliders.push(fL)
    const fR = fL.clone()
    fR.position.x = dwHalf + fpw / 2
    this.group.add(fR); this.colliders.push(fR)

    const dT = new THREE.Mesh(new THREE.BoxGeometry(INTERIOR.doorwayWidth + 1, INTERIOR.height - 4.5, t), m)
    dT.position.set(0, INTERIOR.height - (INTERIOR.height - 4.5) / 2, INTERIOR.frontZ)
    dT.castShadow = dT.receiveShadow = true
    this.group.add(dT)

    const left = new THREE.Mesh(new THREE.BoxGeometry(t, INTERIOR.height, INTERIOR.depth), m)
    left.position.set(INTERIOR.leftX, INTERIOR.height / 2, INTERIOR.centerZ)
    left.castShadow = left.receiveShadow = true
    this.group.add(left); this.colliders.push(left)
    const right = left.clone()
    right.position.x = INTERIOR.rightX
    this.group.add(right); this.colliders.push(right)
  }

  _buildPartitions() {
    const wall = assets.getTexture('wall')
    const m = new THREE.MeshStandardMaterial({ map: wall, roughness: 0.85 })
    const t = 0.4
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(12, INTERIOR.height, t), m)
    p1.position.set(-12, INTERIOR.height / 2, -10)
    p1.castShadow = p1.receiveShadow = true
    this.group.add(p1); this.colliders.push(p1)
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(12, INTERIOR.height, t), m)
    p2.position.set(12, INTERIOR.height / 2, -22)
    p2.castShadow = p2.receiveShadow = true
    this.group.add(p2); this.colliders.push(p2)
  }

  _buildExhibits() {
    const slots = [
      { x: -18, z: -5  }, { x: 0, z: -5 }, { x: 18, z: -5 },
      { x: -18, z: -18 }, { x: 0, z: -15 }, { x: 18, z: -18 },
      { x: -10, z: -28 }, { x: 10, z: -28 }
    ]
    const specs = [
      { type: 'box',      value: 100, n: 2, label: 'Hộp vàng cổ',    mesh: () => createBox(0.9, 0.9, 0.9, 0xFFD700) },
      { type: 'sphere',   value: 150, n: 2, label: 'Quả cầu bạc',     mesh: () => createSphere(0.55, 0xC0C0C0) },
      { type: 'cone',     value: 120, n: 2, label: 'Tháp đồng',       mesh: () => createCone(0.5, 1.2, 0xB87333) },
      { type: 'cylinder', value: 200, n: 3, label: 'Trụ ngọc',        mesh: () => createCylinder(0.4, 0.4, 1.1, 0x50C878) },
      { type: 'torus',    value: 300, n: 3, label: 'Vòng kim cương',  mesh: () => createTorus(0.45, 0.16, 0xB9F2FF) },
      { type: 'teapot',   value: 400, n: 3, label: 'Ấm trà cổ',       mesh: () => createTeapot(0xCD7F32) },
      { type: 'gltf',     value: 500, n: 4, label: 'Cúp vàng',        mesh: () => createTrophy(0xFFD700) },
      { type: 'obj',      value: 350, n: 3, label: 'Bình cổ',         mesh: () => createVase(0xc8a060) }
    ]
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i], sp = specs[i]
      const stand = new DisplayStand(new THREE.Vector3(s.x, 0, s.z))
      this.group.add(stand.group)
      this.displayStands.push(stand)
      this.colliders.push(stand._base)
      const mesh = sp.mesh()
      const item = new ExhibitItem({
        type: sp.type, value: sp.value, numMinigames: sp.n, mesh, label: sp.label
      })
      stand.setItem(item)
      this.group.add(mesh)
      this.exhibitItems.push(item)
    }
  }

  _buildPaintings() {
    const decor = ['deco_floral', 'deco_ancient', 'deco_modern', 'deco_gold']
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.35 })
    const positions = [
      [-29.7, -8,  Math.PI / 2], [-29.7, -20, Math.PI / 2], [-29.7, -30, Math.PI / 2],
      [ 29.7, -8, -Math.PI / 2], [ 29.7, -20,-Math.PI / 2], [ 29.7, -30,-Math.PI / 2],
      [-15, -34.7, 0], [ 15, -34.7, 0]
    ]
    for (let i = 0; i < positions.length; i++) {
      const [x, z, ry] = positions[i]
      const tex = assets.getTexture(decor[i % decor.length])
      const w = 2.2, h = 1.6
      const g = new THREE.Group()
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.12), frameMat)
      frame.castShadow = frame.receiveShadow = true
      g.add(frame)
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
      )
      canvas.position.z = 0.07
      g.add(canvas)
      g.position.set(x, 4.0, z)
      g.rotation.y = ry
      this.group.add(g)
    }
  }

  _buildBenches() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 })
    for (const [x, z] of [[-7, -10], [7, -10], [-7, -25], [7, -25]]) {
      const b = new THREE.Group()
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.7), woodMat)
      seat.position.y = 0.5
      seat.castShadow = seat.receiveShadow = true
      b.add(seat)
      for (const lx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), woodMat)
        leg.position.set(lx, 0.25, 0)
        leg.castShadow = true
        b.add(leg)
      }
      b.position.set(x, 0, z)
      this.group.add(b)
    }
  }

  _buildDust() {
    const N = 250
    const positions = new Float32Array(N * 3)
    this._dustVel = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * INTERIOR.width
      positions[i * 3 + 1] = Math.random() * INTERIOR.height
      positions[i * 3 + 2] = INTERIOR.centerZ + (Math.random() - 0.5) * INTERIOR.depth
      this._dustVel[i * 3 + 0] = (Math.random() - 0.5) * 0.05
      this._dustVel[i * 3 + 1] = 0.05 + Math.random() * 0.1
      this._dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.05
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const m = new THREE.PointsMaterial({
      color: 0xfff4d6, size: 0.04, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })
    this._dust = new THREE.Points(g, m)
    this.group.add(this._dust)
  }

  update(delta) {
    if (!this._dust) return
    const positions = this._dust.geometry.attributes.position.array
    const N = positions.length / 3
    for (let i = 0; i < N; i++) {
      const idx = i * 3
      positions[idx] += this._dustVel[idx] * delta
      positions[idx + 1] += this._dustVel[idx + 1] * delta
      positions[idx + 2] += this._dustVel[idx + 2] * delta
      if (positions[idx + 1] > INTERIOR.height) {
        positions[idx + 1] = 0.2
        positions[idx] = (Math.random() - 0.5) * INTERIOR.width
        positions[idx + 2] = INTERIOR.centerZ + (Math.random() - 0.5) * INTERIOR.depth
      }
    }
    this._dust.geometry.attributes.position.needsUpdate = true
  }
}

export const INTERIOR_LAYOUT = INTERIOR
