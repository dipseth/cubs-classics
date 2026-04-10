import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface Video {
  videoId: string
  title: string
}

// Seed playlist — guaranteed to work without API
const SEED_VIDEOS: Video[] = [
  { videoId: 'MJ3oGSBTjCU', title: 'Game 7 — 2016 World Series' },
  { videoId: '1KxiDlJDpFE', title: 'Game 6 — 2016 World Series' },
  { videoId: 'aTMEtxLIPH4', title: 'Game 5 — 2016 World Series' },
  { videoId: 'WlGt3fDsMVg', title: 'NLCS Game 6 — Cubs clinch 2016 pennant' },
  { videoId: 'joaLiRn5gAo', title: '2015 NLDS Game 4 — Schwarber goes deep' },
  { videoId: 'wYMPFpeid0M', title: 'Kerry Wood 20 Strikeout Game (1998)' },
  { videoId: '5_tbZl5cDww', title: 'Ryne Sandberg Game (1984)' },
  { videoId: 'vq8G81oOHhE', title: 'The Bartman Game — 2003 NLCS Game 6' },
]

const API_BASE = '/api/youtube'

const App = () => {
  const [current, setCurrent] = useState<Video>(SEED_VIDEOS[0])
  const [next, setNext] = useState<Video>(SEED_VIDEOS[1])
  const [queue, setQueue] = useState<Video[]>(SEED_VIDEOS.slice(2))
  const [loading, setLoading] = useState(false)

  // Try to fetch a related video from the API, fall back to seed queue
  const fetchRelated = useCallback(async (videoId: string): Promise<Video[]> => {
    try {
      const res = await fetch(`${API_BASE}?action=related&videoId=${videoId}`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.videos || []).map((v: { videoId: string; title: string }) => ({
        videoId: v.videoId,
        title: cleanTitle(v.title),
      }))
    } catch {
      return []
    }
  }, [])

  // When current video changes, pre-fetch the next recommendation
  useEffect(() => {
    let cancelled = false

    const loadNext = async () => {
      setLoading(true)

      // Try API first
      const related = await fetchRelated(current.videoId)
      if (cancelled) return

      // Filter out current and next to avoid repeats
      const fresh = related.filter(
        (v) => v.videoId !== current.videoId && v.videoId !== next?.videoId
      )

      if (fresh.length > 0) {
        // Merge API results into queue (fresh ones first, then remaining seed)
        setQueue((prev) => {
          const existing = new Set(prev.map((v) => v.videoId))
          const newOnes = fresh.filter((v) => !existing.has(v.videoId))
          return [...newOnes, ...prev]
        })
      }

      setLoading(false)
    }

    loadNext()
    return () => { cancelled = true }
  }, [current.videoId, fetchRelated]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    if (!next) return

    const newCurrent = next
    const remaining = queue.filter((v) => v.videoId !== newCurrent.videoId)

    // Pick next from queue, or loop back to seeds
    const upNext = remaining.length > 0
      ? remaining[0]
      : SEED_VIDEOS.find((v) => v.videoId !== newCurrent.videoId) || SEED_VIDEOS[0]

    const newQueue = remaining.length > 0
      ? remaining.slice(1)
      : SEED_VIDEOS.filter((v) => v.videoId !== newCurrent.videoId && v.videoId !== upNext.videoId)

    setCurrent(newCurrent)
    setNext(upNext)
    setQueue(newQueue)
  }

  return (
    <div className="app">
      {/* Video — takes up as much space as possible */}
      <div className="video-wrapper">
        <iframe
          src={`https://www.youtube.com/embed/${current.videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
          title={current.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Now playing label */}
      <div className="now-playing">
        {current.title}
      </div>

      {/* Single big "Next" button */}
      <button className="next-button" onClick={goNext} disabled={loading && !next}>
        <span className="next-label">Next Game</span>
        <span className="next-title">{next?.title || 'Loading...'}</span>
      </button>
    </div>
  )
}

/** Strip HTML entities and YouTube title noise */
function cleanTitle(raw: string): string {
  const el = document.createElement('span')
  el.innerHTML = raw
  return (el.textContent || raw)
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .trim()
}

export default App
