import { useState, useEffect } from 'react'

/**
 * هوک تشخیص media query
 * @param {string} query - عبارت media query (مثلاً '(min-width: 768px)')
 * @returns {boolean} true اگر query مطابقت داشته باشد
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}