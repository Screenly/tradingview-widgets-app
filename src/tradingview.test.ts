import '@screenly/edge-apps/test'
import { beforeEach, describe, expect, test } from 'bun:test'
import { setupScreenlyMock, resetScreenlyMock } from '@screenly/edge-apps/test'

import {
  buildAdvancedChartConfig,
  buildConfig,
  buildCryptoHeatmapConfig,
  buildStockHeatmapConfig,
  buildSymbolOverviewConfig,
  mountWidget,
  readWidgetSettings,
  type WidgetSettings,
} from './tradingview'

const BASE_SETTINGS: WidgetSettings = {
  symbol: 'NASDAQ:AAPL',
  theme: 'dark',
  interval: 'D',
  chartStyle: '1',
  allowSymbolChange: false,
  hideTopToolbar: false,
  hideSideToolbar: true,
  hideLegend: false,
  locale: 'en',
  heatmapDataset: 'SPX500',
  heatmapGrouping: 'sector',
}

describe('buildAdvancedChartConfig', () => {
  test('maps settings to the widget config with the right field names', () => {
    const config = buildAdvancedChartConfig(BASE_SETTINGS)

    expect(config.symbol).toBe('NASDAQ:AAPL')
    expect(config.interval).toBe('D')
    expect(config.style).toBe('1')
    expect(config.theme).toBe('dark')
    expect(config.allow_symbol_change).toBe(false)
    expect(config.hide_top_toolbar).toBe(false)
    expect(config.hide_side_toolbar).toBe(true)
    expect(config.hide_legend).toBe(false)
    expect(config.autosize).toBe(true)
  })

  test('adds dark background/grid colors only in dark theme', () => {
    const dark = buildAdvancedChartConfig({ ...BASE_SETTINGS, theme: 'dark' })
    const light = buildAdvancedChartConfig({
      ...BASE_SETTINGS,
      theme: 'light',
    })

    expect(dark.backgroundColor).toBe('#0f0f0f')
    expect(light.backgroundColor).toBeUndefined()
  })
})

describe('buildSymbolOverviewConfig', () => {
  test('renders exactly one symbol entry, never a multi-symbol tab switcher', () => {
    const config = buildSymbolOverviewConfig(BASE_SETTINGS)

    expect(config.symbols).toEqual([['AAPL', 'NASDAQ:AAPL|1D']])
  })

  test('falls back to the raw symbol as label when there is no colon', () => {
    const config = buildSymbolOverviewConfig({
      ...BASE_SETTINGS,
      symbol: 'AAPL',
    })

    expect(config.symbols).toEqual([['AAPL', 'AAPL|1D']])
  })

  test('uses colorTheme (not theme) and fills the container', () => {
    const config = buildSymbolOverviewConfig(BASE_SETTINGS)

    expect(config.colorTheme).toBe('dark')
    expect(config.theme).toBeUndefined()
    expect(config.width).toBe('100%')
    expect(config.height).toBe('100%')
    expect(config.autosize).toBe(true)
  })
})

describe('buildStockHeatmapConfig', () => {
  test('passes the configured dataset and grouping through', () => {
    const config = buildStockHeatmapConfig({
      ...BASE_SETTINGS,
      heatmapDataset: 'NASDAQ100',
      heatmapGrouping: 'no_group',
    })

    expect(config.dataSource).toBe('NASDAQ100')
    expect(config.grouping).toBe('no_group')
  })

  test('disables zoom, since there is no mouse on signage hardware', () => {
    const config = buildStockHeatmapConfig(BASE_SETTINGS)

    expect(config.isZoomEnabled).toBe(false)
    expect(config.autosize).toBe(true)
  })
})

describe('buildCryptoHeatmapConfig', () => {
  test('is always the full crypto market, ignoring the stock dataset setting', () => {
    const config = buildCryptoHeatmapConfig({
      ...BASE_SETTINGS,
      heatmapDataset: 'NASDAQ100',
    })

    expect(config.dataSource).toBe('Crypto')
    expect(config.isZoomEnabled).toBe(false)
    expect(config.autosize).toBe(true)
  })
})

describe('buildConfig', () => {
  test('dispatches to the right builder per widget type', () => {
    expect(buildConfig('advanced_chart', BASE_SETTINGS).style).toBe('1')
    expect(buildConfig('symbol_overview', BASE_SETTINGS).symbols).toBeDefined()
    expect(buildConfig('stock_heatmap', BASE_SETTINGS).dataSource).toBe(
      'SPX500',
    )
    expect(buildConfig('crypto_heatmap', BASE_SETTINGS).dataSource).toBe(
      'Crypto',
    )
  })

  test('falls back to the advanced chart for an unrecognized widget type', () => {
    const config = buildConfig(
      'nonexistent_widget' as unknown as Parameters<typeof buildConfig>[0],
      BASE_SETTINGS,
    )

    expect(config.style).toBe('1')
  })
})

describe('readWidgetSettings', () => {
  beforeEach(() => {
    resetScreenlyMock()
  })

  test('falls back to sensible defaults when no settings are configured', () => {
    setupScreenlyMock({}, {})

    const settings = readWidgetSettings()

    expect(settings.symbol).toBe('NASDAQ:AAPL')
    expect(settings.theme).toBe('dark')
    expect(settings.interval).toBe('D')
    expect(settings.hideSideToolbar).toBe(true)
    expect(settings.heatmapDataset).toBe('SPX500')
  })

  test('reads configured settings, coercing string booleans', () => {
    setupScreenlyMock(
      {},
      {
        symbol: 'BINANCE:BTCUSDT',
        theme: 'light',
        allow_symbol_change: 'true',
        hide_side_toolbar: 'false',
        heatmap_dataset: 'NASDAQ100',
        heatmap_grouping: 'no_group',
      },
    )

    const settings = readWidgetSettings()

    expect(settings.symbol).toBe('BINANCE:BTCUSDT')
    expect(settings.theme).toBe('light')
    expect(settings.allowSymbolChange).toBe(true)
    expect(settings.hideSideToolbar).toBe(false)
    expect(settings.heatmapDataset).toBe('NASDAQ100')
    expect(settings.heatmapGrouping).toBe('no_group')
  })

  test('treats any theme value other than "light" as dark', () => {
    setupScreenlyMock({}, { theme: 'not-a-real-theme' })

    expect(readWidgetSettings().theme).toBe('dark')
  })
})

describe('mountWidget', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = '<div id="widget-root"></div>'
    container = document.getElementById('widget-root') as HTMLElement
  })

  test('appends the correct embed script with the JSON config as its text', async () => {
    const config = { symbol: 'NASDAQ:AAPL', autosize: true }
    const promise = mountWidget(container, 'advanced_chart', config)

    const script = container.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.src).toBe(
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
    )
    expect(script?.textContent).toBe(JSON.stringify(config))

    script?.dispatchEvent(new window.Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  test('uses the crypto heatmap slug for crypto_heatmap', () => {
    void mountWidget(container, 'crypto_heatmap', {})
    const script = container.querySelector('script')

    expect(script?.src).toBe(
      'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js',
    )
  })

  test('rejects if the embed script fails to load', async () => {
    const promise = mountWidget(container, 'symbol_overview', {})
    const script = container.querySelector('script')

    script?.dispatchEvent(new window.Event('error'))

    await expect(promise).rejects.toThrow(
      'Failed to load the symbol_overview widget script',
    )
  })
})
