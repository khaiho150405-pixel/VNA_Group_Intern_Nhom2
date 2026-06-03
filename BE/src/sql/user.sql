insert into users (username, "fullName", password, "realRole", "roleId")
values ('nhanvien', 'Nhân viên', '12345678', 'Nhân viên bảo vệ', 1);
insert into users (username, "fullName", password, "realRole", "roleId")
values ('chuyenvien', 'Chuyên viên', '12345678', 'Chuyên viên kiki', 2);
insert into users (username, "fullName", password, "realRole", "roleId")
values ('lanhdao', 'Lãnh đạo', '12345678', null, 3);
insert into users (username, "fullName", password, "realRole", "roleId")
values ('superadmin', 'Quản trị viên', '12345678', null, 4);
insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('testuser', 'Test User', '$argon2i$v=19$m=4096,t=3,p=1$7E/2K/5SQ5MWNVu41LhwGQ$zg+isXS6+7wmvxcQNoILHavNYTyXOqC78vpfgiNtfGY', 'Tester', 4, 'your_email@example.com', false);


