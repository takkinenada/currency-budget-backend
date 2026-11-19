INSERT INTO components (
    category, name, short_spec, brand, price_uah,
    socket, memory_type, tdp_watts, form_factor, length_mm,
    has_dlss, has_fsr, has_ray_tracing, has_pcie5,
    gaming_score, work_score, tech_score, shop_url, is_promo
) VALUES
('CPU', 'AMD Ryzen 5 7500F', 'Ryzen 5 7500F • 6 ядер', 'AMD', 5200.00, 'AM5', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 7, 8, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 5 7600', 'Ryzen 5 7600 • 6 ядер', 'AMD', 6890.00, 'AM5', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 7, 8, 'https://hotline.ua', FALSE),
('CPU', 'AMD Ryzen 5 9600X', 'Ryzen 5 9600X • 6 ядер', 'AMD', 8900.00, 'AM5', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 9, 8, 9, 'https://hotline.ua', TRUE),
('CPU', 'AMD Ryzen 5 5600', 'Ryzen 5 5600 • 6 ядер', 'AMD', 4100.00, 'AM4', 'DDR4', 65, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 7, 6, 5, 'https://hotline.ua', FALSE),
('CPU', 'Intel Core i5-12400F', 'Core i5-12400F • 6 ядер', 'Intel', 4600.00, 'LGA1700', 'DDR4', 65, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 7, 7, 6, 'https://hotline.ua', FALSE),
('CPU', 'Intel Core i5-14400F', 'Core i5-14400F • 10 ядер', 'Intel', 7400.00, 'LGA1700', 'DDR5', 65, NULL, NULL, FALSE, FALSE, FALSE, TRUE, 8, 8, 8, 'https://hotline.ua', FALSE),

('GPU', 'Radeon RX 7700 XT 12 ГБ', 'RX 7700 XT • 12 ГБ', 'AMD', 15400.00, NULL, NULL, 245, NULL, 280, FALSE, TRUE, TRUE, FALSE, 8, 7, 7, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 5070 12 ГБ', 'RTX 5070 • 12 ГБ', 'NVIDIA', 22900.00, NULL, NULL, 250, NULL, 305, TRUE, FALSE, TRUE, TRUE, 10, 9, 10, 'https://hotline.ua', TRUE),
('GPU', 'GeForce RTX 5060 Ti 16 ГБ', 'RTX 5060 Ti • 16 ГБ', 'NVIDIA', 17200.00, NULL, NULL, 180, NULL, 260, TRUE, FALSE, TRUE, TRUE, 8, 8, 9, 'https://hotline.ua', FALSE),
('GPU', 'GeForce RTX 4060 8 ГБ', 'RTX 4060 • 8 ГБ', 'NVIDIA', 12500.00, NULL, NULL, 115, NULL, 240, TRUE, FALSE, TRUE, FALSE, 7, 7, 8, 'https://hotline.ua', FALSE),
('GPU', 'Radeon RX 6600 8 ГБ', 'RX 6600 • 8 ГБ', 'AMD', 8500.00, NULL, NULL, 132, NULL, 235, FALSE, TRUE, FALSE, FALSE, 6, 5, 5, 'https://hotline.ua', FALSE),
('GPU', 'Intel Arc B580 12 ГБ', 'Arc B580 • 12 ГБ', 'Intel', 11800.00, NULL, NULL, 190, NULL, 267, FALSE, FALSE, TRUE, FALSE, 7, 7, 7, 'https://hotline.ua', FALSE),

('RAM', '32 ГБ DDR5-6000', '32 ГБ DDR5', 'Kingston', 3650.00, NULL, 'DDR5', 10, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 8, 9, 9, 'https://hotline.ua', FALSE),
('RAM', '16 ГБ DDR5-5600', '16 ГБ DDR5', 'Kingston', 1900.00, NULL, 'DDR5', 8, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 7, 6, 7, 'https://hotline.ua', FALSE),
('RAM', '16 ГБ DDR4-3200', '16 ГБ DDR4', 'Kingston', 1450.00, NULL, 'DDR4', 6, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 6, 6, 5, 'https://hotline.ua', FALSE),

('SSD', '1 ТБ NVMe Gen4', '1 ТБ NVMe Gen4', 'Kingston', 2480.00, NULL, NULL, 5, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 8, 8, 8, 'https://hotline.ua', FALSE),
('SSD', '1 ТБ NVMe Gen3', '1 ТБ NVMe Gen3', 'Kingston', 1950.00, NULL, NULL, 4, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 7, 7, 6, 'https://hotline.ua', FALSE),
('SSD', '512 ГБ NVMe Gen3', '512 ГБ NVMe Gen3', 'Kingston', 1300.00, NULL, NULL, 4, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 6, 5, 5, 'https://hotline.ua', FALSE),

('MOTHERBOARD', 'B650M', 'B650M', 'MSI', 4200.00, 'AM5', 'DDR5', 30, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 8, 8, 8, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'A620M', 'A620M', 'Gigabyte', 3100.00, 'AM5', 'DDR5', 25, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 7, 6, 7, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'B650M Wi-Fi', 'B650M Wi-Fi', 'Gigabyte', 3800.00, 'AM5', 'DDR5', 30, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, TRUE, 8, 8, 9, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'B550M', 'B550M', 'MSI', 3200.00, 'AM4', 'DDR4', 25, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 7, 7, 6, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'B760M DDR5', 'B760M DDR5', 'MSI', 4300.00, 'LGA1700', 'DDR5', 30, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, TRUE, 8, 8, 8, 'https://hotline.ua', FALSE),
('MOTHERBOARD', 'H610M DDR4', 'H610M DDR4', 'Gigabyte', 2800.00, 'LGA1700', 'DDR4', 25, 'Micro-ATX', NULL, FALSE, FALSE, FALSE, FALSE, 6, 6, 5, 'https://hotline.ua', FALSE),

('PSU', '650 Вт 80+ Gold', '650 Вт Gold', 'MSI', 2750.00, NULL, NULL, 650, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 8, 8, 8, 'https://hotline.ua', FALSE),
('PSU', '750 Вт 80+ Bronze', '750 Вт Bronze', 'Gigabyte', 2700.00, NULL, NULL, 750, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 8, 8, 7, 'https://hotline.ua', FALSE),
('PSU', '550 Вт 80+ Bronze', '550 Вт Bronze', 'Gigabyte', 1850.00, NULL, NULL, 550, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 6, 6, 5, 'https://hotline.ua', FALSE),

('CASE', 'Mid-Tower, 3 вент.', 'Mid-Tower', 'MSI', 2100.00, NULL, NULL, 0, 'ATX', 340, FALSE, FALSE, FALSE, FALSE, 8, 8, 8, 'https://hotline.ua', FALSE),
('CASE', 'Mini-Tower', 'Mini-Tower', 'Gigabyte', 1210.00, NULL, NULL, 0, 'Micro-ATX', 310, FALSE, FALSE, FALSE, FALSE, 7, 7, 7, 'https://hotline.ua', FALSE);