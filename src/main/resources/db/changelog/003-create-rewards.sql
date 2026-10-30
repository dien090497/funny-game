--liquibase formatted sql

--changeset funnygame:003-create-rewards

-- Bảng cấu hình phần thưởng cho top 1-3 theo từng game
CREATE TABLE rewards
(
    id          BIGSERIAL PRIMARY KEY,
    game        VARCHAR(20)              NOT NULL,
    rank        SMALLINT                 NOT NULL CHECK (rank BETWEEN 1 AND 3),
    title       VARCHAR(100)             NOT NULL,
    description VARCHAR(500),
    icon        VARCHAR(10)              NOT NULL DEFAULT '🏆',
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (game, rank)
);

-- Seed dữ liệu mặc định
INSERT INTO rewards (game, rank, title, description, icon) VALUES
  ('2048',   1, 'Nhà vô địch 2048',    'Danh hiệu cao nhất tháng này cho game 2048.',     '🥇'),
  ('2048',   2, 'Á quân 2048',         'Vị trí thứ hai trong tháng.',                     '🥈'),
  ('2048',   3, 'Hạng ba 2048',        'Vị trí thứ ba trong tháng.',                      '🥉'),
  ('snake',  1, 'Vua rắn tháng này',   'Điểm cao nhất game Rắn săn mồi trong tháng.',     '🥇'),
  ('snake',  2, 'Á quân rắn',          'Vị trí thứ hai game Rắn săn mồi.',                '🥈'),
  ('snake',  3, 'Hạng ba rắn',         'Vị trí thứ ba game Rắn săn mồi.',                 '🥉'),
  ('arena',  1, 'Chiến binh huyền thoại', 'Tay súng số một Đấu trường trong tháng.',      '🥇'),
  ('arena',  2, 'Á quân đấu trường',   'Vị trí thứ hai Đấu trường sinh tồn.',             '🥈'),
  ('arena',  3, 'Hạng ba đấu trường',  'Vị trí thứ ba Đấu trường sinh tồn.',              '🥉'),
  ('memory', 1, 'Bậc thầy trí nhớ',   'Trí nhớ xuất sắc nhất tháng, ít lượt nhất.',     '🥇'),
  ('memory', 2, 'Á quân trí nhớ',      'Vị trí thứ hai game Lật thẻ.',                    '🥈'),
  ('memory', 3, 'Hạng ba trí nhớ',     'Vị trí thứ ba game Lật thẻ.',                     '🥉');

-- Index để query theo tháng nhanh
CREATE INDEX idx_scores_game_created ON scores (game, created_at DESC);

--changeset funnygame:003-fix-admin-password
UPDATE users
SET password = '$2a$10$ubrVE65Bn9BfPPF0mGK8J.G/qH.bDTNIvDgxpZRnCX7PyWIYsECCm'
WHERE username = 'admin';
