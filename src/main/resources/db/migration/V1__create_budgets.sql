CREATE TABLE budgets (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120)   NOT NULL,
    amount      NUMERIC(19, 2) NOT NULL CHECK (amount >= 0),
    currency    VARCHAR(3)     NOT NULL CHECK (currency IN ('UAH', 'USD', 'EUR')),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
