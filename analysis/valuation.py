"""
brvmpy.analysis.valuation
==========================
Multi-method intrinsic value computation for BRVM-listed companies.

Methods
-------
1. DDM (Gordon Growth Model)  : V = D₁ / (Ke − g)
2. Graham Number              : V = √(22.5 × EPS × Book Value)
3. PER-based                  : V = EPS × Sector_PER
4. Composite                  : Equally-weighted average of available methods

Market parameters (UEMOA/BRVM)
-------------------------------
- Rf  = 6.0%   BOAD 10-year bond rate (UEMOA risk-free)
- ERP = 7.0%   BRVM equity risk premium (historical)
- g   = 3.0%   Conservative perpetual dividend growth (UEMOA GDP)
"""

from __future__ import annotations
import math
from typing import Optional


# ── Market-wide constants ─────────────────────────────────────────────────────

RF    = 0.06   # Risk-free rate (BOAD/UEMOA 10yr)
ERP   = 0.07   # Equity Risk Premium
G_DDM = 0.03   # Perpetual dividend growth rate

# Sector PER benchmarks (BRVM historical averages)
SECTOR_PER: dict[str, float] = {
    "Finance":         8.0,
    "Agriculture":     12.0,
    "Distribution":    10.0,
    "Industry":        9.0,
    "Telecom":         15.0,
    "Public Services": 11.0,
    "Transport":       8.0,
    "Construction":    9.0,
}

# Verdict thresholds on Margin of Safety
VERDICTS = [
    (30,   "TRES SOUS-EVALUE"),
    (15,   "SOUS-EVALUE"),
    (-10,  "JUSTE VALEUR"),
    (-30,  "SUREVALUE"),
    (-999, "TRES SUREVALUE"),
]


class ValuationEngine:
    """
    Compute intrinsic value using multiple methods.

    Parameters
    ----------
    rf : float
        Risk-free rate (default 6%).
    erp : float
        Equity risk premium (default 7%).
    g_ddm : float
        Perpetual growth rate for DDM (default 3%).

    Examples
    --------
    >>> from brvmpy.analysis.valuation import ValuationEngine
    >>> engine = ValuationEngine()
    >>> fund = {"price": 15000, "eps": 1200, "dividend": 600, "book_value": 8000, "beta": 0.8}
    >>> result = engine.compute("SNTS", "Telecom", fund)
    >>> print(result["verdict"])
    """

    def __init__(
        self,
        rf:    float = RF,
        erp:   float = ERP,
        g_ddm: float = G_DDM,
    ):
        self.rf    = rf
        self.erp   = erp
        self.g_ddm = g_ddm

    # ── Public API ────────────────────────────────────────────────────────────

    def compute(self, ticker: str, sector: str, fund: dict) -> dict:
        """
        Compute intrinsic value for one ticker.

        Parameters
        ----------
        ticker : str
            BRVM ticker symbol.
        sector : str
            Company sector (used for PER benchmark lookup).
        fund : dict
            Fundamental data dict (from FundamentalData.fetch).

        Returns
        -------
        dict
            ticker, price, ke, v_ddm, v_graham, v_per, v_composite,
            margin_of_safety, verdict, methods_used, sector,
            eps, dividend, book_value, beta, per_market, div_yield
        """
        price      = fund.get("price")
        eps        = fund.get("eps")
        dividend   = fund.get("dividend")
        book_value = fund.get("book_value")
        beta       = fund.get("beta")
        per_market = fund.get("per_market")
        div_yield  = fund.get("div_yield")

        ke        = self.capm(beta)
        v_ddm     = self.ddm(dividend, beta)
        v_graham  = self.graham(eps, book_value)
        v_per     = self.per_based(eps, sector)
        v_comp    = self.composite([v_ddm, v_graham, v_per])
        mos       = self.margin_of_safety(v_comp, price)
        verd      = self.verdict(mos)

        methods = []
        if v_ddm    is not None: methods.append("DDM")
        if v_graham is not None: methods.append("Graham")
        if v_per    is not None: methods.append("PER")

        return {
            "ticker":            ticker,
            "sector":            sector,
            "price":             price,
            "eps":               eps,
            "dividend":          dividend,
            "book_value":        book_value,
            "beta":              beta,
            "per_market":        per_market,
            "div_yield":         div_yield,
            "ke":                round(ke * 100, 2),
            "v_ddm":             v_ddm,
            "v_graham":          v_graham,
            "v_per":             v_per,
            "v_composite":       v_comp,
            "margin_of_safety":  mos,
            "verdict":           verd,
            "methods_used":      methods,
            "source_url":        fund.get("source_url", ""),
        }

    # ── Valuation methods ─────────────────────────────────────────────────────

    def capm(self, beta: Optional[float]) -> float:
        """
        Ke = Rf + β × ERP
        Uses market beta (β=1) as fallback.
        """
        b = beta if (beta and 0.1 < beta < 5.0) else 1.0
        return self.rf + b * self.erp

    def ddm(
        self,
        dividend: Optional[float],
        beta:     Optional[float],
        g:        Optional[float] = None,
    ) -> Optional[float]:
        """
        Gordon Growth Model: V = D₁ / (Ke − g)

        D₁ = D₀ × (1 + g)
        """
        if not dividend or dividend <= 0:
            return None
        g  = g or self.g_ddm
        ke = self.capm(beta)
        if ke <= g:
            return None
        d1 = dividend * (1 + g)
        return round(d1 / (ke - g), 0)

    def graham(
        self,
        eps:        Optional[float],
        book_value: Optional[float],
    ) -> Optional[float]:
        """
        Graham Number: V = √(22.5 × EPS × Book Value per Share)
        Only valid when both EPS and Book Value are positive.
        """
        if not eps or not book_value or eps <= 0 or book_value <= 0:
            return None
        return round(math.sqrt(22.5 * eps * book_value), 0)

    def per_based(
        self,
        eps:    Optional[float],
        sector: str,
    ) -> Optional[float]:
        """
        PER-based value: V = EPS × Sector_PER
        Uses sector benchmark PER from BRVM historical averages.
        """
        if not eps or eps <= 0:
            return None
        per = SECTOR_PER.get(sector, 10.0)
        return round(eps * per, 0)

    @staticmethod
    def composite(values: list[Optional[float]]) -> Optional[float]:
        """
        Equally-weighted average of all non-None, positive valuations.
        """
        valid = [v for v in values if v is not None and v > 0]
        if not valid:
            return None
        return round(sum(valid) / len(valid), 0)

    @staticmethod
    def margin_of_safety(
        intrinsic: Optional[float],
        price:     Optional[float],
    ) -> Optional[float]:
        """
        MoS = (Intrinsic − Price) / Intrinsic × 100
        Positive = undervalued. Negative = overvalued.
        """
        if not intrinsic or not price or intrinsic <= 0 or price <= 0:
            return None
        return round((intrinsic - price) / intrinsic * 100, 1)

    @staticmethod
    def verdict(mos: Optional[float]) -> str:
        """Map a margin of safety value to a human-readable verdict."""
        if mos is None:
            return "N/A"
        for threshold, label in VERDICTS:
            if mos >= threshold:
                return label
        return "TRES SUREVALUE"

    def __repr__(self) -> str:
        return (
            f"ValuationEngine("
            f"Rf={self.rf:.0%}, ERP={self.erp:.0%}, g_DDM={self.g_ddm:.0%})"
        )
