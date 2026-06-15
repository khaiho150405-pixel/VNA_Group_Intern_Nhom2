import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  otp: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu mới quá yếu. Yêu cầu mức độ trung bình trở lên (phải bao gồm ít nhất một chữ cái và một chữ số).'
  })
  newPassword: string;
}
