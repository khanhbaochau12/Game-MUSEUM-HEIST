# Museum Heist — Claude Code Implementation Guide

## Mục tiêu dự án

Xây dựng game 3D chạy trên trình duyệt bằng **Three.js**, mô phỏng viện bảo tàng nơi người chơi đóng vai kẻ trộm. Game tích hợp đầy đủ: di chuyển nhân vật, hệ thống camera, chiếu sáng, animation, texture mapping, và 2 loại minigame tương tác.

---

## Tech Stack

- **Renderer**: Three.js r160+
- **Build tool**: Vite (vanilla JS, không dùng framework)
- **Model loader**: GLTFLoader (`.gltf` / `.glb`) + OBJLoader + MTLLoader (`.obj`)
- **Physics / Collision**: Raycasting của Three.js (không cần thư viện vật lý ngoài)
- **Ngôn ngữ**: JavaScript ES modules (không TypeScript)
- **Không dùng**: React, Vue, Angular, hay bất kỳ UI framework nào

### Cài đặt ban đầu

```bash
npm create vite@latest museum-heist -- --template vanilla
cd museum-heist
npm install three
npm install --save-dev vite
```

---

## Cấu trúc thư mục

```
museum-heist/
├── index.html
├── vite.config.js
├── public/
│   ├── models/
│   │   ├── teapot.gltf          # Utah Teapot
│   │   ├── teapot.bin
│   │   ├── bust.gltf            # Tuong buc
│   │   ├── vase.obj             # Binh hoa
│   │   └── vase.mtl
│   ├── textures/
│   │   ├── marble.jpg           # Texture san
│   │   ├── wood.jpg             # Texture ban trung bay
│   │   ├── wall.jpg             # Texture tuong
│   │   ├── brick.jpg            # Tuong ngoai
│   │   ├── grass.jpg            # Co bai
│   │   ├── deco_gold.jpg        # Texture trang tri minigame 2
│   │   ├── deco_floral.jpg
│   │   ├── deco_ancient.jpg
│   │   ├── deco_modern.jpg
│   │   └── skybox/              # 6 anh skybox (px,nx,py,ny,pz,nz).jpg
│   └── sounds/                  # (tuy chon) am thanh
├── src/
│   ├── main.js                  # Entry point, khoi tao game
│   ├── core/
│   │   ├── Game.js              # Game loop, scene management
│   │   ├── InputManager.js      # Xu ly keyboard + mouse
│   │   └── AssetLoader.js       # Load tat ca asset truoc khi chay
│   ├── world/
│   │   ├── Museum.js            # Toan bo khong gian bao tang
│   │   ├── Exterior.js          # Canh ngoai troi
│   │   ├── Interior.js          # Noi that bao tang
│   │   └── Fountain.js          # Dai phun nuoc animation
│   ├── objects/
│   │   ├── ExhibitItem.js       # Lop vat pham trung bay
│   │   ├── DisplayStand.js      # Ban trung bay
│   │   ├── primitives.js        # Tao cac hinh khoi co ban
│   │   └── TreeGroup.js         # Hang cay animation
│   ├── player/
│   │   ├── Player.js            # Nhan vat nguoi choi
│   │   ├── FirstPersonCamera.js # Goc nhin thu 1
│   │   └── ThirdPersonCamera.js # Goc nhin thu 3
│   ├── npc/
│   │   └── Visitor.js           # NPC khach tham quan
│   ├── lighting/
│   │   └── LightingSystem.js    # Toan bo he thong den
│   ├── minigames/
│   │   ├── MinigameManager.js   # Quan ly trang thai minigame
│   │   ├── TransformMinigame.js # Minigame 1: Bien doi Affine
│   │   └── TextureMinigame.js   # Minigame 2: Texture Mapping
│   ├── ui/
│   │   ├── HUD.js               # Overlay HUD (HTML/CSS tren canvas)
│   │   ├── MinigameUI.js        # Giao dien rieng cho minigame
│   │   └── CameraToolbar.js     # Thanh dieu chinh camera
│   └── utils/
│       ├── MathUtils.js         # Ham toan hoc ho tro
│       └── CollisionUtils.js    # Raycasting / kiem tra va cham
```

---

## Thứ tự implement (từng bước)

Thực hiện theo đúng thứ tự dưới đây. Mỗi bước phải chạy được trước khi sang bước tiếp theo.

