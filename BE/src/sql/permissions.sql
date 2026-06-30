CREATE TABLE IF NOT EXISTS permissions (
  code VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  parent_code VARCHAR(255) NULL,
  "order" INT DEFAULT 0,
  FOREIGN KEY (parent_code) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_code VARCHAR(255) NOT NULL,
  PRIMARY KEY (role_id, permission_code),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

-- Seed Permission Groups (Vietnamese names)
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_G_DEPARTMENT', 'Quản lý doanh nghiệp', 'Group', NULL, 1),
('ADMIN_G_ROLE', 'Quản lý vai trò', 'Group', NULL, 2),
('ADMIN_G_USER', 'Quản lý người dùng', 'Group', NULL, 3),
('ADMIN_G_ACCIDENT_REPORT', 'Quản lý báo cáo TNLĐ', 'Group', NULL, 4),
('ADMIN_G_REPORT_PERIOD', 'Cấu hình kỳ báo cáo', 'Group', NULL, 5),
('ADMIN_G_CATEGORY', 'Quản lý danh mục chung', 'Group', NULL, 6),
('ADMIN_G_LOAI_HINH_KD', 'Quản lý loại hình kinh doanh', 'Group', NULL, 7),
('ADMIN_G_NGANH_NGHE_KD', 'Quản lý ngành nghề kinh doanh', 'Group', NULL, 8)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Department Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_DEPARTMENT_VIEW', 'Xem doanh nghiệp', 'Component', 'ADMIN_G_DEPARTMENT', 1),
('ADMIN_C_DEPARTMENT_CREATE', 'Thêm doanh nghiệp', 'Component', 'ADMIN_G_DEPARTMENT', 2),
('ADMIN_C_DEPARTMENT_UPDATE', 'Sửa doanh nghiệp', 'Component', 'ADMIN_G_DEPARTMENT', 3),
('ADMIN_C_DEPARTMENT_DELETE', 'Xóa doanh nghiệp', 'Component', 'ADMIN_G_DEPARTMENT', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Role Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_ROLE_VIEW', 'Xem vai trò', 'Component', 'ADMIN_G_ROLE', 1),
('ADMIN_C_ROLE_CREATE', 'Thêm vai trò', 'Component', 'ADMIN_G_ROLE', 2),
('ADMIN_C_ROLE_UPDATE', 'Sửa vai trò', 'Component', 'ADMIN_G_ROLE', 3),
('ADMIN_C_ROLE_DELETE', 'Xóa vai trò', 'Component', 'ADMIN_G_ROLE', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed User Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_USER_VIEW', 'Xem người dùng', 'Component', 'ADMIN_G_USER', 1),
('ADMIN_C_USER_CREATE', 'Thêm người dùng', 'Component', 'ADMIN_G_USER', 2),
('ADMIN_C_USER_UPDATE', 'Sửa người dùng', 'Component', 'ADMIN_G_USER', 3),
('ADMIN_C_USER_DELETE', 'Xóa người dùng', 'Component', 'ADMIN_G_USER', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Accident Report Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_ACCIDENT_REPORT_VIEW', 'Xem báo cáo TNLĐ', 'Component', 'ADMIN_G_ACCIDENT_REPORT', 1),
('ADMIN_C_ACCIDENT_REPORT_CREATE', 'Khai báo mới báo cáo', 'Component', 'ADMIN_G_ACCIDENT_REPORT', 2),
('ADMIN_C_ACCIDENT_REPORT_UPDATE', 'Duyệt/Từ chối báo cáo', 'Component', 'ADMIN_G_ACCIDENT_REPORT', 3),
('ADMIN_C_ACCIDENT_REPORT_DELETE', 'Xóa báo cáo', 'Component', 'ADMIN_G_ACCIDENT_REPORT', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Report Period Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_REPORT_PERIOD_VIEW', 'Xem cấu hình kỳ báo cáo', 'Component', 'ADMIN_G_REPORT_PERIOD', 1),
('ADMIN_C_REPORT_PERIOD_CREATE', 'Thêm cấu hình kỳ báo cáo', 'Component', 'ADMIN_G_REPORT_PERIOD', 2),
('ADMIN_C_REPORT_PERIOD_UPDATE', 'Sửa cấu hình kỳ báo cáo', 'Component', 'ADMIN_G_REPORT_PERIOD', 3),
('ADMIN_C_REPORT_PERIOD_DELETE', 'Xóa cấu hình kỳ báo cáo', 'Component', 'ADMIN_G_REPORT_PERIOD', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Common Category Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_CATEGORY_VIEW', 'Xem danh mục chung', 'Component', 'ADMIN_G_CATEGORY', 1),
('ADMIN_C_CATEGORY_CREATE', 'Thêm mới danh mục', 'Component', 'ADMIN_G_CATEGORY', 2),
('ADMIN_C_CATEGORY_UPDATE', 'Cập nhật danh mục', 'Component', 'ADMIN_G_CATEGORY', 3),
('ADMIN_C_CATEGORY_DELETE', 'Xóa danh mục', 'Component', 'ADMIN_G_CATEGORY', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Loai Hinh Kinh Doanh Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_LOAI_HINH_KD_VIEW', 'Xem loại hình kinh doanh', 'Component', 'ADMIN_G_LOAI_HINH_KD', 1),
('ADMIN_C_LOAI_HINH_KD_CREATE', 'Thêm loại hình kinh doanh', 'Component', 'ADMIN_G_LOAI_HINH_KD', 2),
('ADMIN_C_LOAI_HINH_KD_UPDATE', 'Sửa loại hình kinh doanh', 'Component', 'ADMIN_G_LOAI_HINH_KD', 3),
('ADMIN_C_LOAI_HINH_KD_DELETE', 'Xóa loại hình kinh doanh', 'Component', 'ADMIN_G_LOAI_HINH_KD', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Nganh Nghe Kinh Doanh Component Permissions
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_NGANH_NGHE_KD_VIEW', 'Xem ngành nghề kinh doanh', 'Component', 'ADMIN_G_NGANH_NGHE_KD', 1),
('ADMIN_C_NGANH_NGHE_KD_CREATE', 'Thêm ngành nghề kinh doanh', 'Component', 'ADMIN_G_NGANH_NGHE_KD', 2),
('ADMIN_C_NGANH_NGHE_KD_UPDATE', 'Sửa ngành nghề kinh doanh', 'Component', 'ADMIN_G_NGANH_NGHE_KD', 3),
('ADMIN_C_NGANH_NGHE_KD_DELETE', 'Xóa ngành nghề kinh doanh', 'Component', 'ADMIN_G_NGANH_NGHE_KD', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- ----------------------------------------------------
-- Map permissions to roles
-- ----------------------------------------------------

-- Clear old roles permissions mappings first to re-apply clean seeding
DELETE FROM role_permissions;

-- Role 4 (superAdmin) has all permissions
INSERT INTO role_permissions (role_id, permission_code)
SELECT 4, code FROM permissions
ON CONFLICT DO NOTHING;

-- Role 3 (leader) has view, create, update on everything (no delete)
INSERT INTO role_permissions (role_id, permission_code)
SELECT 3, code FROM permissions
WHERE code NOT LIKE '%_DELETE'
ON CONFLICT DO NOTHING;

-- Role 2 (expert) has view, create, update on everything (no delete)
INSERT INTO role_permissions (role_id, permission_code)
SELECT 2, code FROM permissions
WHERE code NOT LIKE '%_DELETE'
ON CONFLICT DO NOTHING;

-- Role 1 (employee) has view-only on everything
INSERT INTO role_permissions (role_id, permission_code)
SELECT 1, code FROM permissions
WHERE code LIKE '%_VIEW' OR type = 'Group'
ON CONFLICT DO NOTHING;

-- Role 5 (enterprise) has report permissions, category permissions, business line view, business type view
INSERT INTO role_permissions (role_id, permission_code)
VALUES
(5, 'ADMIN_G_ACCIDENT_REPORT'),
(5, 'ADMIN_C_ACCIDENT_REPORT_VIEW'),
(5, 'ADMIN_C_ACCIDENT_REPORT_CREATE'),
(5, 'ADMIN_C_ACCIDENT_REPORT_UPDATE'),
(5, 'ADMIN_G_CATEGORY'),
(5, 'ADMIN_C_CATEGORY_VIEW'),
(5, 'ADMIN_G_LOAI_HINH_KD'),
(5, 'ADMIN_C_LOAI_HINH_KD_VIEW'),
(5, 'ADMIN_G_NGANH_NGHE_KD'),
(5, 'ADMIN_C_NGANH_NGHE_KD_VIEW')
ON CONFLICT DO NOTHING;
