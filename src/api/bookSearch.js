import { searchGoogleBooks } from './googleBooks'
import { searchOpenLibrary, searchBySubjects, searchByFirstSentence } from './openLibrary'
import { searchFragments, addBooksToIndex } from '../search/fragmentIndex'
import { MOCK_BOOKS } from '../data/books'
 
// ─── searchBooks ──────────────────────────────────────────────────────────────
 
export async function searchBooks({ mode = 'vibe', query = '', tags = [], anatomy = '' }) {
  if (!query?.trim() && !tags?.length) {
    return { results: [], source: 'none', meta: { query, mode } }
  }
 
  try {
    let results = []
    let source = 'api'
 
    switch (mode) {
      case 'vibe':
        results = await vibeSearch(query)
        break
 
      case 'fragment':
        results = await fragmentSearch(query, anatomy)
        break
 
      case 'mood_board':
        results = await moodBoardSearch(query, tags)
        break
 
      case 'image':
        // Image mode: extracted text treated as fragment
        results = await fragmentSearch(query, anatomy)
        break
 
      case 'epilogue':
        results = await vibeSearch(`ending epilogue ${query}`)
        break
 
      case 'special_mentions':
        results = await specialMentionsSearch(query)
        break
 
      default:
        results = await vibeSearch(query)
    }
 
    if (!results.length) {
      results = mockFallback(query)
      source = 'mock_fallback'
    }
 
    const scored = scoreAndSort(results, query)
    const deduped = deduplicateBooks(scored)
 
    return {
      results: deduped,
      source,
      meta: { query, mode, count: deduped.length },
    }
 
  } catch (error) {
    console.error('[bookSearch] Search failed:', error)
    return {
      results: mockFallback(query),
      source: 'mock_fallback',
      meta: { query, mode, error: error.message },
    }
  }
}
 
// ─── Search strategies ────────────────────────────────────────────────────────
 
async function vibeSearch(query) {
  const [googleResult, olResult] = await Promise.allSettled([
    searchGoogleBooks(query, { maxResults: 10 }),
    searchOpenLibrary(query, { limit: 10 }),
  ])
 
  const googleBooks = googleResult.status === 'fulfilled' ? googleResult.value : []
  const olBooks = olResult.status === 'fulfilled' ? olResult.value : []
 
  const combined = [...googleBooks, ...olBooks]
 
  // Grow the fragment index with any opening lines we got back
  addBooksToIndex(combined)
 
  return combined
}
 
async function fragmentSearch(query, anatomy) {
  // ── Step 1: BM25 local index search (instant, offline) ──────────────────
  //
  //  CONCEPT: Why search locally first?
  //  BM25 runs in the browser in milliseconds — no network request needed.
  //  If we find good results in our local index, we show them immediately
  //  while the API search runs in the background.
  //
  //  "Good results" = at least one result with confidence > 0.3
 
  const localResults = searchFragments(query, { topK: 6, anatomy })
  const hasGoodLocalResults = localResults.some(r => r.confidence > 0.3)
 
  // ── Step 2: Open Library API search (parallel with display) ─────────────
  //
  //  Even if we have local results, we also query Open Library
  //  to find books NOT yet in our index, and add them for next time.
 
  const [olResult, googleResult] = await Promise.allSettled([
    searchByFirstSentence(query, 6),
    searchGoogleBooks(`"${query}"`, { maxResults: 4 }),
  ])
 
  const olBooks = olResult.status === 'fulfilled' ? olResult.value : []
  const googleBooks = googleResult.status === 'fulfilled' ? googleResult.value : []
 
  // Add API results to the index for future searches
  addBooksToIndex([...olBooks, ...googleBooks])
 
  // ── Step 3: Merge local BM25 results with API results ───────────────────
  //
  //  Local BM25 results come first (they're most precisely matched).
  //  API results follow as supplementary matches.
  //
  //  Convert local results to the same shape as API book objects
  const localAsBooks = localResults.map(r => ({
    id: r.id,
    title: r.title,
    author: r.author,
    year: r.year,
    cover: r.cover,
    synopsis: r.synopsis || r.matchedText,
    description: r.synopsis || r.matchedText,
    moods: r.moods || [],
    confidence: r.confidence,
    anatomy: r.anatomy,
    matchedText: r.matchedText,
    source: 'fragment_index',
  }))
 
  return [...localAsBooks, ...olBooks, ...googleBooks]
}
 
