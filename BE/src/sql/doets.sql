INSERT INTO doets (id, name, "parentId", address, quarter, ward, district, province, domain, tax_code, email)
VALUES (1, 'Công ty TNHH Giải pháp Phần mềm VNA', null, '123 Cách Mạng Tháng 8', 'Quận 3', '{"key": 1, "value": "Phường 5"}', '{"key": 1, "value": "Quận 3"}', '{"key": 2, "value": "TPHCM"}', 'vna.rcp.com.vn', '0101234567', 'contact@vna.com.vn')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, tax_code = EXCLUDED.tax_code, email = EXCLUDED.email;

INSERT INTO doets (id, name, "parentId", address, quarter, ward, district, province, domain, tax_code, email)
VALUES (2, 'Tổng Công ty Tân Cảng Sài Gòn', null, '722 Điện Biên Phủ', 'Bình Thạnh', '{"key": 2, "value": "Phường 22"}', '{"key": 2, "value": "Bình Thạnh"}', '{"key": 2, "value": "TPHCM"}', 'tancang.rcp.com.vn', '0107654321', 'info@saigonnewport.com.vn')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, tax_code = EXCLUDED.tax_code, email = EXCLUDED.email;

SELECT setval('doets_id_seq', (SELECT MAX(id) FROM doets));
