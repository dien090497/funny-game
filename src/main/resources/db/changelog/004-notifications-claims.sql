--liquibase formatted sql

--changeset funnygame:004-notifications-claims

-- Thông báo gửi cho player khi đạt top
CREATE TABLE notifications
(
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)              NOT NULL,
    game        VARCHAR(20)              NOT NULL,
    rank        SMALLINT                 NOT NULL,
    month       VARCHAR(7)               NOT NULL, -- "2026-10"
    reward_title VARCHAR(100)            NOT NULL,
    reward_icon  VARCHAR(10)             NOT NULL DEFAULT '🏆',
    is_read     BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_username ON notifications (username, is_read);
CREATE UNIQUE INDEX idx_notifications_unique ON notifications (username, game, month);

-- Thông tin nhận thưởng của player
CREATE TABLE reward_claims
(
    id              BIGSERIAL PRIMARY KEY,
    notification_id BIGINT                   NOT NULL REFERENCES notifications(id),
    username        VARCHAR(50)              NOT NULL,
    full_name       VARCHAR(100)             NOT NULL,
    phone           VARCHAR(20)              NOT NULL,
    address         VARCHAR(255)             NOT NULL,
    age             SMALLINT                 NOT NULL,
    claimed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (notification_id)
);
