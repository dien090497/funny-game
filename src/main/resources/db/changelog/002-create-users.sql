--liquibase formatted sql

--changeset funnygame:002-create-users
CREATE TABLE users
(
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(50)              NOT NULL UNIQUE,
    password   VARCHAR(255)             NOT NULL,
    role       VARCHAR(20)              NOT NULL DEFAULT 'PLAYER',
    enabled    BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tạo tài khoản admin mặc định (password: admin123 — đã BCrypt)
INSERT INTO users (username, password, role)
VALUES ('admin', '$2a$12$sZBFRJGDwB8OlGDhCQkBJOBc1ZVvRNKPpkCDlVZhCeVuD6kHYFvLy', 'ADMIN');
