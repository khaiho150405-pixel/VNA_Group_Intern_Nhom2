insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('150', 'Doanh nghiệp tư nhân', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('120', 'Công ty TNHH', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('140', 'Công ty hợp danh', 'INACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('110', 'Doanh nghiệp nhà nước', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('160', 'Công ty trách nhiệm hữu hạn (TNHH) 1 thành viên', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('170', 'Công ty TNHH 2 thành viên trở lên', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('180', 'Công ty cổ phần (CTCP)', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('190', 'Doanh nghiệp tư nhân (DNTN)', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;

insert into loai_hinh_kinh_doanh (ma_loai_hinh, ten_loai_hinh, trang_thai)
values ('200', 'Công ty hợp danh', 'ACTIVE')ON CONFLICT (ma_loai_hinh) DO UPDATE SET ten_loai_hinh = EXCLUDED.ten_loai_hinh, trang_thai = EXCLUDED.trang_thai;
