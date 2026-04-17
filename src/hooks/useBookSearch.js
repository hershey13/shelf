import { useState, useEffect, useCallback, useRef } from 'react'
import { searchBooks } from '../api/bookSearch'
 
export function useBookSearch({ mode, query, tags = [], anatomy = '', enabled = true }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [source, setSource] = useState(null)
  const [meta, setMeta] = useState({})
 
  const abortRef = useRef(null)
 
  const runSearch = useCallback(async () => {
    if (!enabled || (!query?.trim() && !tags?.length)) {
      setResults([])
      setLoading(false)
      return
    }
 
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
 
    setLoading(true)
    setError(null)
 
    try {
      const response = await searchBooks({ mode, query, tags, anatomy })
 
      if (abortRef.current?.signal?.aborted) return
 
      // ── Phase 3 addition ──────────────────────────────────────────────────
      // Attach the original query to every result so BookCard can highlight
      // matched words in the MatchedPassage component.
      const resultsWithQuery = response.results.map(book => ({
        ...book,
        _query: query,
      }))
      // ─────────────────────────────────────────────────────────────────────
 
      setResults(resultsWithQuery)
      setSource(response.source)
      setMeta(response.meta)
    } catch (err) {
      if (abortRef.current?.signal?.aborted) return
      setError(err.message || 'Search failed. Please try again.')
      setResults([])
    } finally {
      if (!abortRef.current?.signal?.aborted) {
        setLoading(false)
      }
    }
  }, [mode, query, JSON.stringify(tags), anatomy, enabled])
 
  useEffect(() => {
    runSearch()
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [runSearch])
 
  return { results, loading, error, source, meta, refetch: runSearch }
}
 
export function useBookDetails(book) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
 
  useEffect(() => {
    if (!book) return
    async function fetchDetails() {
      setLoading(true)
      setError(null)
      try {
        if (book.openLibraryKey) {
          const { getWorkDetails } = await import('../api/openLibrary')
          const workDetails = await getWorkDetails(book.openLibraryKey)
          setDetails(workDetails)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [book?.id])
 
  return { details, loading, error }
}
 