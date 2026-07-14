import './css/style.css'

import {
  getSettingWithDefault,
  signalReady,
  setupErrorHandling,
} from '@screenly/edge-apps'

import {
  buildConfig,
  mountWidget,
  readWidgetSettings,
  type WidgetType,
} from './tradingview'
import { createErrorReporter } from './error-screen'

const READY_FALLBACK_TIMEOUT_MS = 5000

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()

  const displayErrors = getSettingWithDefault('display_errors', false)
  const reportError = createErrorReporter(displayErrors)

  let readySignaled = false
  const signalReadyOnce = () => {
    if (readySignaled) return
    readySignaled = true
    signalReady()
  }

  // TradingView's embed scripts don't expose a generic "widget is visible" callback,
  // so a load-event timeout keeps the screen from hanging forever if it never fires.
  setTimeout(signalReadyOnce, READY_FALLBACK_TIMEOUT_MS)

  try {
    const widgetType = getSettingWithDefault<WidgetType>(
      'widget_type',
      'advanced_chart',
    )
    const settings = readWidgetSettings()

    const widgetRoot = document.getElementById('widget-root')
    if (!widgetRoot) {
      throw new Error('Missing #widget-root container in index.html')
    }

    const config = buildConfig(widgetType, settings)
    await mountWidget(widgetRoot, widgetType, config)
    signalReadyOnce()
  } catch (error) {
    console.error('TradingView widget app initialization failed:', error)
    reportError(error)
    signalReadyOnce()
  }
})
