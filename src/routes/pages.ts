import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import db from '../db/database';

const router = Router();

// Главная страница - список матчей для прогнозов
router.get('/', requireAuth, async (req, res) => {
    try {
        const [matches]: any = await db.query(`
            SELECT
                m.*,
                t1.name as team1_name, t1.flag_emoji as team1_flag,
                t2.name as team2_name, t2.flag_emoji as team2_flag,
                p.predicted_team1_score, p.predicted_team2_score,
                p.predicted_extra_time, p.predicted_penalties,
                p.points_earned
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.id
            JOIN teams t2 ON m.team2_id = t2.id
            LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
            ORDER BY m.match_date
        `, [req.session.userId]);

        // Конвертируем match_date в ISO строку с 'Z' для правильной интерпретации как UTC
        // ВАЖНО: MySQL возвращает DATETIME как Date объект в локальном часовом поясе сервера
        // Нужно вручную создать UTC дату из компонентов
        const matchesWithUTC = matches.map((match: any) => {
            const date = match.match_date;
            // Создаем UTC дату из компонентов локальной даты (которая на самом деле UTC)
            const utcDate = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds()
            ));

            return {
                ...match,
                match_date: utcDate.toISOString()
            };
        });

        const csrfToken = req.app.locals.generateCsrfToken(req, res);
        res.render('index', { matches: matchesWithUTC, userId: req.session.userId, csrfToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading matches');
    }
});

// Таблица лидеров
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
        
        res.render('leaderboard', { 
            leaderboard, 
            currentUserId: req.session.userId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading leaderboard');
    }
});

// ============ АДМИН ПАНЕЛЬ ============

// Главная страница админки
router.get('/admin', requireAdmin, async (req, res) => {
    res.render('admin/index');
});

// Управление командами
router.get('/admin/teams', requireAdmin, async (req, res) => {
    try {
        const [teams] = await db.query('SELECT * FROM teams ORDER BY name');
        const csrfToken = req.app.locals.generateCsrfToken(req, res);
        res.render('admin/teams', { teams, csrfToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading teams');
    }
});

// Управление матчами
router.get('/admin/matches', requireAdmin, async (req, res) => {
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

        const [teams] = await db.query('SELECT * FROM teams ORDER BY name');

        const csrfToken = req.app.locals.generateCsrfToken(req, res);
        res.render('admin/matches', { matches, teams, csrfToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading matches');
    }
});

export default router;

