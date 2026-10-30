package com.n03bt1.funnygame.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // ── Login ────────────────────────────────────────────────────────────────
    @GetMapping("/login")
    public String loginPage(@RequestParam(required = false) String error,
                            @RequestParam(required = false) String logout,
                            Model model) {
        if (error != null) model.addAttribute("error", "Tên đăng nhập hoặc mật khẩu không đúng.");
        if (logout != null) model.addAttribute("message", "Đăng xuất thành công.");
        return "auth/login";
    }

    // ── Register ─────────────────────────────────────────────────────────────
    @GetMapping("/register")
    public String registerPage() {
        return "auth/register";
    }

    @PostMapping("/register")
    public String register(@RequestParam String username,
                           @RequestParam String password,
                           @RequestParam String confirmPassword,
                           RedirectAttributes redirectAttrs) {
        if (!password.equals(confirmPassword)) {
            redirectAttrs.addFlashAttribute("error", "Mật khẩu xác nhận không khớp.");
            return "redirect:/register";
        }
        try {
            userService.register(username, password);
            redirectAttrs.addFlashAttribute("message", "Đăng ký thành công! Hãy đăng nhập.");
            return "redirect:/login";
        } catch (IllegalArgumentException e) {
            redirectAttrs.addFlashAttribute("error", e.getMessage());
            return "redirect:/register";
        }
    }
}
