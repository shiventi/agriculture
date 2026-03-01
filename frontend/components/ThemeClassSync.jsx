'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * next-themes uses class "light" or "dark" on html.
 * Our CSS uses html.theme-light for light theme overrides, so we sync that class.
 */
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
