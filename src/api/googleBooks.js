// ─────────────────────────────────────────────────────────────────────────────
//  src/api/googleBooks.js
//  Phase 2.5 — Google Books API
// ─────────────────────────────────────────────────────────────────────────────
//
//  CONCEPT: What is this file?
//  Think of this as a "translator" between Google's API and your app.
//  Google Books returns a messy JSON object with fields like
//  volumeInfo.imageLinks.thumbnail — this file fetches that data
//  and reshapes it into the clean book shape your app already expects.
//
//  Your React components never talk to Google directly.
//  They just call searchGoogleBooks("some query") and get back
//  a normal array of book objects — same shape as your mock data.
//
//  CORS NOTE: Google Books API allows direct browser requests (no backend needed).
//  The API key goes in the URL as ?key=... — that's normal and fine for this API.
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
const BASE_URL = 'https://www.googleapis.com/books/v1'

// ─── searchGoogleBooks ────────────────────────────────────────────────────────
//
//  Searches Google Books by any query string.
//  Used for: vibe search, natural language, mood queries.
//
//  @param {string} query      — e.g. "dark gothic all-girls school"
//  @param {object} options
//    @param {number} maxResults  — how many books to return (max 40)
//    @param {string} filter      — "partial" | "full" | "free-ebooks" | "paid-ebooks"
//
//  @returns {Array} — array of normalised book objects

export async function searchGoogleBooks(query, { maxResults = 12, filter = '' } = {}) {
  if (!query?.trim()) return []
  return _fetchGoogleBooks(query, { maxResults, filter, withKey: true })
}

async function _fetchGoogleBooks(query, { maxResults, filter, withKey }) {
  const params = new URLSearchParams({
    q: query,
    maxResults,
    printType: 'books',
    langRestrict: 'en',
    ...(withKey && API_KEY && { key: API_KEY }),
    ...(filter && { filter }),
  })

  try {
    const response = await fetch(`${BASE_URL}/volumes?${params}`)

    // If key is wrong/missing, retry once without it
    if (response.status === 401 && withKey) {
      console.warn('[Google Books] API key rejected — retrying without key')
      return _fetchGoogleBooks(query, { maxResults, filter, withKey: false })
    }

    if (!response.ok) return []
    const data = await response.json()
    if (!data.items?.length) return []
    return data.items.map(normaliseGoogleBook)

  } catch (error) {
    console.error('[Google Books] Network error:', error)
    return []
  }
}
// ─── getBookByISBN ─────────────────────────────────────────────────────────────
//
//  Fetch a single specific book by its ISBN.
//  Used for: image search pipeline (cover → ISBN → book details)
//
//  @param {string} isbn — 10 or 13 digit ISBN

export async function getBookByISBN(isbn) {
  if (!isbn) return null

  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: 1,
    ...(API_KEY && { key: API_KEY }),
  })

  try {
    const response = await fetch(`${BASE_URL}/volumes?${params}`)
    const data = await response.json()
    if (!data.items?.length) return null
    return normaliseGoogleBook(data.items[0])
  } catch (error) {
    console.error('[Google Books] ISBN lookup error:', error)
    return null
  }
}

// ─── getBookById ───────────────────────────────────────────────────────────────
//
//  Fetch full details for a single book by its Google Books volume ID.
//  Returns more data than search results (full description, categories, etc.)
//
//  @param {string} volumeId — Google's internal ID, looks like "zyTCAlFPjgYC"

export async function getBookById(volumeId) {
  if (!volumeId) return null

  try {
    const params = new URLSearchParams(API_KEY ? { key: API_KEY } : {})
    const response = await fetch(`${BASE_URL}/volumes/${volumeId}?${params}`)
    const data = await response.json()
    return normaliseGoogleBook(data)
  } catch (error) {
    console.error('[Google Books] Volume fetch error:', error)
    return null
  }
}

// ─── normaliseGoogleBook ───────────────────────────────────────────────────────
//
//  CONCEPT: Normalisation / data mapping
//  APIs return data in their own weird shape. Normalising means converting
//  it into the shape YOUR app uses. This means the rest of your app
//  doesn't care whether a book came from Google or Open Library —
//  it always gets the same object structure.
//
//  This function converts one Google Books "volume" → your book shape.

function normaliseGoogleBook(volume) {
  const info = volume.volumeInfo || {}
  const images = info.imageLinks || {}

  return {
    // ── Identity ───────────────────────────────
    id: `gb_${volume.id}`,          // prefix "gb_" so we know it's from Google
    googleBooksId: volume.id,
    source: 'google_books',

    // ── Core metadata ──────────────────────────
    title: info.title || 'Unknown Title',
    author: (info.authors || []).join(', ') || 'Unknown Author',
    year: info.publishedDate?.slice(0, 4) || null,
    publisher: info.publisher || null,
    pageCount: info.pageCount || null,
    language: info.language || 'en',

    // ── Identifiers ────────────────────────────
    isbn: extractISBN(info.industryIdentifiers),

    // ── Cover image ────────────────────────────
    // Google serves covers as HTTP — we upgrade to HTTPS, and prefer large size
    cover: (images.large || images.thumbnail || '')
      .replace('http://', 'https://')
      .replace('&zoom=1', ''),

    // ── Description ────────────────────────────
    description: info.description || null,

    // ── Classification ─────────────────────────
    // Google's categories are broad ("Fiction", "Juvenile Fiction")
    // We keep them as fallback mood tags
    categories: info.categories || [],
    moods: deriveGoogleMoods(info),

    // ── Preview ────────────────────────────────
    previewLink: info.previewLink || null,
    snippet: volume.searchInfo?.textSnippet?.replace(/<[^>]+>/g, '') || null,

    // ── Confidence ─────────────────────────────
    // Google doesn't give relevance scores — we'll compute this in bookSearch.js
    confidence: null,
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractISBN(identifiers) {
  if (!identifiers?.length) return null
  // Prefer ISBN_13 over ISBN_10
  const isbn13 = identifiers.find(i => i.type === 'ISBN_13')
  const isbn10 = identifiers.find(i => i.type === 'ISBN_10')
  return (isbn13 || isbn10)?.identifier || null
}

// Map Google's broad categories to your mood vocabulary
function deriveGoogleMoods(info) {
  const categories = (info.categories || []).join(' ').toLowerCase()
  const description = (info.description || '').toLowerCase()
  const combined = categories + ' ' + description

  const moodMap = [
    { keywords: ['thriller', 'suspense', 'mystery'], mood: 'dark' },
    { keywords: ['romance', 'love'], mood: 'romantic' },
    { keywords: ['horror', 'gothic', 'ghost'], mood: 'gothic' },
    { keywords: ['coming of age', 'young adult', 'teen'], mood: 'coming-of-age' },
    { keywords: ['literary', 'contemporary fiction'], mood: 'literary' },
    { keywords: ['historical'], mood: 'historical' },
    { keywords: ['fantasy', 'magic', 'wizard'], mood: 'fantasy' },
    { keywords: ['science fiction', 'sci-fi', 'dystopia'], mood: 'sci-fi' },
  ]

  return moodMap
    .filter(m => m.keywords.some(k => combined.includes(k)))
    .map(m => m.mood)
}