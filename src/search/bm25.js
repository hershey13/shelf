// ─────────────────────────────────────────────────────────────────────────────
//  src/search/bm25.js
//  Phase 3 — BM25 Ranking Algorithm
// ─────────────────────────────────────────────────────────────────────────────
//
//  CONCEPT: What is BM25 and why does shelf need it?
//
//  When someone types "the grief of lighthouses and the sea", they don't
//  remember the exact words. A normal search would only find books containing
//  ALL those words. BM25 ranks documents by how RELEVANT they are to the
//  query — even if only some words match, even if the order is different.
//
//  BM25 stands for "Best Match 25" — it's the algorithm behind Elasticsearch,
//  Google's early search, and most modern search engines.
//
//  It scores each document using three ideas:
//
//  1. TERM FREQUENCY — if "lighthouse" appears 3x in a passage, it's more
//     relevant than one that mentions it once. But not linearly — each extra
//     mention matters less (diminishing returns).
//
//  2. INVERSE DOCUMENT FREQUENCY — if "the" appears in every document,
//     it tells us nothing. If "lighthouse" appears in only 2 of 500 documents,
//     it's a very strong signal. Rare words are weighted higher.
//
//  3. DOCUMENT LENGTH NORMALISATION — a long document naturally contains
//     more words. BM25 normalises for this so a short dedication that mentions
//     "lighthouse" once scores higher than a 300-page novel that mentions it
//     once buried in chapter 12.
//
//  The formula: score(D,Q) = Σ IDF(qi) × [ tf(qi,D) × (k1+1) ]
//                                          [ ─────────────────── ]
//                                          [ tf(qi,D) + k1×(1-b+b×|D|/avgdl) ]
//
//  k1 = 1.5  (term frequency saturation — higher = more weight to frequency)
//  b  = 0.75 (length normalisation — 1.0 = full normalisation, 0 = none)
//
//  You don't need to memorise the formula. Just know:
//  "BM25 scores how relevant a document is to a query, accounting for
//   word rarity and document length."
// ─────────────────────────────────────────────────────────────────────────────

export class BM25 {
  constructor({ k1 = 1.5, b = 0.75 } = {}) {
    this.k1 = k1
    this.b = b

    // The index — built by calling .addDocument() for each book
    this.documents = []      // array of { id, text, tokens, anatomy, ...metadata }
    this.termFrequencies = [] // termFrequencies[i] = { word: count } for doc i
    this.documentFrequency = {} // documentFrequency[word] = how many docs contain it
    this.avgDocumentLength = 0
    this.totalTokens = 0
  }

  // ─── addDocument ────────────────────────────────────────────────────────────
  //
  //  Add one book passage to the index.
  //  Call this for each book in your corpus before searching.
  //
  //  @param {object} doc
  //    id       — unique identifier (your book id)
  //    text     — the passage to index (opening line, dedication, etc.)
  //    anatomy  — 'opening_line' | 'dedication' | 'epigraph' | 'body' | etc.
  //    metadata — anything else you want back in results (title, author, cover…)

  addDocument(doc) {
    const tokens = tokenise(doc.text)
    const tf = computeTermFrequency(tokens)

    // Update document frequency for each unique term in this doc
    for (const term of Object.keys(tf)) {
      this.documentFrequency[term] = (this.documentFrequency[term] || 0) + 1
    }

    this.termFrequencies.push(tf)
    this.documents.push({ ...doc, tokens, tokenCount: tokens.length })

    // Update running average document length
    this.totalTokens += tokens.length
    this.avgDocumentLength = this.totalTokens / this.documents.length

    return this // chainable
  }

  // ─── addDocuments ──────────────────────────────────────────────────────────

  addDocuments(docs) {
    docs.forEach(doc => this.addDocument(doc))
    return this
  }

