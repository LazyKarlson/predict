import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';

// Загрузка переменных окружения
dotenv.config();

// БЕЗОПАСНОСТЬ: Проверка обязательных переменных окружения
if (!process.env.SESSION_SECRET) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: SESSION_SECRET не установлен в .env файле!');
    console.error('   Приложение не может запуститься без секретного ключа сессии.');
    console.error('   Добавьте в .env файл:');
    console.error('   SESSION_SECRET=your-random-secret-key-here');
    console.error('');
    console.error('   Сгенерировать случайный ключ можно командой:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

// Импорт роутов
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import pageRoutes from './routes/pages';

const app = express();
const PORT = process.env.PORT || 3000;

// БЕЗОПАСНОСТЬ: Helmet для защиты заголовков HTTP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline нужен для inline скриптов в EJS
            styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline нужен для inline стилей в EJS
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Отключаем для совместимости
}));

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET!, // Теперь гарантированно установлен
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // БЕЗОПАСНОСТЬ: Защита от XSS
        sameSite: 'lax', // БЕЗОПАСНОСТЬ: Защита от CSRF
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// БЕЗОПАСНОСТЬ: CSRF защита
const csrfProtection = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET!,
    getSessionIdentifier: (req) => req.session.id || 'anonymous',
    cookieName: 'x-csrf-token', // Убрали __Host- префикс для работы на localhost
    cookieOptions: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // true только в production (HTTPS)
        httpOnly: true, // Cookie недоступна для JavaScript (защита от XSS)
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const { doubleCsrfProtection, generateCsrfToken } = csrfProtection;

// Делаем generateCsrfToken доступным для роутов
app.locals.generateCsrfToken = generateCsrfToken;

// Применяем CSRF защиту ко всем роутам кроме OAuth callback
app.use((req, res, next) => {
    // Пропускаем CSRF проверку для OAuth callback (он защищен state parameter)
    if (req.path === '/auth/callback' || req.path === '/auth/oauth/start') {
        return next();
    }

    doubleCsrfProtection(req, res, next);
});

// Роуты
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

