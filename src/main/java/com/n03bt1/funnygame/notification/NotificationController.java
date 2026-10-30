package com.n03bt1.funnygame.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    /** Trang thông báo của player */
    @GetMapping
    public String list(@AuthenticationPrincipal UserDetails principal, Model model) {
        model.addAttribute("notifications", service.getForUser(principal.getUsername()));
        return "notifications/list";
    }

    /** Nhận thưởng hoặc cập nhật thông tin */
    @PostMapping("/{id}/claim")
    public String claim(@PathVariable Long id,
                        @RequestParam String fullName,
                        @RequestParam String phone,
                        @RequestParam String address,
                        @RequestParam short age,
                        @AuthenticationPrincipal UserDetails principal,
                        RedirectAttributes ra) {
        try {
            service.claim(id, principal.getUsername(), fullName, phone, address, age);
            ra.addFlashAttribute("message", "Đã lưu thông tin nhận thưởng!");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/notifications";
    }
}
