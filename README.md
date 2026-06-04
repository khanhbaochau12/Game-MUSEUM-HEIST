# Museum Heist

Game 3D chạy trên trình duyệt, người chơi đóng vai kẻ trộm trong bảo tàng cổ điển. Đi qua sân vườn (đài phun nước, cây, tượng, cột đèn), bước vào bảo tàng có 8 cổ vật trên bệ kính dưới đèn spotlight 3 chiều, mỗi cổ vật yêu cầu hoàn thành 2–4 minigame để trộm thành công, rồi chạy ra cửa thoát.
Tech stack: Three.js r160 + Vite (vanilla JS, không framework), procedural texture (không cần file ảnh ngoài).

## Chạy dự án

```bash
cd C:\Users\Admin\IdeaProjects\GAME_MUSEUM
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

## Build production

```bash
npm run build
npm run preview
```
