import { test, type Browser } from '@playwright/test'
import {
  createMockScreenlyForScreenshots,
  FIXED_SCREENSHOT_DATE,
  getScreenshotsDir,
  RESOLUTIONS,
  setupClockMock,
  setupScreenlyJsMock,
} from '@screenly/edge-apps/test/screenshots'
import path from 'path'

const BASE_SETTINGS = {
  symbol: 'NASDAQ:AAPL',
  theme: 'dark',
  interval: 'D',
  chart_style: '1',
  allow_symbol_change: 'false',
  hide_top_toolbar: 'false',
  hide_side_toolbar: 'true',
  hide_legend: 'false',
  locale: 'en',
  heatmap_dataset: 'SPX500',
  heatmap_grouping: 'sector',
  display_errors: 'false',
}

const METADATA = {
  coordinates: [37.3861, -122.0839],
  location: 'Silicon Valley, USA',
}

const { screenlyJsContent: advancedChartScreenlyJsContent } =
  createMockScreenlyForScreenshots(METADATA, {
    ...BASE_SETTINGS,
    widget_type: 'advanced_chart',
  })

const { screenlyJsContent: symbolOverviewScreenlyJsContent } =
  createMockScreenlyForScreenshots(METADATA, {
    ...BASE_SETTINGS,
    widget_type: 'symbol_overview',
  })

const { screenlyJsContent: stockHeatmapScreenlyJsContent } =
  createMockScreenlyForScreenshots(METADATA, {
    ...BASE_SETTINGS,
    widget_type: 'stock_heatmap',
  })

const { screenlyJsContent: cryptoHeatmapScreenlyJsContent } =
  createMockScreenlyForScreenshots(METADATA, {
    ...BASE_SETTINGS,
    widget_type: 'crypto_heatmap',
  })

type BrowserContext = Awaited<ReturnType<Browser['newContext']>>

async function takeScreenshot(
  browser: Browser,
  width: number,
  height: number,
  filename: string,
  screenlyJsContent: string,
  setup: (context: BrowserContext) => Promise<void>
): Promise<void> {
  const screenshotsDir = getScreenshotsDir()
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()

  await setupClockMock(page, FIXED_SCREENSHOT_DATE)
  await setupScreenlyJsMock(page, screenlyJsContent)
  await setup(context)

  await page.goto('/?animations=false')
  // Slack waits for networkidle; TradingView's embed keeps sockets/polling
  // open, so that wait times out. The iframe appearing is the ready signal.
  await page.locator('iframe').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(3000)

  await page.screenshot({
    path: path.join(screenshotsDir, filename),
    fullPage: false,
  })

  await context.close()
}

test.describe.configure({ timeout: 60_000 })

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot advanced chart ${width}x${height}`, async ({ browser }) => {
    await takeScreenshot(
      browser,
      width,
      height,
      `advanced-chart-${width}x${height}.png`,
      advancedChartScreenlyJsContent,
      async () => undefined
    )
  })
}

for (const [width, height] of [
  [1920, 1080],
  [1080, 1920],
  [3840, 2160],
  [2160, 3840],
]) {
  test(`screenshot symbol overview ${width}x${height}`, async ({ browser }) => {
    await takeScreenshot(
      browser,
      width,
      height,
      `symbol-overview-${width}x${height}.png`,
      symbolOverviewScreenlyJsContent,
      async () => undefined
    )
  })

  test(`screenshot stock heatmap ${width}x${height}`, async ({ browser }) => {
    await takeScreenshot(
      browser,
      width,
      height,
      `stock-heatmap-${width}x${height}.png`,
      stockHeatmapScreenlyJsContent,
      async () => undefined
    )
  })

  test(`screenshot crypto heatmap ${width}x${height}`, async ({ browser }) => {
    await takeScreenshot(
      browser,
      width,
      height,
      `crypto-heatmap-${width}x${height}.png`,
      cryptoHeatmapScreenlyJsContent,
      async () => undefined
    )
  })
}
