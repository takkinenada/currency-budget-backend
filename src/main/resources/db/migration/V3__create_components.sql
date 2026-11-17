CREATE TABLE components (
                            id              BIGSERIAL PRIMARY KEY,
                            category        VARCHAR(20)     NOT NULL CHECK (category IN ('CPU', 'GPU', 'RAM', 'SSD', 'MOTHERBOARD', 'PSU', 'CASE')),
                            name            VARCHAR(150)    NOT NULL,
                            short_spec      VARCHAR(100),
                            brand           VARCHAR(50)     NOT NULL,
                            price_uah       NUMERIC(19, 2)  NOT NULL CHECK (price_uah > 0),
                            socket          VARCHAR(30),
                            memory_type     VARCHAR(10)     CHECK (memory_type IS NULL OR memory_type IN ('DDR4', 'DDR5')),
                            tdp_watts       INTEGER         CHECK (tdp_watts IS NULL OR tdp_watts >= 0),
                            form_factor     VARCHAR(30),
                            length_mm       INTEGER         CHECK (length_mm IS NULL OR length_mm > 0),
                            has_dlss        BOOLEAN         NOT NULL DEFAULT FALSE,
                            has_fsr         BOOLEAN         NOT NULL DEFAULT FALSE,
                            has_ray_tracing BOOLEAN         NOT NULL DEFAULT FALSE,
                            has_pcie5       BOOLEAN         NOT NULL DEFAULT FALSE,
                            gaming_score    INTEGER         NOT NULL DEFAULT 5 CHECK (gaming_score BETWEEN 1 AND 10),
                            work_score      INTEGER         NOT NULL DEFAULT 5 CHECK (work_score BETWEEN 1 AND 10),
                            tech_score      INTEGER         NOT NULL DEFAULT 5 CHECK (tech_score BETWEEN 1 AND 10),
                            shop_url        VARCHAR(500),
                            is_promo        BOOLEAN         NOT NULL DEFAULT FALSE,
                            created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_components_category ON components (category);
CREATE INDEX idx_components_brand ON components (brand);