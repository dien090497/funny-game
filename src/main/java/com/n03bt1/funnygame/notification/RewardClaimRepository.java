package com.n03bt1.funnygame.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RewardClaimRepository extends JpaRepository<RewardClaim, Long> {
    Optional<RewardClaim> findByNotificationId(Long notificationId);
}
