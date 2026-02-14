# 🚀 Быстрый старт

## Минимальная настройка для запуска

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск базы данных

```bash
docker-compose up -d
```

### 3. Настройка .env

```bash
cp .env.example .env
```

Минимальная конфигурация для локального запуска:

```env
PORT=3000
SESSION_SECRET=my-secret-key-123

DB_HOST=localhost
DB_PORT=3306
DB_USER=hockey_user
DB_PASSWORD=hockey_password
DB_NAME=hockey_predictions

# Временные значения для OAuth (замените на реальные)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_AUTHORIZE_URL=https://api.orbitar.space/api/v1/oauth2/authorize
OAUTH_TOKEN_URL=https://api.orbitar.space/api/v1/oauth2/token
OAUTH_USER_INFO_URL=https://api.orbitar.space/api/v1/user/profile

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 4. Запуск приложения

```bash
npm run dev
```

### 5. Первые шаги

1. **Вход администратора**: http://localhost:3000/auth/admin/login
   - Логин: `admin`
   - Пароль: `admin123`

2. **Добавьте команды** в разделе "Команды"

3. **Создайте матчи** в разделе "Матчи"

4. **Пользователи** могут войти через OAuth2 на главной странице

## Настройка OAuth2

Для работы авторизации пользователей нужно:

1. Зарегистрировать приложение на https://orbitar.space
2. Указать Redirect URI: `http://localhost:3000/auth/callback`
3. Получить Client ID и Client Secret
4. Добавить их в `.env`

## Тестовые данные

Для быстрого тестирования можно добавить команды через админку:

- 🇷🇺 Россия (RUS)
- 🇨🇦 Канада (CAN)
- 🇺🇸 США (USA)
- 🇸🇪 Швеция (SWE)
- 🇫🇮 Финляндия (FIN)
- 🇨🇿 Чехия (CZE)

## Проблемы?

### База данных не подключается

```bash
# Проверьте статус контейнера
docker-compose ps

# Посмотрите логи
docker-compose logs mariadb
```

### Ошибка при запуске

```bash
# Пересоберите проект
npm run build

# Проверьте .env файл
cat .env
```

### OAuth не работает

Убедитесь, что:
- Client ID и Secret правильные
- Redirect URI совпадает с зарегистрированным
- Приложение доступно по указанному URL

