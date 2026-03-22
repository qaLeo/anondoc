# Деплой AnonDoc

## Архитектура

```
anondoc.ru        → Vercel  (apps/web)
api.anondoc.ru    → Railway (packages/backend)
                     └── PostgreSQL (Railway plugin)
                     └── Redis      (Railway plugin)
```

---

## 1. Railway — Backend

### 1.1 Создать проект

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Выбрать репозиторий `anondoc`
3. Railway создаст сервис автоматически

### 1.2 PostgreSQL

В проекте: **+ New → Database → PostgreSQL**
`DATABASE_URL` автоматически появится в переменных бэкенда.

### 1.3 Redis

**+ New → Database → Redis**
`REDIS_URL` автоматически появится в переменных бэкенда.

### 1.4 Настройка сервиса бэкенда

Railway → сервис → **Settings**:

| Поле | Значение |
|------|---------|
| Root Directory | `/` |
| Dockerfile Path | `packages/backend/Dockerfile` |
| Health Check Path | `/health` |

Railway автоматически читает `packages/backend/railway.toml`.

### 1.5 Переменные среды

Railway → сервис → **Variables → Raw Editor**, вставить:

```env
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

> `DATABASE_URL` и `REDIS_URL` Railway добавляет сам.

### 1.6 Первый деплой

Railway запустит:
1. Docker build (multi-stage, `packages/backend/Dockerfile`)
2. `pnpm migrate:prod` — Prisma миграции
3. `node dist/server.js` — старт сервера

**Проверка:**
```bash
curl https://<railway-domain>.up.railway.app/health
# → {"status":"ok","version":"1.0.0","db":"connected","redis":"connected"}
```

### 1.7 Подключить домен

Railway → сервис → **Settings → Networking → Custom Domain**: `api.anondoc.ru`

Railway покажет CNAME-запись для DNS.

### 1.8 Stripe Webhook

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
- **URL**: `https://api.anondoc.ru/billing/webhook`
- **Events**: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- Скопировать `Signing secret` → вставить в `STRIPE_WEBHOOK_SECRET`

---

## 2. Vercel — Frontend

### 2.1 Создать проект

1. [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**
2. Выбрать репозиторий `anondoc`
3. Настройки:

| Поле | Значение |
|------|---------|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

### 2.2 Переменные среды

Vercel → **Settings → Environment Variables**:

```env
VITE_API_URL=https://api.anondoc.ru
```

### 2.3 Деплой

**Deploy** — Vercel соберёт и задеплоит.

SPA-роутинг работает через `apps/web/vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### 2.4 Подключить домен

Vercel → **Settings → Domains** → добавить `anondoc.ru` и `www.anondoc.ru`

Vercel покажет необходимые DNS-записи.

---

## 3. DNS на Namecheap

### 3.1 Открыть управление DNS

Namecheap → **Domain List → Manage → Advanced DNS**

Убедиться что **Nameservers** = `Namecheap BasicDNS` (или Custom если используются внешние NS).

### 3.2 Записи для Vercel (фронтенд)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | Auto |
| CNAME | `www` | `cname.vercel-dns.com.` | Auto |

> Точный IP и CNAME берёте из Vercel → Settings → Domains.

### 3.3 Записи для Railway (бэкенд)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | `api` | `<your-service>.up.railway.app.` | Auto |

> Точное значение CNAME берёте из Railway → Settings → Networking → Custom Domain.

### 3.4 Проверка распространения DNS

```bash
# Проверить A-запись фронтенда
dig anondoc.ru A +short

# Проверить CNAME бэкенда
dig api.anondoc.ru CNAME +short

# Онлайн-инструмент
# https://dnschecker.org/#CNAME/api.anondoc.ru
```

DNS распространяется от 5 минут до 48 часов (обычно < 30 минут).

---

## 4. Автоматический деплой (CI/CD)

После настройки Railway и Vercel каждый push в `main`:

```
git push origin main
      │
      ├── GitHub Actions (ci.yml)
      │     ├── pnpm install
      │     ├── engine tests
      │     ├── web tests (221 тест)
      │     ├── backend typecheck
      │     └── build web + backend
      │
      ├── Railway  — автодеплой backend (webhook от GitHub)
      └── Vercel   — автодеплой frontend (webhook от GitHub)
```

Railway и Vercel деплоятся независимо от CI — настройте **branch protection** в GitHub если хотите блокировать деплой при падении тестов:

GitHub → Settings → Branches → **Add rule** → `main` → ✓ Require status checks to pass: `Test & Build`

---

## 5. Чеклист после деплоя

```
RAILWAY
[ ] PostgreSQL plugin добавлен, DATABASE_URL появился
[ ] Redis plugin добавлен, REDIS_URL появился
[ ] Все env переменные заполнены (JWT_SECRET, STRIPE_*, ALLOWED_ORIGINS)
[ ] GET https://api.anondoc.ru/health → {"status":"ok","db":"connected","redis":"connected"}
[ ] CNAME api.anondoc.ru → railway.app работает
[ ] SSL-сертификат активен (Railway выдаёт автоматически)

VERCEL
[ ] Root Directory: apps/web
[ ] VITE_API_URL=https://api.anondoc.ru
[ ] https://anondoc.ru открывается без ошибок
[ ] Перезагрузка страницы на /dashboard не даёт 404
[ ] SSL-сертификат активен (Vercel выдаёт автоматически)

STRIPE
[ ] Webhook настроен на https://api.anondoc.ru/billing/webhook
[ ] STRIPE_WEBHOOK_SECRET обновлён после создания webhook
[ ] Тестовый платёж проходит (используй тестовую карту 4242 4242 4242 4242)

ФУНКЦИОНАЛЬНОСТЬ
[ ] Регистрация нового пользователя работает
[ ] Вход / выход работают
[ ] Анонимизация документа работает
[ ] Деанонимизация восстанавливает 15/15 токенов
[ ] Профиль и страница тарифов открываются
[ ] Пробный период 14 дней отображается

CI/CD
[ ] Push в main проходит GitHub Actions
[ ] Branch protection rule настроен (опционально)
```

---

## 6. Откат в случае проблем

```bash
# Откатить Railway на предыдущий деплой
# Railway → Deployments → выбрать предыдущий → Redeploy

# Откатить Vercel на предыдущий деплой
# Vercel → Deployments → выбрать предыдущий → ... → Promote to Production
```
