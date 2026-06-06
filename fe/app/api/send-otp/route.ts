import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, displayName, username, otp } = await request.json();

    // 1. Cấu hình tài khoản gửi mail (Dùng Gmail của bạn)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nuyenphat2468@gmail.com', // THAY BẰNG GMAIL CỦA BẠN
        pass: 'ttzjulwejsrhxxiu', // THAY BẰNG MÃ LẤY Ở BƯỚC 2 (KHÔNG có dấu cách)
      },
    });

    // 2. Xây dựng Template HTML giống hệt hình ảnh thiết kế
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="fe/public/static/mock-images/logoVNG.png" alt="Logo" style="height: 50px;" />
        </div>
        
        <h2 style="color: #000; font-size: 18px; margin-bottom: 20px;">Xin chào, ${displayName}</h2>
        
        <p style="color: #333; line-height: 1.6; font-size: 14px;">
          Bạn vừa yêu cầu khôi phục mật khẩu cho tài khoản <strong>${username}</strong>, dưới đây là mã OTP của bạn: 
          <strong style="font-size: 18px; color: #000;">${otp}</strong>
        </p>
        
        <p style="color: #333; line-height: 1.6; font-size: 14px;">
          Lưu ý quan trọng: Mã OTP có hiệu lực trong <strong>5 phút</strong><br/>
          Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ.
        </p>
        
        <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px;">
          Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>
    `;

    // 3. Gửi email
    const mailOptions = {
      from: '"Hệ Thống An Toàn Vệ Sinh Lao Động" <nuyenphat2468@gmail.com>',
      to: email, // Gửi đến email người dùng nhập vào
      subject: 'Mã xác thực khôi phục mật khẩu',
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Đã gửi email thành công' });
  } catch (error) {
    console.error('Lỗi gửi mail:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server khi gửi mail' }, { status: 500 });
  }
}