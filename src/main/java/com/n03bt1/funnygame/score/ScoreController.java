package com.n03bt1.funnygame.score;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService service;

    /** POST /api/scores — gửi điểm (tên lấy từ user đang login) */
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmitScoreRequest req,
                                    @AuthenticationPrincipal UserDetails principal) {
        try {
            String playerName = principal != null ? principal.getUsername() : req.playerName();
            Score saved = service.save(req.withPlayerName(playerName));
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
