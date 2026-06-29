CREATE TABLE IF NOT EXISTS occupation (
    id SERIAL PRIMARY KEY,
    ma_nghe VARCHAR(50) UNIQUE NOT NULL,
    ten_nghe VARCHAR(255) NOT NULL,
    cap INT NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE'
);

-- Seed values with clean names (no hardcoded dashes)
INSERT INTO occupation (id, ma_nghe, ten_nghe, cap, trang_thai)
VALUES
(1, '1', 'Nhà lãnh đạo trong các ngành, các cấp và các đơn vị', 1, 'ACTIVE'),
(2, '11', 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương và địa phương ...', 2, 'ACTIVE'),
(3, '111', 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương', 3, 'ACTIVE'),
(4, '1111', 'Trưởng ban, Phó Trưởng ban và tương đương trở lên thuộc cấp Trung ương', 4, 'ACTIVE')
ON CONFLICT (ma_nghe) DO UPDATE SET ten_nghe = EXCLUDED.ten_nghe, cap = EXCLUDED.cap, trang_thai = EXCLUDED.trang_thai;

SELECT setval('occupation_id_seq', (SELECT MAX(id) FROM occupation));
