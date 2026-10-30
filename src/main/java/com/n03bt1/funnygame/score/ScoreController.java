package com.n03bt1.funnygame.score;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService service;

    /** POST /api/scores — gửi điểm */
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmitScoreRequest req,
                                    @AuthenticationPrincipal UserDetails principal) {
        try {
            String playerName = principal != null ? principal.getUsername() : req.playerName();
            Score saved = service.save(req.withPlayerName(playerName));
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", saved.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/scores/{game} — top 10 toàn thời gian */
    @GetMapping("/{game}")
    public ResponseEntity<?> leaderboard(@PathVariable String game) {
        try {
            List<ScoreDto> list = service.leaderboard(game);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/scores/{game}/monthly?month=2026-10
     * Trả về top 10 tháng, kèm thông tin phần thưởng top 1-3
     * Mặc định là tháng hiện tại nếu không truyền month
     */
    @GetMapping("/{game}/monthly")
    public ResponseEntity<?> monthlyLeaderboard(@PathVariable String game,
                                                 @RequestParam(required = false) String month) {
        try {
            YearMonth ym = (month != null && !month.isBlank())
                    ? YearMonth.parse(month)
                    : YearMonth.now();
            List<RankedScoreDto> list = service.monthlyLeaderboard(game, ym);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
