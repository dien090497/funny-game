package com.n03bt1.funnygame.reward;

import com.n03bt1.funnygame.score.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository repo;

    /** Lấy tất cả reward, nhóm theo game */
    @Transactional(readOnly = true)
    public Map<String, List<Reward>> allGroupedByGame() {
        Map<String, List<Reward>> grouped = new LinkedHashMap<>();
        for (String game : ScoreService.validGames().stream().sorted().toList()) {
            grouped.put(game, repo.findByGameOrderByRankAsc(game));
        }
        return grouped;
    }

    /** Cập nhật cấu hình một reward */
    @Transactional
    public void update(Long id, String title, String description, String icon) {
        Reward r = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phần thưởng."));
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề phần thưởng không được để trống.");
        }
        r.setTitle(title.trim());
        r.setDescription(description != null ? description.trim() : null);
        r.setIcon(icon != null && !icon.isBlank() ? icon.trim() : "🏆");
        r.setUpdatedAt(OffsetDateTime.now());
        repo.save(r);
    }
}
