# Заполнение базы данных

## Быстрый старт

### 1. Применить SQL скрипт

```bash
# Из корня проекта
mysql -u root -p hockey_predictions < src/db/seed-olympic-2026.sql
```

Или через Docker (если используешь):
```bash
docker exec -i mariadb mysql -u root -p hockey_predictions < src/db/seed-olympic-2026.sql
```

### 2. Проверить результат

Зайди в админ-панель:
- http://localhost:3000/auth/admin/login
- Логин/пароль из `.env` файла
- Перейди в "Управление командами" - должно быть 12 команд
- Перейди в "Управление матчами" - должно быть 18 матчей

---

## Что содержит скрипт

### Команды (12 команд)

**Группа A:**
- 🇨🇭 Швейцария
- 🇫🇷 Франция
- 🇨🇿 Чехия
- 🇨🇦 Канада

**Группа B:**
- 🇸🇰 Словакия
- 🇫🇮 Финляндия
- 🇸🇪 Швеция
- 🇮🇹 Италия

**Группа C:**
- 🇩🇪 Германия
- 🇩🇰 Дания
- 🇱🇻 Латвия
- 🇺🇸 США

### Матчи (18 матчей группового этапа)

Все матчи с 11 по 15 февраля 2026 года.

**⚠️ ВАЖНО:** Время в скрипте указано в UTC (минус 3 часа от московского времени).

Если твой сервер в другом часовом поясе, скорректируй время в скрипте!

---

## Корректировка времени

### Если нужно изменить часовой пояс

Текущее время в скрипте: **UTC** (для московского времени вычти 3 часа)

**Пример:**
- Оригинальное время: 11.02.2026 18:40 (МСК)
- В скрипте: '2026-02-11 15:40:00' (UTC)

**Для другого часового пояса:**

1. Открой `src/db/seed-olympic-2026.sql`
2. Найди все строки с `match_date`
3. Скорректируй время согласно твоему часовому поясу

**Формула:**
```
UTC время = Локальное время - Смещение часового пояса
```

**Примеры:**
- МСК (UTC+3): 18:40 → 15:40 UTC
- Киев (UTC+2): 18:40 → 16:40 UTC
- Лондон (UTC+0): 18:40 → 18:40 UTC
- Нью-Йорк (UTC-5): 18:40 → 23:40 UTC (предыдущий день)

---

## Очистка базы данных

### Удалить все матчи и команды

```sql
-- ВНИМАНИЕ: Это удалит ВСЕ данные!
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE predictions;
TRUNCATE TABLE matches;
TRUNCATE TABLE teams;
SET FOREIGN_KEY_CHECKS = 1;
```

### Удалить только матчи (оставить команды)

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE predictions;
TRUNCATE TABLE matches;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## Добавление плей-офф матчей

После группового этапа можно добавить матчи плей-офф:

```sql
-- Четвертьфиналы
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Команда1'), (SELECT id FROM teams WHERE name = 'Команда2'), '2026-02-18 15:00:00', 'Четвертьфинал');

-- Полуфиналы
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Команда1'), (SELECT id FROM teams WHERE name = 'Команда2'), '2026-02-21 15:00:00', 'Полуфинал');

-- Финал
INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES
((SELECT id FROM teams WHERE name = 'Команда1'), (SELECT id FROM teams WHERE name = 'Команда2'), '2026-02-23 15:00:00', 'Финал');
```

---

## Проверка данных

### Посмотреть все команды

```sql
SELECT id, name, country_code, flag_emoji FROM teams ORDER BY name;
```

### Посмотреть все матчи

```sql
SELECT 
    m.id,
    t1.flag_emoji as flag1,
    t1.name as team1,
    t2.name as team2,
    t2.flag_emoji as flag2,
    m.match_date,
    m.stage
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id
ORDER BY m.match_date;
```

### Посмотреть матчи по группам

```sql
SELECT 
    m.stage,
    COUNT(*) as matches_count
FROM matches m
GROUP BY m.stage
ORDER BY m.stage;
```

---

## Troubleshooting

### Ошибка: "Table 'teams' doesn't exist"

Сначала примени схему базы данных:
```bash
mysql -u root -p hockey_predictions < src/db/schema.sql
```

### Ошибка: "Duplicate entry"

База уже содержит данные. Очисти её (см. раздел "Очистка базы данных") или используй `INSERT IGNORE`:

```sql
INSERT IGNORE INTO teams (name, country_code, flag_emoji) VALUES ...
```

### Ошибка: "Incorrect datetime value"

Проверь формат даты. Должен быть: `'YYYY-MM-DD HH:MM:SS'`

Пример: `'2026-02-11 15:40:00'`

