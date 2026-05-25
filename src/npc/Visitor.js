import * as THREE from 'three'

const NPC_SPEED = 1.4
const ARRIVE_THRESHOLD = 0.4

// Khoảng cách bắt đầu phát hiện vật cản (tính từ tâm NPC)
const DETECT_DIST = 1.8
const BODY_RADIUS = 0.35

// Các góc quét để tìm hướng thoát (trái trước, phải sau)
const PROBE_OFFSETS = [
  25, -25, 50, -50, 75, -75, 110, -110, 150, -150, 180
].map(d => THREE.MathUtils.degToRad(d))

const _raycaster = new THREE.Raycaster()
const _origin    = new THREE.Vector3()
const _dir       = new THREE.Vector3()

export class Visitor {
  /**
   * @param {THREE.Vector3[]} waypoints  - ít nhất 2 điểm
   * @param {number}          colorHsl   - hue 0..1
   * @param {THREE.Object3D[]} colliders - danh sách vật thể cản đường
   */
  constructor(waypoints, colorHsl = 0.6, colliders = []) {
    if (!waypoints || waypoints.length < 2) {
      throw new Error('Visitor requires at least 2 waypoints')
    }
    this.waypoints    = waypoints.map(w => w.clone())
    this.colliders    = colliders
    this._wpIndex     = 0
    this._waitTimer   = 0

    // Heading hiện tại (góc world-space, tính bằng radian)
    this._heading = 0
    // Khi đang né, giữ hướng né trong bao lâu
    this._avoidHeading = null
    this._avoidCooldown = 0

    this.group = new THREE.Group()
    this.group.position.copy(this.waypoints[0])

    const color = new THREE.Color().setHSL(colorHsl, 0.5, 0.5)
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.9, 6, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    )
    torso.position.y = 0.85
    this.group.add(torso)

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xddbb99, roughness: 0.7 })
    )
    head.position.y = 1.6
    this.group.add(head)
  }

  // ─── Raycast helpers ────────────────────────────────────────────────────────

  /** Trả về khoảng cách tới vật cản gần nhất theo hướng angle, hoặc Infinity. */
  _castAngle(angle) {
    _origin.copy(this.group.position)
    _origin.y += 0.9                              // giữa thân
    _dir.set(Math.sin(angle), 0, Math.cos(angle))

    _raycaster.set(_origin, _dir)
    _raycaster.far = DETECT_DIST + BODY_RADIUS

    const hits = _raycaster.intersectObjects(this.colliders, true)
    return hits.length > 0 ? hits[0].distance : Infinity
  }

  /** Kiểm tra hướng angle có thông thoáng không (khoảng cách > ngưỡng). */
  _isClear(angle, threshold = DETECT_DIST) {
    return this._castAngle(angle) > threshold
  }

  /**
   * Dò quạt các hướng xung quanh desiredAngle để tìm hướng thoát đầu tiên.
   * Trả về góc thoát (number) hoặc null nếu phía trước không bị chặn.
   */
  _findAvoidAngle(desiredAngle) {
    // Phía trước thông thoáng → không cần né
    if (this._isClear(desiredAngle)) return null

    for (const offset of PROBE_OFFSETS) {
      const probe = desiredAngle + offset
      if (this._isClear(probe)) return probe
    }

    // Hoàn toàn bị chặn (rất hiếm) → quay ngược
    return desiredAngle + Math.PI
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  /**
   * @param {number}           delta     - thời gian frame (giây)
   * @param {THREE.Object3D[]} [colliders] - có thể cập nhật colliders mỗi frame
   */
  update(delta, colliders) {
    if (colliders && colliders.length > 0) this.colliders = colliders

    const pos    = this.group.position
    const target = this.waypoints[this._wpIndex]
    const dx     = target.x - pos.x
    const dz     = target.z - pos.z
    const dist   = Math.hypot(dx, dz)

    // ── Đến waypoint ──
    if (dist < ARRIVE_THRESHOLD) {
      this._waitTimer += delta
      if (this._waitTimer > 1.5) {
        this._waitTimer    = 0
        this._avoidHeading = null
        this._avoidCooldown = 0
        this._wpIndex = (this._wpIndex + 1) % this.waypoints.length
      }
      return
    }

    // ── Góc mong muốn đến waypoint ──
    const desiredAngle = Math.atan2(dx, dz)

    // ── Obstacle avoidance ──
    // Giảm cooldown (giữ hướng né tối thiểu 0.4s để không giật)
    if (this._avoidCooldown > 0) {
      this._avoidCooldown -= delta
      if (this._avoidCooldown <= 0) {
        this._avoidHeading = null
      }
    }

    // Tính hướng né dựa trên hướng hiện tại (tránh dao động)
    const checkBase  = this._avoidHeading ?? desiredAngle
    const avoidAngle = this._findAvoidAngle(checkBase)

    if (avoidAngle !== null) {
      // Phát hiện vật cản → đặt hướng né mới
      this._avoidHeading  = avoidAngle
      this._avoidCooldown = 0.45   // giữ hướng né ít nhất 0.45s
    }

    const moveAngle = this._avoidHeading ?? desiredAngle

    // ── Xoay heading mượt về moveAngle ──
    let diff = moveAngle - this._heading
    // Chuẩn hóa về [-π, π]
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI
    // Tốc độ quay: nhanh hơn khi né (4 rad/s), bình thường 2.5 rad/s
    const turnSpeed = this._avoidHeading !== null ? 4.5 : 2.5
    this._heading += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed * delta)

    // ── Di chuyển ──
    const step = Math.min(NPC_SPEED * delta, dist)
    pos.x += Math.sin(this._heading) * step
    pos.z += Math.cos(this._heading) * step

    // ── Quay mặt theo hướng đi ──
    this.group.rotation.y = this._heading
  }
}