# Animation trên web — pattern & lỗi hay gặp

Ghi chú dùng chung cho animation JS (GSAP) lẫn CSS thuần, rút ra từ thực tế build.

## Tween cơ bản (GSAP)

```js
gsap.to(el, { x: 100 });               // chạy từ trạng thái hiện tại -> giá trị chỉ định
gsap.from(el, { opacity: 0 });          // chạy từ giá trị chỉ định -> trạng thái hiện tại
gsap.fromTo(el, { y: 50 }, { y: 0 });   // chỉ định rõ cả điểm đầu và điểm cuối
gsap.set(el, { opacity: 1 });           // áp giá trị ngay lập tức, không animate
```

Timeline nối nhiều tween lại, dùng tham số vị trí để canh thời gian:
```js
gsap.timeline()
  .to('.a', { opacity: 1, duration: .6 }, 0)       // bắt đầu tại giây 0
  .to('.b', { opacity: 1, duration: .6 }, 0.2)      // bắt đầu tại giây 0.2 (chồng lấn có chủ đích)
  .to('.c', { opacity: 1, duration: .6 }, '-=0.3'); // bắt đầu sớm hơn 0.3s so với điểm kết thúc trước đó
```

## Easing

- Mặc định của GSAP là `power1.out`.
- Cú pháp: `"tên.hướng"` — hướng là `in`, `out`, hoặc `inOut`.
- Họ ease chính: `power1`–`power4` (càng cao càng "dứt khoát"), `back` (nảy lố rồi về), `bounce`, `circ`, `elastic`, `expo`, `sine`, `steps`.
- Quy tắc chọn nhanh: `power2.out`/`power3.out` cho hiệu ứng xuất hiện tự nhiên (UI, reveal khi cuộn); `power1.inOut` cho chuyển động lặp/loop mượt; `back.out` cho cảm giác "nảy" vui tươi (button, badge); tránh `elastic`/`bounce` cho text lớn — dễ gây rối mắt.
- **Trong lúc kéo tay (drag) thì KHÔNG ease** — chuyển động phải đi 1:1 theo con trỏ, ease lúc kéo sẽ làm sai lệch tính toán vị trí và cảm giác lag. Easing chỉ dành cho hành động lập trình (bấm nút để nhảy tới vị trí, animate khi load/cuộn tới).
- Muốn đồng bộ "nhịp độ" toàn site: định nghĩa 1 easing token dùng chung thay vì rải `ease`/`ease-in-out` mặc định ở từng chỗ:
  ```css
  :root { --ease-smooth: cubic-bezier(0.65, 0, 0.35, 1); }
  ```
  Đổi 1 chỗ là toàn site đổi theo, không phải sửa từng rule khi cần tinh chỉnh.

## ⚠️ Lỗi hay gặp: 2 tween chồng cùng thuộc tính trên cùng 1 phần tử

Từng viết (SAI):
```js
gsap.timeline()
  .to('.hero-title', { opacity: 1, y: 0, duration: .7 }, 0.15)
  .fromTo('.hero-title', { y: 24 }, { y: 0, duration: .7 }, 0.15); // cùng target, cùng vị trí, cùng thuộc tính y
```
Hậu quả: 2 tween cùng điều khiển `y` trên cùng 1 phần tử, khởi động cùng lúc → GSAP overwrite lẫn nhau, tween đầu tiên (mang theo `opacity`) bị "giết" giữa chừng, phần tử kẹt vĩnh viễn ở `opacity: 0`. Không có lỗi console nào báo, chỉ lặng lẽ sai.

**Cách đúng**: gộp thành một `fromTo()` duy nhất cho mỗi phần tử, khai báo đủ from + to trong một lệnh:
```js
gsap.timeline().fromTo('.hero-title', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7 }, 0.15);
```

**Lưu ý thêm về `fromTo`**: phần "from" được render **ngay khi tween được tạo ra** (immediateRender mặc định là `true`), không phải khi playhead chạy tới vị trí đó. Nếu thêm `fromTo` vào timeline ở một vị trí muộn nhưng dòng code chạy ngay khi trang load, giá trị "from" vẫn bị áp lên phần tử ngay lập tức — cần nhớ điều này khi debug trạng thái ban đầu của phần tử trông "sai" trước khi timeline kịp chạy tới.

## Hiệu năng

- Ưu tiên animate `transform` (x/y/scale/rotate) và `opacity` — không tốn layout/reflow.
- Tránh animate `top/left/margin/width/height` trực tiếp — browser phải tính lại layout mỗi frame.
- `filter` và `box-shadow` tốn CPU/GPU hơn — test trên máy yếu trước khi dùng nhiều.
- `stagger` để tạo hiệu ứng nối tiếp cho nhóm phần tử thay vì viết loop thủ công: `gsap.from('.card', { opacity: 0, y: 20, stagger: 0.12 })`.

## ScrollTrigger — khái niệm cốt lõi

