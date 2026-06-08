insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('nhanvien', 'Nhân viên', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Nhân viên bảo vệ', 1, 'nhanvien@example.com', false);

insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('chuyenvien', 'Chuyên viên', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Chuyên viên kiki', 2, 'chuyenvien@example.com', false);

insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('lanhdao', 'Lãnh đạo', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', null, 3, 'lanhdao@example.com', false);

insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('superadmin', 'Quản trị viên', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', null, 4, 'superadmin@example.com', false);

insert into users (username, "fullName", password, "realRole", "roleId", email, status)
values ('testuser', 'Hồ Sĩ Khải', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Quản trị viên', 4, '93.hosikhai.2019@gmail.com', false);
