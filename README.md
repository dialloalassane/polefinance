# brvmpy 🌍📈

**Python library for BRVM financial data — historical prices, technical analysis, and fundamental valuation.**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![BRVM](https://img.shields.io/badge/Exchange-BRVM-orange.svg)](https://www.brvm.org)

---

## What is brvmpy?

`brvmpy` gives you programmatic access to financial data for all companies listed on the **BRVM** (Bourse Régionale des Valeurs Mobilières), the regional stock exchange of West Africa (UEMOA zone).

### Features

| Feature | Description |
|---------|-------------|
| 📊 **Historical prices** | Daily OHLCV data from company inception to any target date |
| 🔬 **Technical analysis** | 20+ indicators: RSI, MACD, Bollinger Bands, ATR, OBV, Stochastic, and more |
| 💡 **Fundamental data** | EPS/BNA, Dividends, Beta, PER, Book Value, Market Cap |
| 💰 **Intrinsic value** | DDM, Graham Number, PER-based, and composite valuation |
| 🎯 **Screener** | Filter all 45 stocks by margin of safety, PER, dividend yield, sector |

### Data sources
- **Historical prices**: [richbourse.com](https://www.richbourse.com) — same API used by the [CRAN BRVM R package](https://github.com/cran/BRVM)
- **Fundamentals**: [sikafinance.com](https://www.sikafinance.com) — same source as `BRVM_company_info()` in the R package

---

## Installation

```bash
# Clone the repository
git clone https://github.com/polefinance/brvmpy.git
cd brvmpy

# Install (editable mode recommended for development)
pip install -e .

# Or install dependencies only
pip install -r requirements.txt
```

---

## Quick start

```python
from brvmpy import BRVM

brvm = BRVM()
```

### Historical prices

```python
# Single ticker — with date range
df = brvm.history("SNTS", start="2020-01-01", end="2024-12-31")
print(df.tail())

#           Open     High      Low    Close   Volume
# Date
# 2024-12-25  15200  15500  15100  15350   12500
# 2024-12-26  15350  15600  15200  15500    9800

# All tickers — full history
data = brvm.history_all(start="2023-01-01")  # dict of DataFrames
```

### Technical analysis

```python
ta = brvm.technical("SNTS", start="2023-01-01")

# Available columns (20+ indicators)
print(ta.columns.tolist())
# ['Open', 'High', 'Low', 'Close', 'Volume',
#  'SMA_20', 'SMA_50', 'SMA_200', 'EMA_20', 'EMA_50',
#  'RSI_14', 'MACD', 'MACD_Signal', 'MACD_Hist',
#  'BB_Upper', 'BB_Middle', 'BB_Lower', 'BB_Width', 'BB_Pct_B',
#  'ATR_14', 'Stoch_K', 'Stoch_D', 'Williams_R',
#  'OBV', 'VWAP', 'Volume_SMA_20',
#  'Signal_SMA', 'Signal_RSI', 'Signal_MACD', 'Signal_BB',
#  'Overall_Signal']

# Use TechnicalAnalysis directly for a summary dict
from brvmpy.analysis.technical import TechnicalAnalysis
hist    = brvm.history("SNTS")
summary = TechnicalAnalysis(hist).summary()
print(summary)
# {'date': '2024-12-25', 'close': 15350, 'rsi_14': 58.2, 'overall_signal': 'BUY', ...}
```

### Fundamental data

```python
fund = brvm.fundamentals("SNTS")
print(fund)
# {
#   'ticker':     'SNTS',
#   'price':      15350,
#   'eps':        1850,
#   'dividend':   900,
#   'book_value': 9200,
#   'beta':       0.72,
#   'per_market': 8.3,
#   'div_yield':  5.9,
#   'rsi':        58.2,
#   'source_url': 'https://www.sikafinance.com/marches/cotation_SNTS.sn'
# }

# All tickers at once
df_all = brvm.fundamentals_all()
```

### Intrinsic value

```python
iv = brvm.intrinsic_value("SNTS")
print(iv)
# {
#   'ticker':           'SNTS',
#   'price':            15350,
#   'ke':               11.04,         # CAPM cost of equity (%)
#   'v_ddm':            11200,         # DDM value (FCFA)
#   'v_graham':         18500,         # Graham Number (FCFA)
#   'v_per':            27750,         # PER-based value (FCFA)
#   'v_composite':      19150,         # Average of methods (FCFA)
#   'margin_of_safety': 19.8,          # (%) positive = undervalued
#   'verdict':          'SOUS-EVALUE',
#   'methods_used':     ['DDM', 'Graham', 'PER']
# }

# All tickers — sorted by best opportunity
df_iv = brvm.intrinsic_value_all()
```

### Screener

```python
# Undervalued stocks with margin of safety >= 15%
df = brvm.screen(min_mos=15)

# Finance sector only, PER < 10
df = brvm.screen(max_per=10, sectors=["Finance"])

# With dividend yield >= 4%
df = brvm.screen(min_div=4.0)
```

### Full report

```python
report = brvm.full_report("SNTS", start="2023-01-01")
# report["info"]         → ticker metadata
# report["history"]      → OHLCV DataFrame
# report["technical"]    → OHLCV + all indicators
# report["fundamentals"] → fundamental dict
# report["valuation"]    → intrinsic value dict
```

---

## All tickers

```python
df = brvm.tickers()
print(df.to_string(index=False))
```

| Ticker | Company | Sector | Country |
|--------|---------|--------|---------|
| SNTS | Sonatel Senegal | Telecom | Senegal |
| ETIT | Ecobank Transnational | Finance | Togo |
| SGBC | Societe Generale CI | Finance | Cote dIvoire |
| ORAC | Orange CI | Telecom | Cote dIvoire |
| SLBC | Solibra CI | Agriculture | Cote dIvoire |
| ... | ... | ... | ... |

*(45 tickers total)*

---

## Valuation methodology

### CAPM — Cost of equity
```
Ke = Rf + β × ERP
   = 6% + β × 7%
```
- **Rf = 6%** — BOAD/UEMOA 10-year bond rate
- **ERP = 7%** — BRVM historical equity risk premium
- **β** scraped from sikafinance.com (fallback: β = 1.0)

### DDM — Gordon Growth Model
```
V = D₁ / (Ke − g)    where D₁ = D₀ × (1 + g),  g = 3%
```

### Graham Number
```
V = √(22.5 × EPS × Book Value per Share)
```

### PER-based
```
V = EPS × Sector_PER_Benchmark
```

### Composite intrinsic value
```
V_composite = average(V_DDM, V_Graham, V_PER)   [only non-None methods]
```

### Margin of Safety
```
MoS = (V_composite − Price) / V_composite × 100%
```

| MoS | Verdict |
|-----|---------|
| ≥ 30% | 🟢 TRES SOUS-EVALUE |
| 15–30% | 🟩 SOUS-EVALUE |
| −10% to 15% | 🟠 JUSTE VALEUR |
| −30% to −10% | 🔴 SUREVALUE |
| < −30% | 🔴 TRES SUREVALUE |

---

## Project structure

```
brvmpy/
├── brvmpy/                  # Main package
│   ├── __init__.py          # Public API exports
│   ├── client.py            # BRVM main client (entry point)
│   ├── data/
│   │   ├── __init__.py
│   │   ├── historical.py    # OHLCV data — richbourse.com
│   │   └── fundamentals.py  # EPS, dividend, beta — sikafinance.com
│   ├── analysis/
│   │   ├── __init__.py
│   │   ├── technical.py     # 20+ technical indicators (pure pandas/numpy)
│   │   └── valuation.py     # DDM, Graham, PER, composite IV
│   └── utils/
│       ├── __init__.py
│       ├── tickers.py       # Tickers registry (single source of truth)
│       ├── http.py          # Shared HTTP session with retries
│       └── validators.py    # Input validation (ticker, dates)
├── tests/
│   ├── test_validators.py   # Unit tests — no network required
│   ├── test_technical.py    # Unit tests — no network required
│   └── test_valuation.py    # Unit tests — no network required
├── examples/
│   └── demo.py              # Complete usage demo
├── docs/                    # Documentation (coming soon)
├── requirements.txt
├── setup.py
└── README.md
```

---

## Running tests

```bash
pip install pytest
pytest tests/ -v
```

All unit tests run **offline** (no network required).

---

## Responsible usage

- This library scrapes publicly available data from `richbourse.com` and `sikafinance.com`.
- A 1.2-second delay is enforced between requests by default (configurable via `BRVM(delay=...)`).
- Do not use this library for high-frequency scraping. Be respectful of the servers.
- Data is for informational purposes only and does not constitute investment advice.

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Credits

- Data source: [richbourse.com](https://www.richbourse.com) and [sikafinance.com](https://www.sikafinance.com)
- API discovery credit: [CRAN BRVM R package](https://github.com/cran/BRVM) by Koffi Frederic SESSIE
- Built by [PoleFinance](https://github.com/polefinance) for the BRVM investment community
