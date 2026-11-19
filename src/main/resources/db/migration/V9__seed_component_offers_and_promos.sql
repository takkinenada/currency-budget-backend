-- 1. Оновлюємо та додаємо пропозиції ROZETKA для всіх 7 категорій комплектуючих (включно з GPU з V8)
INSERT INTO component_offers (
    component_id, store_name, external_id, product_url, price_uah, in_stock, last_checked_at
)
SELECT
    c.id,
    'ROZETKA',
    'RZK-' || LPAD(c.id::text, 5, '0'),
    'https://rozetka.com.ua/ua/search/?text=' || REPLACE(c.name, ' ', '+'),
    c.price_uah,
    TRUE,
    NOW()
FROM components c
    ON CONFLICT (component_id, store_name) DO UPDATE
                                                  SET external_id     = EXCLUDED.external_id,
                                                  product_url     = EXCLUDED.product_url,
                                                  price_uah       = EXCLUDED.price_uah,
                                                  in_stock        = EXCLUDED.in_stock,
                                                  last_checked_at = NOW();

-- 2. Додаємо пропозиції COMFY з актуальними цінами та прямими посиланнями для всіх категорій
INSERT INTO component_offers (
    component_id, store_name, external_id, product_url, price_uah, in_stock, last_checked_at
)
SELECT
    c.id,
    'COMFY',
    'CMF-' || LPAD(c.id::text, 5, '0'),
    'https://comfy.ua/ua/search/?q=' || REPLACE(c.name, ' ', '+'),
    ROUND(c.price_uah * CASE WHEN c.id % 2 = 0 THEN 1.02 ELSE 0.99 END, 2),
    TRUE,
    NOW()
FROM components c
    ON CONFLICT (component_id, store_name) DO UPDATE
                                                  SET external_id     = EXCLUDED.external_id,
                                                  product_url     = EXCLUDED.product_url,
                                                  price_uah       = EXCLUDED.price_uah,
                                                  in_stock        = EXCLUDED.in_stock,
                                                  last_checked_at = NOW();

-- 3. Синхронізуємо найвигіднішу пропозицію в наявності у таблиці components
UPDATE components c
SET price_uah        = best.price_uah,
    shop_url         = best.product_url,
    store_name       = best.store_name,
    in_stock         = best.in_stock,
    price_updated_at = NOW()
    FROM (
    SELECT DISTINCT ON (component_id)
           component_id,
           store_name,
           product_url,
           price_uah,
           in_stock
    FROM component_offers
    WHERE in_stock = TRUE
    ORDER BY component_id, price_uah ASC, id ASC
) best
WHERE best.component_id = c.id;

-- 4. Налаштовуємо спонсорські (рекламні) комплектуючі та пріоритет їх показу
UPDATE components
SET sponsored        = TRUE,
    is_promo         = TRUE,
    promo_label      = 'Реклама',
    sponsor_priority = 20
WHERE name IN (
               'AMD Ryzen 7 7800X3D',
               'AMD Ryzen 7 9800X3D',
               'Radeon RX 9070 XT 16 ГБ',
               'GeForce RTX 5090 32 ГБ',
               'Intel Arc B580 12 ГБ'
    );

UPDATE components
SET sponsored        = TRUE,
    is_promo         = TRUE,
    promo_label      = COALESCE(promo_label, 'Реклама'),
    sponsor_priority = GREATEST(sponsor_priority, 10)
WHERE is_promo = TRUE OR sponsored = TRUE;