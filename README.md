# AnonDoc

Сервис обезличивания персональных данных в документах. PII-движок работает локально в браузере — данные не покидают устройство пользователя.

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Fastify 4, TypeScript ESM |
| База данных | PostgreSQL 16 (Prisma 5) |
| Кэш / rate-limit | Redis 7 |
| PII-движок | `packages/engine` (regex + checksum) |
| Платежи | Stripe, ЮKassa |

## Возможности

- **Анонимизация** — автоматически находит и заменяет ПД на токены (`[ФИО_1]`, `[ТЕЛ_1]` и т.д.)
- **Деанонимизация** — восстанавливает оригинальный текст по сохранённой карте замен
- **Форматы** — TXT, DOCX, XLSX, PDF (текстовые)
- **Типы ПД** — ФИО, телефон, email, ИНН, СНИЛС, паспорт, адрес, дата рождения, банковская карта

---

## Локальная разработка

```bash
# 1. Зависимости
pnpm install

# 2. Поднять PostgreSQL + Redis
docker compose up -d postgres redis

# 3. Применить миграции
pnpm --filter @anondoc/backend db:migrate

# 4. Запустить бэкенд (порт 3000)
pnpm --filter @anondoc/backend dev

# 5. Запустить фронтенд (порт 5173, проксирует API через Vite)
pnpm --filter @anondoc/web dev
```

Переменные среды: скопировать `packages/backend/.env.production.example` → `packages/backend/.env`, заполнить нужные значения.

---

## Деплой: Railway (backend + PostgreSQL + Redis)

### Шаг 1 — Создать проект

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Выбрать репозиторий

### Шаг 2 — Добавить PostgreSQL

**+ Add Service → Database → PostgreSQL**
Railway автоматически добавит `DATABASE_URL` в переменные бэкенда.

### Шаг 3 — Добавить Redis

**+ Add Service → Database → Redis**
Railway автоматически добавит `REDIS_URL`.

### Шаг 4 — Настроить сервис бэкенда

В настройках сервиса (Settings):
- **Root Directory**: `/` (корень монорепо)
- **Dockerfile Path**: `packages/backend/Dockerfile`
- Railway подхватит `railway.toml` из `packages/backend/` автоматически

### Шаг 5 — Переменные среды

Railway → сервис → **Variables**:

```
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
FRONTEND_URL=https://anondoc.ru
ALLOWED_ORIGINS=https://anondoc.ru,https://www.anondoc.ru
NODE_ENV=production
PORT=3000
```

> `DATABASE_URL` и `REDIS_URL` Railway добавляет сам при подключении плагинов.

### Шаг 6 — Первый деплой

Контейнер при старте:
1. `pnpm migrate:prod` — применяет Prisma-миграции
2. `node dist/server.js` — запускает сервер

Проверить: `GET https://<railway-domain>/health`
```json
{ "status": "ok", "version": "1.0.0", "db": "connected", "redis": "connected", "timestamp": "..." }
```

### Шаг 7 — Подключить домен

Railway → сервис → **Settings → Domains** → `api.anondoc.ru`

### Шаг 8 — Настроить Stripe webhook

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
- URL: `https://api.anondoc.ru/billing/webhook`
- Events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## Деплой: Vercel (frontend)

### Шаг 1 — Создать проект

1. [vercel.com](https://vercel.com) → **Add New Project** → импорт из GitHub
2. **Root Directory**: `apps/web`
3. **Framework Preset**: Vite (определяется автоматически)

### Шаг 2 — Переменные среды

Vercel → **Settings → Environment Variables**:

```
VITE_API_URL=https://api.anondoc.ru
```

### Шаг 3 — Деплой

Vercel задеплоит автоматически. SPA-роутинг настроен в `vercel.json`.

### Шаг 4 — Подключить домен

Vercel → **Settings → Domains** → `anondoc.ru`

---

## Все переменные среды

### Backend

| Переменная | Обязательно | Описание |
|-----------|------------|---------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `REDIS_URL` | — | Redis connection string (без Redis работает, но без rate-limit) |
| `JWT_SECRET` | ✓ | Секрет access-токенов (≥ 64 символа) |
| `JWT_REFRESH_SECRET` | — | Секрет refresh-токенов (если не задан — используется JWT_SECRET) |
| `STRIPE_SECRET_KEY` | — | `sk_live_...` из Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | — | `whsec_...` из настроек webhook |
| `STRIPE_PRICE_PRO` | — | Price ID тарифа PRO |
| `STRIPE_PRICE_BUSINESS` | — | Price ID тарифа Business |
| `YUKASSA_SHOP_ID` | — | ЮKassa: идентификатор магазина |
| `YUKASSA_SECRET_KEY` | — | ЮKassa: секретный ключ |
| `RESEND_API_KEY` | — | `re_...` из resend.com |
| `FRONTEND_URL` | ✓ | URL фронтенда (для редиректов Stripe) |
| `ALLOWED_ORIGINS` | ✓ | CORS origins через запятую |
| `NODE_ENV` | ✓ | `production` |
| `PORT` | — | `3000` (по умолчанию) |
| `ADMIN_EMAIL` | — | Email admin-пользователя для seed |
| `ADMIN_PASSWORD` | — | Пароль admin-пользователя для seed |

### Frontend

| Переменная | Описание |
|-----------|---------|
| `VITE_API_URL` | URL бэкенда (Railway domain) |

---

## Команды

```bash
# Зависимости
pnpm install

# Разработка
pnpm --filter @anondoc/backend dev         # бэкенд :3000
pnpm --filter @anondoc/web dev             # фронтенд :5173

# Тесты
pnpm --filter @anondoc/web test --run      # unit-тесты фронтенда
pnpm --filter @anondoc/engine test --run   # тесты PII-движка

# База данных
pnpm --filter @anondoc/backend db:migrate   # создать и применить миграцию (dev)
pnpm --filter @anondoc/backend migrate:prod # применить миграции (prod)
pnpm --filter @anondoc/backend db:seed      # seed (создаёт admin-пользователя)
pnpm --filter @anondoc/backend db:generate  # регенерировать Prisma client

# Сборка
pnpm --filter @anondoc/backend build       # TypeScript → dist/
pnpm --filter @anondoc/web build           # Vite → dist/
```

---

## Чеклист деплоя

```
[ ] Railway проект создан
[ ] PostgreSQL plugin добавлен
[ ] Redis plugin добавлен
[ ] Env переменные настроены (JWT_SECRET, STRIPE_*, ALLOWED_ORIGINS...)
[ ] Первый деплой прошёл (GET /health → {"status":"ok","db":"connected"})
[ ] Домен api.anondoc.ru подключён
[ ] Stripe webhook настроен на /billing/webhook
[ ] Vercel проект создан (root: apps/web)
[ ] VITE_API_URL настроен
[ ] Домен anondoc.ru подключён
[ ] SSL сертификаты активны (выдаются автоматически)
```
