package com.n03bt1.funnygame.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 20)
    private String game;

    @Column(nullable = false)
    private Short rank;

    /** "2026-10" */
    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "reward_title", nullable = false, length = 100)
    private String rewardTitle;

    @Column(name = "reward_icon", nullable = false, length = 10)
    private String rewardIcon = "🏆";

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @OneToOne(mappedBy = "notification", fetch = FetchType.LAZY)
    private RewardClaim claim;
}
