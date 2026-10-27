import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, AVAILABLE_LANGUAGES } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('nagarakshak_lang') || 'en'
    } catch (e) {
      return 'en'
    }
  })

  const setLang = (newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem('nagarakshak_lang', newLang)
    } catch (e) {}
  }

  const toggleLang = () => {
    const codes = AVAILABLE_LANGUAGES.map(l => l.code)
    const nextIdx = (codes.indexOf(lang) + 1) % codes.length
    setLang(codes[nextIdx])
  }

  const t = (key, fallback = '') => {
    const dict = translations[lang] || translations.en
    return dict[key] || (translations.en && translations.en[key]) || fallback || key
  }

  // Helper: Category Translator
  const tCat = (category) => {
    if (!category) return ''
    if (category.includes('Garbage')) return t('cat_garbage')
    if (category.includes('Pothole') || category.includes('Road')) return t('cat_pothole')
    if (category.includes('Streetlight')) return t('cat_streetlight')
    if (category.includes('Water')) return t('cat_water')
    if (category.includes('Other')) return t('cat_other')
    return category
  }

  // Helper: Status Translator
  const tStatus = (status) => {
    if (!status) return ''
    if (status === 'Submitted') return t('status_submitted')
    if (status === 'AI Verified') return t('status_ai_verified', 'AI Verified (Authority Queue)')
    if (status === 'Needs More Evidence') return t('status_needs_evidence', 'Needs More Evidence')
    if (status === 'Flagged for Review') return t('status_flagged', 'Flagged for Review')
    if (status === 'Assigned') return t('status_assigned', 'Assigned')
    if (status === 'In Progress') return t('status_in_progress')
    if (status === 'Awaiting Verification' || status === 'Awaiting Review') return t('status_awaiting_verification')
    if (status === 'Resolved') return t('status_resolved')
    if (status === 'Escalated') return t('status_escalated')
    if (status === 'Reopened') return t('status_reopened')
    if (status === 'Overdue') return t('status_overdue')
    return status
  }

  // Helper: Priority Translator
  const tPriority = (priority) => {
    if (!priority) return ''
    if (priority === 'Critical') return t('prio_critical')
    if (priority === 'High') return t('prio_high')
    if (priority === 'Medium') return t('prio_medium')
    if (priority === 'Low') return t('prio_low')
    return priority
  }

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang, 
      toggleLang, 
      t, 
      tCat, 
      tStatus, 
      tPriority, 
      availableLanguages: AVAILABLE_LANGUAGES 
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback = '') => translations.en[key] || fallback || key,
      tCat: (c) => c,
      tStatus: (s) => s,
      tPriority: (p) => p,
      availableLanguages: AVAILABLE_LANGUAGES
    }
  }
  return ctx
}
