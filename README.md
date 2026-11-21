# csv-reader-speed

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/tonangarivin-ui/csv-reader-speed/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/tonangarivin-ui/csv-reader-speed/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A drop-in replacement for make.fun's `csv-reader` 1.0.0 that returns exactly the same answer for every
input — the same `{columns, rows, errors}`, error codes, order, line and row numbers — while reading the
text several times faster. Same broken-row policy, same quoting rules, same `stray_cr`, `quote_junk`,
`unterminated_quote`, `short_row` and `long_row` behaviour.

## Run it

```sh
node main.ts   # reads /input/cases.json, writes /output/answers.json
```
