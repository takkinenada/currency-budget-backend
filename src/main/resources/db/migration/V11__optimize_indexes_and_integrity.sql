-- 1. Видалення можливих дублікатів у каталозі components (залишаємо запис із найменшим id)
DELETE FROM components c
    USING components dup
WHERE c.id > dup.id
  AND c.category = dup.category
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(dup.name));

-- Унікальний індекс для гарантії відсутності дублікатів у каталозі надалі
CREATE UNIQUE INDEX IF NOT EXISTS uq_components_category_name
    ON components (category, LOWER(TRIM(name)));

-- 2. Складений індекс на таблицю components (category, brand, price_uah) для швидкої фільтрації конфігурацій
CREATE INDEX IF NOT EXISTS idx_components_category_brand_price
    ON components (category, brand, price_uah);

-- Індекс для миттєвої вибірки спонсорських комплектуючих за пріоритетом
CREATE INDEX IF NOT EXISTS idx_components_sponsored_priority
    ON components (sponsored, sponsor_priority DESC)
    WHERE sponsored = TRUE;

-- 3. Індекс для таблиці component_offers (component_id, in_stock, price_uah)
CREATE INDEX IF NOT EXISTS idx_component_offers_comp_instock_price
    ON component_offers (component_id, in_stock, price_uah);

-- 4. Індекс для таблиці affiliate_clicks (component_id, clicked_at)
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_comp_clicked
    ON affiliate_clicks (component_id, clicked_at DESC);

-- 5. Перевірка цілісності зовнішніх ключів (Foreign Keys) та відсутності "битих" записів
DO $$
DECLARE
orphan_offers BIGINT;
    orphan_clicks BIGINT;
BEGIN
SELECT COUNT(*) INTO orphan_offers
FROM component_offers o
         LEFT JOIN components c ON c.id = o.component_id
WHERE c.id IS NULL;

SELECT COUNT(*) INTO orphan_clicks
FROM affiliate_clicks a
         LEFT JOIN components c ON c.id = a.component_id
WHERE c.id IS NULL;

IF orphan_offers > 0 OR orphan_clicks > 0 THEN
        RAISE EXCEPTION 'Порушення цілісності зовнішніх ключів: orphan_offers=%, orphan_clicks=%', orphan_offers, orphan_clicks;
END IF;
END $$;

-- 6. Оновлення статистики планувальника запитів PostgreSQL для використання нових індексів
ANALYZE components;
ANALYZE component_offers;
ANALYZE affiliate_clicks;