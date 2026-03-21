#!/usr/bin/env node
/**
 * Build-time audit: ensures no external network calls exist in the bundle.
 * Scans for fetch(), WebSocket, XMLHttpRequest, navigator.sendBeacon, and external URLs.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const DIST_DIR = './dist'
const EXTERNAL_URL_PATTERN = /https?:\/\/(?!localhost|127\.0\.0\.1)/g
const NETWORK_PATTERNS = [
  /\bfetch\s*\(/g,
  /new\s+WebSocket\s*\(/g,
  /new\s+XMLHttpRequest\s*\(/g,
  /navigator\.sendBeacon\s*\(/g,
]

function walkDir(dir, files = []) {
  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file)
    if (statSync(fullPath).isDirectory()) {
      walkDir(fullPath, files)
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
      files.push(fullPath)
    }
  }
  return files
}

let hasViolations = false
const files = walkDir(DIST_DIR)

for (const file of files) {
  const content = readFileSync(file, 'utf-8')

  const externalUrls = content.match(EXTERNAL_URL_PATTERN) || []
  if (externalUrls.length > 0) {
    console.error(`[FAIL] External URLs in ${file}:`, externalUrls.slice(0, 5))
    hasViolations = true
  }

  for (const pattern of NETWORK_PATTERNS) {
    const matches = content.match(pattern) || []
    if (matches.length > 0) {
      console.error(`[WARN] Network call pattern '${pattern}' in ${file}`)
    }
  }
}

if (hasViolations) {
  console.error('\nAudit FAILED: External network calls detected in bundle.')
  process.exit(1)
} else {
  console.log('[OK] Offline audit passed — no external URLs detected.')
}
