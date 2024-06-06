import prisma from '@/lib/prisma'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import { settingsList } from '@/stream/settingsList'
import { passCheck, failCheck } from '@/stream/initChecks'
import type { SocketClient } from '@/typings/socket'

export { settingsList }

export type SettingsList = {
  [key in keyof typeof settingsList]: typeof settingsList[key]['default'] extends boolean ? boolean : typeof settingsList[key]['default']
}


let settings: SettingsList | null = null
let onReadyCallback: Function | null = null

const Settings = {
  async setSetting(key: keyof SettingsList, value: string | number | boolean, executedBy?: SocketClient): Promise<boolean> {
    if (!settings || value === undefined) return false

    const valueIsValid = typeof value === typeof settings[key]
    if (!valueIsValid) {
      Logger.error(`[Settings] Failed to update setting.${key}: Invalid value type. Expected ${typeof settings[key]}, got ${typeof value}.`)
      return false
    }
    
    Logger.debug(`[Settings] Updating setting.${key} to: ${value}`)
    settings[key] = value as never // This is a hack to make TS happy, because it doesn't understand that value is valid
    
    const setting = settingsList[key]
    
    const clientValue = ('clientValue' in setting) ? await setting.clientValue() : value
    SocketUtils.broadcastAdmin(`setting.${key}` as any, clientValue)
    
    if ('onChange' in setting) await setting.onChange(value as never, executedBy)
      
    await prisma.settings.update({
      where: { key },
      data: { value: value.toString() }
    })

    return true
  },

  async onReady() {
    if (settings) return
    return new Promise<void>(resolve => {
      onReadyCallback = resolve
    })
  }
}

async function initializeSettings() {
  try {
    const dbSettings = await prisma.settings.findMany()

    settings = {} as SettingsList

    for (const settingKey in settingsList) {
      const key = settingKey as keyof SettingsList
      const dbSetting = dbSettings.find(s => s.key === key)
      const defaultValue = settingsList[key].default

      if (dbSetting === undefined) {
        Logger.debug(`[Settings] Setting ${key} not found, creating with default value: ${defaultValue}`)
        settings[key] = defaultValue as never
        await prisma.settings.create({ data: { key, value: defaultValue.toString() } })
        continue
      }

      // Parse value to correct type
      const type = typeof defaultValue
      let value
      if (type === 'string') value = dbSetting.value.toString()
      else if (type === 'number') value = Number(dbSetting.value)
      else if (type === 'boolean') value = dbSetting.value === 'true'

      if (type !== typeof value) {
        Logger.warn(`[Settings] Invalid value for setting.${key}: ${dbSetting.value}, resetting to default.`)

        settings[key] = defaultValue as never
        await prisma.settings.update({
          where: { key },
          data: { value: defaultValue.toString() }
        })
        continue
      }

      settings[key] = value as never
    }

    // Define getters for each setting on main Settings object
    for (const settingKey in settingsList) {
      const key = settingKey as keyof SettingsList
      Object.defineProperty(Settings, key, {
        get: () => {
          if (!settings) throw new Error('Settings not initialized.')
          return settings[key]
        },
        enumerable: true
      })
    }

    passCheck('settingsReady', `Loaded ${Object.keys(settings).length} settings from database.`)

    onReadyCallback?.()
  }
  catch (error: any) { failCheck('settingsReady', error.message) }
}

initializeSettings()

type ReadonlySettingsList = {
  readonly [key in keyof SettingsList]: SettingsList[key]
}

// Export Settings with readonly SettingsList type
export default Settings as ReadonlySettingsList & typeof Settings