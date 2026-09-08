# Dựng layout đúng số đo từ Figma

## ⚠️ `max-width` + `padding` làm hẹp container hơn thiết kế

Từng viết (SAI) cho container nội dung cố định 1090px, căn giữa:
```css
.content-container {
  max-width: 1090px;
  margin: 0 auto;
  padding: 0 var(--section-pad-x); /* clamp(20px, 5vw, 64px) */
}
```
Vì dùng `box-sizing: border-box`, `padding` bị trừ **vào trong** `max-width` → ở desktop, phần tử ngoài đúng 1090px, nhưng nội dung bên trong (children) chỉ còn `1090 - 2*64 = 962px`, hẹp hơn hẳn số đo gốc trong Figma dù CSS "trông có vẻ đúng".

**Cách đúng**: dùng `width: min()` thay vì `max-width` + padding riêng — để padding chỉ có tác dụng làm lề an toàn khi viewport hẹp hơn container, không trừ vào lúc màn hình đủ rộng:
```css
.content-container {
  width: min(1090px, 100% - 2 * var(--section-pad-x));
  margin: 0 auto;
}
```
Kết quả: ở desktop rộng, phần tử đúng y hệt 1090px (không bị trừ gì thêm); ở mobile/tablet, tự co lại và vẫn chừa lề `--section-pad-x` hai bên.

## Padding-top/bottom của section: đừng dùng chung 1 rule cho mọi section

Mỗi section trong Figma có thể có padding-top/bottom khác nhau (vd hero chỉ có `pt-144px`, KHÔNG có padding-bottom — khoảng cách xuống section kế tiếp lấy từ chính padding-top của section sau, không cộng dồn 2 lớp padding). Dùng 1 class `.section { padding: X 0; }` chung cho tất cả sẽ vô tình cộng dồn khoảng trống ở những chỗ Figma không có padding-bottom. Cần đọc kỹ từng node xem có `pt-*`/`pb-*` riêng hay không, không mặc định đối xứng.

## ⚠️ Button cao sai vì quên set `line-height`

Figma cho button dùng `padding` dọc rất nhỏ (vd `py-9px`) vì line-height của font đã được set rõ ràng (vd `22px` cho font 16px) — tổng `padding×2 + line-height` mới ra đúng chiều cao thiết kế (9+9+22=40px). Nếu chỉ copy `padding` mà bỏ qua `line-height` (để mặc định `normal` của trình duyệt, thường co giãn theo font-family thực tế ~1.15-1.2), chiều cao thực tế sẽ SAI dù padding đúng số — ví dụ đã bị 44px thay vì 40px. Cách đúng: luôn set `line-height` tường minh (px hoặc unitless ratio) khớp giá trị trong style hint của công cụ đọc design, đừng chỉ dựa vào `padding`.

## ⚠️ `flex-basis` cố định "chạy sai trục" khi đổi `flex-direction` ở responsive

Định nghĩa desktop: `.block-title { flex: 1 1 280px; }` (basis 280px áp cho CHIỀU RỘNG vì cha là `flex-direction: row`). Ở mobile, cha đổi thành `flex-direction: column` — nếu không reset `flex` trên phần tử con, basis 280px giờ áp cho CHIỀU CAO thay vì chiều rộng, khiến 1 tiêu đề chỉ vài chữ bị cao tới 280px! Cùng lỗi có thể xảy ra ở bất kỳ phần tử nào có flex-basis cố định khi cha đổi trục.

**Cách đúng**: mỗi khi đổi `flex-direction` ở breakpoint, PHẢI reset `flex` (hoặc `flex: none` + `width: 100%`) cho các con vốn có `flex-basis` cố định ở desktop, đừng chỉ sửa `max-width`.

## ⚠️ Sửa 1 class dùng chung, không để ý nó phục vụ 2 ngữ cảnh khác nhau

Sau khi fix lỗi trên bằng cách thêm rule cho 1 class, có thể vô tình làm HỎNG một chỗ khác đang dùng CHUNG class đó nhưng trong ngữ cảnh khác (vd class tiêu đề dùng chung cho cả 1 khối xếp-cột-ở-mobile VÀ 1 khối vẫn-nằm-ngang-cạnh-nút-bấm). Rule mới ép `width: 100%` có thể đẩy phần tử kia (nút bấm cạnh nó) tràn hẳn ra ngoài màn hình.

**Cách đúng**: khi thêm rule responsive cho 1 class dùng chung nhiều nơi, luôn dùng combinator cụ thể để giới hạn đúng phạm vi (vd `.row-block > .block-title` thay vì bare `.block-title`), rồi bắt buộc phải test LẠI TẤT CẢ những nơi khác có dùng class đó — không chỉ nơi vừa sửa.

## Quy tắc chọn max-width khi các row có số đo hơi lệch nhau

Trong 1 file Figma, artboard chuẩn thường có 1 kích thước cố định (vd 1440px). Các "container nội dung" (khác header/footer — 2 thứ này thường luôn full-width + padding cố định, không dùng max-width hẹp) thường được dựng từ auto-layout theo từng hàng riêng biệt, nên tổng width mỗi hàng có thể lệch nhau vài px do làm tròn (vd hàng A 1090px, hàng B 1091px, hàng C 1092px). **Quy tắc: lấy số LỚN NHẤT trong các hàng đó làm `max-width` chung cho cả container** — để hàng nào cũng đạt đúng width riêng của nó (không bị bóp hẹp bởi 1 container ngoài nhỏ hơn spec của chính nó).

## ⚠️ Hệ số `vw` trong `clamp()` không khớp giá trị tại đúng breakpoint tham chiếu

