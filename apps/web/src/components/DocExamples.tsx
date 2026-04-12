import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const TABS = ['cv', 'contract', 'medical', 'hr'] as const
type TabKey = typeof TABS[number]

const TAB_KEYS: Record<TabKey, string> = {
  cv: 'examples.tab_cv',
  contract: 'examples.tab_contract',
  medical: 'examples.tab_medical',
  hr: 'examples.tab_hr',
}

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    cancelRef.current = false
    let i = 0
    const tick = () => {
      if (cancelRef.current) return
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
        setTimeout(tick, speed)
      } else {
        setDone(true)
      }
    }
    setTimeout(tick, 80)
    return () => { cancelRef.current = true }
  }, [text, speed])

  return { displayed, done }
}

function anonymizeSample(text: string): string {
  return text
    .replace(/Müller, Hans-Peter|Smith, James Robert|Dupont, Jean-François|Schneider, Julia Maria|Johnson, Sarah Elizabeth|Weber, Anna Katharina|Taylor, Emily Rose|Moreau, Marie-Claire|Petit, Camille Isabelle|Richter|Brown|Lefebvre/g, '[NAME_1]')
    .replace(/\+49[\d\s\-]+|\+44[\d\s\-]+|\+33[\d\s\-]+|089\/\d+[-\d]*|\d{4} \d{3} \d{4}/g, '[TEL_1]')
    .replace(/[a-z.]+@[a-z.]+\.[a-z]{2,}/gi, '[EMAIL_1]')
    .replace(/DE\d{2}[\s\d]+|FR76[\s\d]+|GB29[\s\w\d]+/g, '[IBAN_1]')
    .replace(/86 095 742 719|JG 10 37 59 A|1 82 06 75 115 423 17/g, '[ID_1]')
    .replace(/A987654321|AB 12 34 56 C|401 023 2137|880692310285|012345678|2B06LSX14/g, '[ID_2]')
    .replace(/2 62 11 33 033 127 88/g, '[SSN_1]')
    .replace(/Hauptstraße 42, 80331 München|15 Baker Street, London W1U 6RT|15 rue de la Paix, 75001 Paris|Goethestraße 15, 60313 Frankfurt|8 Victoria Road, Manchester M1 1AE|8 avenue Victor Hugo, 69006 Lyon|Marienplatz 3, 80331 München|12 Market Square, Bristol BS1 1JA|12 place de la République, 33000 Bordeaux/g, '[ADDR_1]')
    .replace(/DE123456789|GB123456789|FR12 732829320/g, '[TAX_1]')
    .replace(/12345678|732 829 320/g, '[ORG_1]')
    .replace(/07\.11\.1962|15\.03\.1985|22\.06\.1979|23\/06\/198[25]|14\/07\/1990|07\/11\/1962/g, '[DOB_1]')
}

export function DocExamples() {
  const { t } = useTranslation('landing')
  const [activeTab, setActiveTab] = useState<TabKey>('cv')
  const [showAnon, setShowAnon] = useState(false)

  const rawText = t(`examples.${activeTab}`)
  const anonText = anonymizeSample(rawText)
  const { displayed, done } = useTypewriter(showAnon ? anonText : rawText)

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setShowAnon(false)
  }

  return (
    <section style={{ background: '#f9fafb', padding: '64px 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          {t('examples.title')}
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '7px 16px', fontSize: 13, fontWeight: 500,
                borderRadius: 8, cursor: 'pointer', border: 'none',
                background: activeTab === tab ? '#1a56db' : '#ffffff',
                color: activeTab === tab ? '#ffffff' : '#6b7280',
                boxShadow: activeTab === tab ? 'none' : '0 0 0 1px #e5e7eb',
                transition: 'all 0.15s',
              }}
            >
              {t(TAB_KEYS[tab])}
            </button>
          ))}
        </div>

        {/* Document display */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Original */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#fff5f5', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('examples.panel_original')}
              </span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>
                {t('examples.fictitious')}
              </span>
            </div>
            <pre style={{
              padding: '16px', margin: 0, fontSize: 12, color: '#374151',
              lineHeight: 1.7, fontFamily: 'monospace', background: '#ffffff',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 160,
            }}>
              {!showAnon ? displayed : rawText}
              {!showAnon && !done && <span style={{ opacity: 0.5 }}>|</span>}
            </pre>
          </div>

          {/* Anonymized */}
          <div style={{ border: '1px solid #dbeafe', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('examples.panel_anonymized')}
              </span>
              <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>✓ safe</span>
            </div>
            <pre style={{
              padding: '16px', margin: 0, fontSize: 12, color: '#374151',
              lineHeight: 1.7, fontFamily: 'monospace', background: '#f8fbff',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 160,
            }}>
              {showAnon ? displayed : anonText}
              {showAnon && !done && <span style={{ opacity: 0.5 }}>|</span>}
            </pre>
          </div>
        </div>

        {/* Animate button */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setShowAnon(v => !v)}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 500,
              background: showAnon ? '#f3f4f6' : '#1a56db',
              color: showAnon ? '#374151' : '#ffffff',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {showAnon ? t('examples.btn_original') : t('examples.btn_anonymize')}
          </button>
        </div>
      </div>
    </section>
  )
}
