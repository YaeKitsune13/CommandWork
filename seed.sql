SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Берем рабочий хэш пароля (password123) от любого существующего пользователя
SET @pwd = (SELECT password_hash FROM user WHERE password_hash IS NOT NULL LIMIT 1);

-- 2. Пользователи (Админ, Модератор, Обычные пользователи)
INSERT INTO user (id, email, phone, password_hash, nickname, privacy, role, is_blocked, created_at, updated_at) VALUES
(10, 'admin@dinisify.com', '+79990000001', @pwd, 'SuperAdmin', 'public', 'admin', 0, NOW(), NOW()),
(11, 'moderator@dinisify.com', '+79990000002', @pwd, 'Mod_Alex', 'public', 'moderator', 0, NOW(), NOW()),
(12, 'alice@dinisify.com', '+79990000003', @pwd, 'Alice_Rock', 'public', 'user', 0, NOW(), NOW()),
(13, 'bob@dinisify.com', '+79990000004', @pwd, 'Bob_Electro', 'public', 'user', 0, NOW(), NOW()),
(14, 'charlie@dinisify.com', '+79990000005', @pwd, 'Charlie_Secret', 'private', 'user', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE nickname=VALUES(nickname), role=VALUES(role);

-- 3. Жанры
INSERT INTO music_genre (id, name) VALUES
(1, 'Rock'),
(2, 'Electronic'),
(3, 'Pop'),
(4, 'Hip-Hop'),
(5, 'Jazz')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Артисты / Исполнители
INSERT INTO artist (id, name, image, created_at) VALUES
(1, 'Queen', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', NOW()),
(2, 'The Weeknd', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819', NOW()),
(3, 'Daft Punk', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745', NOW()),
(4, 'Eminem', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Альбомы
INSERT INTO album (id, name, artist_id, owner_id, image, release_date, created_at) VALUES
(1, 'A Night at the Opera', 1, 10, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', '1975-11-21', NOW()),
(2, 'After Hours', 2, 10, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819', '2020-03-20', NOW()),
(3, 'Discovery', 3, 10, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745', '2001-03-12', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Треки (статус approved - одобрены модерацией)
INSERT INTO music (id, name, artist_id, owner_id, album_id, file_url, image, duration_sec, status, created_at) VALUES
(1, 'Bohemian Rhapsody', 1, 10, 1, '/uploads/music/bohemian.mp3', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', 354, 'approved', NOW()),
(2, 'Blinding Lights', 2, 10, 2, '/uploads/music/blinding.mp3', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819', 200, 'approved', NOW()),
(3, 'Save Your Tears', 2, 10, 2, '/uploads/music/tears.mp3', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819', 215, 'approved', NOW()),
(4, 'Get Lucky', 3, 10, 3, '/uploads/music/lucky.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745', 248, 'approved', NOW()),
(5, 'Lose Yourself', 4, 10, NULL, '/uploads/music/lose.mp3', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad', 326, 'approved', NOW()),
(6, 'Pending Demo Track', 1, 12, NULL, '/uploads/music/demo.mp3', NULL, 180, 'pending', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Привязка жанров к трекам
INSERT INTO music_genres (music_id, genre_id) VALUES
(1, 1), -- Bohemian Rhapsody -> Rock
(2, 3), -- Blinding Lights -> Pop
(2, 2), -- Blinding Lights -> Electronic
(3, 3), -- Save Your Tears -> Pop
(4, 2), -- Get Lucky -> Electronic
(5, 4)  -- Lose Yourself -> Hip-Hop
ON DUPLICATE KEY UPDATE genre_id=VALUES(genre_id);

-- 8. История прослушиваний (для формирования Чартов)
-- Делаем Blinding Lights лидером чарта (5 прослушиваний), Bohemian Rhapsody вторым (3)
INSERT INTO user_listened (user_id, music_id, listened_at) VALUES
(12, 2, NOW() - INTERVAL 1 HOUR),
(13, 2, NOW() - INTERVAL 2 HOUR),
(14, 2, NOW() - INTERVAL 5 HOUR),
(10, 2, NOW() - INTERVAL 1 DAY),
(11, 2, NOW() - INTERVAL 2 DAY),
(12, 1, NOW() - INTERVAL 3 HOUR),
(13, 1, NOW() - INTERVAL 6 HOUR),
(10, 1, NOW() - INTERVAL 1 DAY),
(13, 4, NOW() - INTERVAL 4 HOUR),
(12, 5, NOW() - INTERVAL 12 HOUR);

-- 9. Лайки пользователей (для системы рекомендаций)
INSERT INTO user_likes (user_id, music_id, type, created_at) VALUES
(12, 1, 'like', NOW()), -- Alice лайкнула рок
(12, 2, 'like', NOW()),
(13, 4, 'like', NOW())  -- Bob лайкнул электронную музыку
ON DUPLICATE KEY UPDATE type=VALUES(type);

-- 10. Подписки (Alice подписана на Bob, Bob подал заявку на Charlie)
INSERT INTO follows (follower_id, following_id, status, created_at) VALUES
(12, 13, 'accepted', NOW()),
(13, 14, 'pending', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 11. Плейлисты
INSERT INTO playlist (id, name, user_id, privacy, description, created_at, updated_at) VALUES
(1, 'Best Rock Legends', 12, 'public', 'Мой любимый плейлист с классикой рока', NOW(), NOW()),
(2, 'Night Drive', 13, 'public', 'Синтвейв и ночные ритмы', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO playlist_tracks (playlist_id, music_id, position, added_by, added_at) VALUES
(1, 1, 1, 12, NOW()),
(2, 2, 1, 13, NOW()),
(2, 4, 2, 13, NOW())
ON DUPLICATE KEY UPDATE position=VALUES(position);

SET FOREIGN_KEY_CHECKS = 1;