---

### Bước 1 — Khởi tạo dự án & Scene cơ bản

**File cần tạo**: `index.html`, `vite.config.js`, `src/main.js`, `src/core/Game.js`

`index.html`:
- Canvas full màn hình, `width: 100vw; height: 100vh`, không có scrollbar
- Import `src/main.js` dạng `type="module"`
- Div `#hud` overlay lên canvas để render UI HTML
- Div `#loading-screen` hiện trong khi load asset

`vite.config.js`:
```js
export default { server: { port: 3000 } }
```

`src/core/Game.js`:
- Class `Game` với `constructor()`, `init()`, `update(delta)`, `render()`, `start()`
- `init()`: tạo `THREE.WebGLRenderer` với `antialias: true`, `shadowMap.enabled = true`, `shadowMap.type = THREE.PCFSoftShadowMap`
- Tạo `THREE.Scene`, set `scene.fog = new THREE.FogExp2(0x87CEEB, 0.008)` cho ngoại cảnh
- Game loop dùng `renderer.setAnimationLoop`, tính `delta` bằng `THREE.Clock`
- Resize handler: cập nhật `camera.aspect` và `renderer.setSize` khi window resize

`src/main.js`:
- Khởi tạo `Game`, gọi `game.init()` rồi `game.start()`

---

### Bước 2 — AssetLoader & Loading Screen

**File cần tạo**: `src/core/AssetLoader.js`

- Class `AssetLoader` load tất cả asset trước khi game bắt đầu
- Load texture bằng `THREE.TextureLoader`
- Load `.gltf` bằng `GLTFLoader` (import từ `three/examples/jsm/loaders/GLTFLoader.js`)
- Load `.obj` bằng `OBJLoader` + `MTLLoader` (import từ `three/examples/jsm/loaders/OBJLoader.js` và `MTLLoader.js`)
- Dùng `Promise.all([...])` để load song song
- Callback `onProgress(percent)` cập nhật loading bar trong `#loading-screen`
- Sau khi load xong, ẩn `#loading-screen`, bắt đầu game
- Export singleton: `export const assets = new AssetLoader()`

---

### Bước 3 — InputManager

**File cần tạo**: `src/core/InputManager.js`

- Theo dõi trạng thái phím: `keys = {}` (map từ key code sang boolean)
- `isDown(key)`: trả về `true` nếu phím đang được giữ
- `onMouseMove(callback)`: đăng ký callback nhận `{dx, dy}` khi chuột di chuyển
- Pointer Lock API: `document.pointerLockElement` — lock chuột khi click vào canvas, unlock khi nhấn Escape
- `onKeyPress(key, callback)`: callback gọi một lần khi nhấn xuống (cho toggle)
- Export singleton: `export const input = new InputManager()`

---

### Bước 4 — Tạo hình khối cơ bản

**File cần tạo**: `src/objects/primitives.js`

Tạo hàm cho từng loại, trả về `THREE.Mesh` với material `MeshStandardMaterial`:

```js
export function createBox(w, h, d, color)      // THREE.BoxGeometry
export function createSphere(r, color)          // THREE.SphereGeometry(r, 32, 32)
export function createCone(r, h, color)         // THREE.ConeGeometry(r, h, 32)
export function createCylinder(rt, rb, h, color)// THREE.CylinderGeometry(rt, rb, h, 32)
export function createTorus(r, tube, color)     // THREE.TorusGeometry(r, tube, 16, 100)
export function createTeapot(color)             // Dung TeapotGeometry tu three/examples hoac load gltf
```

- Mỗi mesh: `castShadow = true`, `receiveShadow = true`
- `createTeapot`: ưu tiên dùng `TeapotGeometry` từ `three/examples/jsm/geometries/TeapotGeometry.js`

---

### Bước 5 — Ngoại cảnh (Exterior)

**File cần tạo**: `src/world/Exterior.js`, `src/objects/TreeGroup.js`, `src/world/Fountain.js`

`Exterior.js`:
- Mặt đất: `PlaneGeometry(200, 200)` với texture `grass.jpg` (repeat 20x20), receiveShadow
- Skybox: `THREE.CubeTextureLoader` load 6 ảnh, gán vào `scene.background`
- Mặt tiền bảo tàng: khối hộp lớn (80x30x10) texture `brick.jpg`, có cột trụ hai bên
- Bậc thềm: 3 bậc `BoxGeometry` xếp chồng trước cửa vào
- Đặt toàn bộ trong group, export `exteriorGroup`

