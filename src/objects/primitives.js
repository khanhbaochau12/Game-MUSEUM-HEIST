import * as THREE from 'three'
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js'

const DEFAULT_MAT_OPTS = { roughness: 0.4, metalness: 0.3 }

function makeMesh(geom, color, extra = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, ...DEFAULT_MAT_OPTS, ...extra
  })
  const mesh = new THREE.Mesh(geom, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function createBox(w, h, d, color) {
  return makeMesh(new THREE.BoxGeometry(w, h, d), color)
}
export function createSphere(r, color) {
  // Ornate silver orb — a base sphere with two perpendicular meridian rings
  // and a small cap on top so rotation is visually distinguishable
  // (a perfect smooth sphere has no observable rotation).
  const group = new THREE.Group()
  group.castShadow = true
  group.receiveShadow = true

  const main = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32),
    new THREE.MeshStandardMaterial({ color, ...DEFAULT_MAT_OPTS, metalness: 0.6, roughness: 0.25 })
  )
  main.castShadow = main.receiveShadow = true
  group.add(main)

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b, metalness: 0.85, roughness: 0.25,
    emissive: 0x332200, emissiveIntensity: 0.15
  })
  const ringR = r * 1.02
  const ringTube = r * 0.06
  const ringEq = new THREE.Mesh(new THREE.TorusGeometry(ringR, ringTube, 12, 48), ringMat)
  ringEq.rotation.x = Math.PI / 2
  ringEq.castShadow = true
  group.add(ringEq)

  const ringMer = new THREE.Mesh(new THREE.TorusGeometry(ringR, ringTube, 12, 48), ringMat)
  ringMer.castShadow = true
  group.add(ringMer)

  // Crown/cap on the "north pole" so X/Z rotation is clearly visible
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(r * 0.22, r * 0.4, 16),
    ringMat
  )
  cap.position.y = r + r * 0.2
  cap.castShadow = true
  group.add(cap)

  // Small dark stud on the "front" (+Z) so Y rotation is clearly visible
  const stud = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.12, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.6 })
  )
  stud.position.z = r * 0.98
  stud.castShadow = true
  group.add(stud)

  return group
}
export function createCone(r, h, color) {
  // 48 radial segments + an explicit base disc to keep the bottom edge sharp.
  const group = new THREE.Group()
  const cone = makeMesh(new THREE.ConeGeometry(r, h, 48), color)
  group.add(cone)
  // Thin gold rim under the base so the polygon edge is always defined
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.03, r * 1.05, 0.04, 48),
    new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.85, roughness: 0.3 })
  )
  rim.position.y = -h / 2 - 0.02
  rim.castShadow = rim.receiveShadow = true
  group.add(rim)
  return group
}
export function createCylinder(rt, rb, h, color) {
  // 48 radial segments + thin gold caps on top and bottom for sharper outline.
  const group = new THREE.Group()
  const cyl = makeMesh(new THREE.CylinderGeometry(rt, rb, h, 48), color)
  group.add(cyl)
  const capMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.85, roughness: 0.3 })
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(rt * 1.05, rt * 1.05, 0.05, 48), capMat)
  capTop.position.y = h / 2 + 0.025
  capTop.castShadow = capTop.receiveShadow = true
  group.add(capTop)
  const capBot = new THREE.Mesh(new THREE.CylinderGeometry(rb * 1.05, rb * 1.05, 0.05, 48), capMat)
  capBot.position.y = -h / 2 - 0.025
  capBot.castShadow = capBot.receiveShadow = true
  group.add(capBot)
  return group
}
export function createTorus(r, tube, color) {
  return makeMesh(new THREE.TorusGeometry(r, tube, 16, 100), color)
}
export function createTeapot(color) {
  return makeMesh(new TeapotGeometry(0.6, 8, true, true, true, false, true), color, { metalness: 0.7, roughness: 0.25 })
}

export function createTrophy(color = 0xFFD700) {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.15 })
  const cup = new THREE.Mesh(new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.55, 0.1), new THREE.Vector2(0.4, 0.5),
      new THREE.Vector2(0.6, 0.85), new THREE.Vector2(0.6, 1.0),
      new THREE.Vector2(0, 1.0)
    ], 32
  ), mat)
  cup.castShadow = cup.receiveShadow = true
  cup.position.y = 0.4
  group.add(cup)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.2, 32), mat)
  base.position.y = 0.1
  base.castShadow = base.receiveShadow = true
  group.add(base)
  for (let i = 0; i < 2; i++) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 24), mat)
    handle.position.set(i === 0 ? -0.55 : 0.55, 0.95, 0)
    handle.rotation.y = Math.PI / 2
    handle.castShadow = true
    group.add(handle)
  }
  return group
}

export function createVase(color = 0xc8a060) {
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 })
  const geom = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0),
      new THREE.Vector2(0.5, 0.2), new THREE.Vector2(0.3, 0.6),
      new THREE.Vector2(0.5, 1.1), new THREE.Vector2(0.45, 1.3),
      new THREE.Vector2(0.5, 1.4), new THREE.Vector2(0, 1.4)
    ], 32
  )
  const mesh = new THREE.Mesh(geom, mat)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/**
 * Clone a mesh deeply (geometry + material) for minigames.
 * Avoids the "Converting circular structure to JSON" bug by clearing
 * userData (which may contain circular refs back to DisplayStand) before
 * Three.js's clone, then restoring on the source.
 */
export function cloneItemMesh(mesh) {
  const stash = []
  mesh.traverse(o => {
    if (o.userData && Object.keys(o.userData).length > 0) {
      stash.push([o, o.userData])
      o.userData = {}
    }
  })
  let clone
  try {
    clone = mesh.clone(true)
  } finally {
    for (const [o, data] of stash) o.userData = data
  }
  clone.traverse(o => {
    if (o.isMesh) {
      o.material = o.material.clone()
      o.geometry = o.geometry.clone()
    }
    if (o.userData) o.userData = {}
  })
  return clone
}
