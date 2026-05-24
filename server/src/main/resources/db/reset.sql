-- ============================================================
-- WeiNi Database — Clean Reset
-- Run this file to drop & recreate everything from scratch
-- ============================================================

DROP DATABASE IF EXISTS weini_db;
CREATE DATABASE weini_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE weini_db;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Users
CREATE TABLE users (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(50)  NOT NULL,
    role          ENUM('GIRLFRIEND', 'BOYFRIEND') NOT NULL,
    avatar_url    VARCHAR(255),
    email         VARCHAR(100),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Snacks
CREATE TABLE snacks (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    image_url   VARCHAR(255),
    stock       INT NOT NULL DEFAULT 0,
    status      ENUM('AVAILABLE', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2b. Snack Categories
CREATE TABLE snack_categories (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(50) NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Snack Requests
CREATE TABLE snack_requests (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    type            ENUM('RESTOCK', 'ADD', 'REMOVE') NOT NULL,
    snack_id        BIGINT,
    snack_name      VARCHAR(100),
    count           INT NOT NULL DEFAULT 1,
    category_name   VARCHAR(50),
    reason          VARCHAR(255),
    status          ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
    requester_id    BIGINT NOT NULL,
    handler_id      BIGINT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (snack_id)     REFERENCES snacks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Meal Menu
CREATE TABLE meal_menu (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    dish_name   VARCHAR(100) NOT NULL,
    category    VARCHAR(50),
    image_url   VARCHAR(255),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Meal Orders
CREATE TABLE meal_orders (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_date      DATE NOT NULL,
    meal_type       ENUM('BREAKFAST', 'LUNCH', 'DINNER') NOT NULL,
    dish_name       VARCHAR(100) NOT NULL,
    notes           VARCHAR(255),
    status          ENUM('PENDING', 'IN_PROGRESS', 'COOKING', 'COMPLETED', 'DONE', 'REJECTED') DEFAULT 'PENDING',
    ordered_by      BIGINT NOT NULL,
    handler_id      BIGINT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME,
    FOREIGN KEY (ordered_by) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Work Orders
CREATE TABLE work_orders (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    category      ENUM('BUG', 'FEATURE', 'COMPLAINT', 'WISH') NOT NULL,
    priority      ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    status        ENUM('SUBMITTED', 'ACCEPTED', 'IN_PROGRESS', 'DONE', 'REJECTED') DEFAULT 'SUBMITTED',
    creator_id    BIGINT NOT NULL,
    handler_id    BIGINT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at   DATETIME,
    handler_note  VARCHAR(500),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Anniversaries
CREATE TABLE anniversaries (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(100) NOT NULL,
    event_date  DATE NOT NULL,
    type        ENUM('MARRIED', 'BIRTHDAY', 'FIRST_MET', 'DATING', 'CUSTOM') DEFAULT 'DATING',
    icon        VARCHAR(50) DEFAULT '💕',
    custom_type VARCHAR(50),
    image_url   VARCHAR(500),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Mood Checkins
CREATE TABLE mood_checkins (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    checkin_date DATE NOT NULL,
    mood_emoji  VARCHAR(10) NOT NULL,
    note        VARCHAR(255),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, checkin_date),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Wishlist
CREATE TABLE wishlist (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(255),
    category        ENUM('TRAVEL', 'FOOD', 'THING', 'EXPERIENCE', 'OTHER') DEFAULT 'OTHER',
    status          ENUM('PENDING', 'ACHIEVED') DEFAULT 'PENDING',
    created_by      BIGINT NOT NULL,
    achieved_by     BIGINT,
    achieved_at     DATETIME,
    achieved_photo  VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (achieved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Photo Albums
CREATE TABLE photo_albums (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(200) NOT NULL,
    cover_image_url VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Photos
CREATE TABLE photos (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    album_id        BIGINT NOT NULL,
    image_url       VARCHAR(255) NOT NULL,
    caption         VARCHAR(500),
    tags            VARCHAR(255),
    uploaded_by     BIGINT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES photo_albums(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Photo Comments
CREATE TABLE photo_comments (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    photo_id    BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    content     VARCHAR(500) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Cooking Records
CREATE TABLE cooking_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    meal_order_id   BIGINT,
    cooking_date    DATE NOT NULL,
    photo_url       VARCHAR(255),
    chef_id         BIGINT NOT NULL,
    note            VARCHAR(500),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_order_id) REFERENCES meal_orders(id),
    FOREIGN KEY (chef_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Cooking Ratings
CREATE TABLE cooking_ratings (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    cooking_record_id   BIGINT NOT NULL,
    rater_id            BIGINT NOT NULL,
    rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment             VARCHAR(255),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_record_rater (cooking_record_id, rater_id),
    FOREIGN KEY (cooking_record_id) REFERENCES cooking_records(id),
    FOREIGN KEY (rater_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Message Board
CREATE TABLE message_board (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id     BIGINT NOT NULL,
    content       TEXT NOT NULL,
    sticker       VARCHAR(50),
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at       DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Chat Messages
CREATE TABLE chat_messages (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    role        ENUM('USER', 'AI') NOT NULL,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Notifications
CREATE TABLE notifications (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT NOT NULL,
    type                VARCHAR(30) NOT NULL,
    title               VARCHAR(100) NOT NULL,
    message             VARCHAR(500) NOT NULL,
    related_entity_id   BIGINT,
    related_entity_type VARCHAR(30),
    is_read             BOOLEAN DEFAULT FALSE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================
-- Password for both users: weini123

INSERT INTO users (username, password_hash, nickname, role) VALUES
('girlfriend', '$2b$10$laZtQdKYutmKkj.LipWAzeddFbPH5zouk.5s/rYK3d4j1NCsejhKu', '女朋友', 'GIRLFRIEND'),
('boyfriend',  '$2b$10$t8cre65AyM01gVdTXX5fHOayuCySK/O6.s57UmCgkrDOdZxqxiZhW', '男朋友', 'BOYFRIEND');

INSERT INTO snacks (name, category, stock, status) VALUES
('原味薯片', '零食', 3, 'AVAILABLE'),
('可乐', '饮料', 5, 'AVAILABLE'),
('芒果布丁', '甜品', 2, 'AVAILABLE'),
('草莓', '水果', 0, 'AVAILABLE'),
('泡面', '速食', 4, 'AVAILABLE'),
('巧克力曲奇', '零食', 1, 'AVAILABLE'),
('酸奶', '饮料', 6, 'AVAILABLE');

INSERT IGNORE INTO snack_categories (name) VALUES
('零食'), ('饮料'), ('甜品'), ('水果'), ('速食');

INSERT INTO anniversaries (title, event_date, type, icon) VALUES
('在一起的日子', '2025-02-14', 'DATING', '💝'),
('女朋友的生日', '2025-08-08', 'BIRTHDAY', '🎂'),
('第一次见面', '2024-12-25', 'FIRST_MET', '✨'),
('结婚纪念日', '2026-03-01', 'MARRIED', '💍');

INSERT INTO meal_menu (dish_name, category, is_active) VALUES
('番茄炒蛋', '家常', TRUE),
('红烧排骨', '硬菜', TRUE),
('酸辣土豆丝', '家常', TRUE),
('清炒时蔬', '素菜', TRUE),
('可乐鸡翅', '硬菜', TRUE),
('紫菜蛋花汤', '汤品', TRUE),
('蛋炒饭', '主食', TRUE),
('意大利面', '西餐', TRUE);
