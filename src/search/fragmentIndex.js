// ─────────────────────────────────────────────────────────────────────────────
//  src/search/fragmentIndex.js
//  Phase 3 — Fragment Index Manager
// ─────────────────────────────────────────────────────────────────────────────
//
//  CONCEPT: What does this file do?
//
//  This is the manager that sits between your app and the raw BM25 algorithm.
//  It handles three things:
//
//  1. BUILDING — creates the index from your corpus on first use
//  2. PERSISTING — saves the index to sessionStorage so it survives navigation
//                  (cleared when the tab closes — not localStorage which is permanent)
//  3. GROWING — when Open Library returns books with opening lines, we add
//               those passages to the index too. The more you search, the better it gets.
//
//  Think of it like a library card catalogue:
//  — corpus.js is the pre-printed cards that come with the library
//  — fragmentIndex.js is the filing system that organises them
//  — every new book result is a new card added to the catalogue
//  — BM25 is the algorithm that searches through the catalogue
// ─────────────────────────────────────────────────────────────────────────────

import { BM25 } from './bm25'
import { OPENING_LINES_CORPUS } from './corpus'

const SESSION_KEY = 'shelf_fragment_index_v1'

// Singleton — only one index exists in the app at any time
let _index = null

// ─── getIndex ─────────────────────────────────────────────────────────────────
//
//  Returns the fragment index, building it if it doesn't exist yet.
//  This is the main function everything else calls.
//
//  First call: reads sessionStorage → if found, restore; if not, build fresh
//  Subsequent calls: returns the in-memory instance immediately

export function getIndex() {
  if (_index) return _index

  // Try to restore from sessionStorage first
  const restored = tryRestoreFromSession()
  if (restored) {
    _index = restored
    console.log(`[fragmentIndex] Restored from session — ${_index.size} passages indexed`)
    return _index
  }

  // Build fresh from the hardcoded corpus
  _index = buildFreshIndex()
  persistToSession(_index)
  console.log(`[fragmentIndex] Built fresh index — ${_index.size} passages indexed`)
  return _index
}

// ─── searchFragments ──────────────────────────────────────────────────────────
//
//  The main search function. Call this instead of index.search() directly
//  so the manager can handle all the setup/persistence for you.
//
//  @param {string}   query    — the user's fragment
//  @param {object}   options
//    @param {number} topK     — number of results
//    @param {string} anatomy  — filter by anatomy type
//
//  @returns {Array} — scored and sorted book matches

export function searchFragments(query, { topK = 8, anatomy = '' } = {}) {
  const index = getIndex()
  const results = index.search(query, { topK, anatomy })

  console.log(`[fragmentIndex] "${query}" → ${results.length} results (index size: ${index.size})`)
  return results
}

// ─── addBooksToIndex ──────────────────────────────────────────────────────────
//
//  CONCEPT: Growing the index
//  When Open Library returns a book with a first_sentence, we add it here.
//  This means every search makes the next search better.
//  This is your data moat building itself automatically.
//
//  @param {Array} books — normalised book objects from Open Library / Google Books
//                         Must have: id, title, author, firstSentence or description

export function addBooksToIndex(books) {
  const index = getIndex()
  let added = 0

  for (const book of books) {
    // Only add books that have a passage to index
    const passage = book.firstSentence || book.snippet
    if (!passage) continue

    // Don't duplicate — check if this book's id is already in the index
    if (index.documents.some(d => d.id === book.id)) continue

    index.addDocument({
      id: book.id,
      text: passage,
      anatomy: book.anatomyType || 'opening_line',
      metadata: {
        title: book.title,
        author: book.author,
        year: book.year,
        cover: book.cover,
        description: book.description,
        synopsis: book.synopsis || book.description,
        moods: book.moods || [],
        source: book.source,
        openLibraryKey: book.openLibraryKey,
        googleBooksId: book.googleBooksId,
      },
    })
    added++
  }

  if (added > 0) {
    persistToSession(index)
    console.log(`[fragmentIndex] Added ${added} new passages — index now ${index.size}`)
  }
}

// ─── getIndexStats ────────────────────────────────────────────────────────────

export function getIndexStats() {
  const index = getIndex()
  const byAnatomy = {}

  for (const doc of index.documents) {
    const a = doc.anatomy || 'unknown'
    byAnatomy[a] = (byAnatomy[a] || 0) + 1
  }

  return {
    total: index.size,
    byAnatomy,
  }
}

// ─── clearIndex ───────────────────────────────────────────────────────────────
//  For development — resets the index to the base corpus

export function clearIndex() {
  _index = null
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  console.log('[fragmentIndex] Index cleared')
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildFreshIndex() {
  const index = new BM25()

  // Add every entry from the hardcoded corpus
  for (const entry of OPENING_LINES_CORPUS) {
    index.addDocument({
      id: entry.id,
      text: entry.text,
      anatomy: entry.anatomy,
      metadata: entry.metadata,
    })
  }

  return index
}

// CONCEPT: sessionStorage
// sessionStorage is like a small key-value store in the browser.
// It's scoped to the current tab and cleared when the tab closes.
// We use it (not localStorage) so the index doesn't grow forever across visits.
// Max storage is ~5MB — plenty for book passages.

function persistToSession(index) {
  try {
    const serialised = JSON.stringify(index.toJSON())
    sessionStorage.setItem(SESSION_KEY, serialised)
  } catch (err) {
    // sessionStorage can throw in private browsing or if storage is full
    // Silently ignore — the index still works in-memory
    console.warn('[fragmentIndex] Could not persist to session:', err.message)
  }
}

function tryRestoreFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const json = JSON.parse(raw)
    const index = BM25.fromJSON(json)

    // Sanity check — if the restored index is too small, rebuild
    if (index.size < OPENING_LINES_CORPUS.length) return null

    return index
  } catch {
    return null
  }
}