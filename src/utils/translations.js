import en from '../locales/en.json'
import hi from '../locales/hi.json'
import te from '../locales/te.json'

export const translations = { en, hi, te }

export function getTranslation(language = 'en', key = '') {
  const dict = translations[language] || translations.en
  const parts = key.split('.')
  const findValue = (source) => parts.reduce((value, part) => value?.[part], source)
  return findValue(dict) ?? findValue(translations.en) ?? (parts.at(-1) || key).replace(/([a-z])([A-Z])/g, '$1 $2')
}
