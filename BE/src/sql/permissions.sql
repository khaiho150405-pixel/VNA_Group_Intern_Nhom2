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

-- Seed Permission Groups
INSERT INTO permissions (code, name, type, parent_code, "order")
VALUES ('ADMIN_G_DEPARTMENT', 'Department Group', 'Group', NULL, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

INSERT INTO permissions (code, name, type, parent_code, "order")
VALUES ('ADMIN_G_ROLE', 'Role Group', 'Group', NULL, 2)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

INSERT INTO permissions (code, name, type, parent_code, "order")
VALUES ('ADMIN_G_USER', 'User Group', 'Group', NULL, 3)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Department Components
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_DEPARTMENT_VIEW', 'View Department', 'Component', 'ADMIN_G_DEPARTMENT', 1),
('ADMIN_C_DEPARTMENT_CREATE', 'Create Department', 'Component', 'ADMIN_G_DEPARTMENT', 2),
('ADMIN_C_DEPARTMENT_UPDATE', 'Update Department', 'Component', 'ADMIN_G_DEPARTMENT', 3),
('ADMIN_C_DEPARTMENT_DELETE', 'Delete Department', 'Component', 'ADMIN_G_DEPARTMENT', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Role Components
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_ROLE_VIEW', 'View Role', 'Component', 'ADMIN_G_ROLE', 1),
('ADMIN_C_ROLE_CREATE', 'Create Role', 'Component', 'ADMIN_G_ROLE', 2),
('ADMIN_C_ROLE_UPDATE', 'Update Role', 'Component', 'ADMIN_G_ROLE', 3),
('ADMIN_C_ROLE_DELETE', 'Delete Role', 'Component', 'ADMIN_G_ROLE', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed User Components
INSERT INTO permissions (code, name, type, parent_code, "order") VALUES
('ADMIN_C_USER_VIEW', 'View User', 'Component', 'ADMIN_G_USER', 1),
('ADMIN_C_USER_CREATE', 'Create User', 'Component', 'ADMIN_G_USER', 2),
('ADMIN_C_USER_UPDATE', 'Update User', 'Component', 'ADMIN_G_USER', 3),
('ADMIN_C_USER_DELETE', 'Delete User', 'Component', 'ADMIN_G_USER', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_code = EXCLUDED.parent_code, "order" = EXCLUDED."order";

-- Seed Default Permissions for roles
-- Role 4 (superAdmin) has all permissions
INSERT INTO role_permissions (role_id, permission_code)
SELECT 4, code FROM permissions
ON CONFLICT DO NOTHING;

-- Role 3 (leader) has view and edit/create, no delete
INSERT INTO role_permissions (role_id, permission_code)
VALUES
(3, 'ADMIN_G_DEPARTMENT'),
(3, 'ADMIN_C_DEPARTMENT_VIEW'),
(3, 'ADMIN_C_DEPARTMENT_CREATE'),
(3, 'ADMIN_C_DEPARTMENT_UPDATE'),
(3, 'ADMIN_G_ROLE'),
(3, 'ADMIN_C_ROLE_VIEW'),
(3, 'ADMIN_C_ROLE_CREATE'),
(3, 'ADMIN_C_ROLE_UPDATE'),
(3, 'ADMIN_G_USER'),
(3, 'ADMIN_C_USER_VIEW'),
(3, 'ADMIN_C_USER_CREATE'),
(3, 'ADMIN_C_USER_UPDATE')
ON CONFLICT DO NOTHING;

-- Role 2 (expert) has view, create/update on departments/users
INSERT INTO role_permissions (role_id, permission_code)
VALUES
(2, 'ADMIN_G_DEPARTMENT'),
(2, 'ADMIN_C_DEPARTMENT_VIEW'),
(2, 'ADMIN_C_DEPARTMENT_CREATE'),
(2, 'ADMIN_C_DEPARTMENT_UPDATE'),
(2, 'ADMIN_G_USER'),
(2, 'ADMIN_C_USER_VIEW'),
(2, 'ADMIN_C_USER_CREATE'),
(2, 'ADMIN_C_USER_UPDATE')
ON CONFLICT DO NOTHING;

-- Role 1 (employee) has only view
INSERT INTO role_permissions (role_id, permission_code)
VALUES
(1, 'ADMIN_G_DEPARTMENT'),
(1, 'ADMIN_C_DEPARTMENT_VIEW'),
(1, 'ADMIN_G_ROLE'),
(1, 'ADMIN_C_ROLE_VIEW'),
(1, 'ADMIN_G_USER'),
(1, 'ADMIN_C_USER_VIEW')
ON CONFLICT DO NOTHING;