async function moodBoardSearch(query, tags) {
  const subjects = tags.length
    ? tags.map(tagToSubject).filter(Boolean)
    : [query]
 
  const [subjectResult, googleResult] = await Promise.allSettled([
    searchBySubjects(subjects, 10),
    searchGoogleBooks(tags.join(' ') || query, { maxResults: 8 }),
  ])
 
  const subjectBooks = subjectResult.status === 'fulfilled' ? subjectResult.value : []
  const googleBooks = googleResult.status === 'fulfilled' ? googleResult.value : []
 
  const combined = [...subjectBooks, ...googleBooks]
  addBooksToIndex(combined)
  return combined
}
 
async function specialMentionsSearch(query) {
  const enrichedQuery = `${query} dedication acknowledgments`
 
  const [olResult, googleResult] = await Promise.allSettled([
    searchOpenLibrary(enrichedQuery, { limit: 10 }),
    searchGoogleBooks(query, { maxResults: 8 }),
  ])
 
  const olBooks = olResult.status === 'fulfilled' ? olResult.value : []
  const googleBooks = googleResult.status === 'fulfilled' ? googleResult.value : []
 
  const combined = [...olBooks, ...googleBooks]
  addBooksToIndex(combined)
  return combined
}
 
// ─── Scoring ──────────────────────────────────────────────────────────────────
 
function scoreAndSort(books, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
 
  return books
    .map(book => {
      // If the book already has a BM25 confidence score, keep it
      if (book.confidence !== null && book.confidence !== undefined && book.source === 'fragment_index') {
        return book
      }
 
      let score = 0.5
 
      const titleLower = book.title?.toLowerCase() || ''
      const authorLower = book.author?.toLowerCase() || ''
      const descLower = (book.description || book.synopsis || '').toLowerCase()
      const snippetLower = (book.snippet || book.matchedText || '').toLowerCase()
 
      if (queryWords.some(w => titleLower.includes(w))) score += 0.2
      if (queryWords.some(w => authorLower.includes(w))) score += 0.1
      if (queryWords.some(w => descLower.includes(w) || snippetLower.includes(w))) score += 0.1
      if (book.cover) score += 0.05
      if (book.description || book.synopsis || book.firstSentence) score += 0.05
      if (book.rating && book.rating > 3.5) score += 0.03
 
      return { ...book, confidence: Math.min(1.0, score) }
    })
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
}
 
function deduplicateBooks(books) {
  const seen = new Set()
  const result = []
 
  for (const book of books) {
    if (book.isbn) {
      if (seen.has(`isbn:${book.isbn}`)) continue
      seen.add(`isbn:${book.isbn}`)
    }
    const titleKey = `title:${normaliseKey(book.title)}_${normaliseKey(book.author)}`
    if (seen.has(titleKey)) continue
    seen.add(titleKey)
    result.push(book)
  }
 
  return result
}
 
function normaliseKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
}
 
function mockFallback(query) {
  if (!query?.trim()) return MOCK_BOOKS.slice(0, 6)
  const words = query.toLowerCase().split(/\s+/)
  return MOCK_BOOKS
    .map(book => {
      const text = `${book.title} ${book.author} ${book.description || ''} ${(book.moods || []).join(' ')}`.toLowerCase()
      const matches = words.filter(w => text.includes(w)).length
      return { ...book, confidence: matches / words.length }
    })
    .filter(b => b.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8)
}
 
function tagToSubject(tag) {
  const tagMap = {
    'morally grey protagonist': 'antiheroes',
    'enemies to lovers': 'romance',
    'unreliable narrator': 'psychological fiction',
    'dark academia': 'academic fiction',
    'found family': 'friendship',
    'slow burn': 'romance',
    'gothic': 'gothic fiction',
    'boarding school': 'boarding schools',
    'sapphic': 'lesbian fiction',
    'cozy mystery': 'mystery and detective stories',
    'historical fiction': 'historical fiction',
    'coming of age': 'coming of age',
    'grief': 'grief',
    'magical realism': 'magical realism',
  }
  return tagMap[tag?.toLowerCase()] || tag
}
 