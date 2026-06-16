"""
brvmpy.utils.validators
=======================
Input validation helpers for tickers and date ranges.
"""

from __future__ import annotations
from datetime import date, datetime
from typing import Optional, Tuple, Union

from brvmpy.utils.tickers import VALID_TICKERS


def validate_ticker(ticker: str) -> str:
    """
    Validate and normalize a BRVM ticker symbol.

    Parameters
    ----------
    ticker : str
        Ticker symbol (case-insensitive).

    Returns
    -------
    str
        Uppercased ticker symbol.

    Raises
    ------
    TypeError
        If ticker is not a string.
    ValueError
        If ticker is not in the BRVM universe.
    """
    if not isinstance(ticker, str):
        raise TypeError(f"Ticker must be a string, got {type(ticker).__name__}.")
    t = ticker.strip().upper()
    if not t:
        raise ValueError("Ticker cannot be empty.")
    if t not in VALID_TICKERS:
        raise ValueError(
            f"'{t}' is not a valid BRVM ticker. "
            f"Call BRVM().tickers() to see all available symbols."
        )
    return t


def validate_dates(
    start: Optional[Union[str, date, datetime]],
    end:   Optional[Union[str, date, datetime]],
) -> Tuple[Optional[date], Optional[date]]:
    """
    Parse and validate a (start, end) date pair.

    Parameters
    ----------
    start : str, date, or datetime, optional
        Start date. Accepts "YYYY-MM-DD" or date/datetime objects.
    end : str, date, or datetime, optional
        End date.

    Returns
    -------
    Tuple[date | None, date | None]

    Raises
    ------
    ValueError
        If start > end, or if a date string cannot be parsed.
    """
    start_d = _parse_date(start, "start")
    end_d   = _parse_date(end,   "end")

    if start_d and end_d and start_d > end_d:
        raise ValueError(
            f"'start' ({start_d}) must be earlier than 'end' ({end_d})."
        )

    today = date.today()
    if end_d and end_d > today:
        end_d = today

    return start_d, end_d


def _parse_date(
    value: Optional[Union[str, date, datetime]],
    name:  str,
) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(value.strip(), fmt).date()
            except ValueError:
                continue
        raise ValueError(
            f"Cannot parse '{name}' date '{value}'. "
            "Use format 'YYYY-MM-DD' (e.g. '2023-01-15')."
        )
    raise TypeError(
        f"'{name}' must be a string or date, got {type(value).__name__}."
    )
