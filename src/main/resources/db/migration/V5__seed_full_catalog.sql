INSERT INTO components (
    category, name, short_spec, brand, price_uah,
    socket, memory_type, tdp_watts, form_factor, length_mm,
    has_dlss, has_fsr, has_ray_tracing, has_pcie5,
    gaming_score, work_score, tech_score, shop_url, is_promo
) VALUES
-- CPU (+12 моделей, всего в базе станет 18)
('CPU', 'Intel Core i3-12100F', 'Core i3-12100F • 4 ядра', 'Intel', 2900.00, 'LGA1700', 'DDR4', 58, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 5 5500', 'Ryzen 5 5500 • 6 ядер', 'AMD', 3400.00, 'AM4', 'DDR4', 65, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 6, 6, 5, 'https://hotline.ua', FALSE),
('CPU', 'Intel Core i5-13400F', 'Core i5-13400F • 10 ядер', 'Intel', 6500.00, 'LGA1700', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 7, 8, 7, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 7 5700X3D', 'Ryzen 7 5700X3D • 8 ядер', 'AMD', 8200.00, 'AM4', 'DDR4', 105, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 9, 7, 6, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 7 7700', 'Ryzen 7 7700 • 8 ядер', 'AMD', 9800.00, 'AM5', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 8, 8, 'https://hotline.ua', FALSE),
('CPU', 'Intel Core i5-14600KF', 'Core i5-14600KF • 14 ядер', 'Intel', 10800.00, 'LGA1700', 'DDR5', 125, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 8, 'https://hotline.ua', FALSE),
('CPU', 'Intel Core Ultra 5 245KF', 'Core Ultra 5 245KF • 14 ядер', 'Intel', 12900.00, 'LGA1851', 'DDR5', 125, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 9, 9, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 7 9700X', 'Ryzen 7 9700X • 8 ядер', 'AMD', 13400.00, 'AM5', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 9, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 7 7800X3D', 'Ryzen 7 7800X3D • 8 ядер', 'AMD', 16500.00, 'AM5', 'DDR5', 120, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 10, 8, 9, 'https://hotline.ua', TRUE),
('CPU', 'Intel Core Ultra 7 265KF', 'Core Ultra 7 265KF • 20 ядер', 'Intel', 17800.00, 'LGA1851', 'DDR5', 125, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 10, 10, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 9 9900X', 'Ryzen 9 9900X • 12 ядер', 'AMD', 18900.00, 'AM5', 'DDR5', 120, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 10, 10, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 7 9800X3D', 'Ryzen 7 9800X3D • 8 ядер', 'AMD', 21500.00, 'AM5', 'DDR5', 120, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 10, 9, 10, 'https://hotline.ua', TRUE),

-- GPU (+11 моделей, всего в базе станет 17)
('GPU', 'GeForce RTX 3050 6 ГБ', 'RTX 3050 • 6 ГБ', 'NVIDIA', 5800.00, NULL, NULL, 70, NULL, 200, TRUE, FALSE, TRUE, FALSE, 5, 5, 6, 'https://hotline.ua', FALSE),
('GPU', 'Intel Arc B570 10 ГБ', 'Arc B570 • 10 ГБ', 'Intel', 10200.00, NULL, NULL, 150, NULL, 250, FALSE, FALSE, TRUE, FALSE, 6, 6, 7, 'https://hotline.ua', FALSE),
('GPU', 'Radeon RX 7600 8 ГБ', 'RX 7600 • 8 ГБ', 'AMD', 10900.00, NULL, NULL, 165, NULL, 240, FALSE, TRUE, TRUE, FALSE, 7, 6, 6, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 5060 8 ГБ', 'RTX 5060 • 8 ГБ', 'NVIDIA', 14500.00, NULL, NULL, 145, NULL, 242, TRUE, FALSE, TRUE, TRUE, 7, 7, 9, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 4060 Ti 8 ГБ', 'RTX 4060 Ti • 8 ГБ', 'NVIDIA', 15800.00, NULL, NULL, 160, NULL, 250, TRUE, FALSE, TRUE, FALSE, 8, 7, 8, 'https://hotline.ua', FALSE),
('GPU', 'Radeon RX 7800 XT 16 ГБ', 'RX 7800 XT • 16 ГБ', 'AMD', 20500.00, NULL, NULL, 263, NULL, 300, FALSE, TRUE, TRUE, FALSE, 9, 8, 8, 'https://hotline.ua', FALSE),
('GPU', 'Radeon RX 9070 16 ГБ', 'RX 9070 • 16 ГБ', 'AMD', 24800.00, NULL, NULL, 220, NULL, 290, FALSE, TRUE, TRUE, TRUE, 9, 8, 9, 'https://hotline.ua', FALSE),
('GPU', 'Radeon RX 9070 XT 16 ГБ', 'RX 9070 XT • 16 ГБ', 'AMD', 29500.00, NULL, NULL, 304, NULL, 320, FALSE, TRUE, TRUE, TRUE, 10, 9, 9, 'https://hotline.ua', TRUE),
('GPU', 'GeForce RTX 5070 Ti 16 ГБ', 'RTX 5070 Ti • 16 ГБ', 'NVIDIA', 34900.00, NULL, NULL, 300, NULL, 315, TRUE, FALSE, TRUE, TRUE, 10, 9, 10, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 5080 16 ГБ', 'RTX 5080 • 16 ГБ', 'NVIDIA', 48500.00, NULL, NULL, 360, NULL, 336, TRUE, FALSE, TRUE, TRUE, 10, 10, 10, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 5090 32 ГБ', 'RTX 5090 • 32 ГБ', 'NVIDIA', 98000.00, NULL, NULL, 575, NULL, 355, TRUE, FALSE, TRUE, TRUE, 10, 10, 10, 'https://hotline.ua', TRUE),

-- RAM (+4 модели для бюджетного и топового сегментов)
('RAM', '16 ГБ (2x8) DDR4-3200', '16 ГБ DDR4', 'Kingston', 1100.00, NULL, 'DDR4', 6, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('RAM', '32 ГБ (2x16) DDR4-3600', '32 ГБ DDR4', 'Kingston', 2400.00, NULL, 'DDR4', 8, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 7, 7, 6, 'https://hotline.ua', FALSE),
('RAM', '32 ГБ (2x16) DDR5-6400', '32 ГБ DDR5', 'Kingston', 4200.00, NULL, 'DDR5', 10, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 9, 9, 9, 'https://hotline.ua', FALSE),
('RAM', '64 ГБ (2x32) DDR5-6000', '64 ГБ DDR5', 'Kingston', 7600.00, NULL, 'DDR5', 12, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 9, 10, 10, 'https://hotline.ua', FALSE),

-- SSD (+3 модели от бюджетного 500 ГБ до топового Gen5)
('SSD', '500 ГБ NVMe Gen3', '500 ГБ NVMe Gen3', 'Kingston', 950.00, NULL, NULL, 3, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('SSD', '2 ТБ NVMe Gen4', '2 ТБ NVMe Gen4', 'Kingston', 4600.00, NULL, NULL, 6, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 9, 9, 9, 'https://hotline.ua', FALSE),
('SSD', '2 ТБ NVMe Gen5', '2 ТБ NVMe Gen5', 'MSI', 7900.00, NULL, NULL, 9, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 10, 10, 'https://hotline.ua', FALSE),

-- MOTHERBOARD (+6 плат для всех сокетов и ценовых сегментов)
('MOTHERBOARD', 'H610M-K DDR4', 'H610M DDR4', 'Gigabyte', 2450.00, 'LGA1700', 'DDR4', 20, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'A520M', 'A520M', 'MSI', 2300.00, 'AM4', 'DDR4', 20, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'B760M DDR4', 'B760M DDR4', 'MSI', 3600.00, 'LGA1700', 'DDR4', 25, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 7, 7, 6, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'Z790 ATX Wi-Fi', 'Z790 Wi-Fi', 'MSI', 7800.00, 'LGA1700', 'DDR5', 35, 'ATX', NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 9, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'X870 ATX Wi-Fi', 'X870 Wi-Fi', 'Gigabyte', 8900.00, 'AM5', 'DDR5', 35, 'ATX', NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 10, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'Z890 ATX Wi-Fi', 'Z890 Wi-Fi', 'MSI', 9500.00, 'LGA1851', 'DDR5', 35, 'ATX', NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 10, 'https://hotline.ua', FALSE),

-- PSU (+4 блока питания от 500 Вт до 1000 Вт ATX 3.1)
('PSU', '500 Вт 80+ Bronze', '500 Вт Bronze', 'Gigabyte', 1100.00, NULL, NULL, 500, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('PSU', '750 Вт 80+ Gold ATX 3.1', '750 Вт Gold', 'MSI', 3600.00, NULL, NULL, 750, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 8, 9, 'https://hotline.ua', FALSE),
('PSU', '850 Вт 80+ Gold ATX 3.1', '850 Вт Gold', 'MSI', 4400.00, NULL, NULL, 850, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 9, 9, 'https://hotline.ua', FALSE),
('PSU', '1000 Вт 80+ Platinum ATX 3.1', '1000 Вт Platinum', 'MSI', 6800.00, NULL, NULL, 1000, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 10, 10, 10, 'https://hotline.ua', FALSE),

-- CASE (+3 корпуса от бюджетного Mini-Tower до просторного Full-Tower под RTX 5090)
('CASE', 'Mini-Tower Basic', 'Mini-Tower', 'Gigabyte', 700.00, NULL, NULL, 0, 'Micro-ATX', 300, FALSE, FALSE, FALSE, FALSE, 5, 5, 5, 'https://hotline.ua', FALSE),
('CASE', 'Mid-Tower Airflow, 4 вент.', 'Mid-Tower', 'MSI', 2850.00, NULL, NULL, 0, 'ATX', 365, FALSE, FALSE, FALSE, FALSE, 8, 8, 8, 'https://hotline.ua', FALSE),
('CASE', 'Full-Tower Mesh, 4 вент.', 'Full-Tower', 'MSI', 4500.00, NULL, NULL, 0, 'ATX', 410, FALSE, FALSE, FALSE, FALSE, 9, 9, 9, 'https://hotline.ua', FALSE);