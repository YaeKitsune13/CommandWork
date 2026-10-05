create database if not exists coop_project;
use coop_project;
-- MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. user

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email`         VARCHAR(255) NOT NULL,
    `phone`         VARCHAR(32)  NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `image`         VARCHAR(500) NULL,
    `nickname`      VARCHAR(100) NULL,
    `privacy`       ENUM('public', 'private') NOT NULL DEFAULT 'public',
    -- роль «guest» не хранится в БД: гость не зарегистрирован и строки в user не имеет
    `role`          ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
    `is_blocked`    BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`    DATETIME NULL COMMENT 'мягкое удаление',
    UNIQUE KEY `uq_user_email` (`email`),
    UNIQUE KEY `uq_user_phone` (`phone`),
    UNIQUE KEY `uq_user_nickname` (`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. artist  (исполнители; заменяют текстовые поля author)

DROP TABLE IF EXISTS `artist`;
CREATE TABLE `artist` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`       VARCHAR(255) NOT NULL,
    `image`      VARCHAR(500) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_artist_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. album

DROP TABLE IF EXISTS `album`;
CREATE TABLE `album` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`         VARCHAR(255) NOT NULL,
    `artist_id`    BIGINT UNSIGNED NOT NULL,
    `owner_id`     BIGINT UNSIGNED NOT NULL COMMENT 'пользователь, создавший альбом',
    `image`        VARCHAR(500) NULL,
    `release_date` DATE NULL,
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_album_artist`
        FOREIGN KEY (`artist_id`) REFERENCES `artist` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_album_owner`
        FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_album_artist` (`artist_id`),
    INDEX `idx_album_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. music_genre

DROP TABLE IF EXISTS `music_genre`;
CREATE TABLE `music_genre` (
    `id`   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    UNIQUE KEY `uq_music_genre_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. music

DROP TABLE IF EXISTS `music`;
CREATE TABLE `music` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`              VARCHAR(255) NOT NULL,
    `artist_id`         BIGINT UNSIGNED NOT NULL,
    `owner_id`          BIGINT UNSIGNED NOT NULL COMMENT 'пользователь, загрузивший трек',
    `album_id`          BIGINT UNSIGNED NULL,
    `file_url`          VARCHAR(500) NOT NULL,
    `image`             VARCHAR(500) NULL,
    `duration_sec`      INT UNSIGNED NULL,
    `status`            ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason`  TEXT NULL,
    `moderated_by`      BIGINT UNSIGNED NULL COMMENT 'модератор, принявший решение',
    `moderated_at`      DATETIME NULL,
    `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at`        DATETIME NULL COMMENT 'мягкое удаление',
    CONSTRAINT `fk_music_artist`
        FOREIGN KEY (`artist_id`) REFERENCES `artist` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_music_owner`
        FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_music_album`
        FOREIGN KEY (`album_id`) REFERENCES `album` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_music_moderator`
        FOREIGN KEY (`moderated_by`) REFERENCES `user` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_music_artist` (`artist_id`),
    INDEX `idx_music_owner` (`owner_id`),
    INDEX `idx_music_album` (`album_id`),
    INDEX `idx_music_status` (`status`),
    INDEX `idx_music_moderator` (`moderated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. playlist

DROP TABLE IF EXISTS `playlist`;
CREATE TABLE `playlist` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(255) NOT NULL,
    `user_id`     BIGINT UNSIGNED NOT NULL COMMENT 'владелец плейлиста',
    `privacy`     ENUM('public', 'private') NOT NULL DEFAULT 'public',
    `description` TEXT NULL,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`  DATETIME NULL COMMENT 'мягкое удаление',
    CONSTRAINT `fk_playlist_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_playlist_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. user_likes  (лайки/дизлайки треков)

DROP TABLE IF EXISTS `user_likes`;
CREATE TABLE `user_likes` (
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `music_id`   BIGINT UNSIGNED NOT NULL,
    `type`       ENUM('like', 'dislike') NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `music_id`),
    CONSTRAINT `fk_user_likes_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_likes_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_user_likes_music` (`music_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. user_listened  (история прослушиваний)

DROP TABLE IF EXISTS `user_listened`;
CREATE TABLE `user_listened` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `music_id`    BIGINT UNSIGNED NOT NULL,
    `listened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_listened_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_listened_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_user_listened_user_time` (`user_id`, `listened_at`),
    INDEX `idx_user_listened_music` (`music_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. music_genres  (M2M music <-> genre)

DROP TABLE IF EXISTS `music_genres`;
CREATE TABLE `music_genres` (
    `music_id` BIGINT UNSIGNED NOT NULL,
    `genre_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`music_id`, `genre_id`),
    CONSTRAINT `fk_music_genres_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_music_genres_genre`
        FOREIGN KEY (`genre_id`) REFERENCES `music_genre` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_music_genres_genre` (`genre_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. playlist_tracks  (M2M playlist <-> music, с позицией и автором добавления)

DROP TABLE IF EXISTS `playlist_tracks`;
CREATE TABLE `playlist_tracks` (
    `playlist_id` BIGINT UNSIGNED NOT NULL,
    `music_id`    BIGINT UNSIGNED NOT NULL,
    `position`    INT UNSIGNED NOT NULL DEFAULT 0,
    `added_by`    BIGINT UNSIGNED NULL COMMENT 'кто добавил трек',
    `added_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`playlist_id`, `music_id`),
    CONSTRAINT `fk_playlist_tracks_playlist`
        FOREIGN KEY (`playlist_id`) REFERENCES `playlist` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_playlist_tracks_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_playlist_tracks_added_by`
        FOREIGN KEY (`added_by`) REFERENCES `user` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_playlist_tracks_music` (`music_id`),
    INDEX `idx_playlist_tracks_position` (`playlist_id`, `position`),
    INDEX `idx_playlist_tracks_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. playlist_collaborators

DROP TABLE IF EXISTS `playlist_collaborators`;
CREATE TABLE `playlist_collaborators` (
    `playlist_id` BIGINT UNSIGNED NOT NULL,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `role`        ENUM('editor', 'viewer') NOT NULL DEFAULT 'viewer',
    PRIMARY KEY (`playlist_id`, `user_id`),
    CONSTRAINT `fk_playlist_collab_playlist`
        FOREIGN KEY (`playlist_id`) REFERENCES `playlist` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_playlist_collab_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_playlist_collab_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. follows  (подписки user -> user, со статусом заявки)
-- Для закрытых профилей (user.privacy = 'private') приложение создаёт подписку
-- со статусом 'pending', владелец профиля переводит её в 'accepted'.
-- Примечание: CHECK-constraint на follower_id <> following_id убран,
-- т.к. MySQL 8 запрещает CHECK на колонке, участвующей в FK с CASCADE
-- (ошибка 3823). Запрет самоподписки реализован через триггеры ниже.

DROP TABLE IF EXISTS `follows`;
CREATE TABLE `follows` (
    `follower_id`  BIGINT UNSIGNED NOT NULL,
    `following_id` BIGINT UNSIGNED NOT NULL,
    `status`       ENUM('pending', 'accepted') NOT NULL DEFAULT 'accepted',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`follower_id`, `following_id`),
    CONSTRAINT `fk_follows_follower`
        FOREIGN KEY (`follower_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_follows_following`
        FOREIGN KEY (`following_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_follows_following` (`following_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. comments

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `music_id`   BIGINT UNSIGNED NOT NULL,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `text`       TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL COMMENT 'мягкое удаление',
    CONSTRAINT `fk_comments_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_comments_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_comments_music` (`music_id`),
    INDEX `idx_comments_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. complaints  (жалоба на трек, пользователя или комментарий)
-- Вместо полиморфной пары target_type/target_id используются три внешних ключа,
-- из которых заполнен ровно один (проверяется триггерами ниже: CHECK здесь
-- невозможен по той же причине, что и в follows — ошибка 3823).

DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
    `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reporter_id`    BIGINT UNSIGNED NOT NULL,
    `music_id`       BIGINT UNSIGNED NULL,
    `target_user_id` BIGINT UNSIGNED NULL,
    `comment_id`     BIGINT UNSIGNED NULL,
    `reason`         TEXT NOT NULL,
    `status`         ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
    `resolved_by`    BIGINT UNSIGNED NULL COMMENT 'модератор, рассмотревший жалобу',
    `resolved_at`    DATETIME NULL,
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_complaints_reporter`
        FOREIGN KEY (`reporter_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_complaints_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_complaints_target_user`
        FOREIGN KEY (`target_user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_complaints_comment`
        FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_complaints_resolver`
        FOREIGN KEY (`resolved_by`) REFERENCES `user` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `uq_complaints_music`   (`reporter_id`, `music_id`),
    UNIQUE KEY `uq_complaints_user`    (`reporter_id`, `target_user_id`),
    UNIQUE KEY `uq_complaints_comment` (`reporter_id`, `comment_id`),
    INDEX `idx_complaints_music` (`music_id`),
    INDEX `idx_complaints_target_user` (`target_user_id`),
    INDEX `idx_complaints_comment` (`comment_id`),
    INDEX `idx_complaints_resolver` (`resolved_by`),
    INDEX `idx_complaints_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. password_reset_tokens  (в БД хранится только хеш токена)

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 токена в hex',
    `expires_at` DATETIME NOT NULL,
    `used_at`    DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_password_reset_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

DROP TRIGGER IF EXISTS `trg_follows_no_self_insert`;
DROP TRIGGER IF EXISTS `trg_follows_no_self_update`;
DROP TRIGGER IF EXISTS `trg_complaints_one_target_insert`;
DROP TRIGGER IF EXISTS `trg_complaints_one_target_update`;

DELIMITER $$

CREATE TRIGGER `trg_follows_no_self_insert`
BEFORE INSERT ON `follows`
FOR EACH ROW
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Пользователь не может подписаться сам на себя';
    END IF;
END$$

CREATE TRIGGER `trg_follows_no_self_update`
BEFORE UPDATE ON `follows`
FOR EACH ROW
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Пользователь не может подписаться сам на себя';
    END IF;
END$$

CREATE TRIGGER `trg_complaints_one_target_insert`
BEFORE INSERT ON `complaints`
FOR EACH ROW
BEGIN
    IF (NEW.music_id IS NOT NULL) + (NEW.target_user_id IS NOT NULL) + (NEW.comment_id IS NOT NULL) <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Жалоба должна ссылаться ровно на один объект: трек, пользователя или комментарий';
    END IF;
END$$

CREATE TRIGGER `trg_complaints_one_target_update`
BEFORE UPDATE ON `complaints`
FOR EACH ROW
BEGIN
    IF (NEW.music_id IS NOT NULL) + (NEW.target_user_id IS NOT NULL) + (NEW.comment_id IS NOT NULL) <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Жалоба должна ссылаться ровно на один объект: трек, пользователя или комментарий';
    END IF;
END$$

DELIMITER ;
