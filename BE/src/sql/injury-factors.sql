-- ============================================
-- Bảng: injury_factors (Yếu tố chấn thương)
-- ============================================

CREATE TABLE IF NOT EXISTS injury_factors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELETE FROM injury_factors WHERE code LIKE 'Mã %';

INSERT INTO injury_factors (code, name, status) VALUES
('YT_01', 'Điện', true),
('YT_02', 'Phóng xạ', true),
('YT_03', 'Thiết bị áp lực', true),
('YT_04', 'Thiết bị nâng', true),
('YT_05', 'Bộ phận truyền động, chuyển động của máy, thiết bị gây cán, cuốn, đè, ép, kẹp, cắt, va đập,...', true),
('YT_06', 'Vật văng bắn', true),
('YT_07', 'Vật rơi, đổ, sập', true),
('YT_08', 'Sập đổ công trình, giàn giáo', true),
('YT_09', 'Sập lò, sập đất đá', true)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name;
