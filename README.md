# Museum Heist

Game 3D mô phỏng kẻ trộm trong viện bảo tàng, xây dựng bằng Three.js + Vite theo đặc tả `CLAUDE.md`.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

## Điều khiển

| Phím | Hành động |
|------|-----------|
| WASD / mũi tên | Di chuyển |
| Shift | Chạy |
| Chuột | Nhìn xung quanh (click vào màn hình để khoá chuột) |
| V | Đổi giữa góc nhìn 1 và 3 |
| E | Tương tác / trộm vật phẩm |
| Esc | Thoát khoá chuột |

## Lối chơi

1. Bắt đầu ngoài bảo tàng, đi qua sân (có đài phun nước, hàng cây) tới cửa.
2. Bên trong có 8 vật phẩm trên các bệ kính. Tới gần để nhận lời nhắc.
3. Nhấn **E** để trộm. Mỗi vật phẩm yêu cầu hoàn thành 2–4 minigame:
   - **Minigame Affine**: kéo/xoay/scale vật phẩm cho khớp mục tiêu.
   - **Minigame Texture**: chọn đúng hình dạng và họa tiết.
4. Hết giờ trong bất kỳ minigame nào → bị bắt.
5. Sau khi trộm được ít nhất một món, đi ra cửa để **thoát thành công**.

## Cấu trúc

Xem `CLAUDE.md` cho chi tiết kiến trúc.

## Asset

Game tự sinh procedural texture (marble, wood, brick, grass, gold, floral, ancient, modern...) nên không cần file ngoài.
Nếu thư mục `public/textures/` có sẵn các file `.jpg` cùng tên, AssetLoader sẽ ưu tiên dùng chúng.

## Build production

```bash
npm run build
npm run preview
```
