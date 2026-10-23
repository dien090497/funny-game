--liquibase formatted sql

--changeset funnygame:001-create-scores
CREATE TABLE scores
(
    id          BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(50)              NOT NULL,
    game        VARCHAR(20)              NOT NULL,
    score       BIGINT                   NOT NULL,
    extra       VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_game_score ON scores (game, score DESC);
