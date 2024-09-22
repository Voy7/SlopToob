import { themes } from '@/lib/themes'
import Settings from '@/server/Settings'
import Player from '@/server/stream/Player'
import type { MultiListOption } from '@/typings/types'

type ThemeID = (typeof themes)[number]['id']

// Main themes handling class, singleton
class Themes {
  activeThemes: ThemeID[] = []

  constructor() {
    const activeThemesString = Settings.activeThemes
    const activeThemes = activeThemesString
      .split(',')
      .filter((theme) => themes.some((t) => t.id === theme)) as ThemeID[]
    this.activeThemes = activeThemes
    if (activeThemesString !== activeThemes.join(',')) {
      Settings.set('activeThemes', activeThemes as any)
    }
  }

  setActiveThemes(themes: string[]): string {
    this.activeThemes = themes as ThemeID[]
    Player.broadcastStreamInfo()
    return this.activeThemes.join(',')
  }

  get multiListOptionThemes(): MultiListOption {
    return {
      list: themes as any,
      selectedIDs: this.activeThemes
    }
  }
}

export default new Themes()
