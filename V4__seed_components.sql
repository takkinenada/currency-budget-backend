-- ДЕМО-ДАНІ. Назви моделей реальні, але ціни (грн) і бали продуктивності/технологій умовні.
-- Пізніше їх замінить імпорт актуальних цін з магазинів (Rozetka, Comfy тощо).
-- Стовпці: type, name, vendor, manufacturer, price_uah, socket, memory_type, form_factor,
--          power_watts, performance_score, tech_score

INSERT INTO components
    (type, name, vendor, manufacturer, price_uah, socket, memory_type, form_factor, power_watts, performance_score, tech_score)
VALUES
-- Процесори
('CPU', 'AMD Ryzen 5 5600',        'AMD',   'AMD',   5200,  'AM4',     NULL, NULL,  65, 52, 30),
('CPU', 'AMD Ryzen 5 7600',        'AMD',   'AMD',   8200,  'AM5',     NULL, NULL,  65, 66, 70),
('CPU', 'AMD Ryzen 5 9600X',       'AMD',   'AMD',   9800,  'AM5',     NULL, NULL,  65, 72, 78),
('CPU', 'AMD Ryzen 7 7800X3D',     'AMD',   'AMD',   17500, 'AM5',     NULL, NULL, 120, 90, 75),
('CPU', 'Intel Core i5-12400F',    'INTEL', 'Intel', 5600,  'LGA1700', NULL, NULL,  65, 55, 40),
('CPU', 'Intel Core i5-13400F',    'INTEL', 'Intel', 7400,  'LGA1700', NULL, NULL,  65, 62, 45),
('CPU', 'Intel Core i5-14600KF',   'INTEL', 'Intel', 11500, 'LGA1700', NULL, NULL, 125, 80, 55),
('CPU', 'Intel Core i7-14700K',    'INTEL', 'Intel', 16500, 'LGA1700', NULL, NULL, 125, 88, 58),

-- Відеокарти
('GPU', 'MSI GeForce RTX 4060 VENTUS 2X',        'NVIDIA', 'MSI',      13500, NULL, NULL, NULL, 115, 40, 78),
('GPU', 'ASUS Dual GeForce RTX 4060',            'NVIDIA', 'ASUS',     13800, NULL, NULL, NULL, 115, 40, 78),
('GPU', 'Gigabyte GeForce RTX 4060 Ti EAGLE',    'NVIDIA', 'Gigabyte', 18500, NULL, NULL, NULL, 160, 50, 80),
('GPU', 'MSI GeForce RTX 4070 SUPER VENTUS 2X',  'NVIDIA', 'MSI',      33000, NULL, NULL, NULL, 220, 72, 90),
('GPU', 'Gigabyte GeForce RTX 5070 WINDFORCE',   'NVIDIA', 'Gigabyte', 36000, NULL, NULL, NULL, 250, 78, 96),
('GPU', 'MSI Radeon RX 7600 MECH 2X',            'AMD',    'MSI',      10500, NULL, NULL, NULL, 165, 38, 62),
('GPU', 'Gigabyte Radeon RX 7700 XT GAMING OC',  'AMD',    'Gigabyte', 20500, NULL, NULL, NULL, 245, 58, 68),
('GPU', 'MSI Radeon RX 7800 XT GAMING TRIO',     'AMD',    'MSI',      26500, NULL, NULL, NULL, 263, 68, 72),
('GPU', 'Gigabyte Radeon RX 9070 XT GAMING OC',  'AMD',    'Gigabyte', 38500, NULL, NULL, NULL, 304, 88, 88),

-- Материнські плати
('MOTHERBOARD', 'MSI B550-A PRO',                 NULL, 'MSI',      4800,  'AM4',     'DDR4', 'ATX',  NULL, 0, 35),
('MOTHERBOARD', 'Gigabyte B550M DS3H',            NULL, 'Gigabyte', 3800,  'AM4',     'DDR4', 'MATX', NULL, 0, 30),
('MOTHERBOARD', 'MSI PRO B650M-P',                NULL, 'MSI',      5600,  'AM5',     'DDR5', 'MATX', NULL, 0, 65),
('MOTHERBOARD', 'Gigabyte B650 EAGLE AX',         NULL, 'Gigabyte', 7200,  'AM5',     'DDR5', 'ATX',  NULL, 0, 80),
('MOTHERBOARD', 'MSI MAG X670E TOMAHAWK WIFI',    NULL, 'MSI',      13500, 'AM5',     'DDR5', 'ATX',  NULL, 0, 95),
('MOTHERBOARD', 'ASUS PRIME B650M-A',             NULL, 'ASUS',     5800,  'AM5',     'DDR5', 'MATX', NULL, 0, 65),
('MOTHERBOARD', 'MSI PRO B760M-P DDR4',           NULL, 'MSI',      4200,  'LGA1700', 'DDR4', 'MATX', NULL, 0, 35),
('MOTHERBOARD', 'Gigabyte B760M GAMING X AX',     NULL, 'Gigabyte', 6200,  'LGA1700', 'DDR5', 'MATX', NULL, 0, 60),
('MOTHERBOARD', 'MSI MAG Z790 TOMAHAWK WIFI',     NULL, 'MSI',      12500, 'LGA1700', 'DDR5', 'ATX',  NULL, 0, 90),