Viết `clamp(56px, 8vw, 124px)` với ý định "cap ở 124px khi đủ rộng", nhưng quên kiểm tra: tại đúng viewport tham chiếu của design (vd 1440px), `8vw = 115.2px` — **chưa chạm mốc cap 124px**, nên ở đúng kích thước desktop chuẩn, giá trị thực tế bị thiếu ~9px so với spec.

**Cách tính hệ số đúng**: hệ số vw phải đủ lớn để giá trị vượt qua mốc cap tại viewport tham chiếu, tức `hệ_số_vw ≥ (giá_trị_target / viewport_tham_chiếu) × 100`. Với target 124px @ 1440px: `124/1440*100 ≈ 8.61vw` là mức tối thiểu — nên chọn dư ra (vd 9vw) để chắc chắn cap đúng tại viewport tham chiếu trở lên, không chỉ tính vừa đủ.

**Cách kiểm tra không bị lặp lại lỗi này**: sau khi viết `clamp(min, Xvw, max)`, luôn test bằng `getBoundingClientRect()` tại đúng viewport tham chiếu của design — nếu số đo ra khác `max`, nghĩa là hệ số vw chưa đủ.

## ⚠️ `height` cố định + `padding` trên cùng 1 phần tử (border-box) → padding ăn vào height

```css
.footer-row { height: 499px; padding-bottom: 64px; } /* SAI: content area thực tế chỉ còn 499-64=435px */
```
Cách đúng: dùng `margin-bottom` cho khoảng cách tới phần tử SAU, giữ `height` chỉ để định kích thước riêng của box đó:
```css
.footer-row { height: 499px; margin-bottom: 64px; }
```

## ⚠️ Dùng chung 1 class có `flex:1` cho cả ngữ cảnh hàng ngang lẫn cột dọc

1 class được tái sử dụng cho cả 1 cột nằm trong flex-ROW (cần `flex:1` để chia đều chiều ngang) và các block nằm trong flex-COLUMN. Vì `flex:1` áp `flex-grow` theo MAIN AXIS của container cha, cùng 1 giá trị `flex:1` sẽ nghĩa là "chia chiều ngang" ở ngữ cảnh row nhưng lại thành "giãn nở chiều dọc" ở ngữ cảnh column — khiến các block dọc bị kéo cao bất thường (vd 132px thực tế bị thổi phồng lên 428px). Cách đúng: chỉ khai `flex:1` cho đúng phần tử/ngữ cảnh cần, dùng selector cụ thể hơn thay vì đặt lên class dùng chung:
```css
.footer-info-group > .footer-info { flex: 1 1 200px; } /* chỉ áp cho con trực tiếp của row */
```

## ⚠️ `margin` cố định trên phần tử cuối cùng cộng dồn với `gap` của flex cha

`.footer-value { margin-bottom: 4px }` tưởng vô hại nhưng khi phần tử này nằm trong 1 flex-column CHA đã có `gap`, margin của phần tử cuối vẫn cộng thêm vào (margin không tự "biến mất" chỉ vì là con cuối, và margin không collapse với flex gap) → thừa khoảng cách. Cách đúng: bỏ margin ở phần tử, dùng gap của cha để tạo khoảng cách; nếu 1 vài phần tử liền kề cần gap riêng mà cha không phải flex (block flow thường), dùng selector kề nhau thay vì margin 2 chiều:
```css
.footer-value { margin: 0; }
.footer-value + .footer-value { margin-top: 8px; } /* chỉ tạo khoảng cách GIỮA các phần tử, không có margin thừa sau phần tử cuối */
```

## ⚠️ Header sticky/overlay: padding-top của section đầu tiên KHÔNG đo từ đáy header

Trong Figma, Header thường là 1 frame RIÊNG đè lên (overlay) phần đầu của section bên dưới nó — cả 2 cùng bắt đầu ở toạ độ y giống nhau (vd cả Header và Section hero đều `y=0`), vì trên web thật Header là `position: sticky`/`fixed`, hiển thị NỔI lên trên nội dung cuộn qua, không phải 1 khối chiếm chỗ nối tiếp trong luồng tài liệu ở Figma.

Hệ quả: nếu thấy heading đầu tiên nằm ở toạ độ tuyệt đối `y=144` (tính từ đỉnh trang) và Header cao 80px, thì **khoảng cách hiển thị thực tế từ đáy header tới heading phải là `144 − 80 = 64px`**, KHÔNG PHẢI 144px — vì 144 đã tính luôn phần bị header che ở trên. Nếu code web dùng `header { position: sticky }` (chiếm chỗ trong luồng, đẩy nội dung xuống — khác với `fixed` không chiếm chỗ), phải trừ chiều cao header ra khỏi con số đọc được trong Figma trước khi đặt `padding-top` cho section kế tiếp, không dùng thẳng số tuyệt đối.

**Cách tránh lặp lại lỗi này**: khi đo padding-top của section ĐẦU TIÊN sau header, luôn kiểm tra xem node Header trong Figma có toạ độ `y` TRÙNG với section đó không (overlay) hay nằm PHÍA TRÊN, tách biệt (nối tiếp trong luồng) — 2 trường hợp cho công thức tính khác nhau hoàn toàn.

## Nguyên tắc: luôn lấy số đo trực tiếp từ node Figma, không áng chừng

Khi build lại thấy sai lệch, đọc lại đúng node đang nghi ngờ để lấy số chính xác (width, padding-top, gap...) rồi đối chiếu bằng `getBoundingClientRect()`/`getComputedStyle()` ở trình duyệt thật — không suy đoán hoặc làm tròn số nếu chưa xác nhận lại nguồn. Nếu công cụ hỗ trợ đọc metadata dạng tọa độ tuyệt đối (x/y/width/height), ưu tiên dùng cách đó thay vì chỉ đọc class/token — tọa độ tuyệt đối lộ ra chênh lệch chính xác hơn nhiều.