  // ─── search ───────────────────────────────────────────────────────────────
  //
  //  Search the index.
  //
  //  @param {string} query   — the user's fragment / misremembered passage
  //  @param {object} options
  //    @param {number}   topK        — how many results to return (default 10)
  //    @param {string}   anatomy     — filter to a specific book anatomy section
  //    @param {number}   minScore    — minimum score threshold (default 0)
  //
  //  @returns {Array} — sorted array of { score, confidence, ...doc.metadata }

  search(query, { topK = 10, anatomy = '', minScore = 0.01 } = {}) {
    if (!query?.trim() || !this.documents.length) return []

    const queryTokens = tokenise(query)
    if (!queryTokens.length) return []

    const N = this.documents.length
    const scores = []

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i]

      // Apply anatomy filter if specified
      if (anatomy && doc.anatomy && doc.anatomy !== anatomy && anatomy !== 'not_sure') {
        continue
      }

      let score = 0

      for (const term of queryTokens) {
        const tf = this.termFrequencies[i][term] || 0
        if (tf === 0) continue // this term doesn't appear in this doc

        const df = this.documentFrequency[term] || 0
        if (df === 0) continue

        // IDF: how rare is this term across all documents?
        // The +0.5 / +1 smoothing prevents log(0) and extreme values
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1)

        // TF with saturation and length normalisation
        const docLength = doc.tokenCount
        const normalisedTF =
          (tf * (this.k1 + 1)) /
          (tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocumentLength)))

        score += idf * normalisedTF
      }

      if (score > minScore) {
        scores.push({ score, doc })
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    // Take top K and normalise scores to 0–1 confidence
    const topResults = scores.slice(0, topK)
    const maxScore = topResults[0]?.score || 1

    return topResults.map(({ score, doc }) => ({
      ...doc.metadata,
      id: doc.id,
      anatomy: doc.anatomy,
      matchedText: doc.text,
      score,
      confidence: Math.min(1, score / maxScore),
    }))
  }

  // ─── size ─────────────────────────────────────────────────────────────────

  get size() {
    return this.documents.length
  }

  // ─── Serialise / deserialise ───────────────────────────────────────────────
  //
  //  CONCEPT: Why serialise?
  //  Building the index from scratch every page load is wasteful.
  //  We save it to sessionStorage so it persists across navigations
  //  within the same browser session (cleared when tab closes).

  toJSON() {
    return {
      k1: this.k1,
      b: this.b,
      documents: this.documents,
      termFrequencies: this.termFrequencies,
      documentFrequency: this.documentFrequency,
      avgDocumentLength: this.avgDocumentLength,
      totalTokens: this.totalTokens,
    }
  }

  static fromJSON(json) {
    const index = new BM25({ k1: json.k1, b: json.b })
    index.documents = json.documents
    index.termFrequencies = json.termFrequencies
    index.documentFrequency = json.documentFrequency
    index.avgDocumentLength = json.avgDocumentLength
    index.totalTokens = json.totalTokens
    return index
  }
}

// ─── Tokeniser ────────────────────────────────────────────────────────────────
//
//  Converts a string into an array of normalised tokens.
//  "She was beautiful, wasn't she?" → ['she', 'was', 'beautiful', 'wasn', 'she']
//
//  CONCEPT: Why tokenise?
//  BM25 works on individual words (tokens). We normalise to lowercase
//  and strip punctuation so "Lighthouse." and "lighthouse" match.
//  We also remove stop words — common words like "the", "a", "and"
//  that carry no meaning for search purposes.

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'it', 'its', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they',
  'not', 'no', 'so', 'if', 'up', 'out', 'about', 'into', 'than',
  'then', 'when', 'where', 'who', 'which', 'what', 'there', 'their',
])

function tokenise(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ') // keep hyphens and apostrophes
    .split(/\s+/)
    .map(w => w.replace(/^['-]+|['-]+$/g, '')) // strip leading/trailing ' -
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function computeTermFrequency(tokens) {
  const tf = {}
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1
  }
  return tf
}