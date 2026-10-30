package com.n03bt1.funnygame;

import com.n03bt1.funnygame.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final NotificationService notificationService;

    private void injectUnread(UserDetails principal, Model model) {
        if (principal != null) {
            model.addAttribute("unreadCount",
                    notificationService.countUnread(principal.getUsername()));
        }
    }

    @GetMapping("/")
    public String hub(@AuthenticationPrincipal UserDetails principal, Model model) {
        injectUnread(principal, model);
        return "index";
    }

    @GetMapping("/games/memory")
    public String memory(@AuthenticationPrincipal UserDetails principal, Model model) {
        injectUnread(principal, model);
        return "games/memory";
    }

    @GetMapping("/games/2048")
    public String game2048(@AuthenticationPrincipal UserDetails principal, Model model) {
        injectUnread(principal, model);
        return "games/game2048";
    }

    @GetMapping("/games/snake")
    public String snake(@AuthenticationPrincipal UserDetails principal, Model model) {
        injectUnread(principal, model);
        return "games/snake";
    }

    @GetMapping("/games/arena")
    public String arena(@AuthenticationPrincipal UserDetails principal, Model model) {
        injectUnread(principal, model);
        return "games/arena";
    }
}
