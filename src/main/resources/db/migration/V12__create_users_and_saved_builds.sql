CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email);

CREATE TABLE IF NOT EXISTS saved_builds (
                                            id BIGSERIAL PRIMARY KEY,
                                            user_id BIGINT NOT NULL,
                                            title VARCHAR(255) NOT NULL,
    scenario VARCHAR(32) NOT NULL DEFAULT 'GAMING',
    total_saved_price_uah NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_builds_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_saved_builds_user_id ON saved_builds (user_id);

CREATE TABLE IF NOT EXISTS saved_build_items (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 saved_build_id BIGINT NOT NULL,
                                                 component_id BIGINT NOT NULL,
                                                 category VARCHAR(32) NOT NULL,
    saved_price_uah NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_saved_build_items_build
    FOREIGN KEY (saved_build_id)
    REFERENCES saved_builds (id)
    ON DELETE CASCADE,
    CONSTRAINT fk_saved_build_items_component
    FOREIGN KEY (component_id)
    REFERENCES components (id)
    );

CREATE INDEX IF NOT EXISTS idx_saved_build_items_build_id ON saved_build_items (saved_build_id);