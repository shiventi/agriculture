'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/** Sync next-themes "light" to html.theme-light for CSS overrides */
export function ThemeClassSync() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    const effective = resolvedTheme ?? theme
    if (effective === 'light') {
      root.classList.add('theme-light')
    } else {
      root.classList.remove('theme-light')
    }
  }, [theme, resolvedTheme])

  return null
}
