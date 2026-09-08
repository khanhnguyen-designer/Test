# Lỗi vặt khi test cục bộ (local static server + browser preview)

## ⚠️ Browser cache file cũ — sửa code nhưng chạy vẫn ra hành vi cũ

Server tĩnh đơn giản (vd `python3 -m http.server`) không gửi header `Cache-Control` rõ ràng, nên trình duyệt tự quyết định cache file theo heuristic. Hậu quả thực tế: sửa file JS/CSS rất nhiều nhưng khi load lại trang, request đó trả về **304 Not Modified** — trình duyệt vẫn dùng bản cache cũ, code mới không hề chạy. Không có lỗi console nào báo hiệu việc này — nhìn qua tưởng code mới bị lỗi logic, tốn thời gian debug sai hướng.

**Cách phát hiện**: nếu sửa code mà hành vi không đổi dù không có lỗi console, việc đầu tiên nên làm là kiểm tra network log xem request file đó trả về `304` hay `200`, hoặc đọc thẳng response body để so với file trên đĩa.

**Cách fix nhanh khi đang dev**: thêm query string cache-busting vào thẻ script/link, tăng số mỗi lần cần chắc chắn browser tải lại:
```html
<script src="js/main.js?v=3"></script>
<link rel="stylesheet" href="css/style.css?v=3">
```
Áp dụng cho MỌI file được include (kể cả các file JS nhỏ/phụ) — không chỉ file chính.

**⚠️ Quan trọng hơn: chính file HTML cũng bị cache, không chỉ file JS/CSS con.** Bump `?v=N` cho file con nhưng load lại đúng URL trang cũ vẫn có thể ra HTML CŨ — vì bản thân request tới trang HTML bị cache, nên các thẻ `<script src="...?v=N">` MỚI bên trong nó còn chưa kịp tới trình duyệt. Kiểm tra bằng cách đọc danh sách `<script src>`/`<link href>` hiện tại trên trang để xem browser đang thấy version nào — nếu vẫn thấy số cũ dù đã sửa file, nghĩa là chính HTML đang bị cache. **Cách fix**: thêm 1 query string tạm vào URL trang khi load lại (vd `?t=2`), ép trình duyệt coi đây là request khác, tải lại HTML thật sự mới.

## `resize_window`/viewport giả lập với số tùy chỉnh nhỏ có thể bị scale sai — đừng tin `window.innerWidth`

Khi pane preview đang ở kích thước vật lý nhỏ, yêu cầu 1 viewport cụ thể (vd 375px) có thể khiến `window.innerWidth` báo về một số HOÀN TOÀN KHÁC (vd 675) — nhưng đây chỉ là lỗi báo cáo của thuộc tính đó trong môi trường giả lập, không phải viewport thật sự sai. **Sự thật (ground truth) nằm ở `element.getBoundingClientRect().width`** của 1 phần tử full-width (vd header) — nếu nó khớp đúng số mình yêu cầu, nghĩa là CSS layout đã render đúng kích thước, chỉ `window.innerWidth`/`document.body.scrollWidth` là không đáng tin. Đừng hoảng khi thấy 2 con số này lệch nhau lớn — luôn đối chiếu bằng `getBoundingClientRect` trên 1 element cụ thể trước khi kết luận có bug.

## Môi trường preview ở chế độ ẩn (background/hidden tab) làm sai lệch kết quả test animation

Khi tab/pane preview không ở trạng thái hiển thị trực tiếp (`document.hidden === true`), trình duyệt throttle mạnh: `requestAnimationFrame` gần như đứng (ảnh hưởng mọi animation JS-driven), sự kiện `scroll` có thể không tự bắn ngay sau khi đổi vị trí cuộn bằng JS, và ảnh chụp màn hình có thể trả về frame cũ (không phản ánh scroll/animation mới nhất).

**Cách kiểm tra không bị đánh lừa bởi việc này**:
- Không tin tưởng hoàn toàn vào screenshot khi test animation/scroll — ưu tiên đọc trực tiếp state qua `getBoundingClientRect()`/`getComputedStyle()`/thuộc tính DOM (`scrollLeft`, `style.transform`, class list...).
- Nếu 1 giá trị DOM không đổi sau khi trigger 1 hành động, thử ép chạy tay: gọi lại đúng logic (vd dispatch lại sự kiện `scroll`) hoặc force-complete animation (nhảy thẳng tới trạng thái cuối) rồi đọc lại — nếu giá trị đúng như tính toán thủ công thì logic code không sai, chỉ là môi trường test bị throttle.
- Khi cần verify 1 chuỗi hành động qua nhiều bước (vd cuộn tới → rời đi → cuộn lại), test từng bước riêng biệt bằng cách gọi thẳng hàm/logic liên quan thay vì chỉ dispatch sự kiện mô phỏng — dispatch sự kiện giả có thể không đủ để engine bên dưới (animation library) nhận biết đúng trạng thái mới trong môi trường bị throttle.

**Trường hợp nặng hơn — pane ẩn khiến `window.innerWidth` = 0 hoàn toàn (không chỉ throttle rAF)**: khi pane preview chưa từng được front (hoặc bị ẩn), `window.innerWidth`/`innerHeight` có thể trả về **0**, kéo theo MỌI phần tử trên trang — kể cả `<main>`/`<body>` — có `getBoundingClientRect().width === 0`. Đây không chỉ làm sai lệch một lần đọc thoáng qua: nếu code có bước đo layout rồi GHI KẾT QUẢ VĨNH VIỄN vào DOM (vd tách text thành từng dòng dựa trên `offsetTop` rồi thay `innerHTML`), việc đo trong lúc width=0 sẽ tạo ra kết quả sai bị "đóng băng" luôn trong DOM, không tự sửa được dù layout thật sau đó đúng. Test lại giống hệt sẽ tiếp tục ra sai vì DOM đã bị ghi đè sai ngay từ đầu.

**Cách né**: trước khi test bất kỳ logic nào phụ thuộc kích thước layout thật (đặc biệt là logic đo-rồi-ghi-DOM một lần), gọi `resize_window` với `width`/`height` cụ thể — lệnh này ép viewport có kích thước thật ngay cả khi pane đang `document.hidden === true`, khiến `window.innerWidth` trả về đúng số yêu cầu thay vì 0. Sau đó mới `navigate`/reload để code chạy lại với layout đúng. Nhớ reset về `preset: "desktop"` sau khi test xong.
