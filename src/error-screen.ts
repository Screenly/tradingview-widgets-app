export type ErrorReporter = (error: unknown) => void

export function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const widgetRoot = document.getElementById('widget-root')
  const errorScreen = document.getElementById('error-screen')
  const errorMessage = document.getElementById('error-message')

  if (widgetRoot) (widgetRoot as HTMLElement).style.display = 'none'
  if (errorScreen) (errorScreen as HTMLElement).style.display = 'flex'
  if (errorMessage) errorMessage.textContent = message
}

export function createErrorReporter(displayErrors: boolean): ErrorReporter {
  if (displayErrors) {
    return (error) => {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }
  return showError
}
