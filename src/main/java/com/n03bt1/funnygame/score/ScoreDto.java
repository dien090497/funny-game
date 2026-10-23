package com.n03bt1.funnygame.score;

import java.time.OffsetDateTime;

public record ScoreDto(
        Long id,
        String playerName,
        Long score,
        String extra,
        OffsetDateTime createdAt
) {}
