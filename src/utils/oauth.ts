import crypto from 'crypto';
import axios from 'axios';

// Генерация PKCE параметров
export function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    
    return {
        codeVerifier,
        codeChallenge
    };
}

// Генерация state для защиты от CSRF
export function generateState(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Получение URL для авторизации
export function getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.OAUTH_CLIENT_ID!,
        redirect_uri: process.env.OAUTH_REDIRECT_URI!,
        state: state,
        scope: 'user:profile'
    });

    return `${process.env.OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

// Обмен кода на токены
export async function exchangeCodeForTokens(code: string, nonce: string) {
    // Для confidential clients используем Basic Authentication
    const basicAuth = Buffer.from(
        `${process.env.OAUTH_CLIENT_ID}:${process.env.OAUTH_CLIENT_SECRET}`
    ).toString('base64');

    // Попробуем без nonce - возможно, сервер его не понимает
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.OAUTH_REDIRECT_URI!
    });

    console.log('Token exchange request:', {
        url: process.env.OAUTH_TOKEN_URL,
        params: params.toString(),
        hasBasicAuth: !!basicAuth
    });

    try {
        const response = await axios.post(
            process.env.OAUTH_TOKEN_URL!,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${basicAuth}`
                }
            }
        );

        console.log('Token exchange success:', {
            hasAccessToken: !!response.data.access_token,
            hasRefreshToken: !!response.data.refresh_token
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('OAuth token exchange error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                requestData: params.toString(),
                headers: error.config?.headers
            });
        }
        throw error;
    }
}

// Получение информации о пользователе из JWT токена
// ВАЖНО: Эта функция должна вызываться ТОЛЬКО с токенами, полученными напрямую от Orbitar!
// Токен НЕ проверяется криптографически, поэтому НИКОГДА не используйте токены из ненадежных источников
export function getUserInfo(accessToken: string) {
    // JWT токен состоит из трех частей, разделенных точками: header.payload.signature
    // Нам нужна payload часть (вторая)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
    }

    // Декодируем payload из base64
    // БЕЗОПАСНОСТЬ: Мы не проверяем подпись JWT, потому что:
    // 1. Токен получен напрямую от Orbitar через защищенный OAuth2 flow
    // 2. Authorization code может быть обменян только один раз
    // 3. Обмен происходит через HTTPS с нашим client_secret
    // 4. State parameter защищает от CSRF атак
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    console.log('Decoded JWT payload:', payload);

    // Возвращаем информацию о пользователе в формате, который ожидает наш код
    // В JWT токене Orbitar уже есть вся необходимая информация
    return {
        id: payload.user?.id || payload.sub,
        username: payload.user?.username,
        name: payload.user?.username // Orbitar не предоставляет отдельное поле name
    };
}