```js
gsap.registerPlugin(ScrollTrigger);
gsap.fromTo(el, { opacity: 0, y: 32 }, {
  opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
  scrollTrigger: {
    trigger: el,
    start: 'top 85%',              // top của el chạm 85% chiều cao viewport
    toggleActions: 'play none none reverse',
    // markers: true,              // bật khi dev để thấy vạch debug, tắt trước khi ship
  }
});
```
- `start`/`end` dùng cú pháp `"<vị trí trigger> <vị trí viewport>"`, hỗ trợ keyword, %, px, hoặc tương đối (`+=300px`).
- `toggleActions` là chuỗi 4 phần: `onEnter onLeave onEnterBack onLeaveBack`. Mặc định `"play none none none"` (chạy 1 lần). Dùng `"play none none reverse"` để hiệu ứng lặp lại khi cuộn lên xuống qua lại.
- `scrub: true` (hoặc `scrub: 1` để mượt hơn) gắn animation trực tiếp theo vị trí cuộn thay vì animate 1 lần.
- `pin: true` ghim phần tử lại khi cuộn qua — tự chèn padding giữ layout, không cần tự animate vị trí.
- Tạo các ScrollTrigger theo đúng thứ tự từ trên xuống dưới trong DOM để tính pin chính xác; gọi `ScrollTrigger.refresh()` sau khi có thay đổi lớn về chiều cao trang (vd ảnh nặng load xong làm lệch vị trí trigger).

## Responsive animation với `matchMedia()`

Dùng khi animation cần **khác nhau** giữa các breakpoint (không chỉ ẩn/hiện bằng CSS mà logic animate thực sự đổi):
```js
let mm = gsap.matchMedia();
mm.add('(min-width: 900px)', () => {
  gsap.to('.hero-image-wrap', { scale: 1, duration: 0.9 });
  // cleanup tự động khi hết match — không cần killTweensOf thủ công
});
mm.add('(max-width: 899px)', () => {
  gsap.set('.hero-image-wrap', { scale: 1 }); // mobile: bỏ hiệu ứng, hiện luôn
});
```
Khi điều kiện media query ngừng khớp, GSAP tự động revert toàn bộ animation/ScrollTrigger tạo trong callback đó — không rò rỉ tween cũ khi resize qua lại giữa các breakpoint.

## Pattern hay dùng

**Đếm số chạy lên khi vào viewport**
```js
document.querySelectorAll('[data-count-to]').forEach(el => {
  const target = parseInt(el.dataset.countTo, 10);
  const counter = { val: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => gsap.to(counter, {
      val: target, duration: 1.4, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(counter.val); }
    })
  });
});
```

**Carousel kéo tay + nút mũi tên** — tween thẳng `scrollLeft` bằng GSAP, không cần vòng lặp JS thủ công cho phần nhảy-tới-vị-trí:
```js
function scrollByCard(dir) {
  const step = track.querySelector('.card').getBoundingClientRect().width + gap;
  gsap.to(track, { scrollLeft: track.scrollLeft + dir * step, duration: 0.5, ease: 'power2.out' });
}
```
Riêng phần kéo tay (pointerdown/move/up) thì set `track.scrollLeft` trực tiếp theo delta con trỏ, KHÔNG qua GSAP/easing (xem mục "Trong lúc kéo tay" ở trên).

**Fade mask ở 2 mép 1 track cuộn ngang** (che phần bị cắt cụt, blend vào nền) — 2 lớp gradient tuyệt đối ở 2 mép, `pointer-events:none`, toggle class ẩn/hiện theo vị trí cuộn:
```css
.fade { position: absolute; top: 0; width: 96px; pointer-events: none; opacity: 0; transition: opacity .3s var(--ease-smooth); }
.fade-left { left: 0; background: linear-gradient(to right, #fff, transparent); }
.fade-right { right: 0; background: linear-gradient(to left, #fff, transparent); opacity: 1; }
```
```js
function updateFade() {
  const max = track.scrollWidth - track.clientWidth;
  fadeLeft.classList.toggle('is-visible', track.scrollLeft > 1);
  fadeRight.classList.toggle('is-hidden', track.scrollLeft >= max - 1);
}
```

## Lottie (animation xuất từ After Effects)

Dùng thư viện `lottie-web` (riêng biệt, không phải GSAP) kết hợp `ScrollTrigger` để trigger khi cuộn tới:
```js
const anim = lottie.loadAnimation({
  container: el, renderer: 'svg', loop: false,
  autoplay: false,          // để ScrollTrigger tự play, không tự chạy khi vừa load
  path: 'assets/lottie/xxx.json',
});
ScrollTrigger.create({
  trigger: '.footer', start: 'top 75%',
  onEnter: () => anim.goToAndPlay(0, true),      // goToAndPlay(0,...) để RESET về đầu, .play() suông không tự reset nếu đã chạy xong
  onEnterBack: () => anim.goToAndPlay(0, true),  // bỏ onEnterBack (và once:true ở trên) nếu chỉ muốn chạy đúng 1 lần trong vòng đời trang
});
```
Container cần đặt `aspect-ratio` khớp đúng `w`/`h` gốc khai báo ở đầu file JSON — vì đây là `<div>` không phải `<img>`, không tự có kích thước nội tại.

