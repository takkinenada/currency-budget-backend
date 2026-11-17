CREATE TABLE components (
    id                 BIGSERIAL PRIMARY KEY,
    type               VARCHAR(16)    NOT NULL
        CHECK (type IN ('CPU', 'MOTHERBOARD', 'RAM', 'GPU', 'SSD', 'PSU', 'CASE')),
    name               VARCHAR(160)   NOT NULL,
    vendor             VARCHAR(16)    CHECK (vendor IN ('NVIDIA', 'AMD', 'INTEL')),
    manufacturer       VARCHAR(40)    NOT NULL,
    price_uah          NUMERIC(12, 2) NOT NULL CHECK (price_uah > 0),
    socket             VARCHAR(16),
    memory_type        VARCHAR(8)     CHECK (memory_type IN ('DDR4', 'DDR5')),
    form_factor        VARCHAR(8)     CHECK (form_factor IN ('ITX', 'MATX', 'ATX')),
    power_watts        INT,
    performance_score  INT            NOT NULL DEFAULT 0 CHECK (performance_score BETWEEN 0 AND 100),
    tech_score         INT            NOT NULL DEFAULT 0 CHECK (tech_score BETWEEN 0 AND 100),
    in_stock           BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_components_type ON components (type);
