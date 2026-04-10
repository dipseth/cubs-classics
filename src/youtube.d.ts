/* Minimal YouTube IFrame API type declarations */
interface YTPlayer {
  destroy(): void
  playVideo(): void
  unMute(): void
  setVolume(vol: number): void
}

interface YTPlayerEvent {
  target: YTPlayer
}

interface YTPlayerConstructor {
  new (el: string, opts: {
    videoId: string
    playerVars?: Record<string, number>
    events?: {
      onReady?: (e: YTPlayerEvent) => void
      onError?: (e: YTPlayerEvent) => void
    }
  }): YTPlayer
}

interface YTNamespace {
  Player: YTPlayerConstructor
}

interface Window {
  YT?: YTNamespace
  onYouTubeIframeAPIReady?: () => void
}
