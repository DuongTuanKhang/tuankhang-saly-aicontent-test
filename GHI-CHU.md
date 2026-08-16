# GHI-CHU

## 1. Tiến độ

Đã hoàn thành đến **Mốc 2**:

-   **Mốc 1 --- Đề xuất ý tưởng**
    -   Chọn bề mặt và số lượng ý tưởng.
    -   Đọc dữ liệu theo workspace hiện tại.
    -   Sinh ý tưởng thông qua `chayNhiemVu()` và queue/worker.
    -   Normalize kết quả AI trước khi đưa ra UI.
    -   Rải ý tưởng theo tỷ lệ trụ cột mục tiêu.
    -   Lưu candidate snapshot phía server.
-   **Mốc 2 --- Biên soạn nội dung**
    -   Mở ý tưởng bằng `ideaId`.
    -   Query idea theo workspace hiện tại.
    -   Sinh draft thông qua `chayNhiemVu('viet-bai', ...)`.
    -   Cho phép người dùng chỉnh tiêu đề và nội dung trên editor.
    -   Khi lưu, chỉ tin nội dung người dùng chỉnh; metadata được lấy
        lại từ idea ở server.

Chưa triển khai các phần sau:

-   `/studio/chuoi-bai`
-   `/studio/hang-loat`
-   `/studio/so-giong`
-   Các phần Mốc 3+ ngoài phạm vi cần thiết cho hai flow trên.

## 2. Kiểm thử

Sau khi khởi động PostgreSQL test bằng Docker, bộ test hiện tại cho kết
quả:

-   **236 tests**
-   **227 pass**
-   **0 fail**
-   **9 skipped**

Ngoài ra:

-   `npx tsc --noEmit`: pass.
-   `next build`: phần build Next.js compile thành công.
-   Repository đã được push lên GitHub với lịch sử commit theo từng mốc.

## 3. Các quyết định kỹ thuật chính

### Workspace isolation

Client không gửi `workspaceId`. Server lấy workspace từ session thông
qua `workspaceHienTai()` rồi tạo repository đã được scope theo
workspace.

Lý do: `workspaceId` là security boundary. Không thể coi UUID do browser
gửi là bằng chứng người dùng được phép truy cập workspace đó.

### AI output được normalize

Kết quả từ model được coi là `unknown` trước khi sử dụng.
`donKetQuaDeXuat()` kiểm tra hình dạng dữ liệu, trim chuỗi, kiểm tra
`beMat` và đối chiếu `truCot`/`chanDung` với dữ liệu thật trong hồ sơ.

Nếu model trả về tên trụ cột hoặc chân dung không tồn tại, giá trị được
đưa về `null` thay vì tự tạo dữ liệu mới.

### Không đưa raw bài tham khảo vào prompt

Với dữ liệu từ kênh được theo dõi, hệ thống chỉ sử dụng thông tin cần
thiết để học chủ đề/công thức kể và không truyền nguyên văn nội dung bài
gốc vào prompt.

Mục tiêu là học cách kể thay vì sao chép nội dung, đồng thời giảm rủi ro
prompt injection từ dữ liệu bên ngoài.

### Queue/worker thay vì gọi AI trực tiếp

Studio không gọi trực tiếp Gemini/OpenAI. Flow đi qua `chayNhiemVu()`,
tạo job, worker nhận job và thực hiện model run.

Cách này giữ được retry, logging, cost tracking và kiểm soát concurrency
ở một nơi.

### Save idea có tính idempotent

Client chỉ gửi `jobId` khi lưu ý tưởng. Server đọc lại candidate
snapshot từ job và thực hiện claim bằng compare-and-set trước khi
persist.

Việc này giúp hai request Save đồng thời không tạo ra hai bản ghi idea
trùng nhau.

### Mốc 2 không tin metadata từ browser

`ideaId` trên URL chỉ là locator. Server query lại idea trong workspace
hiện tại rồi tự lấy metadata cần thiết.

Khi lưu content, server không tin `pillarId`, `personaId`, `beMat` hay
metadata tương tự do browser gửi.

## 4. Điểm còn phân vân

Có một số file migration/rollback được tạo trong quá trình triển khai:

-   `db/rollback/0009_bent_serpent_society.down.sql`
-   `db/rollback/0010_peaceful_plazm.down.sql`

Hiện các file này chưa được đưa vào commit cuối cùng vì cần xác nhận
chúng có thuộc artifact bắt buộc của bài nộp hay chỉ là file hỗ trợ quá
trình phát triển.

`IMPLEMENTATION-PLAN-MILESTONE-1-2.md` cũng đang để ngoài commit chính.

## 5. Bài học chính

Điểm em tập trung trong bài test không phải số lượng màn hình mà là giữ
đúng boundary giữa:

**browser → server action → workspace-scoped repository → job/queue →
worker → AI provider → normalize → persistence**

Đặc biệt, dữ liệu từ browser và AI đều được coi là không đáng tin ở
runtime; server là nơi kiểm tra quyền, validate và tái dựng metadata
trước khi ghi database.

## 6. Trạng thái nộp

-   Mốc 1: hoàn thành và đã commit.
-   Mốc 2: hoàn thành và đã commit.
-   Các commit đã push lên repository GitHub.
-   Full test: 0 failure.
-   Video demo và phần giải thích quyết định kỹ thuật là phần cần hoàn
    thiện trước khi nộp.
