insert into roles (id, role, name )
values (1, 'employee', 'Nhân viên');

insert into roles (id, role, name )
values (2, 'expert', 'Chuyên viên');

insert into roles (id, role, name )
values (3, 'leader', 'Lãnh đạo');

insert into roles (id, role, name )
values (4, 'superAdmin', 'Quản trị viên');

SELECT setval('roles_id_seq', 4);