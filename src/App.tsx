import { useState } from 'react'
import './App.css'

interface Game {
  id: string
  videoId: string
  title: string
  year: number
  opponent: string
  tags: string[]
}

const GAMES: Game[] = [
  {
    id: 'game7-2016',
    videoId: 'MJ3oGSBTjCU',
    title: 'Game 7 — 2016 World Series',
    year: 2016,
    opponent: 'Indians',
    tags: ['World Series', 'Postseason'],
  },
  {
    id: 'game6-2016',
    videoId: '1KxiDlJDpFE',
    title: 'Game 6 — 2016 World Series',
    year: 2016,
    opponent: 'Indians',
    tags: ['World Series', 'Postseason'],
  },
  {
    id: 'game5-2016',
    videoId: 'aTMEtxLIPH4',
    title: 'Game 5 — 2016 World Series',
    year: 2016,
    opponent: 'Indians',
    tags: ['World Series', 'Postseason'],
  },
  {
    id: 'nlcs-2016',
    videoId: 'WlGt3fDsMVg',
    title: 'NLCS Game 6 — Cubs clinch pennant',
    year: 2016,
    opponent: 'Dodgers',
    tags: ['NLCS', 'Postseason'],
  },
  {
    id: 'nlds-2015',
    videoId: 'joaLiRn5gAo',
    title: 'NLDS Game 4 — Schwarber goes deep',
    year: 2015,
    opponent: 'Cardinals',
    tags: ['NLDS', 'Postseason'],
  },
  {
    id: 'kerry-wood-20k',
    videoId: 'wYMPFpeid0M',
    title: 'Kerry Wood 20 Strikeout Game',
    year: 1998,
    opponent: 'Astros',
    tags: ['Classic', 'Regular Season'],
  },
  {
    id: 'sandberg-game',
    videoId: '5_tbZl5cDww',
    title: 'Ryne Sandberg Game — 2 game-tying HRs',
    year: 1984,
    opponent: 'Cardinals',
    tags: ['Classic', 'Regular Season'],
  },
  {
    id: 'bartman-game',
    videoId: 'vq8G81oOHhE',
    title: 'NLCS Game 6 — The Bartman Game',
    year: 2003,
    opponent: 'Marlins',
    tags: ['NLCS', 'Postseason', 'Infamous'],
  },
]

const ALL_TAGS = [...new Set(GAMES.flatMap((g) => g.tags))].sort()

const App = () => {
  const [activeGame, setActiveGame] = useState<Game>(GAMES[0])
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filteredGames = activeTag
    ? GAMES.filter((g) => g.tags.includes(activeTag))
    : GAMES

  return (
    <div className="app">
      <header className="header">
        <h1>🐻 Cubs Classics</h1>
        <p className="subtitle">Relive the greatest moments in Chicago Cubs history</p>
      </header>

      <main className="main">
        <section className="player-section">
          <div className="video-container">
            <iframe
              src={`https://www.youtube.com/embed/${activeGame.videoId}?rel=0&modestbranding=1&hd=1`}
              title={activeGame.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="now-playing">
            <h2>{activeGame.title}</h2>
            <span className="meta">
              {activeGame.year} &middot; vs {activeGame.opponent}
            </span>
          </div>
        </section>

        <section className="games-section">
          <div className="tag-filters">
            <button
              className={`chip ${activeTag === null ? 'chip-active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                className={`chip ${activeTag === tag ? 'chip-active' : ''}`}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="game-grid">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                className={`game-card ${game.id === activeGame.id ? 'game-card-active' : ''}`}
                onClick={() => setActiveGame(game)}
              >
                <img
                  src={`https://img.youtube.com/vi/${game.videoId}/mqdefault.jpg`}
                  alt={game.title}
                  className="game-thumb"
                  loading="lazy"
                />
                <div className="game-info">
                  <span className="game-title">{game.title}</span>
                  <span className="game-meta">{game.year} &middot; vs {game.opponent}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
