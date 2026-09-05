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
    `role`          ENUM('guest', 'user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
    `is_blocked`    BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_user_email` (`email`),
    UNIQUE KEY `uq_user_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. album

DROP TABLE IF EXISTS `album`;
CREATE TABLE `album` (
    `id`     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`   VARCHAR(255) NOT NULL,
    `author` VARCHAR(255) NULL,
    `image`  VARCHAR(500) NULL,
    `date`   DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. music_genre

DROP TABLE IF EXISTS `music_genre`;
CREATE TABLE `music_genre` (
    `id`   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    UNIQUE KEY `uq_music_genre_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. music

DROP TABLE IF EXISTS `music`;
CREATE TABLE `music` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`              VARCHAR(255) NOT NULL,
    `author`            VARCHAR(255) NULL,
    `owner_id`          BIGINT UNSIGNED NOT NULL,
    `album_id`          BIGINT UNSIGNED NULL,
    `file_url`          VARCHAR(500) NOT NULL,
    `image`             VARCHAR(500) NULL,
    `status`            ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason`  TEXT NULL,
    `date`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_music_owner`
        FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_music_album`
        FOREIGN KEY (`album_id`) REFERENCES `album` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_music_owner` (`owner_id`),
    INDEX `idx_music_album` (`album_id`),
    INDEX `idx_music_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. playlist

DROP TABLE IF EXISTS `playlist`;
CREATE TABLE `playlist` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(255) NOT NULL,
    `user_id`     BIGINT UNSIGNED NOT NULL COMMENT 'владелец плейлиста',
    `privacy`     ENUM('public', 'private') NOT NULL DEFAULT 'public',
    `description` TEXT NULL,
    CONSTRAINT `fk_playlist_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_playlist_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. user_likes  (лайки/дизлайки треков)

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

-- 7. user_listened  (история прослушиваний)

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
    INDEX `idx_user_listened_user` (`user_id`),
    INDEX `idx_user_listened_music` (`music_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. music_genres  (M2M music <-> genre)

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

-- 9. playlist_tracks  (M2M playlist <-> music, с позицией)

DROP TABLE IF EXISTS `playlist_tracks`;
CREATE TABLE `playlist_tracks` (
    `playlist_id` BIGINT UNSIGNED NOT NULL,
    `music_id`    BIGINT UNSIGNED NOT NULL,
    `position`    INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`playlist_id`, `music_id`),
    CONSTRAINT `fk_playlist_tracks_playlist`
        FOREIGN KEY (`playlist_id`) REFERENCES `playlist` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_playlist_tracks_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_playlist_tracks_music` (`music_id`),
    INDEX `idx_playlist_tracks_position` (`playlist_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. playlist_collaborators

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

-- 11. follows  (подписки user -> user)

DROP TABLE IF EXISTS `follows`;
CREATE TABLE `follows` (
    `follower_id`  BIGINT UNSIGNED NOT NULL,
    `following_id` BIGINT UNSIGNED NOT NULL,
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`follower_id`, `following_id`),
    CONSTRAINT `fk_follows_follower`
        FOREIGN KEY (`follower_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_follows_following`
        FOREIGN KEY (`following_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_follows_following` (`following_id`),
    CONSTRAINT `chk_follows_not_self` CHECK (`follower_id` <> `following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. comments

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `music_id`   BIGINT UNSIGNED NOT NULL,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `text`       TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comments_music`
        FOREIGN KEY (`music_id`) REFERENCES `music` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_comments_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_comments_music` (`music_id`),
    INDEX `idx_comments_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. complaints  (полиморфная жалоба: music / user / comment)

DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` BIGINT UNSIGNED NOT NULL,
    `target_type` ENUM('music', 'user', 'comment') NOT NULL,
    `target_id`   BIGINT UNSIGNED NOT NULL,
    `reason`      TEXT NOT NULL,
    `status`      ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_complaints_reporter`
        FOREIGN KEY (`reporter_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_complaints_reporter` (`reporter_id`),
    INDEX `idx_complaints_target` (`target_type`, `target_id`),
    INDEX `idx_complaints_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='target_id — полиморфная ссылка; отдельный FK не создаётся, т.к. target_type определяет таблицу';

-- 14. password_reset_tokens

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `token`      VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_password_reset_token` (`token`),
    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_password_reset_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
