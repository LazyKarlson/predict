import { Request, Response, NextFunction } from 'express';

// Проверка авторизации пользователя
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
}

// Проверка прав администратора
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
}

