CREATE TABLE IF NOT EXISTS injury_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,    
    name VARCHAR(500) NOT NULL,          
    level INT DEFAULT 1,
    status BOOLEAN DEFAULT TRUE,         
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

-- Thêm cột level nếu bảng đã tồn tại trước đó
ALTER TABLE injury_types ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Cập nhật lại dữ liệu theo phân cấp
INSERT INTO injury_types (code, name, level, status) VALUES
('1', 'Đầu, mặt, cổ', 1, true),
('11', '----- Các chấn thương sọ não hở hoặc kín', 2, true),
('110', '---------- Bị thương vào cổ, tác hại đến thanh quản...', 3, true),
('2', 'Thân và tứ chi', 1, true),
('21', '----- Gãy xương, chấn thương cột sống', 2, true),
('210', '---------- Gãy xương tay, chân', 3, true),
('3', 'Các loại chấn thương khác', 1, true),
('31', '----- Bỏng nhiệt / Bỏng hóa chất', 2, true),
('32', '----- Điện giật', 2, true),
('33', '----- Ngạt thở / Ngộ độc khí', 2, true)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level;
