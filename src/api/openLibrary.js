// ─────────────────────────────────────────────────────────────────────────────
//  src/api/openLibrary.js
//  Phase 2.5 — Open Library API (Internet Archive)
// ─────────────────────────────────────────────────────────────────────────────
//
//  CONCEPT: Why Open Library alongside Google Books?
//
//  Google Books is great for metadata and covers.
//  Open Library is great for the INSIDE of books — opening lines,
//  dedications, epigraphs — which is shelf's entire differentiator.
//
//  Open Library is completely free, no API key, no account needed.
//  It's maintained by the Internet Archive (archive.org).
//
//  The API has two main endpoints we use:
//
//  1. /search.json  — search for books by query
//                     returns: title, author, cover, first_sentence, subjects
//
//  2. /works/{id}.json — full details for one book
//                        returns: description, excerpts, first_sentences
//
//  CORS: Open Library allows direct browser requests — no backend needed.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://openlibrary.org'

// Fields we ask for in search — only request what you need (faster)
const SEARCH_FIELDS = [
  'key',
  'title',
  'author_name',
  'cover_i',
  'first_sentence',
  'subject',
  'first_publish_year',
  'isbn',
  'number_of_pages_median',
  'ratings_average',
  'want_to_read_count',
].join(',')

// ─── searchOpenLibrary ────────────────────────────────────────────────────────
//
//  General search — used for vibe/natural language and mood queries.
//
//  @param {string} query       — e.g. "dark gothic all-girls school"
//  @param {object} options
//    @param {number} limit     — max results (default 12)
//    @param {string} subject   — optional subject filter e.g. "romance"
//
//  @returns {Array} — normalised book objects

export async function searchOpenLibrary(query, { limit = 12, subject = '' } = {}) {
  if (!query?.trim()) return []

  const params = new URLSearchParams({
    q: query,
    limit,
    fields: SEARCH_FIELDS,
    ...(subject && { subject }),
  })

  try {
    const response = await fetch(`${BASE_URL}/search.json?${params}`)
    if (!response.ok) return []

    const data = await response.json()
    if (!data.docs?.length) return []

    return data.docs.map(normaliseOLSearchResult)
  } catch (error) {
    console.error('[Open Library] Search error:', error)
    return []
  }
}

// ─── searchBySubject ───────────────────────────────────────────────────────────
//
//  Search by subject/genre — Open Library has rich subject tagging.
//  Good for mood board tag matching.
//
//  @param {string[]} subjects — e.g. ["gothic fiction", "boarding schools", "mystery"]
//  @param {number} limit

export async function searchBySubjects(subjects, limit = 12) {
  if (!subjects?.length) return []

  // Combine multiple subjects into one query using Open Library syntax
  const query = subjects.map(s => `subject:"${s}"`).join(' OR ')
  return searchOpenLibrary(query, { limit })
}

// ─── searchByFirstSentence ────────────────────────────────────────────────────
//
//  Fragment search — search for a remembered opening line or passage.
//  This is early Phase 3 territory but the API supports it now.
//
//  @param {string} fragment — misremembered or partial opening line

export async function searchByFirstSentence(fragment, limit = 8) {
  if (!fragment?.trim()) return []

  // Open Library's first_sentence field is searchable
  const params = new URLSearchParams({
    q: fragment,
    limit,
    fields: SEARCH_FIELDS,
  })

  try {
    const response = await fetch(`${BASE_URL}/search.json?${params}`)
    if (!response.ok) return []
    const data = await response.json()
    if (!data.docs?.length) return []
    return data.docs.map(normaliseOLSearchResult)
  } catch (error) {
    console.error('[Open Library] Fragment search error:', error)
    return []
  }
}

// ─── getWorkDetails ────────────────────────────────────────────────────────────
//
//  Fetch full book details including description, excerpts, subjects.
//  Used in BookDetails page to enrich a result after clicking into it.
//
//  @param {string} workKey — Open Library work key, e.g. "/works/OL45804W"
//                           (this comes from the key field in search results)

