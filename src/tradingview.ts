import { getSettingWithDefault, getTheme } from '@screenly/edge-apps'

const EMBED_SCRIPT_BASE =
  'https://s3.tradingview.com/external-embedding/embed-widget-'

export type WidgetType =
  'advanced_chart' | 'symbol_overview' | 'stock_heatmap' | 'crypto_heatmap'

const SCRIPT_SLUG: Record<WidgetType, string> = {
  advanced_chart: 'advanced-chart',
  symbol_overview: 'symbol-overview',
  stock_heatmap: 'stock-heatmap',
  crypto_heatmap: 'crypto-coins-heatmap',
}

export interface WidgetSettings {
  symbol: string
  theme: 'dark' | 'light'
  interval: string
  chartStyle: string
  allowSymbolChange: boolean
  hideTopToolbar: boolean
  hideSideToolbar: boolean
  hideLegend: boolean
  locale: string
  heatmapDataset: string
  heatmapGrouping: string
}

export function buildAdvancedChartConfig(
  settings: WidgetSettings,
): Record<string, unknown> {
  return {
    autosize: true,
    symbol: settings.symbol,
    interval: settings.interval,
    timezone: 'Etc/UTC',
    theme: settings.theme,
    style: settings.chartStyle,
    locale: settings.locale,
    allow_symbol_change: settings.allowSymbolChange,
    hide_top_toolbar: settings.hideTopToolbar,
    hide_side_toolbar: settings.hideSideToolbar,
    hide_legend: settings.hideLegend,
    save_image: false,
    calendar: false,
    withdateranges: false,
    hotlist: false,
    details: false,
    studies: [],
    ...(settings.theme === 'dark'
      ? { backgroundColor: '#0f0f0f', gridColor: 'rgba(242, 242, 242, 0.06)' }
      : {}),
  }
}

export function buildSymbolOverviewConfig(
  settings: WidgetSettings,
): Record<string, unknown> {
  // A single-entry list, deliberately: TradingView renders multiple entries as
  // clickable tabs, which nothing can operate on unattended signage hardware.
  const label = settings.symbol.split(':').pop() || settings.symbol
  return {
    symbols: [[label, `${settings.symbol}|1D`]],
    chartOnly: false,
    width: '100%',
    height: '100%',
    locale: settings.locale,
    colorTheme: settings.theme,
    autosize: true,
    showVolume: false,
    hideDateRanges: false,
    scalePosition: 'right',
    scaleMode: 'Normal',
    chartType: 'area',
    lineWidth: 2,
    dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
    ...(settings.theme === 'dark'
      ? {
          backgroundColor: '#0f0f0f',
          fontColor: 'rgb(106,109,120)',
          gridLineColor: 'rgba(242,242,242,0.06)',
        }
      : {}),
  }
}

export function buildStockHeatmapConfig(
  settings: WidgetSettings,
): Record<string, unknown> {
  return {
    exchanges: [],
    dataSource: settings.heatmapDataset,
    grouping: settings.heatmapGrouping,
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    colorTheme: settings.theme,
    locale: settings.locale,
    symbolUrl: '',
    hasTopBar: false,
    isDataSetEnabled: false,
    // No mouse on unattended signage hardware to drive pinch/scroll zoom.
    isZoomEnabled: false,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '100%',
    autosize: true,
  }
}

export function buildCryptoHeatmapConfig(
  settings: WidgetSettings,
): Record<string, unknown> {
  return {
    dataSource: 'Crypto',
    blockSize: 'market_cap_calc',
    blockColor: '24h_close_change|5',
    colorTheme: settings.theme,
    locale: settings.locale,
    symbolUrl: '',
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: false,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '100%',
    autosize: true,
  }
}

export function readWidgetSettings(): WidgetSettings {
  return {
    symbol: getSettingWithDefault('symbol', 'NASDAQ:AAPL'),
    theme: getTheme() === 'light' ? 'light' : 'dark',
    interval: getSettingWithDefault('interval', 'D'),
    chartStyle: getSettingWithDefault('chart_style', '1'),
    allowSymbolChange: getSettingWithDefault('allow_symbol_change', false),
    hideTopToolbar: getSettingWithDefault('hide_top_toolbar', false),
    hideSideToolbar: getSettingWithDefault('hide_side_toolbar', true),
    hideLegend: getSettingWithDefault('hide_legend', false),
    locale: getSettingWithDefault('locale', 'en'),
    heatmapDataset: getSettingWithDefault('heatmap_dataset', 'SPX500'),
    heatmapGrouping: getSettingWithDefault('heatmap_grouping', 'sector'),
  }
}

export function buildConfig(
  widgetType: WidgetType,
  settings: WidgetSettings,
): Record<string, unknown> {
  switch (widgetType) {
    case 'symbol_overview':
      return buildSymbolOverviewConfig(settings)
    case 'stock_heatmap':
      return buildStockHeatmapConfig(settings)
    case 'crypto_heatmap':
      return buildCryptoHeatmapConfig(settings)
    case 'advanced_chart':
    default:
      return buildAdvancedChartConfig(settings)
  }
}

/**
 * Appends TradingView's embed script (container div + JSON-config script tag) to
 * `container`, following TradingView's own "copy embed code" pattern. The script's
 * `load` event is the closest available readiness signal for these async embeds.
 */
export function mountWidget(
  container: HTMLElement,
  widgetType: WidgetType,
  config: Record<string, unknown>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `${EMBED_SCRIPT_BASE}${SCRIPT_SLUG[widgetType]}.js`
    script.async = true
    script.textContent = JSON.stringify(config)
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error(`Failed to load the ${widgetType} widget script`))
    container.appendChild(script)
  })
}
