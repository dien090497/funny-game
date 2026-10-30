package com.n03bt1.funnygame.score;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    /** Top N toàn thời gian theo game */
    @Query("""
            SELECT s FROM Score s
            WHERE s.game = :game
            ORDER BY s.score DESC
            LIMIT :limit
            """)
    List<Score> findTopByGame(@Param("game") String game, @Param("limit") int limit);

    /** Top N theo game trong khoảng thời gian (dùng cho monthly ranking)
     *  Mỗi player chỉ tính điểm cao nhất */
    @Query("""
            SELECT s FROM Score s
            WHERE s.game = :game
              AND s.createdAt >= :from
              AND s.createdAt < :to
              AND s.score = (
                  SELECT MAX(s2.score) FROM Score s2
                  WHERE s2.game = s.game
                    AND s2.playerName = s.playerName
                    AND s2.createdAt >= :from
                    AND s2.createdAt < :to
              )
            GROUP BY s.id
            ORDER BY s.score DESC
            LIMIT :limit
            """)
    List<Score> findTopByGameAndPeriod(@Param("game") String game,
                                       @Param("from") OffsetDateTime from,
                                       @Param("to") OffsetDateTime to,
                                       @Param("limit") int limit);
}
