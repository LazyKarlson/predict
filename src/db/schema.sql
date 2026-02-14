-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orbitar_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица команд
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица матчей
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    match_date DATETIME NOT NULL, -- Хранится в UTC
    stage VARCHAR(50) NOT NULL, -- 'group', 'quarterfinal', 'semifinal', 'final'

    -- Результаты (заполняются админом после матча)
    team1_score INT,
    team2_score INT,
    had_overtime BOOLEAN DEFAULT FALSE,
    had_shootout BOOLEAN DEFAULT FALSE,
    is_finished BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team1_id) REFERENCES teams(id),
    FOREIGN KEY (team2_id) REFERENCES teams(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица прогнозов
CREATE TABLE IF NOT EXISTS predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    match_id INT NOT NULL,

    -- Прогноз пользователя
    predicted_team1_score INT NOT NULL,
    predicted_team2_score INT NOT NULL,
    predicted_overtime BOOLEAN DEFAULT FALSE,
    predicted_shootout BOOLEAN DEFAULT FALSE,

    -- Начисленные баллы (рассчитываются после завершения матча)
    points_earned DECIMAL(3,1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    UNIQUE KEY unique_user_match (user_id, match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Индексы для производительности
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);

