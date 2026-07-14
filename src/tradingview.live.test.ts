import { describe, expect, test } from 'bun:test'

// Not part of `bun run test` (the hermetic suite CI runs on every push) since
// it needs real network access. Run on demand with `bun run test:live` to
// catch TradingView renaming/removing a script or config key our widgets
// depend on.

const EMBED_SCRIPT_BASE =
  'https://s3.tradingview.com/external-embedding/embed-widget-'

interface WidgetContract {
  slug: string
  label: string
  expectedKeys: string[]
}

const CONTRACTS: WidgetContract[] = [
  {
    slug: 'advanced-chart',
    label: 'Advanced Real-Time Chart',
    expectedKeys: [
      'symbol',
      'interval',
      'theme',
      'style',
      'allow_symbol_change',
      'hide_top_toolbar',
      'hide_side_toolbar',
      'hide_legend',
      'autosize',
    ],
  },
  {
    slug: 'symbol-overview',
    label: 'Symbol Overview',
    expectedKeys: ['symbols', 'colorTheme', 'autosize', 'chartOnly'],
  },
  {
    slug: 'stock-heatmap',
    label: 'Stock Heatmap',
    expectedKeys: [
      'dataSource',
      'grouping',
      'blockSize',
      'blockColor',
      'colorTheme',
      'isZoomEnabled',
      'autosize',
    ],
  },
  {
    slug: 'crypto-coins-heatmap',
    label: 'Crypto Heatmap',
    expectedKeys: [
      'dataSource',
      'blockSize',
      'blockColor',
      'colorTheme',
      'isZoomEnabled',
      'autosize',
    ],
  },
]

describe('TradingView embed script contracts (live)', () => {
  for (const { slug, label, expectedKeys } of CONTRACTS) {
    test(`${label} (${slug}) script is reachable and still exposes its config keys`, async () => {
      const url = `${EMBED_SCRIPT_BASE}${slug}.js`
      const response = await fetch(url)

      expect(response.ok).toBe(true)

      const source = await response.text()
      const missing = expectedKeys.filter((key) => !source.includes(key))

      expect(missing).toEqual([])
    })
  }
})
