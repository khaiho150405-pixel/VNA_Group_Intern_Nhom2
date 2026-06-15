import { IsNotEmpty, MinLength, Matches, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  otp: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu mới quá yếu. Yêu cầu mức độ trung bình trở lên (phải bao gồm ít nhất một chữ cái và một chữ số).'
  })
  newPassword: string;
}