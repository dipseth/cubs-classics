import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import CLASSICS from './classics.json'

interface Video {
  videoId: string
  title: string
}

// Pinned classics from classics.yaml — always in the playlist
const PINNED: Video[] = CLASSICS as Video[]

const API_BASE = '/api/youtube'

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function dedup(videos: Video[]): Video[] {
  const seen = new Set<string>()
  return videos.filter((v) => {
    if (seen.has(v.videoId)) return false
    seen.add(v.videoId)
    return true
  })
}

function cleanTitle(raw: string): string {
  const el = document.createElement('span')
  el.innerHTML = raw
  return (el.textContent || raw)
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .trim()
}

// Cubs logo — persistent identity anchor
const CubsLogo = () => (
  <svg viewBox="0 0 100 100" className="cubs-logo" aria-label="Chicago Cubs">
    <circle cx="50" cy="50" r="48" fill="#0e3386" stroke="#cc3433" strokeWidth="4" />
    <text x="50" y="42" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">CHICAGO</text>
    <text x="50" y="68" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="900" fontFamily="system-ui, sans-serif">CUBS</text>
  </svg>
)

const App = () => {
  // Start with a shuffled pinned list so every session feels different
  const [playlist] = useState<Video[]>(() => shuffle(PINNED))
  const [current, setCurrent] = useState<Video>(() => playlist[0])
  const [next, setNext] = useState<Video>(() => playlist[1])
  const [queue, setQueue] = useState<Video[]>(() => playlist.slice(2))
  const [muted, setMuted] = useState(true)
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }, [])

  // Create / recreate player when video changes or mute state changes
  useEffect(() => {
    const create = () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '<div id="yt-player"></div>'
      }

      playerRef.current = new window.YT!.Player('yt-player', {
        videoId: current.videoId,
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            if (!muted) {
              e.target.unMute()
              e.target.setVolume(80)
            }
            e.target.playVideo()
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      create()
    } else {
      (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = create
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [current.videoId, muted])

  const handleUnmute = () => {
    setMuted(false)
    if (playerRef.current) {
      playerRef.current.unMute()
      playerRef.current.setVolume(80)
      playerRef.current.playVideo()
    }
  }

  // Fetch videos from API
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

  // On mount, fetch fresh videos from API and merge with pinned classics
  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      const fresh = await fetchVideos('chicago cubs full game classic')
      if (cancelled || fresh.length === 0) return

      // Merge: shuffled pinned classics first, then shuffled API results
      setQueue((prev) => {
        const merged = dedup([...prev, ...shuffle(fresh)])
        return merged
      })
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
        // Insert related videos at random positions in the queue
        setQueue((prev) => {
          const merged = dedup([...prev, ...fresh])
          return shuffle(merged)
        })
      }
    }
    loadRelated()
    return () => { cancelled = true }
  }, [current.videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    const newCurrent = next || PINNED[0]
    const remaining = queue.filter((v) => v.videoId !== newCurrent.videoId)

    // If queue runs low, re-inject shuffled pinned classics
    const pool = remaining.length > 2
      ? remaining
      : dedup([...remaining, ...shuffle(PINNED)])
          .filter((v) => v.videoId !== newCurrent.videoId)

    const upNext = pool[0] || PINNED[0]
    const newQueue = pool.slice(1)

    setCurrent(newCurrent)
    setNext(upNext)
    setQueue(newQueue)
  }

  return (
    <div className="app">
      <div className="header-bar">
        <CubsLogo />
        <span className="header-title">Cubs Classics</span>
      </div>

      <div className="video-wrapper">
        <div ref={containerRef} className="player-container">
          <div id="yt-player" />
        </div>

        {muted && (
          <button className="unmute-overlay" onClick={handleUnmute}>
            <span className="unmute-icon">🔊</span>
            <span className="unmute-text">Tap to Hear the Game</span>
          </button>
        )}
      </div>

      <div className="now-playing">
        {current.title}
      </div>

      <button className="next-button" onClick={goNext}>
        <span className="next-label">Next Game</span>
        <span className="next-title">{next?.title || PINNED[0].title}</span>
      </button>
    </div>
  )
}

export default App
