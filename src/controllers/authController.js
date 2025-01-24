const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 1. Đăng ký tài khoản
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user.length)
      return res.status(400).json({ message: "Email đã được đăng ký" });

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP hết hạn sau 10 phút

    // Lưu người dùng và OTP vào DB
    await db.query(
      "INSERT INTO users (email, password, otp_code, otp_expires_at) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, otpCode, otpExpiresAt]
    );

    // Gửi OTP qua email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP xác thực tài khoản",
      text: `Mã OTP của bạn là: ${otpCode}`,
    });

    res
      .status(201)
      .json({
        message: "Đăng ký thành công. Vui lòng xác thực email của bạn",
      });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi đăng ký người dùng", error: err.message });
  }
};

// 2. Kích hoạt tài khoản bằng OTP
exports.verifyOTP = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user.length)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const userData = user[0];

    if (
      userData.otp_code !== otpCode ||
      new Date() > new Date(userData.otp_expires_at)
    ) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Cập nhật trạng thái xác minh
    await db.query(
      "UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE email = ?",
      [email]
    );

    res.status(200).json({ message: "Tài khoản đã được xác minh thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi xác minh OTP", error: err.message });
  }
};

// 3. Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user.length)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const userData = user[0];

    if (!userData.is_verified) {
      return res.status(403).json({ message: "Tài khoản chưa được xác minh" });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch)
      return res.status(400).json({ message: "Mật khẩu không chính xác" });

    // Tạo JWT
    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi đăng nhập", error: err.message });
  }
};

// 4. Quên mật khẩu bằng OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user.length)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Cập nhật OTP
    await db.query(
      "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
      [otpCode, otpExpiresAt, email]
    );

    // Gửi email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otpCode}`,
    });

    res.status(200).json({ message: "OTP đã được gửi đến email" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi gửi OTP", error: err.message });
  }
};

// 5. Đặt lại mật khẩu bằng OTP
exports.resetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;

  try {
    // Kiểm tra xem email có tồn tại không
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user.length)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const userData = user[0];

    // Kiểm tra OTP có hợp lệ và chưa hết hạn
    if (
      userData.otp_code !== otpCode ||
      new Date() > new Date(userData.otp_expires_at)
    ) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu và xóa OTP
    await db.query(
      "UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi đặt lại mật khẩu", error: err.message });
  }
};
