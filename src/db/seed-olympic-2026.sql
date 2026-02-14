-- Вставка команд Олимпийского турнира 2026
-- Все команды с флагами emoji

INSERT INTO teams (name, country_code, flag_emoji) VALUES
-- Группа A
('Швейцария', 'SUI', '🇨🇭'),
('Франция', 'FRA', '🇫🇷'),
('Чехия', 'CZE', '🇨🇿'),
('Канада', 'CAN', '🇨🇦'),

-- Группа B
('Словакия', 'SVK', '🇸🇰'),
('Финляндия', 'FIN', '🇫🇮'),
('Швеция', 'SWE', '🇸🇪'),
('Италия', 'ITA', '🇮🇹'),

-- Группа C
('Германия', 'GER', '🇩🇪'),
('Дания', 'DEN', '🇩🇰'),
('Латвия', 'LAT', '🇱🇻'),
('США', 'USA', '🇺🇸');

-- Вставка матчей группового этапа
-- ВАЖНО: Время указано в UTC (конвертировано из локального времени)
-- Если у вас другой часовой пояс, скорректируйте время соответственно

-- Группа B - 11.02.2026
-- 18:40 МСК = 15:40 UTC (МСК = UTC+3)
-- 23:10 МСК = 20:10 UTC
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Словакия'), (SELECT id FROM teams WHERE name = 'Финляндия'), '2026-02-11 15:40:00', 'Группа B'),
((SELECT id FROM teams WHERE name = 'Швеция'), (SELECT id FROM teams WHERE name = 'Италия'), '2026-02-11 20:10:00', 'Группа B');

-- Группа A - 12.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Швейцария'), (SELECT id FROM teams WHERE name = 'Франция'), '2026-02-12 11:10:00', 'Группа A'),
((SELECT id FROM teams WHERE name = 'Чехия'), (SELECT id FROM teams WHERE name = 'Канада'), '2026-02-12 15:40:00', 'Группа A');

-- Группа C - 12.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Германия'), (SELECT id FROM teams WHERE name = 'Дания'), '2026-02-12 20:10:00', 'Группа C'),
((SELECT id FROM teams WHERE name = 'Латвия'), (SELECT id FROM teams WHERE name = 'США'), '2026-02-12 20:10:00', 'Группа C');

-- Группа B - 13.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Италия'), (SELECT id FROM teams WHERE name = 'Словакия'), '2026-02-13 11:10:00', 'Группа B'),
((SELECT id FROM teams WHERE name = 'Финляндия'), (SELECT id FROM teams WHERE name = 'Швеция'), '2026-02-13 11:10:00', 'Группа B');

-- Группа A - 13.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Франция'), (SELECT id FROM teams WHERE name = 'Чехия'), '2026-02-13 15:40:00', 'Группа A'),
((SELECT id FROM teams WHERE name = 'Канада'), (SELECT id FROM teams WHERE name = 'Швейцария'), '2026-02-13 20:10:00', 'Группа A');

-- Группа B - 14.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Швеция'), (SELECT id FROM teams WHERE name = 'Словакия'), '2026-02-14 11:10:00', 'Группа B');

-- Группа C - 14.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Германия'), (SELECT id FROM teams WHERE name = 'Латвия'), '2026-02-14 11:10:00', 'Группа C');

-- Группа B - 14.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Финляндия'), (SELECT id FROM teams WHERE name = 'Италия'), '2026-02-14 15:40:00', 'Группа B');

-- Группа C - 14.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'США'), (SELECT id FROM teams WHERE name = 'Дания'), '2026-02-14 20:10:00', 'Группа C');

-- Группа A - 15.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Швейцария'), (SELECT id FROM teams WHERE name = 'Чехия'), '2026-02-15 11:10:00', 'Группа A'),
((SELECT id FROM teams WHERE name = 'Канада'), (SELECT id FROM teams WHERE name = 'Франция'), '2026-02-15 15:40:00', 'Группа A');

-- Группа C - 15.02.2026
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Дания'), (SELECT id FROM teams WHERE name = 'Латвия'), '2026-02-15 18:10:00', 'Группа C'),
((SELECT id FROM teams WHERE name = 'США'), (SELECT id FROM teams WHERE name = 'Германия'), '2026-02-15 20:10:00', 'Группа C');

-- Проверка вставленных данных
SELECT 'Команды:' as info;
SELECT id, name, country_code, flag_emoji FROM teams ORDER BY id;

SELECT '' as info;
SELECT 'Матчи:' as info;
SELECT 
    m.id,
    t1.name as team1,
    t2.name as team2,
    m.match_date,
    m.stage
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id
ORDER BY m.match_date;