export async function getWorkDetails(workKey) {
  if (!workKey) return null

  try {
    // workKey includes the /works/ prefix already
    const response = await fetch(`${BASE_URL}${workKey}.json`)
    if (!response.ok) return null
    const data = await response.json()

    return {
      description: extractDescription(data.description),
      subjects: data.subjects || [],
      subjectPeople: data.subject_people || [],
      subjectPlaces: data.subject_places || [],
      subjectTimes: data.subject_times || [],
      excerpts: (data.excerpts || []).map(e => e.excerpt).filter(Boolean),
      firstSentences: data.first_sentences || [],
    }
  } catch (error) {
    console.error('[Open Library] Work details error:', error)
    return null
  }
}

// ─── normaliseOLSearchResult ───────────────────────────────────────────────────
//
//  Convert one Open Library search result → your app's book shape.
//  Same shape as normaliseGoogleBook — so the rest of your app doesn't care
//  which API the book came from.

function normaliseOLSearchResult(doc) {
  const workKey = doc.key || ''

  return {
    // ── Identity ───────────────────────────────
    id: `ol_${workKey.replace('/works/', '')}`,
    openLibraryKey: workKey,
    source: 'open_library',

    // ── Core metadata ──────────────────────────
    title: doc.title || 'Unknown Title',
    author: (doc.author_name || []).slice(0, 2).join(', ') || 'Unknown Author',
    year: doc.first_publish_year || null,
    pageCount: doc.number_of_pages_median || null,

    // ── Identifiers ────────────────────────────
    isbn: (doc.isbn || [])[0] || null,

    // ── Cover image ────────────────────────────
    // Open Library cover IDs → cover URL
    // Size options: S (small), M (medium), L (large)
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,

    // ── Description / opening line ─────────────
    // first_sentence is what makes Open Library special for shelf
    description: null, // Only available in work details, not search
    firstSentence: extractFirstSentence(doc.first_sentence),

    // ── Classification ─────────────────────────
    categories: (doc.subject || []).slice(0, 8),
    moods: deriveOLMoods(doc.subject || []),

    // ── Popularity signal ──────────────────────
    rating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
    wantToRead: doc.want_to_read_count || 0,

    // ── Confidence ─────────────────────────────
    confidence: null,

    // ── Preview ────────────────────────────────
    previewLink: workKey ? `https://openlibrary.org${workKey}` : null,
    snippet: extractFirstSentence(doc.first_sentence),
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractFirstSentence(raw) {
  if (!raw) return null
  // Open Library returns first_sentence as either a string or { value: string }
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw.value) return raw.value
  return null
}

function extractDescription(raw) {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw.value) return raw.value
  return null
}

// Map Open Library's subject tags to your mood vocabulary
function deriveOLMoods(subjects) {
  if (!subjects?.length) return []

  const subjectsLower = subjects.map(s => s.toLowerCase()).join(' ')

  const moodMap = [
    { keywords: ['gothic', 'horror', 'ghost'], mood: 'gothic' },
    { keywords: ['romance', 'love stories'], mood: 'romantic' },
    { keywords: ['mystery', 'detective', 'crime'], mood: 'mystery' },
    { keywords: ['coming of age', 'bildungsroman', 'young adult'], mood: 'coming-of-age' },
    { keywords: ['boarding school', 'school', 'college'], mood: 'school-setting' },
    { keywords: ['friendship', 'found family'], mood: 'found-family' },
    { keywords: ['grief', 'loss', 'death'], mood: 'grief' },
    { keywords: ['historical fiction', 'history'], mood: 'historical' },
    { keywords: ['fantasy', 'magic', 'witches', 'wizards'], mood: 'fantasy' },
    { keywords: ['science fiction', 'dystopia', 'utopia'], mood: 'sci-fi' },
    { keywords: ['thriller', 'suspense', 'psychological'], mood: 'thriller' },
    { keywords: ['literary fiction', 'literary'], mood: 'literary' },
  ]

  return [...new Set(
    moodMap
      .filter(m => m.keywords.some(k => subjectsLower.includes(k)))
      .map(m => m.mood)
  )]
}
