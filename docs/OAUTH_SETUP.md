# 🔐 Настройка OAuth2 авторизации через Orbitar

## Шаг 1: Регистрация приложения на Orbitar

1. Войди на [orbitar.space](https://orbitar.space) или твой локальный инстанс
2. Перейди в **Профиль → Настройки → Приложения**
3. Нажми кнопку **"Зарегистрировать своё приложение"**
4. Заполни форму:
   - **Название**: Прогнозы на хоккей 2026
   - **Описание**: Конкурс прогнозов на олимпийский турнир по хоккею
   - **Тип клиента**: `confidential` (для серверного приложения)
   - **Redirect URIs**: `http://localhost:3000/auth/callback`
   - **URL подключения** (опционально): `http://localhost:3000`

5. После создания ты получишь:
   - **Client ID** (например: `a2e454ea-d2f1-4dce-875c-fbf3161ebaa5`)
   - **Client Secret** (например: `9cf4dee4088809ff09704b5b8b7b423ee0b2182c8c88540f06f9feb2d476d96c`)

⚠️ **Важно**: Сохрани Client Secret в безопасном месте! Если потеряешь, придется перегенерировать.

## Шаг 2: Настройка .env файла

Скопируй `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируй `.env` и замени значения:

```env
# OAuth2 Orbitar
OAUTH_CLIENT_ID=твой-client-id-из-шага-1
OAUTH_CLIENT_SECRET=твой-client-secret-из-шага-1
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Для production orbitar.space
OAUTH_AUTHORIZE_URL=https://api.orbitar.space/api/v1/oauth2/authorize
OAUTH_TOKEN_URL=https://api.orbitar.space/api/v1/oauth2/token
OAUTH_USER_INFO_URL=https://api.orbitar.space/api/v1/user/profile

# Для локального инстанса orbitar.local
# OAUTH_AUTHORIZE_URL=https://api.orbitar.local/api/v1/oauth2/authorize
# OAUTH_TOKEN_URL=https://api.orbitar.local/api/v1/oauth2/token
# OAUTH_USER_INFO_URL=https://api.orbitar.local/api/v1/user/profile
```

## Шаг 3: Перезапуск сервера

После изменения `.env` перезапусти сервер:

```bash
# Останови текущий процесс (Ctrl+C)
npm run dev
```

## Шаг 4: Тестирование авторизации

1. Открой http://localhost:3000
2. Нажми "Войти через Orbitar"
3. Ты будешь перенаправлен на Orbitar для авторизации
4. Разреши доступ приложению
5. Тебя вернет обратно в приложение с активной сессией

## Типы клиентов

### Confidential Client (используется в этом проекте)

- Для серверных приложений
- Имеет Client Secret
- Может безопасно хранить секреты
- Использует **Basic Authentication** для обмена токенов
- PKCE опционален (мы не используем для простоты)
- Использует параметр `nonce` для дополнительной безопасности

### Public Client

- Для SPA, мобильных и десктопных приложений
- Не имеет Client Secret
- **Обязательно** использует PKCE
- Код не может быть скрыт от пользователя

## Как работает наша реализация

1. **Authorization Request**: Пользователь перенаправляется на Orbitar с `client_id`, `redirect_uri`, `state`, `scope`
2. **User Authorization**: Пользователь разрешает доступ
3. **Authorization Code**: Orbitar возвращает код авторизации
4. **Token Exchange**: Приложение обменивает код на токены используя **Basic Authentication**:
   ```
   Authorization: Basic base64(client_id:client_secret)
   ```
5. **API Access**: Используем access token для получения информации о пользователе

## Scopes (области доступа)

Приложение запрашивает следующие scopes:

- `user:profile` - доступ к профилю пользователя

Если нужны дополнительные права (например, создание постов), добавь их в `src/utils/oauth.ts`:

```typescript
scope: 'user:profile post:create'
```

## Troubleshooting

### Ошибка: "Invalid redirect URI"

**Причина**: Redirect URI в `.env` не совпадает с зарегистрированным в приложении.

**Решение**: Проверь, что в настройках приложения на Orbitar указан точно такой же URI.

### Ошибка: "Invalid client credentials"

**Причина**: Неверный Client ID или Client Secret.

**Решение**: 
1. Проверь правильность значений в `.env`
2. Убедись, что нет лишних пробелов
3. Если потерял Secret, перегенерируй его в настройках приложения

### Ошибка: "Missing parameter: accessToken"

**Причина**: Неправильный формат запроса токена.

**Решение**: Убедись, что используешь `nonce` для confidential clients (уже исправлено в коде).

### Ошибка: "Invalid scopes"

**Причина**: Запрашиваемые scopes не существуют или недоступны.

**Решение**: Проверь список доступных scopes в документации Orbitar.

## Безопасность

✅ **Что делаем правильно:**
- Client Secret хранится на сервере (не в браузере)
- Используем HTTPS в production
- Проверяем state parameter для защиты от CSRF
- Используем session для хранения токенов

⚠️ **Важные правила:**
- Никогда не коммить `.env` в git
- Не показывай Client Secret в логах
- Используй HTTPS в production
- Регулярно обновляй зависимости

## Production deployment

Для production окружения:

1. Зарегистрируй новое приложение с production URL
2. Обнови Redirect URI на production домен
3. Используй `https://` вместо `http://`
4. Установи переменные окружения на сервере
5. Используй `orbitar.space` вместо `orbitar.local`

Пример production `.env`:

```env
OAUTH_CLIENT_ID=production-client-id
OAUTH_CLIENT_SECRET=production-client-secret
OAUTH_REDIRECT_URI=https://your-domain.com/auth/callback
OAUTH_AUTHORIZE_URL=https://api.orbitar.space/api/v1/oauth2/authorize
OAUTH_TOKEN_URL=https://api.orbitar.space/api/v1/oauth2/token
OAUTH_USER_INFO_URL=https://api.orbitar.space/api/v1/user/profile
```

## Дополнительные ресурсы

- [Документация OAuth2 Orbitar](https://github.com/spaceshelter/orbitar/blob/dev/docs/api/oauth2/README.md)
- [Примеры приложений](https://github.com/spaceshelter/oauth2-sample-client)
- [OAuth2 спецификация](https://oauth.net/2/)

