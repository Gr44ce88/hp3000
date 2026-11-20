/**
 * Копирование в буфер: Clipboard API есть только в безопасном контексте (https/localhost),
 * поэтому на http://IP нужен запасной путь через textarea + execCommand.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // падаем в запасной путь
  }

  try {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', 'true')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}
