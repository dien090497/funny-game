package com.n03bt1.funnygame.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    // ── Spring Security ──────────────────────────────────────────────────────
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + username));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                .disabled(!user.isEnabled())
                .build();
    }

    // ── Register ─────────────────────────────────────────────────────────────
    @Transactional
    public void register(String username, String rawPassword) {
        username = username.trim();
        if (username.isBlank() || username.length() < 3 || username.length() > 50) {
            throw new IllegalArgumentException("Tên đăng nhập phải từ 3 đến 50 ký tự.");
        }
        if (!username.matches("[a-zA-Z0-9_]+")) {
            throw new IllegalArgumentException("Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới.");
        }
        if (repo.existsByUsername(username)) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại.");
        }
        if (rawPassword == null || rawPassword.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự.");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.PLAYER);
        repo.save(user);
    }

    // ── Admin operations ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void toggleEnabled(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Không thể vô hiệu hoá tài khoản admin.");
        }
        user.setEnabled(!user.isEnabled());
        repo.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Không thể xoá tài khoản admin.");
        }
        repo.delete(user);
    }
}
