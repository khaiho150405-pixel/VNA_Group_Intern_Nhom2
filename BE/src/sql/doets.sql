INSERT INTO doets (id, name, "parentId", address, quarter, ward, district, province, domain, tax_code, email, loai_hinh_id, business_line_id, "createdAt", "updatedAt")
VALUES (1, 'Công ty TNHH Giải pháp Phần mềm VNA', null, '123 Cách Mạng Tháng 8', 'Quận 3', '{"key": "14048", "value": "Phường Bình Thạnh"}', null, '{"key": "13986", "value": "Thành phố Hồ Chí Minh"}', 'vna.rcp.com.vn', '0101234567', 'company@example.com', 2, 24, '2022-01-01', '2022-01-01')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, tax_code = EXCLUDED.tax_code, email = EXCLUDED.email, loai_hinh_id = EXCLUDED.loai_hinh_id, business_line_id = EXCLUDED.business_line_id, province = EXCLUDED.province, ward = EXCLUDED.ward, district = EXCLUDED.district, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO doets (id, name, "parentId", address, quarter, ward, district, province, domain, tax_code, email, loai_hinh_id, business_line_id, "createdAt", "updatedAt")
VALUES (2, 'Tổng Công ty Tân Cảng Sài Gòn', null, '722 Điện Biên Phủ', 'Bình Thạnh', '{"key": "14042", "value": "Phường An Hội Tây"}', null, '{"key": "13986", "value": "Thành phố Hồ Chí Minh"}', 'tancang.rcp.com.vn', '0107654321', 'tancang@example.com', 4, 24, '2022-01-01', '2022-01-01')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, tax_code = EXCLUDED.tax_code, email = EXCLUDED.email, loai_hinh_id = EXCLUDED.loai_hinh_id, business_line_id = EXCLUDED.business_line_id, province = EXCLUDED.province, ward = EXCLUDED.ward, district = EXCLUDED.district, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt";

SELECT setval('doets_id_seq', (SELECT MAX(id) FROM doets));
