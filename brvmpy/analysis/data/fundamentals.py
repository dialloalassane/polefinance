"""
brvmpy.data.fundamentals
========================
Fetch fundamental financial data for BRVM-listed companies.

Data source: sikafinance.com
URL pattern: https://www.sikafinance.com/marches/cotation_{TICKER}.{country_code}

Fields scraped: Price, BNA/EPS, Dividend, Book Value, Beta,
                PER, Dividend Yield, RSI, Market Cap, Shares outstanding.

This replicates the logic of the CRAN BRVM R package BRVM_company_info():
https://github.com/cran/BRVM/blob/master/R/brvm_company_info.R
"""

from __future__ import annotations
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
from typing import Optional

from brvmpy.utils.tickers import TICKERS, get_ticker_info
from brvmpy.utils.http     import build_session


_BASE_URL = "https://www.sikafinance.com/marches/cotation_{ticker}.{cc}"

# Map scraped label → clean field name
# Keys are lowercased substrings to match against scraped table labels
_FIELD_MAP = {
    "cours":              "price",
    "dernier cours":      "price",
    "cloture":            "price",
    "per":                "per_market",
    "p/e":                "per_market",
    "bna":                "eps",
    "bnpa":               "eps",
    "benefice net":       "eps",
    "eps":                "eps",
    "dividende":          "dividend",
    "rendement":          "div_yield",
    "beta":               "beta",
    "rsi":                "rsi",
    "valeur comptable":   "book_value",
    "vcp":                "book_value",
    "capitalisation":     "market_cap",
    "nombre de titres":   "shares",
    "nb titres":          "shares",
    "plus haut":          "high_52w",
    "plus bas":           "low_52w",
    "variation":          "change_pct",
    "volume":             "volume",
}


class FundamentalData:
    """
    Scrape fundamental data from sikafinance.com.

    Parameters
    ----------
    delay : float
        Seconds between requests.
    timeout : int
        HTTP timeout in seconds.
    """

    def __init__(self, delay: float = 1.2, timeout: int = 25):
        self._delay   = delay
        self._timeout = timeout
        self._session = build_session()

    # ── Public API ────────────────────────────────────────────────────────────

    def fetch(self, ticker: str, cc: str) -> dict:
        """
        Fetch fundamental data for a single ticker.

        Parameters
        ----------
        ticker : str
            BRVM ticker symbol.
        cc : str
            Country code suffix (e.g. "ci", "sn", "tg").

        Returns
        -------
        dict
            Keys: ticker, price, eps, dividend, book_value, beta,
                  per_market, div_yield, rsi, market_cap, shares,
                  high_52w, low_52w, change_pct, volume, source_url
        """
        url  = _BASE_URL.format(ticker=ticker, cc=cc)
        html = self._get(url)
        data = self._parse(html)
        data["ticker"]     = ticker
        data["source_url"] = url
        return data

    def fetch_all(self, verbose: bool = True) -> pd.DataFrame:
        """
        Fetch fundamental data for all BRVM tickers.

        Returns
        -------
        pd.DataFrame
            One row per ticker with all fundamental fields.
        """
        rows  = []
        total = len(TICKERS)

        for i, (ticker, name, sector, country, cc) in enumerate(TICKERS, start=1):
            if verbose:
                print(f"[{i:02d}/{total}] {ticker:<6} — {name}")
            try:
                d = self.fetch(ticker, cc=cc)
                d["name"]    = name
                d["sector"]  = sector
                d["country"] = country
                rows.append(d)
                if verbose:
                    price = d.get("price", "N/A")
                    eps   = d.get("eps", "N/A")
                    print(f"         ✓ Price={price}  EPS={eps}")
            except Exception as exc:
                if verbose:
                    print(f"         ✗ FAILED: {exc}")
                rows.append({
                    "ticker": ticker, "name": name,
                    "sector": sector, "country": country,
                    "source_url": _BASE_URL.format(ticker=ticker, cc=cc),
                })
            time.sleep(self._delay)

        df = pd.DataFrame(rows)
        # Reorder columns for readability
        priority_cols = [
            "ticker", "name", "sector", "country",
            "price", "eps", "dividend", "book_value", "beta",
            "per_market", "div_yield", "rsi",
            "market_cap", "shares", "high_52w", "low_52w",
            "change_pct", "volume", "source_url",
        ]
        existing = [c for c in priority_cols if c in df.columns]
        other    = [c for c in df.columns if c not in priority_cols]
        return df[existing + other].reset_index(drop=True)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _get(self, url: str) -> str:
        resp = self._session.get(url, timeout=self._timeout)
        resp.raise_for_status()
        return resp.text

    def _parse(self, html: str) -> dict:
        """
        Parse sikafinance.com company page tables.
        Tables 2, 3, 4 (1-indexed) contain fundamental data
        as two-column (Label | Value) rows.
        """
        soup   = BeautifulSoup(html, "lxml")
        tables = soup.find_all("table")
        raw    = {}

        for tbl in tables[1:5]:
            for row in tbl.find_all("tr"):
                cols = row.find_all(["td", "th"])
                if len(cols) >= 2:
                    key = cols[0].get_text(strip=True).lower()
                    val = cols[1].get_text(strip=True)
                    raw[key] = val

        result = {}
        for raw_key, raw_val in raw.items():
            for pattern, field in _FIELD_MAP.items():
                if pattern in raw_key and field not in result:
                    v = _clean_number(raw_val)
                    if v is not None:
                        result[field] = v
                    break

        return result


# ── Module-level helpers ──────────────────────────────────────────────────────

def _clean_number(s: str) -> Optional[float]:
    """
    Convert BRVM-formatted number string to float.
    Handles:  "1 234,56 FCFA"  "12.5%"  "1 234 567"  "-"  "N/A"
    """
    if s is None:
        return None
    s = str(s).strip()
    if s in ("", "-", "N/A", "n/a", "—"):
        return None
    s = (
        s.replace("\xa0", "")
         .replace(" ", "")
         .replace(",", ".")
         .replace("FCFA", "")
         .replace("F", "")
         .replace("%", "")
    )
    # Take first value if range (e.g. "12.5/14.0")
    s = s.split("/")[0].strip()
    try:
        return float(s)
    except (ValueError, TypeError):
        return None
