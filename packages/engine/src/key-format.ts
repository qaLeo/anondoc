/**
 * AnonDoc .key file format — PEM-like structure for vault serialization.
 *
 * Format:
 *   -----BEGIN ANONDOC KEY-----
 *   Version: AnonDoc/1.0
 *   Document: filename.docx
 *   Session: sess_abc123
 *   Created: 2026-04-14T14:23:00Z
 *   Language: de
 *   Entries: 12
 *
 *   <base64 encoded JSON vault, 64 chars per line>
 *
 *   -----END ANONDOC KEY-----
 */

export interface KeyFileContent {
  version: string
  document: string
  session: string
  created: string
  language: string
  vault: Record<string, string>
  /**
   * Engine version that produced this key.
   * undefined | 1 = legacy (pre-fix, multi-lang token counter was broken)
   * 2            = post-fix (anonymizeMultiLang single-pass, tokens are unique)
   */
  engineVersion?: number
}

const BEGIN_MARKER = '-----BEGIN ANONDOC KEY-----'
const END_MARKER = '-----END ANONDOC KEY-----'
const LINE_WIDTH = 64

/**
 * Encode a UTF-8 string to base64.
 * Uses TextEncoder (available in browser and Node.js ≥18).
 */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

/**
 * Decode a base64 string to UTF-8.
 * Uses TextDecoder (available in browser and Node.js ≥18).
 */
function fromBase64(b64: string): string {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function serializeKey(content: KeyFileContent): string {
  const engineVersion = content.engineVersion ?? 2
  const headers = [
    BEGIN_MARKER,
    `Version: AnonDoc/1.0`,
    `Engine-Version: ${engineVersion}`,
    `Document: ${content.document}`,
    `Session: ${content.session}`,
    `Created: ${content.created}`,
    `Language: ${content.language}`,
    `Entries: ${Object.keys(content.vault).length}`,
    '',
  ].join('\n')

  const base64 = toBase64(JSON.stringify(content.vault))
  const chunked = (base64.match(new RegExp(`.{1,${LINE_WIDTH}}`, 'g')) ?? []).join('\n')

  return `${headers}\n${chunked}\n\n${END_MARKER}\n`
}

export function parseKey(text: string): KeyFileContent {
  const lines = text.split('\n')
  const beginIdx = lines.findIndex(l => l.trim() === BEGIN_MARKER)
  const endIdx = lines.findIndex(l => l.trim() === END_MARKER)

  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('Invalid key file format')
  }

  const headers: Record<string, string> = {}
  let payloadStartIdx = beginIdx + 1

  for (let i = beginIdx + 1; i < endIdx; i++) {
    const line = lines[i].trim()
    if (line === '') {
      payloadStartIdx = i + 1
      break
    }
    const match = line.match(/^([^:]+):\s*(.+)$/)
    if (match) headers[match[1].trim()] = match[2].trim()
  }

  const base64 = lines
    .slice(payloadStartIdx, endIdx)
    .map(l => l.trim())
    .filter(l => l !== '')
    .join('')

  const vault = JSON.parse(fromBase64(base64)) as Record<string, string>

  const engineVersionRaw = headers['Engine-Version']
  return {
    version: headers['Version'] ?? 'AnonDoc/1.0',
    engineVersion: engineVersionRaw ? parseInt(engineVersionRaw, 10) : undefined,
    document: headers['Document'] ?? 'unknown',
    session: headers['Session'] ?? '',
    created: headers['Created'] ?? new Date().toISOString(),
    language: headers['Language'] ?? 'en',
    vault,
  }
}

/**
 * Parse either the new .key format or legacy JSON vault files.
 * Returns the vault and optional metadata.
 */
export function parseKeyFile(text: string): KeyFileContent {
  const trimmed = text.trim()
  if (trimmed.startsWith(BEGIN_MARKER)) {
    return parseKey(text)
  }
  if (trimmed.startsWith('{')) {
    // Legacy JSON format: may be bare vault map or wrapped payload
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    const vault = (parsed['vault'] as Record<string, string> | undefined) ?? (parsed as Record<string, string>)
    return {
      version: (parsed['version'] as string | undefined) ?? 'legacy',
      document: 'unknown',
      session: (parsed['sessionId'] as string | undefined) ?? '',
      created: (parsed['createdAt'] as string | undefined) ?? new Date().toISOString(),
      language: 'en',
      vault,
    }
  }
  throw new Error('Unknown key format')
}
