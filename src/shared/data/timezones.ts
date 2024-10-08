// List of timezones and their UTC offsets
type Timezone = {
  name: string
  offset: number
}

export const timezones: Timezone[] = [
  { name: '(UTC-12) International Date Line West', offset: -12 },
  { name: '(UTC-11) Midway Island, Samoa', offset: -11 },
  { name: '(UTC-10) Hawaii', offset: -10 },
  { name: '(UTC-9) Alaska', offset: -9 },
  { name: '(UTC-8) Pacific Time (US & Canada)', offset: -8 },
  { name: '(UTC-7) Mountain Time (US & Canada)', offset: -7 },
  { name: '(UTC-6) Central Time (US & Canada)', offset: -6 },
  { name: '(UTC-5) Eastern Time (US & Canada)', offset: -5 },
  { name: '(UTC-4) Atlantic Time (Canada)', offset: -4 },
  { name: '(UTC-3) Buenos Aires, Georgetown', offset: -3 },
  { name: '(UTC-2) Mid-Atlantic', offset: -2 },
  { name: '(UTC-1) Azores, Cape Verde Is.', offset: -1 },
  { name: '(UTC) Casablanca, Dublin, London', offset: 0 },
  { name: '(UTC+1) Amsterdam, Berlin, Rome, Paris', offset: 1 },
  { name: '(UTC+2) Athens, Helsinki, Istanbul', offset: 2 },
  { name: '(UTC+3) Moscow, St. Petersburg, Volgograd', offset: 3 },
  { name: '(UTC+4) Abu Dhabi, Muscat', offset: 4 },
  { name: '(UTC+5) Islamabad, Karachi', offset: 5 },
  { name: '(UTC+6) Almaty, Dhaka', offset: 6 },
  { name: '(UTC+7) Bangkok, Hanoi, Jakarta', offset: 7 },
  { name: '(UTC+8) Beijing, Hong Kong, Singapore', offset: 8 },
  { name: '(UTC+9) Osaka, Sapporo, Tokyo', offset: 9 },
  { name: '(UTC+10) Brisbane, Melbourne, Sydney', offset: 10 },
  { name: '(UTC+11) Magadan, Solomon Is.', offset: 11 },
  { name: '(UTC+12) Auckland, Wellington', offset: 12 },
  { name: "(UTC+13) Nuku'alofa", offset: 13 }
]
