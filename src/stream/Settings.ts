import prisma from '@/lib/prisma'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import { settingsList } from '@/stream/settingsList'

export { settingsList }

export type SettingsList = {
  [key in keyof typeof settingsList]: typeof settingsList[key]['default'] extends boolean ? boolean : typeof settingsList[key]['default']
}

export default new class Settings {
  private settings: SettingsList | null = null
  private onReadyCallback: (() => void) | null = null

  constructor() { this.createDefaultSettings() }

  private async createDefaultSettings() {
    const allSettings = await prisma.settings.findMany()

    const vars: { [key: string]: SettingsList[keyof SettingsList] } = {}

    for (const settingKey in settingsList) {
      const key = settingKey as keyof SettingsList
      const existingSetting = allSettings.find(s => s.key === key)
      const defaultValue = settingsList[key].default

      if (existingSetting === undefined) {
        Logger.debug(`Setting ${key} not found, creating with default value: ${defaultValue}`)
        vars[key] = defaultValue
        await prisma.settings.create({ data: { key, value: defaultValue.toString() } })
        continue
      }

      // if (!this.isValidValue(key, existingSetting.value)) {
      //   Logger.warn(`Invalid value for settings.${key}: ${existingSetting.value}, resetting to default.`)

      //   vars[key] = defaultValue
      //   await prisma.settings.update({
      //     where: { key },
      //     data: { value: defaultValue.toString() }
      //   })
      //   continue
      // }

      // Parse value to correct type
      // const defaultSetting = settingsList[key]
      // const expectedType = settingsList[key].type
      const type = typeof defaultValue
      let value
      if (type === 'string') value = existingSetting.value.toString()
      else if (type === 'number') value = Number(existingSetting.value)
      else if (type === 'boolean') value = existingSetting.value === 'true'

      if (type !== typeof value) {
        Logger.warn(`Invalid value for setting.${key}: ${existingSetting.value}, resetting to default.`)

        vars[key] = defaultValue
        await prisma.settings.update({
          where: { key },
          data: { value: defaultValue.toString() }
        })
        continue
      }

      vars[key] = value as never
    }

    this.settings = vars as SettingsList

    this.onReadyCallback?.()
  }

  getSettings(): SettingsList {
    if (!this.settings) throw new Error('Tried to get settings before they were initialized.')
    return this.settings
  }

  // Update a setting, returns true if value is valid & successful
  async setSetting(key: keyof SettingsList, value: string | number | boolean): Promise<boolean> {
    if (value === undefined) return false

    if (!this.settings) {
      Logger.error('Failed to update setting. Settings not initialized.')
      return false
    }

    const valueIsValid = typeof value === typeof this.settings[key]
    if (!valueIsValid) {
      Logger.error(`Failed to update setting. Invalid value for settings.${key}: ${value}`)
      return false
    }

    const setting = settingsList[key]

    Logger.debug(`Updating setting.${key} to ${value}`)
    this.settings[key] = value as never // This is a hack to make TS happy, because it doesn't understand that value is valid
    
    const clientValue = ('clientValue' in setting) ? await setting.clientValue() : value
    SocketUtils.broadcastAdmin(`setting.${key}` as any, clientValue)
    
    if ('onChange' in setting) await setting.onChange(value as never)
    await prisma.settings.update({
      where: { key },
      data: { value: value.toString() }
    })

    return true
  }

  onReady(callback: () => void) {
    if (this.settings) return callback()
    this.onReadyCallback = callback
  }

  // private isValidValue(key: keyof SettingsList, value: any): boolean {
  //   const setting = settingsList[key]
  //   if (!setting) return false

  //   // Is enum checker
  //   if (setting.type === 'enum') {
  //     const enumValues = Object.values(setting.enum)
  //     if (enumValues.includes(value)) return true
  //   }

  //   if (setting.type === 'number') value = Number(value)
  //   if (setting.type === 'boolean') value = Boolean(value)

  //   // Is primitive type checker
  //   if (typeof value === setting.type) return true

  //   return false
  // }
}