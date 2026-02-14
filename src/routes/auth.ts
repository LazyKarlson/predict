import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { generateState, getAuthorizationUrl, exchangeCodeForTokens, getUserInfo } from '../utils/oauth';
import db from '../db/database';
import crypto from 'crypto';

const router = Router();

// Хранилище неудачных попыток входа (IP -> { count, blockedUntil })
const loginAttempts = new Map<string, { count: number; blockedUntil?: number }>();

// Rate limiter для админ-логина: максимум 10 попыток в 15 минут
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // максимум 10 запросов
    message: 'Слишком много попыток входа. Попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Функция для проверки блокировки IP
function isIpBlocked(ip: string): boolean {
    const attempt = loginAttempts.get(ip);
    if (!attempt || !attempt.blockedUntil) {
        return false;
    }

    if (Date.now() < attempt.blockedUntil) {
        return true;
    }

    // Блокировка истекла - очищаем
    loginAttempts.delete(ip);
    return false;
}

// Функция для регистрации неудачной попытки
function recordFailedAttempt(ip: string, username: string): void {
    const attempt = loginAttempts.get(ip) || { count: 0 };
    attempt.count++;

    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY] Неудачная попытка входа #${attempt.count} для пользователя "${username}" с IP ${ip} в ${timestamp}`);

    // После 5 неудачных попыток - блокировка на 30 минут
    if (attempt.count >= 5) {
        attempt.blockedUntil = Date.now() + 30 * 60 * 1000; // 30 минут
        console.error(`[SECURITY] IP ${ip} заблокирован на 30 минут после ${attempt.count} неудачных попыток`);
    }

    loginAttempts.set(ip, attempt);
}

// Функция для очистки счетчика при успешном входе
function clearFailedAttempts(ip: string): void {
    loginAttempts.delete(ip);
}

// Страница входа
router.get('/login', (req, res) => {
    res.render('login');
});

// Начало OAuth2 авторизации
router.get('/oauth/start', (req, res) => {
    const state = generateState();
    const nonce = crypto.randomBytes(16).toString('hex');

    // Сохраняем в сессии для проверки при callback
    req.session.oauthState = state;
    req.session.oauthNonce = nonce;

    const authUrl = getAuthorizationUrl(state);
    res.redirect(authUrl);
});

// Callback после авторизации
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    console.log('OAuth callback received:', {
        hasCode: !!code,
        hasState: !!state,
        stateMatches: state === req.session.oauthState
    });

    // Проверка state для защиты от CSRF
    if (!state || state !== req.session.oauthState) {
        return res.status(400).send('Invalid state parameter');
    }

    if (!code || typeof code !== 'string') {
        return res.status(400).send('Authorization code not provided');
    }

    console.log('Starting token exchange...');

    try {
        // Обмен кода на токены
        const tokens = await exchangeCodeForTokens(code, req.session.oauthNonce!);

        // Получение информации о пользователе из JWT токена
        const userInfo = getUserInfo(tokens.access_token);
        
        // Сохранение или обновление пользователя в БД
        const [rows]: any = await db.query(
            'SELECT id FROM users WHERE orbitar_id = ?',
            [userInfo.id || userInfo.username]
        );
        
        let userId: number;
        
        if (rows.length > 0) {
            userId = rows[0].id;
            // Обновляем информацию
            await db.query(
                'UPDATE users SET username = ?, display_name = ? WHERE id = ?',
                [userInfo.username, userInfo.name || userInfo.username, userId]
            );
        } else {
            // Создаем нового пользователя
            const [result]: any = await db.query(
                'INSERT INTO users (orbitar_id, username, display_name) VALUES (?, ?, ?)',
                [userInfo.id || userInfo.username, userInfo.username, userInfo.name || userInfo.username]
            );
            userId = result.insertId;
        }
        
        // Сохраняем в сессии
        req.session.userId = userId;

        // Очищаем временные данные OAuth
        delete req.session.oauthState;
        delete req.session.oauthNonce;

        res.redirect('/');
    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Вход администратора
router.get('/admin/login', (req, res) => {
    const csrfToken = req.app.locals.generateCsrfToken(req, res);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Проверяем, не заблокирован ли IP
    if (isIpBlocked(ip)) {
        const attempt = loginAttempts.get(ip);
        const minutesLeft = attempt?.blockedUntil
            ? Math.ceil((attempt.blockedUntil - Date.now()) / 60000)
            : 30;

        return res.render('admin-login', {
            csrfToken,
            error: `Ваш IP заблокирован на ${minutesLeft} минут из-за множественных неудачных попыток входа.`
        });
    }

    res.render('admin-login', { csrfToken });
});

router.post('/admin/login', adminLoginLimiter, (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const csrfToken = req.app.locals.generateCsrfToken(req, res);

    // Проверяем, не заблокирован ли IP
    if (isIpBlocked(ip)) {
        const attempt = loginAttempts.get(ip);
        const minutesLeft = attempt?.blockedUntil
            ? Math.ceil((attempt.blockedUntil - Date.now()) / 60000)
            : 30;

        console.warn(`[SECURITY] Попытка входа с заблокированного IP ${ip}`);
        return res.render('admin-login', {
            csrfToken,
            error: `Ваш IP заблокирован на ${minutesLeft} минут из-за множественных неудачных попыток входа.`
        });
    }

    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {
        // Успешный вход
        clearFailedAttempts(ip);
        req.session.isAdmin = true;
        console.log(`[SECURITY] Успешный вход администратора с IP ${ip}`);
        res.redirect('/admin');
    } else {
        // Неудачная попытка
        recordFailedAttempt(ip, username);
        res.render('admin-login', {
            csrfToken,
            error: 'Неверное имя пользователя или пароль'
        });
    }
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

export default router;

