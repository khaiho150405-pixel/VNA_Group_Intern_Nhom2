INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status)
VALUES ('nhanvien', 'Nguyễn Văn Nam', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Nhân viên', 1, 'nhanvien@example.com', false)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status;

INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status)
VALUES ('chuyenvien', 'Trần Thị Phương', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Chuyên viên', 2, 'chuyenvien@example.com', false)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status;

INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status)
VALUES ('lanhdao', 'Lê Hoàng Long', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Lãnh đạo', 3, 'lanhdao@example.com', false)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status;

INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status)
VALUES ('superadmin', 'Phạm Thanh Tùng', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Quản trị viên', 4, 'superadmin@example.com', false)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status;

INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status)
VALUES ('testuser', 'Hồ Sĩ Khải', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Quản trị viên', 4, '93.hosikhai.2019@gmail.com', false)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status;

-- Sample Enterprise User
INSERT INTO users (username, "fullName", password, "realRole", "roleId", email, status, doet_id)
VALUES ('company_user', 'Nguyễn Minh Tuấn', '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4', 'Doanh nghiệp', 5, 'company@example.com', false, 1)
ON CONFLICT (username) DO UPDATE SET "fullName" = EXCLUDED."fullName", "realRole" = EXCLUDED."realRole", "roleId" = EXCLUDED."roleId", email = EXCLUDED.email, status = EXCLUDED.status, doet_id = EXCLUDED.doet_id;
