CREATE TABLE IF NOT EXISTS injury_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,    
    name VARCHAR(500) NOT NULL,          
    level INT DEFAULT 1,
    status BOOLEAN DEFAULT TRUE,         
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

ALTER TABLE injury_types ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Clear old table data and seed
TRUNCATE TABLE injury_types RESTART IDENTITY CASCADE;

-- Seed data: 3 level 1 parents and 11 level 2 child categories
INSERT INTO injury_types (code, name, level, status) VALUES
('1', 'Đầu, mặt, cổ', 1, true),
('11', 'Chấn thương sọ não', 2, true),
('12', 'Tổn thương mắt / Mất thị lực', 2, true),
('2', 'Thân và tứ chi', 1, true),
('21', 'Gãy xương (tay, chân, sườn...)', 2, true),
('22', 'Cắt cụt / Mất bộ phận cơ thể', 2, true),
('23', 'Chấn thương cột sống', 2, true),
('24', 'Tổn thương phần mềm (Rách da, bầm dập)', 2, true),
('25', 'Chấn thương cơ quan nội tạng', 2, true),
('3', 'Các loại chấn thương khác', 1, true),
('31', 'Bỏng nhiệt / Bỏng hóa chất', 2, true),
('32', 'Ngạt thở / Ngộ độc khí', 2, true),
('33', 'Điện giật', 2, true),
('34', 'Loại chấn thương khác', 2, true);
