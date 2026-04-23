# Testing api.anondoc.app on Vercel Preview

## Окружения и env-переменные

| Vercel environment | `VITE_API_URL`                     |
|--------------------|------------------------------------|
| Production         | старый Railway URL (Sensitive) — менять только после успешного preview-теста |
| Preview            | `https://api.anondoc.app`          |
| Development        | `` (пусто) — Vite proxy на localhost:3000 |

На Railway (backend) должны быть выставлены:

| Переменная        | Значение                                                          |
|-------------------|-------------------------------------------------------------------|
| `ALLOWED_ORIGINS` | `https://anondoc.app,https://www.anondoc.app,<preview-url>`      |
| `COOKIE_DOMAIN`   | `.anondoc.app`                                                    |

`<preview-url>` добавляется временно на время теста. После мержа в master его можно убрать.

---

## Как понять, что preview работает

1. Vercel создаёт preview-деплой автоматически на каждый push в ветку, отличную от master.
2. URL деплоя появится в GitHub PR или на вкладке Deployments в Vercel.
3. Формат URL: `anondoc-web-git-test-api-subdomain-<username>.vercel.app`
4. Признак успеха — в Network DevTools `POST /auth/refresh` возвращает `200` (не 401, не цикл).

---

## Чеклист ручной проверки в браузере

Открой preview-URL в **инкогнито**. DevTools → Network.

- [ ] **Главная загружается** без ошибок в консоли
- [ ] **`/auth/refresh` вызывается ровно один раз** при загрузке (если нет сессии — `401`, если есть — `200`). Не должно быть цикла повторов.
- [ ] **Логин** (`POST /auth/login`) → `200`, в ответе `accessToken`
- [ ] **Cookie** → DevTools → Application → Cookies → `api.anondoc.app`:
  `refreshToken` присутствует, флаги: `HttpOnly ✓`, `Secure ✓`, `SameSite=Lax`
- [ ] **Перезагрузка страницы** → `POST /auth/refresh` → `200` (сессия восстановилась)
- [ ] **Logout** → cookie `refreshToken` исчезает из Application → Cookies
- [ ] **Console** — нет `Maximum update depth exceeded`, нет необработанных `401`

---

## Переключение в Production (после успешного теста)

1. Смержить `test/api-subdomain` в `master`
2. Vercel → Settings → Environment Variables → `VITE_API_URL` (Production) → изменить на `https://api.anondoc.app`
3. Vercel → Deployments → последний Production-деплой → **Redeploy** (без кеша)
4. Railway → `ALLOWED_ORIGINS` → убрать preview-URL (он больше не нужен)
