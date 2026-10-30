package com.n03bt1.funnygame.user;

import com.n03bt1.funnygame.notification.NotificationService;
import com.n03bt1.funnygame.reward.RewardService;
import com.n03bt1.funnygame.score.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final RewardService rewardService;
    private final ScoreService scoreService;
    private final NotificationService notificationService;

    private static final java.util.List<String> GAMES =
            java.util.List.of("2048", "snake", "arena", "memory");

    // ── Redirect /admin → /admin/users ───────────────────────────────────────
    @GetMapping
    public String index() {
        return "redirect:/admin/users";
    }

    // ── Danh sách người dùng ─────────────────────────────────────────────────
    @GetMapping("/users")
    public String users(Model model) {
        var users = userService.findAll();
        model.addAttribute("users", users);
        model.addAttribute("playerCount", users.stream().filter(u -> u.getRole() == Role.PLAYER).count());
        model.addAttribute("lockedCount", users.stream().filter(u -> !u.isEnabled()).count());
        model.addAttribute("activeMenu", "users");
        return "admin/users";
    }

    @PostMapping("/users/{id}/toggle")
    public String toggleEnabled(@PathVariable Long id, RedirectAttributes ra) {
        try { userService.toggleEnabled(id); }
        catch (IllegalArgumentException e) { ra.addFlashAttribute("error", e.getMessage()); }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/delete")
    public String deleteUser(@PathVariable Long id, RedirectAttributes ra) {
        try {
            userService.deleteUser(id);
            ra.addFlashAttribute("message", "Đã xoá người dùng.");
        } catch (IllegalArgumentException e) { ra.addFlashAttribute("error", e.getMessage()); }
        return "redirect:/admin/users";
    }

    // ── Cấu hình phần thưởng ─────────────────────────────────────────────────
    @GetMapping("/rewards")
    public String rewards(Model model) {
        model.addAttribute("rewardsByGame", rewardService.allGroupedByGame());
        model.addAttribute("activeMenu", "rewards");
        return "admin/rewards";
    }

    @PostMapping("/rewards/{id}")
    public String updateReward(@PathVariable Long id,
                               @RequestParam String title,
                               @RequestParam(required = false) String description,
                               @RequestParam(required = false) String icon,
                               RedirectAttributes ra) {
        try {
            rewardService.update(id, title, description, icon);
            ra.addFlashAttribute("message", "Đã cập nhật phần thưởng.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/rewards";
    }

    // ── Tổng kết tháng ───────────────────────────────────────────────────────
    @PostMapping("/summarize")
    public String summarize(@RequestParam(required = false) String month, RedirectAttributes ra) {
        try {
            YearMonth ym = (month != null && !month.isBlank())
                    ? YearMonth.parse(month) : YearMonth.now().minusMonths(1);
            int count = notificationService.summarizeMonth(ym);
            ra.addFlashAttribute("message",
                    "Tổng kết tháng " + ym + ": đã gửi " + count + " thông báo.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/ranking";
    }

    // ── Danh sách claims ─────────────────────────────────────────────────────
    @GetMapping("/claims")
    public String claims(Model model) {
        model.addAttribute("notifications", notificationService.getAllNotifications());
        model.addAttribute("activeMenu", "claims");
        return "admin/claims";
    }
    @GetMapping("/ranking")
    public String ranking(@RequestParam(required = false) String month, Model model) {
        YearMonth ym = (month != null && !month.isBlank())
                ? YearMonth.parse(month) : YearMonth.now();

        Map<String, java.util.List<com.n03bt1.funnygame.score.RankedScoreDto>> rankingByGame =
                new LinkedHashMap<>();
        for (String game : GAMES) {
            rankingByGame.put(game, scoreService.monthlyLeaderboard(game, ym));
        }

        model.addAttribute("rankingByGame", rankingByGame);
        model.addAttribute("currentMonth", ym.toString());
        model.addAttribute("currentMonthLabel",
                ym.getMonth().getDisplayName(java.time.format.TextStyle.FULL,
                        new java.util.Locale("vi")) + " " + ym.getYear());
        model.addAttribute("activeMenu", "ranking");
        return "admin/ranking";
    }
}
