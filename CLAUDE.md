# AnonDoc — Developer Guide

## Project Overview
Offline-first tool for anonymizing Russian personal data (PII) in documents. Compliant with ФЗ-152.

## Tech Stack
- **Build**: Vite 6 + React 19 + TypeScript 5.7
- **State**: Zustand 5 (slice pattern + immer). Persist ONLY to encrypted vault, NOT localStorage
- **UI**: Tailwind CSS + shadcn/ui + TanStack Table + @tanstack/react-virtual
- **Desktop**: Tauri 2.x
- **Encryption**: Argon2id (hash-wasm) + AES-256-GCM, IndexedDB via Dexie.js
- **DOCX**: JSZip + DOMParser (direct XML manipulation)
- **XLSX**: ExcelJS only (read + write)
- **PDF**: pdfjs-dist (read) + pdf-lib (write via canvas re-render)
- **OCR**: Tesseract.js (lazy-loaded, NOT in main bundle)
- **Tests**: Vitest + Testing Library + Playwright (E2E)

## Critical Rules
1. **NEVER use Math.random()** — use `crypto.getRandomValues()` only (ESLint rule enforces this)
2. **NEVER persist PII mappings to localStorage** — only to encrypted IndexedDB vault
3. **NEVER add external network requests** — this is an offline-first app
4. **Tesseract.js** must be lazy-loaded: `const t = await import('tesseract.js')`
5. **PDF export**: must use canvas re-render to produce image-based PDF (no text layer)
6. **Argon2id params**: t=3, m=65536 (64MB), p=4. Minimum password: 12 chars

## Project Structure
- `src/engine/` — PII detection, parsers, exporters, anonymizer
- `src/store/` — Zustand slices (core, vault, settings)
- `src/vault/` — encryption, Dexie DB, vault service
- `src/workers/` — single Web Worker for parse + detect
- `src/components/` — React components
- `src/pages/` — page components (wizard pattern, no router)
- `e2e/` — Playwright E2E tests
- `bench/` — performance benchmarks
- `scripts/` — build-time utilities

## Running
- `npm run dev` — development server
- `npm run test` — unit tests
- `npm run test:e2e` — E2E tests
- `npm run tauri:dev` — Tauri desktop dev mode
- `npm run audit:offline` — verify no external network calls in bundle

## Architecture Notes
- **Single Web Worker** (`processingWorker.ts`): receives File, parses it, detects PII, returns results
- **Wizard pattern**: no react-router-dom, state-driven page rendering
- **Virtualization**: TokenText uses @tanstack/react-virtual for large documents
- **Vault destroy**: overwrites with random data → flush → delete DB → generates destruction certificate
