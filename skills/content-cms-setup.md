# Gắn CMS chỉnh content cho site tĩnh (không cần database/server riêng)

## Khi nào dùng cách này

Site tĩnh (HTML/CSS/JS thuần, không build tool) đã xong, giờ cần cho phép sửa content (text/ảnh/link) mà không phải sửa code mỗi lần. Không muốn tự dựng database + admin panel riêng.

## Kiến trúc: Decap CMS (git-based), không cần backend tự viết

Decap CMS là 1 admin app tĩnh (chỉ HTML/JS, chạy ở `/admin`) — khi bấm "Publish" nó **commit thẳng vào file trong git repo** qua GitHub API. Không cần viết/host server riêng cho CMS. Phần duy nhất giống "backend" là xác thực người sửa với GitHub — **Netlify Identity + Git Gateway** làm việc này với 0 dòng code (chỉ bật toggle trong dashboard Netlify). Deploy ở nơi khác (Vercel...) thì phải tự dựng thêm 1 OAuth proxy nhỏ — vì vậy nên chọn Netlify riêng cho tính năng này nếu muốn đơn giản nhất.

## Pattern: tách content ra JSON, trang fetch + inject lúc load

1. Chuyển toàn bộ text/ảnh/link đang hardcode trong HTML ra file JSON (vd `content/about.json`, `content/global.json` cho phần dùng chung như header/footer).
2. Giữ NGUYÊN text hardcode trong HTML — nó trở thành fallback/first-paint content, JS sẽ ghi đè lên khi JSON load xong. Lợi ích: không có flash-of-empty-content, trang vẫn chạy được nếu fetch lỗi.
3. Viết 1 script `content-loader.js` (load TRƯỚC script animation chính): fetch JSON → set `textContent`/`innerHTML`/attribute theo `id` tương ứng.
4. Với content dạng DANH SÁCH (card, nav link, social link...) — đừng chỉ text-patch từng phần tử cố định, mà **regenerate toàn bộ children từ mảng JSON** (`container.innerHTML = items.map(templateFn).join('')`). Vậy khi CMS thêm/bớt item, số lượng phần tử trên trang tự đổi theo, không bị giới hạn ở số lượng cứng đã hardcode ban đầu.

## ⚠️ Bẫy sequencing: animation/JS khác PHẢI chờ content load xong mới chạy

Nếu script animation chính (vd GSAP) chạy TRƯỚC khi content-loader kịp fetch xong:
- Nó có thể đọc phải giá trị CŨ/fallback cho những thứ cần chính xác (vd 1 số đếm lên tới target lấy từ `data-count-to` — nếu đọc trước khi content-loader cập nhật attribute này, animation sẽ chạy tới sai con số).
- Nó có thể gắn event listener lên các phần tử SẼ BỊ THAY THẾ khi content-loader regenerate list (vd link nav) — listener gắn lên phần tử cũ, phần tử mới thay vào không có listener, tính năng im lặng gãy không báo lỗi.

**Cách đúng**: bọc toàn bộ code animation/JS chính vào 1 hàm, chỉ gọi hàm đó SAU KHI content-loader báo đã xong (dùng 1 `Promise` dùng chung, có timeout dự phòng để trang vẫn chạy nếu fetch treo/lỗi):
```js
// content-loader.js
window.contentReady = Promise.race([
  Promise.all([fetchJSON('a.json').then(applyA), fetchJSON('b.json').then(applyB)]),
  new Promise(resolve => setTimeout(resolve, 2000)), // timeout an toàn
]);

// main.js
function initSiteAnimations() { /* toàn bộ code cũ ở đây */ }
(window.contentReady || Promise.resolve()).then(initSiteAnimations);
```

## Thiết kế schema CMS (Decap `config.yml`)

- Mỗi "file" JSON là 1 collection riêng trong `config.yml` (`files: [{file: "content/x.json", fields: [...]}]`), field type khớp cấu trúc JSON: `string`/`text`/`image`/`list` (list lồng field con cho từng item).
- Nội dung DÙNG CHUNG nhiều trang (header, footer) tách file riêng khỏi content của TỪNG trang — sau này thêm trang mới không phải khai báo lại nav/footer.
- Ảnh dùng widget `image` (Decap tự lo upload vào `media_folder` khai báo trong config) thay vì field text chứa đường dẫn tay.

## Việc cần làm thủ công (ngoài phạm vi code) để CMS hoạt động thật

Code chỉ chạy đúng cục bộ (đọc JSON, hiện login screen của Decap) — để publish/edit thật cần deploy thật + xác thực thật.

### Nếu host trên Netlify (đơn giản nhất — 0 code cho phần auth)
`backend: { name: git-gateway }` trong `config.yml`.
1. Push repo lên GitHub.
2. Tạo site trên Netlify trỏ vào repo đó.
3. Netlify dashboard: bật Identity (invite only) → bật Git Gateway trong phần Identity → tự mời chính mình qua email.
4. Vào `<site>.netlify.app/admin`, đăng nhập, sửa và Publish.

### Nếu host trên Cloudflare Pages (hoặc bất kỳ đâu khác Netlify) — phải tự viết OAuth proxy

Cloudflare không có tính năng kiểu Identity/Git Gateway dựng sẵn. Cách làm: dùng `backend: { name: github }` trong `config.yml` + tự viết 2 serverless function xử lý OAuth handshake với GitHub, đặt NGAY TRONG project (Cloudflare Pages Functions — file trong thư mục `functions/`, tự động thành route, không cần deploy riêng):

- `functions/auth.js` — redirect sang trang authorize của GitHub.
- `functions/callback.js` — GitHub redirect ngược về đây kèm `?code=...`, function đổi code lấy access token (cần `client_secret`, **chỉ được làm ở server**, không bao giờ lộ ra client), rồi trả về 1 trang HTML nhỏ `postMessage` token đó ngược lại cho popup `/admin` đang mở (đúng theo giao thức Decap CMS: opener gửi `"authorizing:github"`, callback lắng nghe rồi trả `"authorization:github:success:{token,...}"`).

`config.yml` cần thêm:
```yaml
backend:
  name: github
  repo: owner/repo-name        # điền sau khi có repo GitHub thật
  branch: main
  base_url: https://xxx.pages.dev  # domain Cloudflare Pages thật
  auth_endpoint: auth
```

Việc thủ công cần làm:
1. Tạo 1 **GitHub OAuth App** (Settings → Developer settings → OAuth Apps) — Authorization callback URL phải khớp CHÍNH XÁC `https://<domain>/callback`.
2. Lấy `Client ID` + `Client Secret` từ app đó, set làm **environment variable** trong Cloudflare Pages dashboard (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) — không bao giờ hardcode secret vào code/commit.
3. Push repo lên GitHub, tạo project Cloudflare Pages trỏ vào repo đó (Cloudflare tự nhận diện `functions/` folder).
4. Điền đúng `repo:`/`base_url:` trong `config.yml` khớp domain Cloudflare Pages thật, deploy lại.
5. Vào `<domain>/admin`, bấm "Login with GitHub", sửa và Publish.
