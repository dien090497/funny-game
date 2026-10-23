package com.n03bt1.funnygame.score;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService service;

    /** POST /api/scores — gửi điểm mới */
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmitScoreRequest req) {
        try {
            Score saved = service.save(req);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("id", saved.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/scores/{game} — top 10 leaderboard */
    @GetMapping("/{game}")
    public ResponseEntity<?> leaderboard(@PathVariable String game) {
        try {
            List<ScoreDto> list = service.leaderboard(game);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
