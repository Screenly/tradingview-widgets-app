# TradingView Widget - Screenly App

A full-screen Screenly app that displays a TradingView market widget.

It wraps four of TradingView's [widgets](https://www.tradingview.com/widget-docs/getting-started/):

- **Advanced Real-Time Chart**
- **Symbol Overview** (single-symbol area chart + price, autosizing to fill the screen)
- **Stock Heatmap**
- **Crypto Heatmap**

("Symbol Info" was considered too, but it's a fixed ~205px quote card that can't fill a screen, and would have meant either stretching it awkwardly or letterboxing it. Symbol Overview already covers the same "single symbol, at a glance" need while filling the screen properly, so it was left out.)

Which widget renders, and its symbol/theme/interval/etc., is controlled entirely
through Screenly app settings, no code changes needed to reconfigure a
screen. The app does not modify TradingView's own widget design; it only
toggles the configuration options TradingView itself exposes.

## Settings

| Setting               | Applies to          | Default          | Notes                                                                                                                                                  |
| --------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `widget_type`         | all                 | `advanced_chart` | `advanced_chart` \| `symbol_overview` \| `stock_heatmap` \| `crypto_heatmap`                                                                           |
| `symbol`              | all except heatmaps | `NASDAQ:AAPL`    | `EXCHANGE:SYMBOL` format. Symbol Overview always shows this one symbol only, no multi-symbol tab switcher, since signage has no mouse to click it with |
| `theme`               | all                 | `dark`           | `dark` \| `light`                                                                                                                                      |
| `interval`            | Advanced Chart      | `D`              | `1`,`5`,`15`,`30`,`60`,`240`,`D`,`W`,`M`                                                                                                               |
| `chart_style`         | Advanced Chart      | `1` (candles)    | candles/bars/line/area                                                                                                                                 |
| `allow_symbol_change` | Advanced Chart      | `false`          | Off by default for unattended signage                                                                                                                  |
| `hide_top_toolbar`    | Advanced Chart      | `false`          |                                                                                                                                                        |
| `hide_side_toolbar`   | Advanced Chart      | `true`           |                                                                                                                                                        |
| `hide_legend`         | Advanced Chart      | `false`          |                                                                                                                                                        |
| `heatmap_dataset`     | Stock Heatmap       | `SPX500`         | S&P 500, Nasdaq 100, Dow 30, All US, FTSE 100, DAX, Nikkei 225, Shenzhen Component, Nifty 50, TSX, ASX 200, Ibovespa                                   |
| `heatmap_grouping`    | Stock Heatmap       | `sector`         | `sector` \| `no_group`. Crypto Heatmap has no grouping/dataset choice, it's always the full crypto market                                              |
| `locale`              | all                 | `en`             |                                                                                                                                                        |
| `display_errors`      | all                 | `false`          | Shows failures on-screen instead of failing silently                                                                                                   |

## Development

```bash
bun install
bun run dev          # local dev server
bun run type-check
bun run build         # production build to dist/
bun run deploy        # build + screenly edge-app deploy --path=dist/
```

## Testing

```bash
bun run test          # hermetic unit tests, no network access
bun run test:live      # hits TradingView's real embed scripts, run on demand
```

## Screenshots

```bash
bun run screenshots
```

This generates WebP screenshots for all supported resolutions into the `screenshots/` directory. Advanced Chart is captured at every resolution; the other widget types are captured at 1080p and 4K, landscape and portrait.
