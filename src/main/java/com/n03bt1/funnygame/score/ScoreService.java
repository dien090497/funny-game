package com.n03bt1.funnygame.score;

import com.n03bt1.funnygame.reward.Reward;
import com.n03bt1.funnygame.reward.RewardDto;
import com.n03bt1.funnygame.reward.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private static final Set<String> VALID_GAMES = Set.of("2048", "snake", "arena", "memory");
    private static final int LEADERBOARD_SIZE = 10;

    private final ScoreRepository scoreRepo;
    private final RewardRepository rewardRepo;

    // ── Submit ───────────────────────────────────────────────────────────────
    @Transactional
    public Score save(SubmitScoreRequest req) {
        String game = req.game().toLowerCase();
        if (!VALID_GAMES.contains(game)) {
            throw new IllegalArgumentException("Unknown game: " + game);
        }
        String playerName = req.playerName().trim();
        if (playerName.isBlank() || playerName.length() > 50) {
            throw new IllegalArgumentException("Invalid player name");
        }
        if (req.score() < 0) {
            throw new IllegalArgumentException("Score must be non-negative");
        }

        Score entity = new Score();
        entity.setGame(game);
        entity.setPlayerName(playerName);
        entity.setScore(req.score());
        entity.setExtra(req.extra());
        return scoreRepo.save(entity);
    }

    // ── Leaderboard toàn thời gian ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ScoreDto> leaderboard(String game) {
        String g = validateGame(game);
        return scoreRepo.findTopByGame(g, LEADERBOARD_SIZE).stream()
                .map(s -> new ScoreDto(s.getId(), s.getPlayerName(), s.getScore(),
                        s.getExtra(), s.getCreatedAt()))
                .toList();
    }

    // ── Monthly leaderboard (kèm phần thưởng) ────────────────────────────────
    @Transactional(readOnly = true)
    public List<RankedScoreDto> monthlyLeaderboard(String game, YearMonth month) {
        String g = validateGame(game);

        OffsetDateTime from = month.atDay(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime to   = month.plusMonths(1).atDay(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        List<Score> scores = scoreRepo.findTopByGameAndPeriod(g, from, to, LEADERBOARD_SIZE);

        // Load rewards cho game này, map rank → reward
        Map<Short, Reward> rewardMap = rewardRepo.findByGameOrderByRankAsc(g).stream()
                .collect(Collectors.toMap(Reward::getRank, r -> r));

        return IntStream.range(0, scores.size())
                .mapToObj(i -> {
                    Score s = scores.get(i);
                    short rank = (short) (i + 1);
                    Reward reward = rewardMap.get(rank);
                    RewardDto rewardDto = reward != null
                            ? new RewardDto(reward.getIcon(), reward.getTitle(), reward.getDescription())
                            : null;
                    return new RankedScoreDto(rank, s.getPlayerName(), s.getScore(),
                            s.getExtra(), s.getCreatedAt(), rewardDto);
                })
                .toList();
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private String validateGame(String game) {
        String g = game.toLowerCase();
        if (!VALID_GAMES.contains(g)) throw new IllegalArgumentException("Unknown game: " + game);
        return g;
    }

    public static Set<String> validGames() {
        return VALID_GAMES;
    }
}
