# Безопасность приложения

## Реализованные меры безопасности

### 1. ✅ SESSION_SECRET - обязательная проверка

**Проблема:** Если `SESSION_SECRET` не установлен, злоумышленник может подделать session cookie.

**Решение:** Приложение не запустится без установленного `SESSION_SECRET`.

**Файл:** `src/server.ts`

```typescript
if (!process.env.SESSION_SECRET) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: SESSION_SECRET не установлен!');
    process.exit(1);
}
```

**Как установить:**

1. Сгенерируйте случайный ключ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Добавьте в `.env`:
```env
SESSION_SECRET=ваш-сгенерированный-ключ
```

---

### 2. ✅ CSRF защита

**Проблема:** Злоумышленник может отправить запросы от имени администратора, если тот зайдет на вредоносный сайт.

**Решение:** Все POST/PUT/DELETE запросы защищены CSRF токенами.

**Библиотека:** `csrf-csrf`

**Как это работает:**

1. При загрузке страницы генерируется уникальный CSRF токен
2. Токен передается в шаблон и добавляется в заголовок `x-csrf-token`
3. Сервер проверяет токен при каждом запросе

**Защищенные endpoints:**
- `POST /auth/admin/login` - вход администратора
- `POST /api/teams` - создание команды
- `DELETE /api/teams/:id` - удаление команды
- `POST /api/matches` - создание матча
- `PUT /api/matches/:id/result` - обновление результата
- `POST /api/predictions` - сохранение прогноза

**Исключения:**
- OAuth2 callback (`/auth/callback`) - защищен state parameter
- OAuth2 start (`/auth/oauth/start`) - не требует защиты

---

### 3. ✅ Content Security Policy (CSP)

**Проблема:** XSS атаки могут выполнить произвольный JavaScript код.

**Решение:** Helmet middleware с настроенной CSP политикой.

**Библиотека:** `helmet`

**Настройки CSP:**

```typescript
contentSecurityPolicy: {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // inline скрипты для EJS
        styleSrc: ["'self'", "'unsafe-inline'"], // inline стили для EJS
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
    },
}
```

**Дополнительные заголовки от Helmet:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (в production)

---

### 4. ✅ Rate Limiting для админ-логина

**Проблема:** Злоумышленник может перебирать пароли (brute force атака).

**Решение:** Ограничение количества попыток входа с одного IP адреса.

**Библиотека:** `express-rate-limit`

**Настройки:**
- Максимум 10 попыток входа в 15 минут с одного IP
- После 5 неудачных попыток - блокировка IP на 30 минут
- Все попытки логируются в консоль

**Как это работает:**

1. **Rate Limiter** - ограничивает общее количество запросов:
   - 10 запросов в 15 минут на `/auth/admin/login`
   - При превышении - HTTP 429 (Too Many Requests)

2. **Счетчик неудачных попыток** - отслеживает неправильные пароли:
   - После каждой неудачной попытки счетчик увеличивается
   - После 5 неудачных попыток - IP блокируется на 30 минут
   - При успешном входе счетчик сбрасывается

3. **Логирование:**
   ```
   [SECURITY] Неудачная попытка входа #1 для пользователя "admin" с IP 192.168.1.100 в 2026-02-11T10:30:00.000Z
   [SECURITY] IP 192.168.1.100 заблокирован на 30 минут после 5 неудачных попыток
   [SECURITY] Успешный вход администратора с IP 192.168.1.100
   ```

**Файл:** `src/routes/auth.ts`

---

### 5. ✅ OAuth2 безопасность

**Защита от CSRF в OAuth2:**
- State parameter генерируется и проверяется
- Authorization code используется только один раз
- Токены получаются через HTTPS с Basic Authentication

**JWT токены:**
- Токены получаются только от Orbitar через защищенный OAuth2 flow
- Подпись не проверяется, т.к. токен приходит напрямую от доверенного источника

**Файл:** `src/utils/oauth.ts`

---

### 6. ✅ SQL Injection защита

**Решение:** Все SQL запросы используют параметризованные запросы (prepared statements).

**Пример:**
```typescript
await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

❌ **Никогда не делайте так:**
```typescript
await db.query(`SELECT * FROM users WHERE id = ${userId}`); // ОПАСНО!
```

---

### 7. ✅ Session безопасность

**Настройки cookie:**
```typescript
cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only в production
    httpOnly: true, // Защита от XSS
    sameSite: 'lax', // Защита от CSRF
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
}
```

---

## Рекомендации для production

### 1. Обязательно установите сильные пароли

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=используйте-длинный-случайный-пароль
```

### 2. Используйте HTTPS

В production обязательно используйте HTTPS. Настройте reverse proxy (nginx/caddy):

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Ограничьте доступ к админ-панели по IP

В nginx:
```nginx
location /admin {
    allow 192.168.1.0/24;  # Ваша локальная сеть
    deny all;
    proxy_pass http://localhost:3000;
}
```

### 4. Регулярно обновляйте зависимости

```bash
npm audit
npm audit fix
```

---

## Известные ограничения

### ⚠️ Логи хранятся только в памяти

**Проблема:** При перезапуске сервера история неудачных попыток входа теряется.

**Рекомендация:** В production используйте внешнюю систему логирования (Winston, Bunyan) с записью в файлы или базу данных.

### ⚠️ Блокировки IP хранятся в памяти

**Проблема:** При перезапуске сервера все блокировки сбрасываются.

**Рекомендация:** Для production используйте Redis или базу данных для хранения блокировок.

---

## Контрольный список для production

- [ ] `SESSION_SECRET` установлен и является случайным
- [ ] `ADMIN_PASSWORD` - сильный пароль (минимум 16 символов)
- [ ] HTTPS настроен
- [ ] Доступ к админ-панели ограничен по IP
- [ ] `NODE_ENV=production` установлен
- [ ] Все зависимости обновлены (`npm audit`)
- [ ] База данных защищена паролем
- [ ] Резервное копирование базы данных настроено

