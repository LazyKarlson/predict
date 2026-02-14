#!/bin/bash

# Скрипт для заполнения базы данных командами и матчами Олимпиады 2026

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏒 Заполнение базы данных Олимпийским турниром 2026${NC}"
echo ""

# Загружаем переменные окружения
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    exit 1
fi

# Проверяем наличие переменных
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Не все переменные окружения установлены!${NC}"
    echo "Проверьте DB_HOST, DB_USER, DB_NAME в .env файле"
    exit 1
fi

echo -e "${YELLOW}📊 Параметры подключения:${NC}"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Спрашиваем подтверждение
read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Отменено${NC}"
    exit 0
fi

# Применяем SQL скрипт
echo -e "${YELLOW}📝 Применяем SQL скрипт...${NC}"

if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < src/db/seed-olympic-2026.sql
else
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < src/db/seed-olympic-2026.sql
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ База данных успешно заполнена!${NC}"
    echo ""
    echo -e "${GREEN}📋 Добавлено:${NC}"
    echo "  • 12 команд (Группы A, B, C)"
    echo "  • 18 матчей группового этапа"
    echo ""
    echo -e "${YELLOW}🌐 Проверьте результат:${NC}"
    echo "  • Админ-панель: http://localhost:3000/auth/admin/login"
    echo "  • Команды: http://localhost:3000/admin/teams"
    echo "  • Матчи: http://localhost:3000/admin/matches"
else
    echo ""
    echo -e "${RED}❌ Ошибка при применении SQL скрипта!${NC}"
    exit 1
fi

