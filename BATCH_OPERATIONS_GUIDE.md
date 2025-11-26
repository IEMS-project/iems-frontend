# Hướng Dẫn Sử Dụng Tính Năng Batch Operations (Xóa & Di Chuyển Nhiều File)

## Tổng Quan
Ứng dụng hiện đã hỗ trợ xóa và di chuyển nhiều file/folder cùng lúc, giống như Google Drive.

## Cách Chọn Nhiều File/Folder

### 1. Sử dụng Checkbox
- Click vào checkbox bên cạnh tên file/folder để chọn
- Click vào checkbox header (ở đầu danh sách) để chọn tất cả

### 2. Sử dụng Ctrl+Click (hoặc Cmd+Click trên Mac)
- Giữ phím `Ctrl` (Windows/Linux) hoặc `Cmd` (Mac)
- Click vào file/folder để thêm/bỏ khỏi danh sách chọn
- Bạn có thể chọn nhiều item không liên tiếp nhau

## Tính Năng Batch Operations

### Xóa Nhiều File/Folder

1. **Chọn các item muốn xóa**
   - Dùng checkbox hoặc Ctrl+Click để chọn nhiều item

2. **Nhấn nút "Xóa"**
   - Sau khi chọn, toolbar sẽ hiển thị số lượng item đã chọn
   - Nhấn nút đỏ "Xóa (n)" với n là số item đã chọn

3. **Xác nhận**
   - Một dialog xác nhận sẽ xuất hiện
   - Nhấn "Xác nhận" để tiếp tục xóa

4. **Kết quả**
   - Hệ thống sẽ xóa tất cả các item đã chọn
   - Nếu một số item không thể xóa (do quyền), thông báo sẽ hiển thị số lượng xóa thành công/thất bại
   - Các item xóa thành công sẽ biến mất khỏi danh sách

### Di Chuyển Nhiều File/Folder

1. **Chọn các item muốn di chuyển**
   - Dùng checkbox hoặc Ctrl+Click để chọn nhiều item

2. **Nhấn nút "Di chuyển"**
   - Toolbar sẽ hiển thị nút "Di chuyển" khi có item được chọn
   - Nhấn vào nút này

3. **Chọn folder đích**
   - Một modal sẽ hiển thị cây thư mục
   - Chọn folder đích muốn di chuyển đến
   - Hoặc để trống để di chuyển về root

4. **Xác nhận di chuyển**
   - Nhấn "Di chuyển" trong modal
   - Hệ thống sẽ di chuyển tất cả các item đã chọn

5. **Kết quả**
   - Các item sẽ được di chuyển đến folder đích
   - Nếu có lỗi (circular reference, không có quyền), thông báo sẽ hiển thị chi tiết

## Giao Diện Khi Chọn Nhiều Item

### Toolbar Thay Đổi
Khi có item được chọn:
- **Hiển thị**: Số lượng item đã chọn (ví dụ: "3 mục đã chọn")
- **Nút mới xuất hiện**:
  - 🗂️ **Di chuyển**: Di chuyển các item đã chọn
  - 🗑️ **Xóa (n)**: Xóa n item đã chọn

### Visual Feedback
- **List View**: Item được chọn có background màu xanh nhạt (`bg-blue-50`)
- **Grid View**: Item được chọn có border màu xanh và background xanh nhạt

## Lưu Ý Quan Trọng

### Quyền Truy Cập
- ✅ Chỉ có thể xóa/di chuyển file/folder mà bạn là **chủ sở hữu**
- ❌ Item của người khác được chia sẻ cho bạn sẽ không thể xóa/di chuyển
- ⚠️ Nếu chọn cả item có quyền và không có quyền, chỉ những item có quyền sẽ được xử lý

### Xóa Folder
- Khi xóa folder, **tất cả file và subfolder** bên trong cũng sẽ bị xóa
- Hành động này **không thể hoàn tác**

