import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import db from '../db/database';
import { calculatePoints } from '../utils/scoring';
import { Match, Prediction } from '../types';

const router = Router();

// ============ КОМАНДЫ ============

// Получить все команды
router.get('/teams', async (req, res) => {
    try {
        const [teams] = await db.query('SELECT * FROM teams ORDER BY name');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Создать команду (только админ)
router.post('/teams', requireAdmin, async (req, res) => {
    const { name, country_code, flag_emoji } = req.body;

    try {
        const [result]: any = await db.query(
            'INSERT INTO teams (name, country_code, flag_emoji) VALUES (?, ?, ?)',
            [name, country_code, flag_emoji]
        );
        res.json({ id: result.insertId, name, country_code, flag_emoji });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team', details: error instanceof Error ? error.message : String(error) });
    }
});

// Обновить команду (только админ)
router.put('/teams/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, country_code, flag_emoji } = req.body;
    
    try {
        await db.query(
            'UPDATE teams SET name = ?, country_code = ?, flag_emoji = ? WHERE id = ?',
            [name, country_code, flag_emoji, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Удалить команду (только админ)
router.delete('/teams/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM teams WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// ============ МАТЧИ ============

// Получить все матчи с информацией о командах
router.get('/matches', async (req, res) => {
    try {
        const [matches] = await db.query(`
            SELECT 
                m.*,
                t1.name as team1_name, t1.flag_emoji as team1_flag,
                t2.name as team2_name, t2.flag_emoji as team2_flag
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.id
            JOIN teams t2 ON m.team2_id = t2.id
            ORDER BY m.match_date
        `);
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Создать матч (только админ)
router.post('/matches', requireAdmin, async (req, res) => {
    const { team1_id, team2_id, match_date, stage } = req.body;

    try {
        // match_date приходит в формате ISO UTC от клиента (2026-02-05T15:00:00.000Z)
        // Конвертируем в формат MySQL DATETIME (2026-02-05 15:00:00)
        const mysqlDate = new Date(match_date).toISOString().slice(0, 19).replace('T', ' ');

        const [result]: any = await db.query(
            'INSERT INTO matches (team1_id, team2_id, match_date, stage) VALUES (?, ?, ?, ?)',
            [team1_id, team2_id, mysqlDate, stage]
        );
        res.json({ id: result.insertId });
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Failed to create match', details: error instanceof Error ? error.message : String(error) });
    }
});

// Обновить результат матча (только админ)
router.put('/matches/:id/result', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { team1_score, team2_score, had_overtime, had_shootout } = req.body;
    
    try {
        // Обновляем результат матча
        await db.query(
            `UPDATE matches 
             SET team1_score = ?, team2_score = ?, had_overtime = ?, had_shootout = ?, is_finished = TRUE 
             WHERE id = ?`,
            [team1_score, team2_score, had_overtime, had_shootout, id]
        );
        
        // Получаем матч
        const [matchRows]: any = await db.query('SELECT * FROM matches WHERE id = ?', [id]);
        const match: Match = matchRows[0];
        
        // Получаем все прогнозы для этого матча
        const [predictions]: any = await db.query(
            'SELECT * FROM predictions WHERE match_id = ?',
            [id]
        );
        
        // Пересчитываем баллы для каждого прогноза
        for (const prediction of predictions) {
            const points = calculatePoints(match, prediction as Prediction);
            await db.query(
                'UPDATE predictions SET points_earned = ? WHERE id = ?',
                [points, prediction.id]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update match result' });
    }
});

// ============ ПРОГНОЗЫ ============

// Получить прогнозы пользователя
router.get('/predictions', requireAuth, async (req, res) => {
    try {
        const [predictions] = await db.query(
            `SELECT p.*, m.match_date,
                    t1.name as team1_name, t2.name as team2_name
             FROM predictions p
             JOIN matches m ON p.match_id = m.id
             JOIN teams t1 ON m.team1_id = t1.id
             JOIN teams t2 ON m.team2_id = t2.id
             WHERE p.user_id = ?
             ORDER BY m.match_date`,
            [req.session.userId]
        );
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// Создать или обновить прогноз
router.post('/predictions', requireAuth, async (req, res) => {
    const { match_id, predicted_team1_score, predicted_team2_score, predicted_overtime, predicted_shootout } = req.body;

    try {
        // Проверяем, что матч еще не начался
        const [matchRows]: any = await db.query(
            'SELECT match_date, is_finished FROM matches WHERE id = ?',
            [match_id]
        );

        if (matchRows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const match = matchRows[0];
        // Конвертируем DATETIME из MySQL в правильную UTC дату
        // MySQL возвращает DATETIME как Date в локальном часовом поясе сервера
        // Нужно вручную создать UTC дату из компонентов
        const date = match.match_date;
        const matchDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ));
        const now = new Date(); // Текущее UTC время сервера

        // Проверяем, что матч не завершен и еще не начался
        if (match.is_finished) {
            return res.status(400).json({ error: 'Матч уже завершен. Прогнозы больше не принимаются.' });
        }

        if (matchDate <= now) {
            return res.status(400).json({ error: 'Матч уже начался. Прогнозы больше не принимаются.' });
        }

        // Проверяем, есть ли уже прогноз
        const [existingPredictions]: any = await db.query(
            'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?',
            [req.session.userId, match_id]
        );

        if (existingPredictions.length > 0) {
            // Обновляем существующий прогноз
            await db.query(
                `UPDATE predictions
                 SET predicted_team1_score = ?, predicted_team2_score = ?,
                     predicted_overtime = ?, predicted_shootout = ?
                 WHERE user_id = ? AND match_id = ?`,
                [predicted_team1_score, predicted_team2_score, predicted_overtime, predicted_shootout,
                 req.session.userId, match_id]
            );
        } else {
            // Создаем новый прогноз
            await db.query(
                `INSERT INTO predictions
                 (user_id, match_id, predicted_team1_score, predicted_team2_score, predicted_overtime, predicted_shootout)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.session.userId, match_id, predicted_team1_score, predicted_team2_score,
                 predicted_overtime, predicted_shootout]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save prediction' });
    }
});

// ============ ТАБЛИЦА ЛИДЕРОВ ============

// Получить таблицу лидеров
router.get('/leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await db.query(`
            SELECT
                u.id as user_id,
                u.username,
                u.display_name,
                COALESCE(SUM(p.points_earned), 0) as total_points,
                COUNT(p.id) as predictions_count
            FROM users u
            LEFT JOIN predictions p ON u.id = p.user_id
            GROUP BY u.id, u.username, u.display_name
            HAVING predictions_count > 0
            ORDER BY total_points DESC, predictions_count DESC
        `);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;

