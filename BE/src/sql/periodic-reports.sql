CREATE TABLE IF NOT EXISTS periodic_reports (
    id SERIAL PRIMARY KEY,
    doet_id VARCHAR(36),
    year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'DANG_BAO_CAO',
    company_name VARCHAR(255),
    company_type_id INT,
    business_line_id INT,
    total_employees INT DEFAULT 0,
    female_employees INT DEFAULT 0,
    total_salary_fund BIGINT DEFAULT 0,
    "tnldSummary" JSONB,
    "tnldTroCapSummary" JSONB,
    report_file_url VARCHAR(255),
    report_file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accident_details (
    id SERIAL PRIMARY KEY,
    report_id INT REFERENCES periodic_reports(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    nguyen_nhan_id INT,
    yeu_to_chan_thuong_id INT,
    nghe_nghiep_id INT,
    stats JSONB
);

-- Dữ liệu mẫu (sẽ dùng cho giao diện test)
INSERT INTO periodic_reports (id, doet_id, year, period, status, company_name, business_line_id, total_employees, female_employees, total_salary_fund, "tnldSummary", "tnldTroCapSummary")
VALUES (
    1, 'testuser', 2022, 'CA_NAM', 'DA_TIEP_NHAN', 
    'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ABC', 1, 10, 5, 10200000,
    '{"tongSoVu": 1, "tongSoVuNguoiChet": 1, "tongSoVu2NguoiTroLen": 1, "tongSoNguoiBiNan": 10, "tongLaoDongNuBiNan": 5, "tongSoNguoiChet": 5, "tongSoNguoiThuongNang": 10, "chiPhiYTe": 10000000, "chiPhiTraLuong": 10000000, "chiPhiBoiThuong": 10000000, "tongNgayNghi": 20, "thietHaiTaiSan": 10000000}',
    '{"tongSoVu": 2, "tongSoVuNguoiChet": 1, "tongSoVu2NguoiTroLen": 1, "tongSoNguoiBiNan": 10, "tongLaoDongNuBiNan": 5, "tongSoNguoiChet": 5, "tongSoNguoiThuongNang": 10, "chiPhiYTe": 10000000, "chiPhiTraLuong": 10000000, "chiPhiBoiThuong": 10000000, "tongNgayNghi": 20, "thietHaiTaiSan": 10000000}'
) ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

INSERT INTO accident_details (id, report_id, report_type, nguyen_nhan_id, yeu_to_chan_thuong_id, nghe_nghiep_id, stats)
VALUES (
    1, 1, 'TAI_NAN_LAO_DONG', 1, 1, 1,
    '{"tongSoVu": 1, "tongSoVuNguoiChet": 1, "tongSoVu2NguoiTroLen": 1, "tongSoNguoiBiNan": 10, "tongLaoDongNuBiNan": 5, "tongSoNguoiChet": 5, "tongSoNguoiThuongNang": 10, "chiPhiYTe": 10000000, "chiPhiTraLuong": 10000000, "chiPhiBoiThuong": 10000000, "tongNgayNghi": 20, "thietHaiTaiSan": 10000000}'
) ON CONFLICT (id) DO NOTHING;

SELECT setval('periodic_reports_id_seq', (SELECT MAX(id) FROM periodic_reports));
SELECT setval('accident_details_id_seq', (SELECT MAX(id) FROM accident_details));
