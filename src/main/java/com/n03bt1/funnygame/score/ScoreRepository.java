package com.n03bt1.funnygame.score;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    @Query("""
            SELECT s FROM Score s
            WHERE s.game = :game
            ORDER BY s.score DESC
            LIMIT :limit
            """)
    List<Score> findTopByGame(@Param("game") String game, @Param("limit") int limit);
}
