package com.n03bt1.funnygame.reward;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByGameOrderByRankAsc(String game);
    Optional<Reward> findByGameAndRank(String game, Short rank);
    List<Reward> findAllByOrderByGameAscRankAsc();
}
