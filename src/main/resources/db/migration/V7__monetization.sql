ALTER TABLE components
    ADD COLUMN IF NOT EXISTS sponsored        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS promo_label      VARCHAR(64),
    ADD COLUMN IF NOT EXISTS sponsor_priority INT NOT NULL DEFAULT 0;

UPDATE components
SET sponsored = TRUE,
    promo_label = 'Реклама',
    sponsor_priority = 10
WHERE id IN (SELECT id FROM components ORDER BY id LIMIT 3);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id           BIGSERIAL PRIMARY KEY,
    component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    store_name   VARCHAR(32),
    target_url   VARCHAR(1024) NOT NULL,
    clicked_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_component
    ON affiliate_clicks(component_id);