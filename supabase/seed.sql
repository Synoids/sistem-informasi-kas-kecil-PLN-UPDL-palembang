-- ==============================================================================
-- SEED DATA: Sistem Informasi Pengelolaan Kas Kecil
-- ==============================================================================
-- Make this script idempotent

-- 1. Categories
INSERT INTO categories (name) VALUES 
('Perkakas, RT Umum & Pengiriman'),
('BBM'),
('E-Toll'),
('Konsumsi'),
('Lain-lain')
ON CONFLICT DO NOTHING;

-- 2. Divisions
INSERT INTO divisions (name) VALUES 
('MAN'),
('PKU'),
('JAR'),
('PMK'),
('K3LHKam'),
('PBJ'),
('INS')
ON CONFLICT DO NOTHING;

-- 3. Cash Sources
-- Main Cash Source doesn't need a fund holder immediately, or it can be null.
INSERT INTO cash_sources (code, name, type) VALUES 
('MAIN', 'Kas Utama', 'MAIN')
ON CONFLICT (code) DO NOTHING;
