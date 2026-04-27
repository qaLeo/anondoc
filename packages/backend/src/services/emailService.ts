import { TRIAL_DAYS } from '../config/plans.js'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const FROM_NOREPLY = 'AnonDoc <noreply@anondoc.app>'
const FROM_INFO    = 'AnonDoc <info@anondoc.app>'
const TO_INFO      = 'info@anondoc.app'

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

// ── Business lead notifications ──────────────────────────────────────────────

interface BusinessLead {
  id: string
  companyName: string
  role: string
  country: string
  industry: string
  expectedVolume: string
  email: string
  message?: string | null
}

export async function sendBusinessLeadEmail(lead: BusinessLead): Promise<void> {
  const volumeLabel: Record<string, string> = {
    LT100: '< 100 / mo', '100_1000': '100–1000 / mo',
    '1000_10000': '1 000–10 000 / mo', GT10000: '10 000+ / mo',
  }
  await sendEmail({
    from: FROM_INFO,
    to: [TO_INFO],
    subject: `[AnonDoc] New business lead: ${lead.companyName} (${lead.country})`,
    html: `<!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
<h2 style="margin:0 0 16px">New Business Lead</h2>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:6px 0;color:#6b7280;width:160px">Company</td><td style="padding:6px 0"><strong>${lead.companyName}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#6b7280">Role</td><td style="padding:6px 0">${lead.role}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280">Country</td><td style="padding:6px 0">${lead.country}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280">Industry</td><td style="padding:6px 0">${lead.industry}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280">Volume</td><td style="padding:6px 0">${volumeLabel[lead.expectedVolume] ?? lead.expectedVolume}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
  ${lead.message ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Message</td><td style="padding:6px 0">${lead.message.replace(/\n/g, '<br>')}</td></tr>` : ''}
</table>
<p style="margin-top:24px"><a href="${APP_URL}/admin/leads/${lead.id}" style="color:#1a56db">View in admin →</a></p>
</body></html>`,
  })
}

export async function sendBusinessAutoReply(toEmail: string, companyName: string): Promise<void> {
  await sendEmail({
    from: FROM_INFO,
    to: [toEmail],
    subject: 'Thanks for your interest in AnonDoc Business',
    html: `<!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
<h2 style="margin:0 0 16px">Thanks for reaching out!</h2>
<p>Hi ${companyName} team,</p>
<p>We received your request and will reply within 2 business days.</p>
<p>In the meantime, you can try AnonDoc free at <a href="${APP_URL}" style="color:#1a56db">anondoc.app</a>.</p>
<p style="margin-top:32px;color:#6b7280">— AnonDoc team · <a href="mailto:info@anondoc.app" style="color:#6b7280">info@anondoc.app</a></p>
</body></html>`,
  })
}

// ── Pro waitlist ─────────────────────────────────────────────────────────────

const WAITLIST_COPY: Record<string, { subject: string; body: string }> = {
  en: {
    subject: "You're on the AnonDoc Pro waitlist",
    body: "You're on the list. We'll notify you as soon as Pro launches — expected Q3 2026.",
  },
  de: {
    subject: 'Sie stehen auf der AnonDoc Pro Warteliste',
    body: 'Sie sind auf der Liste. Wir benachrichtigen Sie, sobald Pro verfügbar ist — voraussichtlich Q3 2026.',
  },
  fr: {
    subject: "Vous êtes sur la liste d'attente AnonDoc Pro",
    body: "Vous êtes sur la liste. Nous vous informerons dès que Pro sera disponible — prévu T3 2026.",
  },
}

export async function sendWaitlistConfirmation(toEmail: string, locale: string): Promise<void> {
  const copy = WAITLIST_COPY[locale] ?? WAITLIST_COPY.en
  await sendEmail({
    from: FROM_NOREPLY,
    to: [toEmail],
    subject: copy.subject,
    html: `<!DOCTYPE html><html lang="${locale}"><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
<h2 style="margin:0 0 16px">✓ You're on the list</h2>
<p>${copy.body}</p>
<p style="margin-top:32px;color:#6b7280">— AnonDoc team · <a href="${APP_URL}" style="color:#6b7280">anondoc.app</a></p>
</body></html>`,
  })
}

// ── Welcome email ─────────────────────────────────────────────────────────────

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
