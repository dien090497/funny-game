package com.n03bt1.funnygame.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n LEFT JOIN FETCH n.claim WHERE n.username = :username ORDER BY n.createdAt DESC")
    List<Notification> findByUsernameWithClaim(@Param("username") String username);

    Optional<Notification> findByUsernameAndGameAndMonth(String username, String game, String month);

    @Query("SELECT n FROM Notification n LEFT JOIN FETCH n.claim ORDER BY n.createdAt DESC")
    List<Notification> findAllWithClaim();

    long countByUsernameAndReadFalse(String username);
}
