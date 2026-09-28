# Загородный дом «Атмосфера»

Сайт онлайн-бронирования двух домов с чанами под Уфой: публичный сайт, календарь доступности, заявки, личный кабинет клиента и панель владельца.

**Демо:** https://uregina96.github.io/atmosfera/

## Демо-доступ

| Роль | Где | Данные |
|---|---|---|
| Владелец | `/admin` | логин `admin`, пароль `atmosfera2026` |
| Клиент | `/account` | телефон `+7 900 000-00-00`, код `ATM-1042` |

> Это фронтенд-этап: серверная часть и Telegram-бот ещё не подключены. Данные хранятся в браузере (localStorage) у каждого посетителя, поэтому демо-пароль ничего не открывает за пределами вашего браузера. Сбросить данные — «Настройки → Сбросить демо-данные».

## Что внутри

- Next.js 15 (App Router, static export), TypeScript, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form + Zod.
- `src/lib/services/*` — единая бизнес-логика: `bookings` (BookingService), `availability`, `pricing` (PriceCalculationService), `notifications` (идемпотентные сообщения + напоминания за 24/3 часа).
- `src/lib/api.ts` — фасад в форме REST API `/api/v1/...`: при подключении Spring Boot backend меняется только он.
- Ночи считаются как `[checkIn, checkOut)` — день выезда свободен для следующего заезда. Проверка пересечений повторяется внутри транзакции перед записью.
- Визуализации домов (`src/components/render`) — процедурные SVG, заменяются реальными фото в админке («Дома → Фотографии»).

## Запуск

```bash
npm install
npm run dev   # http://localhost:3000
```

Деплой на GitHub Pages — автоматически из `main` (`.github/workflows/pages.yml`).
