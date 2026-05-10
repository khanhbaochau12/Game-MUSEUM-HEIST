import * as THREE from 'three'

/**
 * Lighting:
 *  - Exterior: sun + sky ambient + hemisphere
 *  - Interior:
 *    * dim ambient
 *    * grid of recessed CEILING DOWNLIGHTS lighting the whole ceiling/floor
 *    * 3 SPOTLIGHTS per exhibit (triangle around it) for dramatic museum lighting
 *    * 2 chandeliers in the central aisle
 *    * wall sconces along corridors
 */
export class LightingSystem {
  constructor() {
    this._timeLights = []
    this._volumetricCones = []
  }

  setupExterior(scene) {
    const sun = new THREE.DirectionalLight(0xFFF5E0, 1.4)
    sun.position.set(50, 80, 30)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 300
    sun.shadow.camera.left = -80
    sun.shadow.camera.right = 80
    sun.shadow.camera.top = 80
    sun.shadow.camera.bottom = -80
    sun.shadow.bias = -0.0005
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0x87CEEB, 0.45))
    scene.add(new THREE.HemisphereLight(0xCFE8FF, 0x556B2F, 0.4))
  }

  setupInterior(scene, exhibitItems) {
    scene.add(new THREE.AmbientLight(0x2a2a3e, 0.55))
    scene.add(new THREE.HemisphereLight(0x553311, 0x222244, 0.4))

    // 1. Ceiling-wide downlight grid
    this._addCeilingGrid(scene)

    // 2. Per-exhibit 3-spotlight setup
    for (const item of exhibitItems) {
      this._addExhibitTripleSpot(scene, item)
    }

    // 3. Wall sconces
    for (let z = 0; z >= -32; z -= 8) {
      for (const x of [-25, 25]) {
        const p = new THREE.PointLight(0x556699, 0.7, 10, 1.5)
        p.position.set(x, 6, z)
        scene.add(p)
        const sconce = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 12, 12),
          new THREE.MeshStandardMaterial({
            color: 0xaaccff, emissive: 0x556699, emissiveIntensity: 1.5
          })
        )
        sconce.position.set(x, 6, z)
        scene.add(sconce)
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.6, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x8b6f1f, metalness: 0.7, roughness: 0.4 })
        )
        plate.position.set(x + (x > 0 ? -0.06 : 0.06), 6, z)
        scene.add(plate)
      }
    }

    // 4. Doorway warm glow
    const doorLight = new THREE.PointLight(0xFFD08A, 2.0, 16, 1.6)
    doorLight.position.set(0, 5, 4)
    scene.add(doorLight)

    // 5. Chandeliers
    for (const z of [-10, -25]) this._addChandelier(scene, 0, z)
  }

  /**
   * Recessed ceiling downlights - bright points + visible glow rings on the ceiling.
   * Covers the whole interior ceiling so the room is well-lit.
   */
  _addCeilingGrid(scene) {
    const ceilingY = 7.95
    const cx = 0, cz = -15
    const W = 60, D = 40
    const cols = 8, rows = 6
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = cx - W / 2 + (W / (cols - 1)) * i
        const z = cz - D / 2 + (D / (rows - 1)) * j
        // Skip points too close to walls
        if (Math.abs(x) > 28 || z > 4 || z < -34) continue

        // Visible glow disc
        const glow = new THREE.Mesh(
          new THREE.CircleGeometry(0.22, 16),
          new THREE.MeshBasicMaterial({
            color: 0xfff4d6, transparent: true, opacity: 0.9,
            side: THREE.DoubleSide
          })
        )
        glow.rotation.x = Math.PI / 2
        glow.position.set(x, ceilingY - 0.01, z)
        scene.add(glow)

        // Ring frame
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.22, 0.3, 16),
          new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide
          })
        )
        ring.rotation.x = Math.PI / 2
        ring.position.set(x, ceilingY - 0.005, z)
        scene.add(ring)

        // Soft point light - fills the room ambient warmth
        const p = new THREE.PointLight(0xFFE8B5, 0.7, 9, 1.4)
        p.position.set(x, ceilingY - 0.2, z)
        scene.add(p)
      }
    }
  }

  /**
   * Three spotlights pointing at one exhibit from a triangle of ceiling positions.
   * Each spotlight has its own visible cone for drama.
   */
  _addExhibitTripleSpot(scene, item) {
    const itemPos = item.mesh.position
    const ceilingY = 7.6
    const radius = 1.4

    // Floor glow puck (one big shared)
    const puck = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.6, 32),
      new THREE.MeshBasicMaterial({
        color: 0xFFD995, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    )
    puck.rotation.x = -Math.PI / 2
    puck.position.set(itemPos.x, 0.02, itemPos.z)
    scene.add(puck)

    // 3 spotlights at 120° around exhibit
    const colors = [0xFFD995, 0xFFE8B5, 0xFFCB7E]
    for (let k = 0; k < 3; k++) {
      const angle = (k / 3) * Math.PI * 2 + Math.PI / 6
      const sx = itemPos.x + Math.cos(angle) * radius
      const sz = itemPos.z + Math.sin(angle) * radius
      const color = colors[k]

      // Track fixture
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.4 })
      )
      fixture.position.set(sx, ceilingY + 0.1, sz)
      scene.add(fixture)

      // Bright bulb
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xfff4d6, emissive: color, emissiveIntensity: 3,
          metalness: 0.3, roughness: 0.4
        })
      )
      bulb.position.set(sx, ceilingY - 0.01, sz)
      scene.add(bulb)

      // Spotlight aimed at the item
      const spot = new THREE.SpotLight(color, 5, 14, Math.PI / 7, 0.45, 1.4)
      spot.position.set(sx, ceilingY, sz)
      spot.target.position.copy(itemPos)
      spot.castShadow = (k === 0) // only one casts shadow for perf
      if (spot.castShadow) {
        spot.shadow.mapSize.set(512, 512)
        spot.shadow.bias = -0.0005
        spot.shadow.focus = 1.0
      }
      scene.add(spot)
      scene.add(spot.target)

      // Volumetric beam cone
      const dir = new THREE.Vector3(itemPos.x - sx, itemPos.y - ceilingY, itemPos.z - sz)
      const beamLen = dir.length()
      const half = Math.PI / 7
      const beamRadius = Math.tan(half) * beamLen
      const coneGeom = new THREE.ConeGeometry(beamRadius, beamLen, 24, 1, true)
      const coneMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          color: { value: new THREE.Color(color) },
          intensity: { value: 0.18 }
        },
        vertexShader: 'varying float vY; varying vec3 vN; void main(){ vY=position.y; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 color; uniform float intensity; varying float vY; varying vec3 vN; void main(){ float fade=smoothstep(-0.5,0.5,vY); float a=fade*intensity; float edge=max(0.0,vN.z); a*=mix(0.4,1.0,edge); gl_FragColor=vec4(color,a); }'
      })
      const cone = new THREE.Mesh(coneGeom, coneMat)
      // Position midpoint between spot and item
      const mid = new THREE.Vector3(sx, ceilingY, sz).add(new THREE.Vector3(itemPos.x, itemPos.y, itemPos.z)).multiplyScalar(0.5)
      cone.position.copy(mid)
      // Orient: cone tip is at +Y by default. We want tip at spot, base at item.
      const up = new THREE.Vector3(0, 1, 0)
      const dirNorm = dir.clone().normalize()
      // Rotate so default up (0,1,0) aligns with -dirNorm (because tip of cone is at +Y)
      const target = dirNorm.clone().multiplyScalar(-1)
      const quat = new THREE.Quaternion().setFromUnitVectors(up, target)
      cone.quaternion.copy(quat)
      cone.renderOrder = 2
      scene.add(cone)

      this._volumetricCones.push({ cone, baseIntensity: 0.18, phase: Math.random() * Math.PI * 2 })
      this._timeLights.push({
        light: spot, baseIntensity: 5, phase: Math.random() * Math.PI * 2,
        bulbMat: bulb.material, bulbBase: 3
      })
    }
  }

  _addChandelier(scene, x, z) {
    const ceilingY = 7.95
    const group = new THREE.Group()

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b6f1f, metalness: 0.8, roughness: 0.4 })
    )
    rod.position.y = -0.7
    group.add(rod)

    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.04, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 })
    )
    crown.rotation.x = Math.PI / 2
    crown.position.y = -1.0
    group.add(crown)

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xfff4d6, emissive: 0xffd76a, emissiveIntensity: 3,
          metalness: 0.2, roughness: 0.4
        })
      )
      bulb.position.set(Math.cos(angle) * 0.5, -1.0, Math.sin(angle) * 0.5)
      group.add(bulb)
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 })
      )
      arm.position.set(Math.cos(angle) * 0.42, -0.96, Math.sin(angle) * 0.42)
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = -angle
      group.add(arm)
    }

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xffeebb, transparent: true, opacity: 0.7,
        roughness: 0.05, metalness: 0.1, transmission: 0.7, ior: 1.5
      })
    )
    crystal.position.y = -1.25
    group.add(crystal)

    group.position.set(x, ceilingY, z)
    scene.add(group)

    const light = new THREE.PointLight(0xFFD995, 1.6, 18, 1.5)
    light.position.set(x, ceilingY - 1.0, z)
    scene.add(light)
    this._timeLights.push({ light, baseIntensity: 1.6, phase: Math.random() * Math.PI * 2 })
  }

  update(time) {
    for (const tl of this._timeLights) {
      const flick = Math.sin(time * 3 + tl.phase) * 0.1 + Math.sin(time * 7 + tl.phase) * 0.04
      tl.light.intensity = tl.baseIntensity * (1.0 + flick)
      if (tl.bulbMat) {
        const base = tl.bulbBase || 2.5
        tl.bulbMat.emissiveIntensity = base + flick * 0.6
      }
    }
    for (const v of this._volumetricCones) {
      const flick = Math.sin(time * 2.5 + v.phase) * 0.04 + Math.sin(time * 5 + v.phase) * 0.02
      v.cone.material.uniforms.intensity.value = v.baseIntensity + flick
    }
  }
}
