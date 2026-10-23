package com.n03bt1.funnygame.score;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "scores")
@Getter
@Setter
@NoArgsConstructor
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_name", nullable = false, length = 50)
    private String playerName;

    /** Giá trị: "2048", "snake", "arena", "memory" */
    @Column(nullable = false, length = 20)
    private String game;

    /** Điểm số chính (số lớn = tốt hơn) */
    @Column(nullable = false)
    private Long score;

    /**
     * Thông tin phụ tuỳ theo game, ví dụ:
     * arena  → "kills=12,time=165"
     * memory → "moves=24,time=47,difficulty=hard"
     */
    @Column(length = 255)
    private String extra;

    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
