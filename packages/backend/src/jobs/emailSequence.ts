/**
 * Email sequence for Free users:
 * Day 0: Welcome
 * Day 5: Use-case (HR)
 * Day 12: Demo offer
 *
 * Stop triggers:
 * - User converted to Business tier
 * - 0 anonymizations in 14 days (lost lead)
 *
 * Run daily as a cron job: 0 8 * * *
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? ''
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'team@anondoc.app'
const REPLY_TO = process.env.SALES_EMAIL ?? 'sales@anondoc.app'

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) {
    console.log(`[emailSequence] SENDGRID_API_KEY not set — skipping email to ${to}`)
    return
  }
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'AnonDoc Team' },
      reply_to: { email: REPLY_TO },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  }).catch(err => console.error('[emailSequence] SendGrid error:', err))
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function firstName(name: string | null): string {
  return name?.split(' ')[0] ?? 'dort'
}

export async function runEmailSequence() {
  const freeUsers = await prisma.user.findMany({
    where: { tier: 'free' },
    select: { id: true, email: true, name: true, createdAt: true, documentsUsedThisMonth: true },
  })

  for (const user of freeUsers) {
    const days = daysSince(user.createdAt)
    const fn = firstName(user.name)

    // Day 0 welcome (send on day 0–1)
    if (days === 0) {
      await sendEmail(
        user.email,
        'Willkommen bei AnonDoc — Ihr erster anonymer KI-Workflow',
        getWelcomeHtml(fn)
      )
    }

    // Day 5 use-case (send on day 5–6)
    if (days === 5) {
      await sendEmail(user.email, 'Wie HR-Abteilungen AnonDoc einsetzen', getUsecaseHtml(fn))
    }

    // Day 12 demo offer (send on day 12–13, only if used at least once)
    if (days === 12 && user.documentsUsedThisMonth > 0) {
      await sendEmail(
        user.email,
        'Wenn mehr als eine Person bei Ihnen mit KI arbeitet',
        getDemoOfferHtml(fn)
      )
    }
  }

  console.log(`[emailSequence] Processed ${freeUsers.length} Free users`)
}

function getWelcomeHtml(firstName: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#374151">
<p>Guten Tag ${firstName},</p>
<p>vielen Dank für Ihre Registrierung. AnonDoc anonymisiert Dokumente,
bevor sie zu KI-Tools wie ChatGPT oder Claude gesendet werden — alles
direkt in Ihrem Browser.</p>
<p>Wenn Sie noch nicht ausprobiert haben:</p>
<ol>
<li>Laden Sie ein Dokument (TXT, DOCX, PDF) in AnonDoc</li>
<li>Anonymisieren — Sie sehen Tokens wie [NAME_1] statt echter Namen</li>
<li>Kopieren Sie den anonymisierten Text in ChatGPT</li>
<li>Fügen Sie die Antwort wieder in AnonDoc ein → Entschlüsseln</li>
</ol>
<p>Fertig. Originaldaten haben nie Ihren Computer verlassen.</p>
<p>Sie haben 10 Dokumente pro Monat im Free-Plan zur Verfügung.</p>
<p><a href="https://anondoc.app" style="color:#1a56db">→ Jetzt loslegen: anondoc.app</a></p>
<p>Bei Fragen einfach antworten.</p>
<p>Beste Grüsse,<br>AnonDoc Team</p>
</body></html>`
}

function getUsecaseHtml(firstName: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#374151">
<p>Guten Tag ${firstName},</p>
<p>ein konkretes Anwendungsbeispiel:</p>
<p>HR-Abteilungen bekommen täglich Bewerbungen mit personenbezogenen
Daten. Diese Lebensläufe direkt in ChatGPT zu kopieren, ist DSGVO-
problematisch — selbst für eine schnelle Erstauswahl.</p>
<p><strong>Mit AnonDoc:</strong></p>
<ul>
<li>Lebenslauf in AnonDoc → Tokens [NAME_1], [TEL_1], [E-MAIL_1]</li>
<li>Anonymisierte Version an ChatGPT für Erstauswahl</li>
<li>Antwort wieder in AnonDoc → Entschlüsseln</li>
<li>Ergebnis: Sie sehen die Antwort mit echten Namen, ChatGPT hat sie nie gesehen</li>
</ul>
<p>Ähnliche Workflows funktionieren bei:</p>
<ul>
<li>Vertragsanalysen in Kanzleien</li>
<li>Mitarbeitergesprächen im HR</li>
<li>Patientenberichten in der Medizin</li>
</ul>
<p>Wichtig: AnonDoc ersetzt keine fachliche Entscheidung — es macht die KI-Vorbereitung rechtssicher.</p>
<p><a href="https://anondoc.app" style="color:#1a56db">→ Anwendungsfall ausprobieren: anondoc.app</a></p>
<p>Beste Grüsse,<br>AnonDoc Team</p>
</body></html>`
}

function getDemoOfferHtml(firstName: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#374151">
<p>Guten Tag ${firstName},</p>
<p>eine Frage: arbeitet bei Ihnen nur Sie mit KI-Tools, oder sind es mehrere Kollegen?</p>
<p>Falls mehrere — der Free-Plan stösst hier an Grenzen. Im Business-Plan gibt es:</p>
<ul>
<li>Geteilten Vault für das gesamte Team</li>
<li>Audit-Log: wer hat wann welches Dokument anonymisiert</li>
<li>Admin-Panel für zentrale Verwaltung</li>
<li>Eine Rechnung statt mehrerer Einzelkonten</li>
<li>AVV mit SCC-Anhang für Ihre Datenschutz-Abteilung</li>
</ul>
<p>Die Konditionen — Anzahl der Benutzer und Preis — vereinbaren wir
individuell. Dafür gibt es einen 15-Min-Termin:</p>
<p><a href="https://anondoc.app/de/demo" style="color:#1a56db">→ Demo buchen: anondoc.app/de/demo</a></p>
<p>Wenn Sie weiterhin allein arbeiten — Free reicht völlig aus, kein Druck.</p>
<p>Beste Grüsse,<br>AnonDoc Team</p>
</body></html>`
}

if (process.argv[1]?.endsWith('emailSequence.js') || process.argv[1]?.endsWith('emailSequence.ts')) {
  runEmailSequence()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      prisma.$disconnect()
      process.exit(1)
    })
}