### Di Chuyển Folder
- Không thể di chuyển folder vào chính nó hoặc subfolder của nó (circular reference)
- Hệ thống sẽ tự động kiểm tra và ngăn chặn

### Không Rollback
- Nếu một số item thất bại, các item đã thành công sẽ **không được hoàn tác**
- Ví dụ: Chọn 5 item, 3 xóa thành công, 2 thất bại → 3 item đã xóa sẽ không được khôi phục

## Ví Dụ Sử Dụng

### Ví dụ 1: Dọn dẹp nhiều file cũ
```
1. Ctrl+Click chọn các file: report-2023.pdf, old-data.xlsx, temp.txt
2. Toolbar hiển thị: "3 mục đã chọn"
3. Nhấn nút "Xóa (3)"
4. Xác nhận → Tất cả 3 file bị xóa
```

### Ví dụ 2: Tổ chức lại cấu trúc thư mục
```
1. Chọn checkbox các folder: Project-A, Project-B, Project-C
2. Nhấn "Di chuyển"
3. Chọn folder "2024-Projects" trong modal
4. Nhấn "Di chuyển" → 3 folder được di chuyển vào "2024-Projects"
```

### Ví dụ 3: Di chuyển nhiều file vào folder mới
```
1. Tạo folder mới "Documents"
2. Ctrl+Click chọn: file1.pdf, file2.docx, file3.xlsx
3. Nhấn "Di chuyển"
4. Chọn folder "Documents"
5. Xác nhận → 3 file được sắp xếp gọn gàng
```

## Phím Tắt

| Thao tác | Phím tắt |
|----------|----------|
| Chọn/Bỏ chọn item | `Ctrl+Click` (Windows/Linux)<br>`Cmd+Click` (Mac) |
| Chọn tất cả | Click checkbox header |
| Bỏ chọn tất cả | Click checkbox header lần nữa |

## Xử Lý Lỗi

### Thông Báo Thành Công Hoàn Toàn
```
✅ "Đã xóa thành công 5 mục"
✅ "Đã di chuyển thành công 3 mục"
```

### Thông Báo Một Phần Thành Công
```
⚠️ "Đã xóa 3/5 mục. 2 mục không thể xóa."
⚠️ "Đã di chuyển 2/4 mục. 2 mục không thể di chuyển."
```

### Thông Báo Lỗi
```
❌ "Lỗi khi xóa các mục"
❌ "Lỗi khi di chuyển các mục"
```

## Best Practices

1. **Kiểm tra trước khi xóa**: Đảm bảo bạn đã chọn đúng các item
2. **Sử dụng di chuyển thay vì xóa**: Nếu chưa chắc chắn, hãy di chuyển vào folder tạm
3. **Xóa theo nhóm nhỏ**: Với số lượng lớn, nên chia nhỏ để dễ kiểm soát
4. **Backup trước**: Với data quan trọng, nên backup trước khi xóa hàng loạt

## Troubleshooting

### Không thể xóa/di chuyển
- **Nguyên nhân**: Bạn không phải là chủ sở hữu
- **Giải pháp**: Chỉ chọn các item do bạn tạo ra

### Một số item không được xử lý
- **Nguyên nhân**: Quyền truy cập hỗn hợp (một số có quyền, một số không)
- **Giải pháp**: Kiểm tra icon 🌐 (Public) hoặc 🔒 (Private) để xác định ownership

### Không thể di chuyển folder
- **Nguyên nhân**: Circular reference (di chuyển folder vào subfolder của chính nó)
- **Giải pháp**: Chọn folder đích khác

## Tips & Tricks

- **Quick Delete**: Ctrl+Click nhiều file cũ, một lần xóa sạch
- **Bulk Organization**: Chọn tất cả file cùng loại, di chuyển vào folder chung
- **Mix Selection**: Có thể chọn cả file và folder cùng lúc để xử lý
- **Visual Check**: Item được chọn có màu xanh rõ ràng, dễ kiểm tra trước khi thao tác
