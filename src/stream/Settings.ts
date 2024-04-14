import prisma from '@/lib/prisma'
import Logger from '@/lib/Logger'

enum StreamMode {
  Queue = 'Queue',
  Movie = 'Movie',
}

// All settings and their types
type SettingsList = {
  streamMode: StreamMode,
  activePlaylistID: string,
  allowVoteSkip: boolean,
  voteSkipPercentage: number,
  bumperIntervalMinutes: number,
  targetQueueSize: number,
  cacheVideos: boolean,
  cacheBumpers: boolean,
  finishTranscodeIfSkipped: boolean,
}

type DefaultSettings = {
  [key in keyof SettingsList]: string | boolean | number | { enum: any, default: any }
}

/// Default settings, and their default values
const defaultSettings: DefaultSettings = {
  streamMode: {
    enum: StreamMode,
    default: StreamMode.Queue
  },
  activePlaylistID: 'None',
  allowVoteSkip: true,
  voteSkipPercentage: 0.5,
  bumperIntervalMinutes: 1800, // 30 minutes
  targetQueueSize: 5,
  cacheVideos: true,
  cacheBumpers: true,
  finishTranscodeIfSkipped: true,
} as const


export default new class Settings {
  private settings: SettingsList | null = null
  private onReadyCallback: (() => void) | null = null

  constructor() {
    this.createDefaultSettings()
  }

  getSettings(): SettingsList {
    if (!this.settings) throw new Error('Tried to get settings before they were initialized.')
    return this.settings
  }

  // value is any type in SettingsList
  async setSetting(key: keyof SettingsList, value: any) {
    // If settings are not loaded yet, wait for them and re-run the function
    if (!this.settings) {
      await this.getSettings()
      await this.setSetting(key, value)
      return
    }

    const valueIsValid = this.isValidValue(key, value)
    if (!valueIsValid) {
      Logger.error(`Failed to update setting. Invalid value for settings.${key}: ${value}`)
      return
    }

    this.settings[key] = value as never // This is a hack to make TS happy, because it doesn't understand that value is valid
    await prisma.settings.update({
      where: { key },
      data: { value: value.toString() }
    })
  }

  onReady(callback: () => void) {
    if (this.settings) return callback()
    this.onReadyCallback = callback
  }

  private async createDefaultSettings() {
    const allSettings = await prisma.settings.findMany()

    function getDefaultValue(key: keyof SettingsList): any {
      const defaultValue = defaultSettings[key]

      if (typeof defaultValue === 'object' && 'default' in defaultValue) {
        return defaultValue.default
      }

      return defaultValue
    }

    const vars: {
      [key: string]: string | boolean
    } = {}

    for (const settingKey in defaultSettings) {
      const key = settingKey as keyof SettingsList
      const existingSetting = allSettings.find((s) => s.key === key)

      if (!existingSetting) {
        Logger.info(`Setting ${key} not found, creating with default value`)
        const defaultValue = getDefaultValue(key)
        vars[key] = defaultValue
        await prisma.settings.create({
          data: { key, value: defaultValue.toString() }
        })
        continue
      }

      if (!this.isValidValue(key, existingSetting.value)) {
        Logger.warn(`Invalid value for settings.${key}: ${existingSetting.value}, resetting to default.`)

        const defaultValue = getDefaultValue(key)
        vars[key] = defaultValue
        await prisma.settings.update({
          where: { key },
          data: { value: defaultValue.toString() }
        })
        continue
      }

      vars[key] = existingSetting.value
    }

    this.settings = vars as unknown as SettingsList

    this.onReadyCallback?.()
  }

  private isValidValue(key: keyof SettingsList, value: any): boolean {
    const defaultValue = defaultSettings[key]

    // Is enum checker
    if (typeof defaultValue === 'object' && 'enum' in defaultValue) {
      const enumValues = Object.values(defaultValue.enum)
      if (enumValues.includes(value)) return true
    }

    if (typeof defaultValue === 'boolean') value = Boolean(value)
    if (typeof defaultValue === 'number') value = Number(value)

    // Is primitive type checker
    if (typeof value === typeof defaultValue) return true

    return false
  }
}