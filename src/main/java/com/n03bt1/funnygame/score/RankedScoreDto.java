package com.n03bt1.funnygame.score;

import com.n03bt1.funnygame.reward.RewardDto;

import java.time.OffsetDateTime;

/** ScoreDto kèm thông tin phần thưởng nếu có (top 1-3) */
public record RankedScoreDto(
        int rank,
        String playerName,
        Long score,
        String extra,
        OffsetDateTime createdAt,
        RewardDto reward   // null nếu không có phần thưởng
) {}
