import { useEffect } from 'react'
import { useWebHaptics } from 'web-haptics/react'

const DEFAULT_PATTERN = 'nudge'

const isDisabled = (element) => {
  if (!element) return true

  const nativeDisabled = element.matches('button, input, select, textarea') && element.disabled
  const ariaDisabled = element.getAttribute('aria-disabled') === 'true'

  return nativeDisabled || ariaDisabled
}

export default function WebHapticsProvider() {
  const { trigger } = useWebHaptics()

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!(event.target instanceof Element)) return

      const interactiveElement = event.target.closest('button, [role="button"], [data-haptic]')
      if (!interactiveElement) return

      if (interactiveElement.closest('[data-haptic-exclude="true"]')) return
      if (interactiveElement.getAttribute('data-haptic') === 'false') return
      if (isDisabled(interactiveElement)) return

      const pattern = interactiveElement.getAttribute('data-haptic-pattern') || DEFAULT_PATTERN

      trigger(pattern).catch(() => {
        // Ignore unsupported devices or blocked vibration calls.
      })
    }

    document.addEventListener('click', handleGlobalClick, true)

    return () => {
      document.removeEventListener('click', handleGlobalClick, true)
    }
  }, [trigger])

  return null
}