`TreeGroup.js`:
- Mỗi cây gồm: thân (CylinderGeometry màu nâu) + tán (SphereGeometry màu xanh lá, hơi random scale)
- Tạo 2 hàng cây dọc lối vào (khoảng 6 cây mỗi bên)
- Animation lắc theo gió: trong `update(time)`, dùng `Math.sin(time + offset) * 0.03` để xoay nhẹ thân cây

`Fountain.js`:
- Bể: `CylinderGeometry` dẹt, texture đá
- Cột giữa: `CylinderGeometry` thon
- Hạt nước: `Points` geometry với 200 particle, mỗi frame cập nhật vị trí `y` tăng dần rồi reset về 0 khi quá ngưỡng
- `update(delta)` xử lý animation particle

---

### Bước 6 — Nội thất bảo tàng (Interior)

**File cần tạo**: `src/world/Interior.js`

Cấu trúc phòng:
- Tường: 4 mặt `BoxGeometry` dày 0.5, texture `wall.jpg`
- Sàn: `PlaneGeometry` texture `marble.jpg` (repeat 10x10), receiveShadow
- Trần: `PlaneGeometry` màu tối `0x111111`
- Cửa vào: khoảng hở ở tường trước (không tạo mesh, chỉ bỏ qua đoạn đó)
- Kích thước phòng chính: 60 × 40 × 8 (rộng × sâu × cao)
- Có thể chia thêm 2-3 phòng nhỏ hơn hai bên bằng tường ngăn

Bố trí ban trưng bày:
- Tạo 8–10 vị trí đặt `DisplayStand` phân bố đều trong phòng
- Mỗi ban cách tường tối thiểu 3 units, cách nhau tối thiểu 5 units

---

### Bước 7 — Ban trưng bày & Vật phẩm

**File cần tạo**: `src/objects/DisplayStand.js`, `src/objects/ExhibitItem.js`

`DisplayStand.js`:
- Bệ đỡ: `BoxGeometry(2, 1, 2)` texture `wood.jpg`
- Thuộc tính: `position`, `itemSlot` (vị trí đặt vật phẩm phía trên bệ)
- `isPlayerNearby(playerPos)`: trả về `true` nếu khoảng cách < 3 units

`ExhibitItem.js`:
- Constructor: `(type, value, numMinigames, mesh)`
    - `type`: `'box' | 'sphere' | 'cone' | 'cylinder' | 'torus' | 'teapot' | 'gltf' | 'obj'`
    - `value`: số tiền thưởng (ví dụ: 100, 250, 500)
    - `numMinigames`: số minigame phải hoàn thành (tối thiểu 2, tối đa 4)
    - `mesh`: `THREE.Mesh` hoặc `THREE.Group`
- `update(delta)`: animation xoay (`mesh.rotation.y += delta * 0.8`) + phát sáng nhịp nhàng (`material.emissiveIntensity = 0.3 + 0.2 * Math.sin(time * 2)`)
- `collected`: boolean, nếu `true` thì ẩn mesh
- Danh sách vật phẩm cụ thể (tạo trong `Interior.js`):

| STT | Loại | Giá trị | Số minigame |
|-----|------|---------|-------------|
| 1 | Box (vàng) | 100 | 2 |
| 2 | Sphere (bạc) | 150 | 2 |
| 3 | Cone (đồng) | 120 | 2 |
| 4 | Cylinder (ngọc) | 200 | 3 |
| 5 | Torus (kim cương) | 300 | 3 |
| 6 | Teapot | 400 | 3 |
| 7 | GLTF model 1 | 500 | 4 |
| 8 | OBJ model | 350 | 3 |

---

### Bước 8 — Hệ thống chiếu sáng

**File cần tạo**: `src/lighting/LightingSystem.js`

Ngoại cảnh:
```js
// Anh sang mat troi
const sun = new THREE.DirectionalLight(0xFFF5E0, 1.2)
sun.position.set(50, 80, 30)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.near = 0.5
sun.shadow.camera.far = 300
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60

// Anh sang moi truong
const ambientOut = new THREE.AmbientLight(0x87CEEB, 0.4)
```

