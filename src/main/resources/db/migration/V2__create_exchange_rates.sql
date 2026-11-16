CREATE TABLE exchange_rates (
    id           BIGSERIAL PRIMARY KEY,
    currency     VARCHAR(3)      NOT NULL CHECK (currency IN ('USD', 'EUR')),
    rate_to_uah  NUMERIC(19, 6)  NOT NULL CHECK (rate_to_uah > 0),
    rate_date    DATE            NOT NULL,
    fetched_at   TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_rate_currency_date UNIQUE (currency, rate_date)
);

CREATE INDEX idx_exchange_rates_currency_date ON exchange_rates (currency, rate_date DESC);
