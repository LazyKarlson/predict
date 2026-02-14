# 🏒 Прогнозы на Олимпийский хоккей 2026

Веб-приложение для конкурса прогнозов на олимпийский турнир по хоккею 2026.

## Возможности

### Для пользователей
- 🔐 Авторизация через OAuth2 (Orbitar)
- 📊 Просмотр календаря матчей
- 🎯 Создание прогнозов на матчи (счет, овертайм, буллиты)
- ⏱️ Редактирование прогнозов до начала матча
- 🚫 Автоматическая блокировка прогнозов после начала матча
- 🏆 Таблица лидеров с рейтингом участников
- 📈 Автоматический подсчет баллов

### Для администратора
- ➕ Добавление команд
- 📅 Создание календаря матчей
- ✅ Ввод результатов матчей
- 🔄 Автоматический пересчет баллов

## Система начисления баллов

- **+1 балл** - угадан победитель
- **+2 балла** - угадан точный счет (дополнительно к баллу за победителя)
- **+0.5 балла** - угадан овертайм
- **+0.5 балла** - угаданы буллиты

## Технологии

- **Backend**: TypeScript, Node.js, Express
- **Database**: MariaDB
- **Auth**: OAuth2 (Orbitar)
- **Frontend**: EJS, Vanilla JS

## Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd predict
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

#### Вариант A: Использование Docker (рекомендуется)

```bash
docker-compose up -d
```

База данных будет автоматически создана и схема применена.

#### Вариант B: Локальная установка MariaDB

Создайте базу данных MariaDB:

```sql
CREATE DATABASE hockey_predictions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Импортируйте схему:

```bash
mysql -u root -p hockey_predictions < src/db/schema.sql
```

### 4. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-random-secret-key

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=hockey_predictions

# OAuth2 Orbitar
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_AUTHORIZE_URL=https://api.orbitar.space/api/v1/oauth2/authorize
OAUTH_TOKEN_URL=https://api.orbitar.space/api/v1/oauth2/token
OAUTH_USER_INFO_URL=https://api.orbitar.space/api/v1/user/profile

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
```

### 5. Регистрация OAuth2 приложения

1. Зарегистрируйте приложение на Orbitar
2. Укажите redirect URI: `http://localhost:3000/auth/callback`
3. Скопируйте Client ID и Client Secret в `.env`

## Запуск

### Режим разработки

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

Приложение будет доступно по адресу: `http://localhost:3000`

## Использование

### Для пользователей

1. Откройте `http://localhost:3000`
2. Нажмите "Войти через Orbitar"
3. Авторизуйтесь через OAuth2
4. Просматривайте матчи и делайте прогнозы
5. Следите за таблицей лидеров

**Важно:** Время матчей отображается в вашем локальном часовом поясе. Прогнозы автоматически блокируются после начала матча независимо от вашего местоположения.

### Для администратора

1. Откройте `http://localhost:3000/auth/admin/login`
2. Введите логин и пароль из `.env`
3. Добавьте команды в разделе "Команды"
4. Создайте календарь матчей в разделе "Матчи"
5. После каждого матча вводите результаты

**Важно:** При создании матча вводите время в вашем локальном часовом поясе. Система автоматически конвертирует его в UTC для корректной работы со всеми пользователями.

## Структура проекта

```
predict/
├── src/
│   ├── db/
│   │   ├── database.ts      # Подключение к БД
│   │   └── schema.sql       # Схема БД
│   ├── middleware/
│   │   └── auth.ts          # Middleware авторизации
│   ├── routes/
│   │   ├── api.ts           # API endpoints
│   │   ├── auth.ts          # OAuth2 авторизация
│   │   └── pages.ts         # Страницы
│   ├── types/
│   │   └── index.ts         # TypeScript типы
│   ├── utils/
│   │   ├── oauth.ts         # OAuth2 утилиты
│   │   └── scoring.ts       # Подсчет баллов
│   └── server.ts            # Главный файл сервера
├── views/
│   ├── admin/               # Админ-панель
│   ├── index.ejs            # Главная страница
│   ├── leaderboard.ejs      # Таблица лидеров
│   └── login.ejs            # Страница входа
├── package.json
├── tsconfig.json
└── .env.example
```

## Лицензия

MIT