Nội thất:
```js
// Anh sang tong rat yeu
const ambientIn = new THREE.AmbientLight(0x111122, 0.3)

// Spotlight cho tung vat pham (tao trong loop)
exhibitItems.forEach(item => {
  const spot = new THREE.SpotLight(0xFFEEAA, 2, 10, Math.PI / 6, 0.3, 1)
  spot.position.set(item.x, ceilingY - 0.5, item.z)
  spot.target = item.mesh
  spot.castShadow = true
  spot.shadow.mapSize.set(512, 512)
  scene.add(spot, spot.target)
})

// Den hanh lang (point lights yeu doc tuong)
// Dat moi 8 units doc tuong, mau 0x334455, intensity 0.5, distance 6
```

`LightingSystem.js` export class với method `setupExterior(scene)`, `setupInterior(scene, items)`, `update(time)` (animate emissive).

---

### Bước 9 — Nhân vật người chơi & Camera

**File cần tạo**: `src/player/Player.js`, `src/player/FirstPersonCamera.js`, `src/player/ThirdPersonCamera.js`

`Player.js`:
- Capsule collision: dùng `THREE.CapsuleGeometry(0.4, 1.6)` ẩn đi (visible: false), chỉ dùng để tính collision
- Vị trí mắt: `playerPos.y + 1.7` (chiều cao mắt)
- `moveSpeed = 5`, `runSpeed = 9` (giữ Shift để chạy)
- `update(delta, input)`:
    - Tính direction từ `input.keys` (WASD)
    - Chuyển sang world space dựa theo hướng camera (dùng `camera.getWorldDirection`)
    - Di chuyển `player.position` theo `direction * speed * delta`
    - Raycasting kiểm tra va chạm với tường (nếu có va chạm, không cho di chuyển theo hướng đó)
- `canInteract(stands)`: duyệt qua danh sách `DisplayStand`, trả về stand đầu tiên có `isPlayerNearby(playerPos) === true`, hoặc `null`

`FirstPersonCamera.js`:
- Camera position = eye position của player
- Mouse look: `camera.rotation.y -= dx * sensitivity`, `camera.rotation.x -= dy * sensitivity`
- Clamp `rotation.x` trong `[-Math.PI/2.2, Math.PI/2.2]`
- Dùng `THREE.Euler` với order `'YXZ'`

`ThirdPersonCamera.js`:
- Camera lùi sau lưng player: `offset = new THREE.Vector3(0, 3, 6)`
- Xoay offset theo hướng nhìn của player: `offset.applyQuaternion(player.quaternion)`
- `camera.position = player.position + offset`
- `camera.lookAt(player.position + Vector3(0, 1.5, 0))`
- Mouse drag để xoay quanh player (khi giữ chuột phải)

Trong `Player.js`, thêm:
- Phím `V` để toggle giữa FPS và TPS (dùng `input.onKeyPress('v', ...)`)
- FPS: ẩn mesh player; TPS: hiện mesh player (hình trụ đơn giản đại diện nhân vật)

---

### Bước 10 — NPC Khách tham quan

**File cần tạo**: `src/npc/Visitor.js`

- Mỗi NPC: mesh đơn giản (CapsuleGeometry + BoxGeometry đầu), màu khác nhau
- Định nghĩa `waypoints[]`: mảng `Vector3` là các điểm trong phòng NPC sẽ đi qua tuần tự
- `update(delta)`:
    - Di chuyển về phía `waypoints[currentIndex]` với tốc độ 1.5 units/s
    - Khi đến gần (< 0.3 units), chuyển sang waypoint tiếp theo (vòng lặp)
    - Xoay mặt NPC về hướng di chuyển: `mesh.lookAt(targetPos)`
- Tạo 3–5 NPC với waypoints khác nhau trong `Interior.js`

---

### Bước 11 — HUD & Camera Toolbar

**File cần tạo**: `src/ui/HUD.js`, `src/ui/CameraToolbar.js`

`HUD.js` — dùng HTML/CSS overlay (`#hud` div):
```html
<!-- Cau truc HTML trong #hud -->
<div id="money-display">💰 $<span id="money">0</span></div>
<div id="timer-display" class="hidden">⏱ <span id="timer">30</span>s</div>
<div id="interact-hint" class="hidden">Nhấn [E] để tương tác</div>
<div id="minigame-overlay"><!-- render bởi MinigameUI --></div>
```

