import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface Video {
  videoId: string
  title: string
}

// Curated playlist — loops forever, no "watched" tracking
const SEED_VIDEOS: Video[] = [
  { videoId: 'MJ3oGSBTjCU', title: 'Game 7 — 2016 World Series' },
  { videoId: '1KxiDlJDpFE', title: 'Game 6 — 2016 World Series' },
  { videoId: 'aTMEtxLIPH4', title: 'Game 5 — 2016 World Series' },
  { videoId: 'WlGt3fDsMVg', title: 'Cubs Clinch 2016 Pennant' },
  { videoId: 'joaLiRn5gAo', title: 'Schwarber Goes Deep — 2015' },
  { videoId: 'wYMPFpeid0M', title: 'Kerry Wood 20 Strikeouts' },
  { videoId: '5_tbZl5cDww', title: 'Ryne Sandberg Game — 1984' },
  { videoId: 'vq8G81oOHhE', title: 'The Bartman Game — 2003' },
]

const API_BASE = '/api/youtube'

// Cubs logo SVG — always visible as an identity anchor
const CubsLogo = () => (
  <svg viewBox="0 0 100 100" className="cubs-logo" aria-label="Chicago Cubs">
    <circle cx="50" cy="50" r="48" fill="#0e3386" stroke="#cc3433" strokeWidth="4" />
    <text x="50" y="42" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">CHICAGO</text>
    <text x="50" y="68" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="900" fontFamily="system-ui, sans-serif">CUBS</text>
  </svg>
)

const App = () => {
  const [current, setCurrent] = useState<Video>(SEED_VIDEOS[0])
  const [next, setNext] = useState<Video>(SEED_VIDEOS[1])
  const [queue, setQueue] = useState<Video[]>(SEED_VIDEOS.slice(2))
  // Silently fetch related videos from API, merge into queue
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

  // Pre-fetch related videos when current changes
  useEffect(() => {
    let cancelled = false

    const loadRelated = async () => {
      const related = await fetchRelated(current.videoId)
      if (cancelled) return

      const fresh = related.filter(
        (v) => v.videoId !== current.videoId && v.videoId !== next?.videoId
      )

      if (fresh.length > 0) {
        setQueue((prev) => {
          const existing = new Set(prev.map((v) => v.videoId))
          const newOnes = fresh.filter((v) => !existing.has(v.videoId))
          return [...newOnes, ...prev]
        })
      }
    }

    loadRelated()
    return () => { cancelled = true }
  }, [current.videoId, fetchRelated]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    const newCurrent = next || SEED_VIDEOS[0]
    const remaining = queue.filter((v) => v.videoId !== newCurrent.videoId)

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
      {/* Orienting header — Cubs logo + simple label */}
      <div className="header-bar">
        <CubsLogo />
        <span className="header-title">Cubs Classics</span>
      </div>

      {/* Video fills all available space */}
      <div className="video-wrapper">
        <iframe
          key={current.videoId}
          src={`https://www.youtube.com/embed/${current.videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
          title={current.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Now playing — large, readable */}
      <div className="now-playing">
        {current.title}
      </div>

      {/* THE one button */}
      <button className="next-button" onClick={goNext}>
        <span className="next-label">Next Game</span>
        <span className="next-title">{next?.title || SEED_VIDEOS[0].title}</span>
      </button>
    </div>
  )
}

function cleanTitle(raw: string): string {
  const el = document.createElement('span')
  el.innerHTML = raw
  return (el.textContent || raw)
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .trim()
}

export default App
