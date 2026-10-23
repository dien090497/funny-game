package com.n03bt1.funnygame.score;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private static final Set<String> VALID_GAMES = Set.of("2048", "snake", "arena", "memory");
    private static final int LEADERBOARD_SIZE = 10;

    private final ScoreRepository repo;

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
        return repo.save(entity);
    }

    @Transactional(readOnly = true)
    public List<ScoreDto> leaderboard(String game) {
        String g = game.toLowerCase();
        if (!VALID_GAMES.contains(g)) {
            throw new IllegalArgumentException("Unknown game: " + game);
        }
        return repo.findTopByGame(g, LEADERBOARD_SIZE).stream()
                .map(s -> new ScoreDto(s.getId(), s.getPlayerName(), s.getScore(),
                        s.getExtra(), s.getCreatedAt()))
                .toList();
    }
}