CSS quan trọng:
```css
#hud { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
#money-display { position: absolute; top: 20px; left: 20px; color: #FFD700; font-size: 24px; font-family: monospace; text-shadow: 1px 1px 3px #000; }
#timer-display { position: absolute; top: 20px; right: 20px; color: #FF4444; font-size: 28px; font-family: monospace; text-shadow: 1px 1px 3px #000; }
#interact-hint { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 16px; }
```

`HUD.js` methods:
- `showMoney(amount)`: cập nhật `#money`
- `showTimer(seconds)`: cập nhật `#timer`, nếu `seconds <= 10` thêm class `.urgent` (đổi màu đỏ, animation nhấp nháy)
- `showInteractHint(show)`: toggle `#interact-hint`
- `showGameOver(reason)`: overlay toàn màn hình "Bạn đã bị bắt!" hoặc "Thoát thành công!"

`CameraToolbar.js`:
- Thanh công cụ HTML ở dưới cùng, `pointer-events: all`
- Input số cho: `pos.x`, `pos.y`, `pos.z`, `fov`, `near`, `far`
- Mỗi input: range slider + số hiển thị bên cạnh
- Thay đổi realtime: cập nhật `camera.position`, `camera.fov`, `camera.near`, `camera.far`, gọi `camera.updateProjectionMatrix()`
- Nút "Reset": đưa về giá trị mặc định

---

### Bước 12 — MinigameManager

**File cần tạo**: `src/minigames/MinigameManager.js`

```js
class MinigameManager {
  constructor(scene, camera, hud)
  
  startSequence(item)
  // Xac dinh thu tu minigame cho item nay:
  // - Bat buoc co 1 TransformMinigame va 1 TextureMinigame
  // - Neu numMinigames > 2: chon them ngau nhien tu 2 loai
  // - Tao queue: [minigame1, minigame2, ...]
  
  startNext()
  // Lay minigame tiep theo trong queue, khoi dong no
  // Hien giao dien minigame, lock input cua player
  
  onMinigameComplete(success)
  // Neu success: startNext() neu con, hoac ket thuc sequence neu het
  // Neu !success (het gio): goi game.gameOver('caught')
  
  endSequence()
  // Player nhan duoc tien, vat pham bien mat, unlock input
}
```

Quản lý trạng thái:
- `isActive`: boolean, khi đang trong minigame, tắt movement của player
- Timer: `setInterval` đếm ngược, gọi `onMinigameComplete(false)` khi hết giờ
- Thời gian mỗi minigame: 45 giây (có thể config theo `item.value`)

---

### Bước 13 — Minigame 1: Biến đổi Affine

**File cần tạo**: `src/minigames/TransformMinigame.js`

Giao diện: chia đôi màn hình tạm thời bằng `MinigameUI`:
- **Bên trái** ("Mục tiêu"): render scene phụ với vật phẩm đã áp dụng biến đổi ngẫu nhiên
- **Bên phải** ("Của bạn"): render scene phụ với vật phẩm ban đầu, người chơi tương tác

Kỹ thuật render hai scene: dùng `renderer.setScissor` và `renderer.setViewport`:
```js
// Render trai (muc tieu)
renderer.setScissor(0, 0, width/2, height)
renderer.setViewport(0, 0, width/2, height)
renderer.render(targetScene, targetCamera)

// Render phai (tuong tac)
renderer.setScissor(width/2, 0, width/2, height)
renderer.setViewport(width/2, 0, width/2, height)
renderer.render(playerScene, playerCamera)
```

Tạo biến đổi mục tiêu ngẫu nhiên:
```js
function generateTarget(mesh) {
  const target = mesh.clone()
  target.position.set(
    THREE.MathUtils.randFloat(-1.5, 1.5),
    THREE.MathUtils.randFloat(-0.5, 0.5),
    THREE.MathUtils.randFloat(-0.5, 0.5)
  )
  target.rotation.set(
    THREE.MathUtils.randFloat(0, Math.PI),
    THREE.MathUtils.randFloat(0, Math.PI * 2),
    THREE.MathUtils.randFloat(0, Math.PI / 2)
  )
  const s = THREE.MathUtils.randFloat(0.7, 1.4)
  target.scale.set(s, s * THREE.MathUtils.randFloat(0.8, 1.2), s)
  return target
}
```

