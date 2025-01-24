# API Xác Thực

Dự án này cung cấp API xác thực được xây dựng bằng Node.js và MySQL. API bao gồm các chức năng như đăng ký tài khoản, xác minh email bằng OTP, đăng nhập, đặt lại mật khẩu bằng OTP và xử lý dữ liệu người dùng một cách bảo mật.

## Tính năng

- **Đăng ký tài khoản**: Đăng ký tài khoản mới với email và mật khẩu.
- **Xác minh OTP qua email**: Xác minh tài khoản bằng OTP gửi qua email.
- **Đăng nhập**: Xác thực người dùng bằng JWT.
- **Quên mật khẩu**: Yêu cầu OTP để đặt lại mật khẩu.
- **Đặt lại mật khẩu**: Cập nhật mật khẩu bằng OTP.

## Yêu cầu

- [Node.js](https://nodejs.org/) (phiên bản 14 hoặc cao hơn)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)
- Tài khoản Gmail để gửi OTP qua email

## Hướng dẫn cài đặt

1. **Clone dự án từ GitHub**:

   ```bash
   git clone https://github.com/your-username/auth-api.git
   cd auth-api
   ```

2. **Cài đặt các thư viện**:

   ```bash
   npm install
   ```

3. **Tạo file môi trường `.env`**:
   Tạo file `.env` trong thư mục gốc và thêm nội dung sau:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=auth_system
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_email_password
   ```

   - Thay `your_mysql_password` bằng mật khẩu MySQL của bạn.
   - Thay `your_email@example.com` và `your_email_password` bằng thông tin tài khoản Gmail của bạn.

4. **Khởi tạo cơ sở dữ liệu**:

   - Tạo cơ sở dữ liệu:
     ```sql
     CREATE DATABASE auth_system;
     ```
   - Cơ sở dữ liệu và bảng sẽ được tạo tự động khi bạn chạy ứng dụng lần đầu (nếu đã xử lý trong mã nguồn).

5. **Chạy server**:

   ```bash
   npm start
   ```

   Hoặc, trong chế độ phát triển (có tự động reload):

   ```bash
   npm run dev
   ```

6. **Kiểm tra API**:
   Sử dụng [Postman](https://www.postman.com/) hoặc công cụ tương tự để kiểm tra các endpoint của API.

## API Endpoint

### **URL Gốc**: `http://localhost:3000`

### **Các route của API xác thực**

1. **Đăng ký tài khoản**

   - **POST** `/api/auth/register`
   - Request Body:
     ```json
     {
       "email": "user@example.com",
       "password": "your_password"
     }
     ```
   - Response:
     ```json
     {
       "message": "Đăng ký thành công. Vui lòng xác thực email của bạn"
     }
     ```

2. **Xác minh OTP**

   - **POST** `/api/auth/verify-otp`
   - Request Body:
     ```json
     {
       "email": "user@example.com",
       "otpCode": "123456"
     }
     ```
   - Response:
     ```json
     {
       "message": "Tài khoản đã được xác minh thành công"
     }
     ```

3. **Đăng nhập**

   - **POST** `/api/auth/login`
   - Request Body:
     ```json
     {
       "email": "user@example.com",
       "password": "your_password"
     }
     ```
   - Response:
     ```json
     {
       "message": "Đăng nhập thành công",
       "token": "your_jwt_token"
     }
     ```

4. **Quên mật khẩu**

   - **POST** `/api/auth/forgot-password`
   - Request Body:
     ```json
     {
       "email": "user@example.com"
     }
     ```
   - Response:
     ```json
     {
       "message": "OTP đã được gửi đến email"
     }
     ```

5. **Đặt lại mật khẩu**
   - **POST** `/api/auth/reset-password`
   - Request Body:
     ```json
     {
       "email": "user@example.com",
       "otpCode": "123456",
       "newPassword": "new_password"
     }
     ```
   - Response:
     ```json
     {
       "message": "Mật khẩu đã được đặt lại thành công"
     }
     ```

## Cấu trúc dự án

```
.
├── config
│   └── db.js            # Cấu hình cơ sở dữ liệu
├── controllers
│   └── authController.js # Xử lý logic xác thực
├── routes
│   └── authRoutes.js     # Các route liên quan đến xác thực
├── .env                  # Biến môi trường (được bỏ qua khi push lên Git)
├── .gitignore            # Các file/thư mục không push lên Git
├── package.json          # Các thư viện sử dụng trong dự án
├── server.js             # Điểm bắt đầu của server
└── README.md             # Tài liệu của dự án
```

## Lưu ý bảo mật

- Không lưu trữ thông tin nhạy cảm (ví dụ: mật khẩu, khóa bí mật) trực tiếp trong mã nguồn.
- Đảm bảo file `.env` được thêm vào `.gitignore` để tránh bị tải lên GitHub.
- Sử dụng mật khẩu an toàn và thường xuyên cập nhật JWT secret.
