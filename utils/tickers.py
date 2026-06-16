"""
brvmpy.utils.tickers
====================
Single source of truth for all BRVM-listed company tickers.

Each entry: (ticker, name, sector, country, country_code)
country_code is used to build sikafinance.com URLs.

Source: CRAN BRVM R package + BRVM official listing
"""

from __future__ import annotations


# fmt: off
TICKERS: list[tuple[str, str, str, str, str]] = [
    # ticker   name                                  sector            country         cc
    ("ABJC",  "Agence de Bourse BRVM",              "Finance",        "Cote dIvoire", "ci"),
    ("BICC",  "Bernabe CI",                          "Distribution",   "Cote dIvoire", "ci"),
    ("BNBC",  "Bici Bail",                           "Finance",        "Cote dIvoire", "ci"),
    ("BOAB",  "Bank of Africa Benin",                "Finance",        "Benin",         "bj"),
    ("BOABF", "Bank of Africa Burkina Faso",         "Finance",        "Burkina Faso",  "bf"),
    ("BOAC",  "Bank of Africa Congo",                "Finance",        "Cote dIvoire", "ci"),
    ("BOAM",  "Bank of Africa Mali",                 "Finance",        "Mali",          "ml"),
    ("BOAN",  "Bank of Africa Niger",                "Finance",        "Niger",         "ne"),
    ("BOAS",  "Bank of Africa Senegal",              "Finance",        "Senegal",       "sn"),
    ("CABC",  "CABC CI",                             "Finance",        "Cote dIvoire", "ci"),
    ("CBIBF", "Coris Bank Burkina Faso",             "Finance",        "Burkina Faso",  "bf"),
    ("CFAC",  "CFAO Motors CI",                      "Distribution",   "Cote dIvoire", "ci"),
    ("CIEC",  "CIE CI",                              "Public Services","Cote dIvoire", "ci"),
    ("ECOC",  "Ecobank CI",                          "Finance",        "Cote dIvoire", "ci"),
    ("ETIT",  "Ecobank Transnational Inc.",           "Finance",        "Togo",          "tg"),
    ("FTSC",  "Filtisac CI",                         "Industry",       "Cote dIvoire", "ci"),
    ("NEIC",  "NEI CEDA CI",                         "Distribution",   "Cote dIvoire", "ci"),
    ("NSBC",  "Nsia Banque CI",                      "Finance",        "Cote dIvoire", "ci"),
    ("NTLC",  "Nestle CI",                           "Agriculture",    "Cote dIvoire", "ci"),
    ("ONTBF", "ONT Burkina Faso",                    "Telecom",        "Burkina Faso",  "bf"),
    ("ORGT",  "Oragroup Togo",                       "Finance",        "Togo",          "tg"),
    ("ORAC",  "Orange CI",                           "Telecom",        "Cote dIvoire", "ci"),
    ("PALC",  "Palm CI",                             "Agriculture",    "Cote dIvoire", "ci"),
    ("PRSC",  "Prestige CI",                         "Industry",       "Cote dIvoire", "ci"),
    ("SAFC",  "SAFCA CI",                            "Finance",        "Cote dIvoire", "ci"),
    ("SCRC",  "SICOR CI",                            "Agriculture",    "Cote dIvoire", "ci"),
    ("SDCC",  "SDCI CI",                             "Finance",        "Cote dIvoire", "ci"),
    ("SDSC",  "Sode CI",                             "Agriculture",    "Cote dIvoire", "ci"),
    ("SEMC",  "Crown Siem CI",                       "Industry",       "Cote dIvoire", "ci"),
    ("SGBC",  "Societe Generale CI",                 "Finance",        "Cote dIvoire", "ci"),
    ("SHEC",  "Shell CI",                            "Distribution",   "Cote dIvoire", "ci"),
    ("SIBC",  "SIB CI",                              "Finance",        "Cote dIvoire", "ci"),
    ("SICC",  "SICABLE CI",                          "Industry",       "Cote dIvoire", "ci"),
    ("SIVC",  "SIVOA CI",                            "Agriculture",    "Cote dIvoire", "ci"),
    ("SLBC",  "Solibra CI",                          "Agriculture",    "Cote dIvoire", "ci"),
    ("SMBC",  "SMB CI",                              "Industry",       "Cote dIvoire", "ci"),
    ("SNTS",  "Sonatel Senegal",                     "Telecom",        "Senegal",       "sn"),
    ("SOGC",  "SOGB CI",                             "Agriculture",    "Cote dIvoire", "ci"),
    ("SPHC",  "SAPH CI",                             "Agriculture",    "Cote dIvoire", "ci"),
    ("STAC",  "SETAO CI",                            "Construction",   "Cote dIvoire", "ci"),
    ("STBC",  "SETB CI",                             "Transport",      "Cote dIvoire", "ci"),
    ("TTLC",  "Total CI",                            "Distribution",   "Cote dIvoire", "ci"),
    ("TTLS",  "Total Senegal",                       "Distribution",   "Senegal",       "sn"),
    ("UNLC",  "UNACOOPEC CI",                        "Finance",        "Cote dIvoire", "ci"),
    ("UNXC",  "Union Financiere CI",                 "Finance",        "Cote dIvoire", "ci"),
]
# fmt: on

# Build fast lookup dict: ticker → dict
_TICKER_MAP: dict[str, dict] = {
    t[0]: {
        "ticker":  t[0],
        "name":    t[1],
        "sector":  t[2],
        "country": t[3],
        "cc":      t[4],
    }
    for t in TICKERS
}

VALID_TICKERS: set[str] = set(_TICKER_MAP.keys())


def get_ticker_info(ticker: str) -> dict:
    """
    Return metadata for a ticker.

    Parameters
    ----------
    ticker : str
        BRVM ticker symbol (case-insensitive).

    Returns
    -------
    dict
        Keys: ticker, name, sector, country, cc

    Raises
    ------
    ValueError
        If the ticker is not in the BRVM universe.
    """
    t = ticker.upper()
    if t not in _TICKER_MAP:
        raise ValueError(
            f"'{t}' is not a valid BRVM ticker. "
            f"Use BRVM().tickers() to see all {len(TICKERS)} available tickers."
        )
    return _TICKER_MAP[t]


def get_all_tickers() -> list[str]:
    """Return list of all BRVM ticker symbols."""
    return [t[0] for t in TICKERS]
