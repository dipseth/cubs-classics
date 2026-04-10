import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface Video {
  videoId: string
  title: string
}

// Verified seed playlist — fallback if API is unavailable
const SEED_VIDEOS: Video[] = [
  { videoId: '9CaDeppJDnU', title: '2016 World Series Game 7 — Cubs Win It All' },
  { videoId: 'Cic9qAra2Eg', title: '2016 World Series Game 1' },
  { videoId: 'IeW_MgzcdCQ', title: '2016 World Series Game 5' },
  { videoId: 'gSLDM99Vh5E', title: 'Dodgers vs Cubs — July 1986' },
  { videoId: 'z1M4_DVjaKg', title: 'Cubs 9, Phillies 2 — August 1989' },
  { videoId: 'lHTB1oUedMI', title: 'Reds at Cubs — WGN Broadcast 1986' },
  { videoId: 'izX8n9lw_kQ', title: 'Phillies 23, Cubs 22 — May 1979' },
  { videoId: 'mliob1U9IMA', title: 'Dodgers vs Cubs — Tokyo Series' },
  { videoId: 'sqqI2YtaBv8', title: 'White Sox vs Cubs — Spring Training 2024' },
  { videoId: 'ltGFuxMx04w', title: 'Diamondbacks vs Cubs — Wild 8th Inning' },
]

const API_BASE = '/api/youtube'

// Cubs logo — persistent identity anchor
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

  // Fetch videos from API — used for both initial load and related
  const fetchVideos = useCallback(async (query: string): Promise<Video[]> => {
    try {
      const res = await fetch(`${API_BASE}?action=search&q=${encodeURIComponent(query)}`)
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

  // On mount, try to load fresh videos from API
  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const fresh = await fetchVideos('chicago cubs full game classic')
      if (cancelled || fresh.length === 0) return

      // Use API results but keep seeds as backup
      const all = dedup([...fresh, ...SEED_VIDEOS])
      setCurrent(all[0])
      setNext(all[1] || SEED_VIDEOS[1])
      setQueue(all.slice(2))
    }

    bootstrap()
    return () => { cancelled = true }
  }, [fetchVideos])

  // When current video changes, fetch related to enrich queue
  useEffect(() => {
    let cancelled = false

    const loadRelated = async () => {
      const related = await fetchVideos(`cubs ${current.title}`)
      if (cancelled) return

      const fresh = related.filter(
        (v) => v.videoId !== current.videoId && v.videoId !== next?.videoId
      )

      if (fresh.length > 0) {
        setQueue((prev) => dedup([...fresh, ...prev]))
      }
    }

    loadRelated()
    return () => { cancelled = true }
  }, [current.videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    const newCurrent = next || SEED_VIDEOS[0]
    const remaining = queue.filter((v) => v.videoId !== newCurrent.videoId)

    const upNext = remaining.length > 0
      ? remaining[0]
      : SEED_VIDEOS.find((v) => v.videoId !== newCurrent.videoId) || SEED_VIDEOS[0]

    const newQueue = remaining.length > 0
      ? remaining.slice(1)
      : SEED_VIDEOS.filter((v) =>
          v.videoId !== newCurrent.videoId && v.videoId !== upNext.videoId
        )

    setCurrent(newCurrent)
    setNext(upNext)
    setQueue(newQueue)
  }

  return (
    <div className="app">
      {/* Orienting header — always visible */}
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

      {/* Now playing */}
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

function dedup(videos: Video[]): Video[] {
  const seen = new Set<string>()
  return videos.filter((v) => {
    if (seen.has(v.videoId)) return false
    seen.add(v.videoId)
    return true
  })
}

export default App