-- Оперативна пам'ять
('RAM', 'Kingston FURY Beast 16GB DDR4-3200',  NULL, 'Kingston', 1500, NULL, 'DDR4', NULL, NULL, 0, 40),
('RAM', 'Corsair Vengeance 32GB DDR4-3600',    NULL, 'Corsair',  2800, NULL, 'DDR4', NULL, NULL, 0, 45),
('RAM', 'Patriot Viper 16GB DDR5-5200',        NULL, 'Patriot',  2100, NULL, 'DDR5', NULL, NULL, 0, 70),
('RAM', 'Kingston FURY Beast 16GB DDR5-5600',  NULL, 'Kingston', 2400, NULL, 'DDR5', NULL, NULL, 0, 75),
('RAM', 'Corsair Vengeance 32GB DDR5-6000',    NULL, 'Corsair',  4800, NULL, 'DDR5', NULL, NULL, 0, 90),
('RAM', 'G.Skill Trident Z5 32GB DDR5-6400',   NULL, 'G.Skill',  6200, NULL, 'DDR5', NULL, NULL, 0, 100),

-- SSD
('SSD', 'Kingston NV2 500GB NVMe',      NULL, 'Kingston', 1300, NULL, NULL, NULL, NULL, 40, 40),
('SSD', 'WD Blue SN580 1TB NVMe',       NULL, 'WD',       2600, NULL, NULL, NULL, NULL, 60, 70),
('SSD', 'Samsung 990 PRO 1TB NVMe',     NULL, 'Samsung',  4800, NULL, NULL, NULL, NULL, 80, 75),
('SSD', 'Kingston KC3000 2TB NVMe',     NULL, 'Kingston', 7500, NULL, NULL, NULL, NULL, 85, 75),
('SSD', 'Crucial T700 1TB PCIe 5.0',    NULL, 'Crucial',  8500, NULL, NULL, NULL, NULL, 95, 100),

-- Блоки живлення (power_watts = потужність БЖ)
('PSU', 'DeepCool PK550D 550W',      NULL, 'DeepCool', 1900, NULL, NULL, NULL,  550, 0, 0),
('PSU', 'MSI MAG A650BN 650W',       NULL, 'MSI',      2300, NULL, NULL, NULL,  650, 0, 0),
('PSU', 'Gigabyte P750GM 750W',      NULL, 'Gigabyte', 3500, NULL, NULL, NULL,  750, 0, 0),
('PSU', 'MSI MAG A850GL 850W',       NULL, 'MSI',      4900, NULL, NULL, NULL,  850, 0, 0),
('PSU', 'Corsair RM1000x 1000W',     NULL, 'Corsair',  7500, NULL, NULL, NULL, 1000, 0, 0),

-- Корпуси (form_factor = максимальний типорозмір плати)
('CASE', 'DeepCool MATREXX 40 (mATX)',  NULL, 'DeepCool', 1500, NULL, NULL, 'MATX', NULL, 0, 0),
('CASE', 'Zalman T7 (ATX)',             NULL, 'Zalman',   1700, NULL, NULL, 'ATX',  NULL, 0, 0),
('CASE', 'MSI MAG FORGE 100R (ATX)',    NULL, 'MSI',      2300, NULL, NULL, 'ATX',  NULL, 0, 0),
('CASE', 'Gigabyte C200 Glass (ATX)',   NULL, 'Gigabyte', 2500, NULL, NULL, 'ATX',  NULL, 0, 0),
('CASE', 'Lian Li LANCOOL 216 (ATX)',   NULL, 'Lian Li',  4500, NULL, NULL, 'ATX',  NULL, 0, 0);