Điều khiển tương tác (bên phải):
- **Xoay**: giữ chuột trái + kéo → `mesh.rotation.y += dx * 0.01`, `mesh.rotation.x += dy * 0.01`
- **Tịnh tiến**: giữ Shift + chuột trái + kéo → `mesh.position.x += dx * 0.005`, `mesh.position.y -= dy * 0.005`
- **Thu phóng**: lăn chuột → `mesh.scale.multiplyScalar(1 ± 0.05)`

Kiểm tra kết quả — hàm `checkMatch(playerMesh, targetMesh)`:
```js
function checkMatch(a, b) {
  const posOk = a.position.distanceTo(b.position) < 0.25
  const rotOk = Math.abs(a.rotation.x - b.rotation.x) < 0.2
              && Math.abs(a.rotation.y - b.rotation.y) < 0.2
              && Math.abs(a.rotation.z - b.rotation.z) < 0.2
  const scaleOk = a.scale.distanceTo(b.scale) < 0.15
  return posOk && rotOk && scaleOk
}
```

- Nút "Kiểm tra": gọi `checkMatch`, nếu đúng → `onComplete(true)`, nếu sai → flash đỏ + trừ 5 giây
- Nút "Reset": đưa mesh người chơi về vị trí ban đầu

---

### Bước 14 — Minigame 2: Texture Mapping

**File cần tạo**: `src/minigames/TextureMinigame.js`

Cấu trúc dữ liệu:
```js
// 4 texture trang tri co san
const DECOR_TEXTURES = ['deco_gold.jpg', 'deco_floral.jpg', 'deco_ancient.jpg', 'deco_modern.jpg']

// Moi vat pham co 1 cap (shape, texture) la dap an dung
// Tao truoc: 4 vat pham dang (shape + texture da map), luu vao danh sach
```

Tạo ảnh mục tiêu:
- Clone mesh của vật phẩm hiện tại, apply một texture ngẫu nhiên từ `DECOR_TEXTURES`
- Render ra `THREE.WebGLRenderTarget(512, 512)` → dùng làm ảnh hiển thị mục tiêu

Giao diện HTML overlay (`MinigameUI`):
```
┌──────────────────────────────────────────────────┐
│  MỤC TIÊU:  [ảnh vật phẩm đã có texture]         │
│                                                    │
│  Chọn hình dạng:    Chọn texture trang trí:       │
│  [ ]  Hình cầu      [ ]  deco_gold preview        │
│  [x]  Hình hộp      [x]  deco_floral preview      │
│  [ ]  Hình nón      [ ]  deco_ancient preview     │
│  [ ]  Hình trụ      [ ]  deco_modern preview      │
│                                                    │
│  Xem trước: [live preview của cặp đang chọn]      │
│                                                    │
│             [  XÁC NHẬN  ]                        │
└──────────────────────────────────────────────────┘
```

Kỹ thuật live preview:
- Khi người chơi chọn shape hoặc texture: render ngay vào `<canvas>` nhỏ preview
- Dùng `renderer.render(previewScene, previewCamera)` vào canvas đó

Kiểm tra kết quả:
- So sánh shape type và texture file name với đáp án
- Đúng → `onComplete(true)`
- Sai → flash đỏ border + trừ 8 giây + cho chọn lại

---

### Bước 15 — Tích hợp & Game Loop hoàn chỉnh

**Cập nhật `src/core/Game.js`** để kết nối tất cả:

```js
class Game {
  async init() {
    // 1. Khoi tao renderer, scene, clock
    // 2. Load assets (AssetLoader)
    // 3. Setup exterior + interior
    // 4. Setup lighting
    // 5. Tao exhibit items va display stands
    // 6. Tao player + camera
    // 7. Tao NPCs
    // 8. Tao HUD + CameraToolbar
    // 9. Tao MinigameManager
    // 10. Setup event listeners (E de interact)
  }

  update(delta) {
    if (this.minigameManager.isActive) return  // Freeze world khi co minigame

    this.player.update(delta, this.input)
    this.npcs.forEach(npc => npc.update(delta))
    this.exhibitItems.forEach(item => item.update(delta))
    this.treeGroup.update(this.clock.elapsedTime)
    this.fountain.update(delta)
    this.lightingSystem.update(this.clock.elapsedTime)

    // Kiem tra interact
    const nearStand = this.player.canInteract(this.displayStands)
    this.hud.showInteractHint(nearStand !== null)
    if (this.input.isDown('KeyE') && nearStand) {
      this.minigameManager.startSequence(nearStand.item)
    }

    // Kiem tra thoat (vung exit o cua ra)
    if (this.isPlayerAtExit()) {
      this.endGame('escaped')
    }
  }

  render() {
    if (this.minigameManager.isActive) {
      this.minigameManager.render()  // Minigame tu render
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  endGame(reason) {
    // 'escaped': hien so tien, chuc mung
    // 'caught': hien game over
    this.hud.showGameOver(reason, this.totalMoney)
  }
}
```

