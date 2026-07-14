import '@screenly/edge-apps/test'
import { beforeEach, describe, expect, test } from 'bun:test'

import { createErrorReporter, showError } from './error-screen'

function renderScreenSkeleton(): void {
  document.body.innerHTML = `
    <div id="widget-root"></div>
    <div id="error-screen" style="display: none">
      <p id="error-message"></p>
    </div>
  `
}

describe('showError', () => {
  beforeEach(() => {
    renderScreenSkeleton()
  })

  test('hides the widget and reveals the error screen with the message', () => {
    showError(new Error('symbol not found'))

    expect(
      (document.getElementById('widget-root') as HTMLElement).style.display,
    ).toBe('none')
    expect(
      (document.getElementById('error-screen') as HTMLElement).style.display,
    ).toBe('flex')
    expect(document.getElementById('error-message')?.textContent).toBe(
      'symbol not found',
    )
  })

  test('stringifies non-Error values', () => {
    showError('just a string')

    expect(document.getElementById('error-message')?.textContent).toBe(
      'just a string',
    )
  })

  test('does nothing that throws when the expected elements are missing', () => {
    document.body.innerHTML = ''

    expect(() => showError(new Error('boom'))).not.toThrow()
  })
})

describe('createErrorReporter', () => {
  test('with displayErrors=false, wires up showError (which has its own tests)', () => {
    expect(createErrorReporter(false)).toBe(showError)
  })

  test('with displayErrors=true, rethrows so the debug overlay can catch it', () => {
    const reportError = createErrorReporter(true)

    expect(() => reportError(new Error('boom'))).toThrow('boom')
  })

  test('with displayErrors=true, wraps non-Error values in an Error before rethrowing', () => {
    const reportError = createErrorReporter(true)

    expect(() => reportError('raw string failure')).toThrow(
      'raw string failure',
    )
  })
})
