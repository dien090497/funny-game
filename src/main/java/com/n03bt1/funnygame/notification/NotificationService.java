package com.n03bt1.funnygame.notification;

import com.n03bt1.funnygame.reward.Reward;
import com.n03bt1.funnygame.reward.RewardRepository;
import com.n03bt1.funnygame.score.RankedScoreDto;
import com.n03bt1.funnygame.score.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final List<String> GAMES = List.of("2048", "snake", "arena", "memory");

    private final NotificationRepository notifRepo;
    private final RewardClaimRepository claimRepo;
    private final ScoreService scoreService;
    private final RewardRepository rewardRepo;

    // ── Admin: tổng kết tháng ─────────────────────────────────────────────────
    @Transactional
    public int summarizeMonth(YearMonth month) {
        String monthStr = month.toString();
        int count = 0;
        for (String game : GAMES) {
            List<RankedScoreDto> top3 = scoreService.monthlyLeaderboard(game, month)
                    .stream().filter(r -> r.rank() <= 3).toList();

            Map<Short, Reward> rewardMap = rewardRepo.findByGameOrderByRankAsc(game).stream()
                    .collect(Collectors.toMap(Reward::getRank, r -> r));

            for (RankedScoreDto r : top3) {
                // Bỏ qua nếu đã có thông báo cho user+game+month này
                if (notifRepo.findByUsernameAndGameAndMonth(r.playerName(), game, monthStr).isPresent())
                    continue;

                Reward reward = rewardMap.get((short) r.rank());
                Notification n = new Notification();
                n.setUsername(r.playerName());
                n.setGame(game);
                n.setRank((short) r.rank());
                n.setMonth(monthStr);
                n.setRewardTitle(reward != null ? reward.getTitle() : "Phần thưởng TOP " + r.rank());
                n.setRewardIcon(reward != null ? reward.getIcon() : "🏆");
                notifRepo.save(n);
                count++;
            }
        }
        return count;
    }

    // ── Player: lấy thông báo ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Notification> getForUser(String username) {
        return notifRepo.findByUsernameWithClaim(username);
    }

    @Transactional(readOnly = true)
    public long countUnread(String username) {
        return notifRepo.countByUsernameAndReadFalse(username);
    }

    @Transactional
    public void markRead(Long notifId, String username) {
        notifRepo.findById(notifId).ifPresent(n -> {
            if (n.getUsername().equals(username)) n.setRead(true);
        });
    }

    // ── Player: nhận thưởng ───────────────────────────────────────────────────
    @Transactional
    public RewardClaim claim(Long notifId, String username,
                             String fullName, String phone, String address, short age) {
        Notification n = notifRepo.findById(notifId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông báo."));
        if (!n.getUsername().equals(username))
            throw new IllegalArgumentException("Không có quyền.");

        validate(fullName, phone, address, age);

        RewardClaim claim = claimRepo.findByNotificationId(notifId)
                .orElseGet(() -> { RewardClaim c = new RewardClaim(); c.setNotification(n); return c; });

        claim.setUsername(username);
        claim.setFullName(fullName.trim());
        claim.setPhone(phone.trim());
        claim.setAddress(address.trim());
        claim.setAge(age);
        claim.setUpdatedAt(OffsetDateTime.now());
        n.setRead(true);
        return claimRepo.save(claim);
    }

    // ── Admin: danh sách claims ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications() {
        return notifRepo.findAllWithClaim();
    }

    private void validate(String fullName, String phone, String address, short age) {
        if (fullName == null || fullName.isBlank() || fullName.length() > 100)
            throw new IllegalArgumentException("Họ tên không hợp lệ.");
        if (phone == null || !phone.matches("0[0-9]{8,10}"))
            throw new IllegalArgumentException("Số điện thoại không hợp lệ.");
        if (address == null || address.isBlank() || address.length() > 255)
            throw new IllegalArgumentException("Địa chỉ không hợp lệ.");
        if (age < 1 || age > 120)
            throw new IllegalArgumentException("Tuổi không hợp lệ.");
    }
}