---

## Quy tắc code bắt buộc

1. **Không dùng magic numbers** — tất cả hằng số đặt ở đầu file hoặc file `config.js`
2. **Mỗi class một file** — không nhét nhiều class vào một file
3. **Dispose properly** — khi remove object khỏi scene: gọi `geometry.dispose()`, `material.dispose()`, `texture.dispose()`
4. **Shadow optimization** — chỉ các object lớn và spotlight mới `castShadow = true`. Particle và NPC không cast shadow
5. **Texture repeat** — luôn set `texture.wrapS = texture.wrapT = THREE.RepeatWrapping` trước khi dùng repeat
6. **Camera updateProjectionMatrix** — gọi sau mỗi lần thay đổi `fov`, `near`, `far`, `aspect`
7. **Pointer Lock** — chỉ lock khi game đang chạy, unlock tự động khi mở minigame UI

---

## Các lỗi thường gặp & cách tránh

| Vấn đề | Nguyên nhân | Cách fix |
|--------|-------------|----------|
| Model không hiện | GLTFLoader async, chưa await | Dùng `await loader.loadAsync(url)` |
| Shadow bị cắt | Shadow camera frustum nhỏ | Tăng `shadow.camera.left/right/top/bottom` |
| FPS thấp | Quá nhiều shadow caster | Giới hạn `castShadow` cho object quan trọng |
| Texture bị lặp sai | Quên set wrapS/wrapT | Set `RepeatWrapping` trước `repeat.set()` |
| Minigame scene lẫn scene chính | Dùng chung renderer | Dùng `setScissor` + `setViewport` để tách |
| Camera jitter TPS | LookAt gọi sau rotation | Tính offset trước, lookAt sau cùng |
| Pointer lock không hoạt động | Gọi ngoài user event | Chỉ gọi `requestPointerLock()` trong click handler |

---

## Kiểm thử từng bước

Sau mỗi bước implement, kiểm tra:

- **Bước 1–3**: Scene trắng với fog hiển thị, loading screen ẩn sau khi load xong
- **Bước 4**: Chạy `primitives.js` standalone, log 6 mesh vào console
- **Bước 5**: Ngoại cảnh hiển thị đủ cây, đài phun nước, mặt tiền, skybox
- **Bước 6**: Đi vào trong thấy phòng tối, sàn marble, tường
- **Bước 7**: Ban trưng bày hiện đúng vị trí, vật phẩm nằm trên bệ
- **Bước 8**: Spotlight chiếu rõ từng vật phẩm, bên ngoài có bóng đổ
- **Bước 9**: WASD di chuyển được, chuột nhìn xung quanh, V toggle camera
- **Bước 10**: NPC đi đúng waypoints, không đi xuyên tường
- **Bước 11**: HUD hiện tiền, toolbar thay đổi camera realtime
- **Bước 12**: Tiếp cận bệ, hint hiện, nhấn E kích hoạt luồng
- **Bước 13**: Minigame 1 hiện hai cảnh, kéo/xoay/scale hoạt động, kiểm tra pass/fail
- **Bước 14**: Minigame 2 hiện ảnh mục tiêu, chọn đúng pass, chọn sai trừ thời gian
- **Bước 15**: Hoàn thành toàn bộ item nhận tiền, ra cửa kết thúc game

---

## Lưu ý cuối

- Chạy dev server: `npm run dev`
- Nếu thiếu model file trong `public/models/`, tạm thời thay bằng primitive tương ứng và log warning
- Không commit `node_modules/`
- Target: chạy mượt 60fps trên Chrome/Firefox desktop với GPU tích hợp