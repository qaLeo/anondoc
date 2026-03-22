import { TRIAL_DAYS } from '../config/plans.js'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

interface EmailPayload {
  from: string
  to: string[]
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your_resend_api_key') {
    console.log('[email] RESEND_API_KEY not configured — skipping send to:', payload.to[0])
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const firstName = name?.split(' ')[0] ?? 'пользователь'

  await sendEmail({
    from: 'AnonDoc <noreply@anondoc.ru>',
    to: [email],
    subject: `Добро пожаловать в AnonDoc — у вас ${TRIAL_DAYS} дней Pro`,
    html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Добро пожаловать в AnonDoc</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E0E0E0;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#1976D2;padding:28px 36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;width:32px;height:32px;background:#fff;border-radius:8px;text-align:center;line-height:32px;font-size:18px;font-weight:700;color:#1976D2;">A</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">AnonDoc</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A2E;letter-spacing:-0.3px;">
                Привет, ${firstName}! 👋
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#616161;line-height:1.6;">
                Добро пожаловать в <strong>AnonDoc</strong> — сервис обезличивания документов.<br/>
                Ваш аккаунт активен, и вам автоматически подключён <strong>14-дневный пробный период Pro</strong>.
              </p>

              <!-- Trial badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:14px 18px;">
                    <span style="font-size:14px;color:#1976D2;font-weight:600;">
                      🎁 Pro-период: ${TRIAL_DAYS} дней бесплатно
                    </span>
                    <p style="margin:6px 0 0;font-size:13px;color:#1565C0;">
                      Безлимитные документы · Все форматы · Все страны СНГ
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What you can do -->
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1A1A2E;">Что можно делать с Pro:</p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  'Загружать TXT, DOCX, XLSX, PDF без ограничений',
                  'Обезличивать ФИО, ИНН, СНИЛС, паспорта, контакты',
                  'Работать с документами РФ, Казахстана, Беларуси, Узбекистана',
                  'Использовать API для интеграции в ваши системы',
                ].map((f) => `
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#2E7D32;font-weight:700;margin-right:8px;">✓</span>
                    <span style="font-size:14px;color:#424242;">${f}</span>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:8px;background:#1976D2;">
                    <a href="${APP_URL}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:0.2px;">
                      Перейти в AnonDoc →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9E9E9E;line-height:1.6;">
                После окончания пробного периода аккаунт автоматически перейдёт на план Free (10 документов/мес).<br/>
                Продлить Pro можно в любой момент на странице <a href="${APP_URL}/pricing" style="color:#1976D2;text-decoration:none;">тарифов</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAFAFA;border-top:1px solid #E0E0E0;padding:16px 36px;">
              <p style="margin:0;font-size:12px;color:#9E9E9E;">
                © 2026 AnonDoc · Обработка данных соответствует ФЗ-152 ·
                <a href="${APP_URL}" style="color:#9E9E9E;">anondoc.ru</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