**⚠️ Cách verify animation có track matte (reveal/mask) thực sự chạy, đừng tin `getBBox()`**: `path.getBBox()` chỉ đo hình học riêng của path, KHÔNG phản ánh việc path đó có đang bị `<mask>` che hay không — dễ kết luận nhầm "animation không chạy" dù thực ra nó chạy đúng nhưng bị mask ẩn phần chưa tới. Cách verify đúng: serialize SVG hiện tại thành ảnh, vẽ lên `<canvas>`, đọc pixel thật bằng `getImageData()` ở nhiều frame khác nhau, đếm số pixel có alpha > 0:
```js
const xml = new XMLSerializer().serializeToString(svg);
const img = new Image();
img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
await new Promise(r => img.onload = r);
ctx.drawImage(img, 0, 0, w, h);
const data = ctx.getImageData(0, 0, w, h).data; // đếm pixel alpha>0 ở từng frame để thấy hiệu ứng reveal thật
```

## Underline hover 2 chiều bằng CSS thuần (không cần JS)

Yêu cầu: mặc định ẩn, hover thì vẽ line từ trái sang phải, rời chuột thì line **rút lại cũng theo hướng trái sang phải** (không phải rút ngược từ phải sang trái) rồi mới biến mất.

Chìa khóa: đổi `transform-origin` giữa 2 trạng thái — `transform-origin` không tự animate (đổi tức thì), chỉ `transform: scaleX()` mới animate, nên "đánh lừa" được hướng co giãn:
```css
.nav a::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px;
  background: currentColor;      /* luôn khớp màu chữ, không hardcode màu */
  transform: scaleX(0);
  transform-origin: right;        /* trạng thái ẩn/rút: neo bên phải -> cạnh trái "đuổi" sang phải khi scale về 0 */
  transition: transform .4s var(--ease-smooth);
}
.nav a:hover::after { transform: scaleX(1); transform-origin: left; } /* neo bên trái -> line "mọc" từ trái sang phải */
```
Logic: khi `:hover` được thêm, `transform-origin` đổi thành `left` ngay lập tức, rồi `scaleX` mới animate 0→1 dùng origin mới. Khi bỏ hover, origin trở về `right` ngay lập tức, rồi `scaleX` animate 1→0 dùng origin `right` (cạnh trái tiến về phía cạnh phải cố định = rút từ trái sang phải).

## Flip-up text trong button lúc hover (trượt che, không phải xoay 3D)

Hiệu ứng "chữ lật lên" phổ biến trong button THỰC RA thường là trượt che (`translateY` + `overflow:hidden`), không phải xoay 3D `rotateX`. 2 bản copy text xếp chồng dọc, bản dưới nằm ngay bên dưới bản trên (ẩn bởi overflow), hover thì cả 2 cùng trượt lên 1 khoảng bằng chiều cao dòng — bản trên trượt ra khỏi vùng nhìn thấy, bản dưới trượt vào đúng vị trí bản trên vừa rời đi:
```html
<button class="btn">
  <span class="flip-content">
    <span class="flip-text" data-flip-text>Đăng ký</span>
    <span class="flip-text flip-text-hover" data-flip-text>Đăng ký</span>
  </span>
</button>
```
```css
.flip-content { position: relative; display: block; overflow: hidden; }
.flip-text { display: block; transform: translateY(0%); transition: transform .4s var(--ease-smooth); }
.flip-text-hover { position: absolute; left: 0; bottom: -100%; width: 100%; }
.btn:hover .flip-text { transform: translateY(-100%); }
```
Nhiều demo gốc (vd CodePen phổ biến) dùng easing kiểu `cubic-bezier(0.16,1,0.3,1)` (dứt khoát, không phải ease-in-out) — nếu muốn mượt/ease-in-out thật, đổi sang token ease-in-out dùng chung của site thay vì copy nguyên easing gốc.

**⚠️ Nếu button này có content lấy từ CMS/content-loader**: đừng dùng `el.textContent = value` trên phần tử `<button>` ngoài — nó sẽ xoá mất luôn cấu trúc 2 span bên trong. Phải set text vào ĐÚNG cả 2 span `[data-flip-text]` bên trong:
```js
function setFlipText(id, value) {
  document.getElementById(id)?.querySelectorAll('[data-flip-text]').forEach(span => { span.textContent = value; });
}
```

## Nguyên tắc chung cho hover/transition CSS

- Chỉ nên animate `transform` + `opacity` (+ `background-color`/`color` nếu cần, rẻ) — tránh `width`/`height`/`top`/`left` gây reflow.
- Dùng `currentColor` cho chi tiết trang trí đi theo màu chữ (underline, border nhỏ) — tránh phải đồng bộ tay khi đổi màu chữ.
- Khi khách hàng/thiết kế yêu cầu "bỏ animation" ở 1 khu vực cụ thể: bỏ cả `transition` property luôn (không chỉ bỏ giá trị hover) — còn để `transition` mà không có gì animate là code thừa, dọn cho sạch.
