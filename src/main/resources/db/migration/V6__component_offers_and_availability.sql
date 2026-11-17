ALTER TABLE components
    ALTER COLUMN shop_url TYPE VARCHAR(1024);

ALTER TABLE components
    ADD COLUMN IF NOT EXISTS store_name       VARCHAR(32),
    ADD COLUMN IF NOT EXISTS in_stock         BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS component_offers (
    id              BIGSERIAL PRIMARY KEY,
    component_id    BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    store_name      VARCHAR(32) NOT NULL,
    external_id     VARCHAR(128),
    product_url     VARCHAR(1024) NOT NULL,
    price_uah       NUMERIC(19, 2) NOT NULL,
    in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_component_store UNIQUE (component_id, store_name)
);

CREATE INDEX IF NOT EXISTS idx_component_offers_component
    ON component_offers(component_id);

-- Переносимо вже існуючі посилання з V3-V5 у component_offers
INSERT INTO component_offers (component_id, store_name, product_url, price_uah, in_stock, last_checked_at)
SELECT id,
       CASE
           WHEN shop_url ILIKE '%comfy.ua%' THEN 'COMFY'
           WHEN shop_url ILIKE '%telemart.ua%' THEN 'TELEMART'
           ELSE 'ROZETKA'
       END,
       shop_url,
       price_uah,
       TRUE,
       NOW()
FROM components
WHERE shop_url IS NOT NULL AND TRIM(shop_url) <> ''
ON CONFLICT (component_id, store_name) DO NOTHING;

-- Синхронізуємо store_name у самій таблиці components
UPDATE components c
SET store_name = o.store_name
FROM component_offers o
WHERE o.component_id = c.id
  AND c.store_name IS NULL;