-- 1. Дозаполняем socket для CPU и MOTHERBOARD, если где-то осталось NULL
UPDATE components
SET socket = CASE
                 WHEN name ILIKE '%AM5%' OR short_spec ILIKE '%AM5%' OR name ~* 'Ryzen\s+[579]\s+[789]\d{3}|B650|X670|A620' THEN 'AM5'
    WHEN name ILIKE '%AM4%' OR short_spec ILIKE '%AM4%' OR name ~* 'Ryzen\s+[3579]\s+[345]\d{3}|B450|B550|A520|X570' THEN 'AM4'
    WHEN name ILIKE '%1700%' OR short_spec ILIKE '%1700%' OR name ~* 'i[3579]-1[234]\d{3}|B660|B760|Z690|Z790|H610' THEN 'LGA1700'
    WHEN name ILIKE '%1200%' OR short_spec ILIKE '%1200%' OR name ~* 'i[3579]-1[01]\d{3}|B460|B560|H510' THEN 'LGA1200'
    ELSE socket
END
WHERE socket IS NULL
  AND category IN ('CPU', 'MOTHERBOARD');

-- 2. Дозаполняем memory_type (DDR4 / DDR5) для CPU, MOTHERBOARD и RAM
UPDATE components
SET memory_type = CASE
                      WHEN name ILIKE '%DDR5%' OR short_spec ILIKE '%DDR5%' OR socket = 'AM5' THEN 'DDR5'
    WHEN name ILIKE '%DDR4%' OR short_spec ILIKE '%DDR4%' OR socket IN ('AM4', 'LGA1200') THEN 'DDR4'
    WHEN socket = 'LGA1700' THEN 'DDR5'
    ELSE memory_type
END
WHERE memory_type IS NULL
  AND category IN ('CPU', 'MOTHERBOARD', 'RAM');

-- 3. Дозаполняем tdp_watts для CPU, GPU и PSU, если не заполнено
UPDATE components
SET tdp_watts = COALESCE(
        NULLIF(substring(COALESCE(short_spec, name) FROM '(\d{2,4})\s*[WwВв]'), '')::INT,
        CASE category
            WHEN 'CPU' THEN 65
            WHEN 'GPU' THEN 180
            WHEN 'PSU' THEN 650
            END
                )
WHERE tdp_watts IS NULL
  AND category IN ('CPU', 'GPU', 'PSU');

-- 4. Дозаполняем form_factor для MOTHERBOARD, CASE и PSU
UPDATE components
SET form_factor = CASE
                      WHEN name ILIKE '%Mini-ITX%' OR short_spec ILIKE '%Mini-ITX%' OR name ILIKE '%ITX%' THEN 'Mini-ITX'
    WHEN name ILIKE '%Micro-ATX%' OR short_spec ILIKE '%mATX%' OR name ~* '[BHA]\d{3}M' THEN 'mATX'
    WHEN name ILIKE '%SFX%' OR short_spec ILIKE '%SFX%' THEN 'SFX'
    ELSE 'ATX'
END
WHERE form_factor IS NULL
  AND category IN ('MOTHERBOARD', 'CASE', 'PSU');

-- 5. Композитные индексы для быстрого поиска совместимых аналогов и фильтрации по наличию
CREATE INDEX IF NOT EXISTS idx_components_compat_search
    ON components (category, socket, memory_type, price_uah);

CREATE INDEX IF NOT EXISTS idx_components_category_in_stock
    ON components (category, in_stock);