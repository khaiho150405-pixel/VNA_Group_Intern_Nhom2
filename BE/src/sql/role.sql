INSERT INTO roles (id, role, name, type)
VALUES (1, 'employee', 'Nhân viên', 'SO')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO roles (id, role, name, type)
VALUES (2, 'expert', 'Chuyên viên', 'SO')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO roles (id, role, name, type)
VALUES (3, 'leader', 'Lãnh đạo', 'SO')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO roles (id, role, name, type)
VALUES (4, 'superAdmin', 'Quản trị viên', 'SO')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO roles (id, role, name, type)
VALUES (5, 'enterprise', 'Doanh nghiệp', 'DN')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, type = EXCLUDED.type;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
