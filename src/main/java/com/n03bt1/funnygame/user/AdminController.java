package com.n03bt1.funnygame.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("users", userService.findAll());
        return "admin/dashboard";
    }

    @PostMapping("/users/{id}/toggle")
    public String toggleEnabled(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        try {
            userService.toggleEnabled(id);
        } catch (IllegalArgumentException e) {
            redirectAttrs.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin";
    }

    @PostMapping("/users/{id}/delete")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        try {
            userService.deleteUser(id);
            redirectAttrs.addFlashAttribute("message", "Đã xoá người dùng.");
        } catch (IllegalArgumentException e) {
            redirectAttrs.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin";
    }
}
