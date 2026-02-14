-- Исправление времени матчей
-- Проблема: время было сохранено с неправильным смещением
-- Нужно добавить 3 часа ко всем матчам

UPDATE matches SET match_date = DATE_ADD(match_date, INTERVAL 3 HOUR);

-- Проверка результата
SELECT 
    m.id,
    t1.name as team1,
    t2.name as team2,
    m.match_date as utc_time,
    DATE_ADD(m.match_date, INTERVAL 3 HOUR) as moscow_time,
    m.stage
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id
ORDER BY m.match_date
LIMIT 5;

