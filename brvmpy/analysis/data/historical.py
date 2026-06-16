"""
brvmpy.data.historical
======================
Fetch daily OHLCV historical price data for BRVM-listed companies.

Data source: richbourse.com
URL pattern: https://www.richbourse.com/common/mouvements/technique/{TICKER}/status/200

This replicates the exact logic of the CRAN BRVM R package:
https://github.com/cran/BRVM/blob/master/R/brvm-get.R
"""

from __future__ import annotations
import re
import time
import requests
import pandas as pd
from datetime import date, datetime
from typing import Optional

from brvmpy.utils.tickers import TICKERS, get_ticker_info
from brvmpy.utils.http     import build_session


_BASE_URL = "https://www.richbourse.com/common/mouvements/technique/{ticker}/status/200"


class HistoricalData:
    """
    Fetch and parse OHLCV historical data from richbourse.com.

    Parameters
    ----------
    delay : float
        Seconds between requests (polite crawling).
    timeout : int
        HTTP timeout in seconds.
    """

    def __init__(self, delay: float = 1.2, timeout: int = 25):
        self._delay   = delay
        self._timeout = timeout
        self._session = build_session()

    # ── Public API ────────────────────────────────────────────────────────────

    def fetch(
        self,
        ticker: str,
        start: Optional[date] = None,
        end:   Optional[date] = None,
    ) -> pd.DataFrame:
        """
        Fetch historical OHLCV data for a single ticker.

        Parameters
        ----------
        ticker : str
            BRVM ticker (uppercase, e.g. "SNTS").
        start : date, optional
            Start date. Defaults to full history.
        end : date, optional
            End date. Defaults to today.

        Returns
        -------
        pd.DataFrame
            Columns: Open, High, Low, Close, Volume
            Index: DatetimeIndex named "Date"

        Raises
        ------
        ValueError
            If no data is found for the ticker.
        requests.HTTPError
            If the HTTP request fails.
        """
        url  = _BASE_URL.format(ticker=ticker)
        html = self._get(url)
        df   = self._parse(html, ticker)

        if start:
            df = df[df.index >= pd.Timestamp(start)]
        if end:
            df = df[df.index <= pd.Timestamp(end)]

        if df.empty:
            raise ValueError(
                f"No data found for '{ticker}' between {start} and {end}. "
                f"Verify the ticker at: {url}"
            )
        return df

    def fetch_all(
        self,
        start: Optional[date] = None,
        end:   Optional[date] = None,
        verbose: bool = True,
    ) -> dict[str, pd.DataFrame]:
        """
        Fetch historical OHLCV data for all BRVM tickers.

        Returns
        -------
        dict[str, pd.DataFrame]
            Keys: ticker symbols. Values: OHLCV DataFrames.
        """
        results = {}
        total   = len(TICKERS)

        for i, (ticker, name, *_) in enumerate(TICKERS, start=1):
            if verbose:
                print(f"[{i:02d}/{total}] {ticker:<6} — {name}")
            try:
                df = self.fetch(ticker, start=start, end=end)
                results[ticker] = df
                if verbose:
                    print(f"         ✓ {len(df)} rows  "
                          f"{df.index.min().date()} → {df.index.max().date()}")
            except Exception as exc:
                if verbose:
                    print(f"         ✗ FAILED: {exc}")
                results[ticker] = pd.DataFrame()
            time.sleep(self._delay)

        ok = sum(1 for v in results.values() if not v.empty)
        if verbose:
            print(f"\nCompleted: {ok}/{total} tickers fetched successfully.")
        return results

    # ── Private helpers ───────────────────────────────────────────────────────

    def _get(self, url: str) -> str:
        resp = self._session.get(url, timeout=self._timeout)
        resp.raise_for_status()
        return resp.text

    def _parse(self, html: str, ticker: str) -> pd.DataFrame:
        """
        Parse the richbourse.com page HTML to extract OHLCV arrays.

        The page embeds two Highcharts `data:` JS arrays:
          - data[0]: [[timestamp, open, high, low, close], ...]
          - data[1]: [[timestamp, volume], ...]

        Timestamps are JS milliseconds since epoch.
        Conversion: date = (ts + 0.1) / 1000  → POSIX timestamp
        (Same formula as the CRAN BRVM R package)
        """
        lines = html.split("\n")

        # Find all lines that are exactly "    data: [...]"
        data_indices = [
            i for i, line in enumerate(lines)
            if line.split(":", 1)[0].strip() == "data"
            and len(line.split(":", 1)) == 2
        ]

        if len(data_indices) < 2:
            raise ValueError(
                f"Could not parse data blocks for '{ticker}'. "
                "The page structure may have changed."
            )

        # Block 1: OHLC
        ohlc_raw = lines[data_indices[0]].split(":", 1)[1]
        ohlc_rows = _parse_js_array(ohlc_raw)
        ohlc = []
        for r in ohlc_rows:
            if len(r) >= 5:
                ohlc.append({
                    "Date":  _ts_to_date(r[0]),
                    "Open":  _to_float(r[1]),
                    "High":  _to_float(r[2]),
                    "Low":   _to_float(r[3]),
                    "Close": _to_float(r[4]),
                })

        # Block 2: Volume
        vol_raw  = lines[data_indices[1]].split(":", 1)[1]
        vol_rows = _parse_js_array(vol_raw)
        vol = []
        for r in vol_rows:
            if len(r) >= 2:
                vol.append({
                    "Date":   _ts_to_date(r[0]),
                    "Volume": _to_float(r[1]),
                })

        df_ohlc = pd.DataFrame(ohlc).set_index("Date") if ohlc else pd.DataFrame()
        df_vol  = pd.DataFrame(vol).set_index("Date")  if vol  else pd.DataFrame()

        if df_ohlc.empty:
            raise ValueError(f"Empty OHLC data for '{ticker}'.")

        df = df_ohlc.join(df_vol, how="left")
        df.index = pd.to_datetime(df.index)
        df.index.name = "Date"
        df = df.sort_index()
        df = df[~df.index.duplicated(keep="last")]
        return df.dropna(subset=["Close"])


# ── Module-level parse helpers ────────────────────────────────────────────────

def _parse_js_array(block: str) -> list[list[str]]:
    """Split a JS [[a,b,c],[d,e,f],...] string into rows."""
    block = block.strip().lstrip("[").rstrip("]").rstrip(",")
    rows  = re.split(r"],\s*\[", block)
    result = []
    for row in rows:
        row = row.strip().strip("[").strip("]")
        vals = [v.strip() for v in row.split(",")]
        if vals and vals[0]:
            result.append(vals)
    return result


def _ts_to_date(ts_str: str) -> Optional[pd.Timestamp]:
    """Convert JS millisecond timestamp → pandas Timestamp (same as R package)."""
    try:
        ts = (float(ts_str) + 0.1) / 1000
        return pd.Timestamp.fromtimestamp(ts).normalize()
    except (ValueError, TypeError, OSError):
        return None


def _to_float(s: str) -> Optional[float]:
    """Safely convert string to float."""
    try:
        return float(str(s).strip().rstrip("]").rstrip(","))
    except (ValueError, TypeError):
        return None
