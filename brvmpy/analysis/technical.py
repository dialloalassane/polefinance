"""
brvmpy.analysis.technical
==========================
Compute technical indicators from OHLCV price data.

All indicators are implemented from scratch using pandas/numpy —
no TA-Lib or external indicator library required.

Indicators
----------
Trend       : SMA_20, SMA_50, SMA_200, EMA_20, EMA_50
Momentum    : RSI_14, MACD, MACD_Signal, MACD_Hist, Stoch_K, Stoch_D, Williams_R
Volatility  : BB_Upper, BB_Middle, BB_Lower, BB_Width, ATR_14
Volume      : OBV, Volume_SMA_20, VWAP
Signals     : Signal_SMA (Golden/Death Cross), Signal_RSI, Signal_MACD, Signal_BB
Summary     : Overall_Signal (BUY / SELL / NEUTRAL)
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional


class TechnicalAnalysis:
    """
    Compute technical indicators on a BRVM stock OHLCV DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        Must have columns: Open, High, Low, Close, Volume
        Must have a DatetimeIndex named "Date".

    Examples
    --------
    >>> from brvmpy import BRVM
    >>> brvm = BRVM()
    >>> hist = brvm.history("SNTS", start="2022-01-01")
    >>> ta   = TechnicalAnalysis(hist).compute_all()
    >>> print(ta[["Close","RSI_14","MACD","Signal_RSI"]].tail())
    """

    def __init__(self, df: pd.DataFrame):
        if df.empty:
            raise ValueError("Cannot compute indicators on an empty DataFrame.")
        required = {"Open", "High", "Low", "Close"}
        missing  = required - set(df.columns)
        if missing:
            raise ValueError(f"DataFrame missing columns: {missing}")
        self._df = df.copy()

    # ── Public entry point ────────────────────────────────────────────────────

    def compute_all(self) -> pd.DataFrame:
        """
        Compute all indicators and return enriched DataFrame.

        Returns
        -------
        pd.DataFrame
            Original OHLCV + all indicators.
        """
        df = self._df.copy()
        df = self._add_moving_averages(df)
        df = self._add_rsi(df)
        df = self._add_macd(df)
        df = self._add_bollinger_bands(df)
        df = self._add_atr(df)
        df = self._add_stochastic(df)
        df = self._add_williams_r(df)
        df = self._add_obv(df)
        df = self._add_vwap(df)
        df = self._add_volume_sma(df)
        df = self._add_signals(df)
        return df

    # ── Trend ─────────────────────────────────────────────────────────────────

    def _add_moving_averages(self, df: pd.DataFrame) -> pd.DataFrame:
        close = df["Close"]
        df["SMA_20"]  = close.rolling(20).mean()
        df["SMA_50"]  = close.rolling(50).mean()
        df["SMA_200"] = close.rolling(200).mean()
        df["EMA_20"]  = close.ewm(span=20, adjust=False).mean()
        df["EMA_50"]  = close.ewm(span=50, adjust=False).mean()
        return df

    # ── Momentum ──────────────────────────────────────────────────────────────

    def _add_rsi(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        delta  = df["Close"].diff()
        gain   = delta.clip(lower=0)
        loss   = (-delta).clip(lower=0)
        avg_g  = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_l  = loss.ewm(com=period - 1, min_periods=period).mean()
        rs     = avg_g / avg_l.replace(0, np.nan)
        df[f"RSI_{period}"] = 100 - (100 / (1 + rs))
        return df

    def _add_macd(
        self,
        df: pd.DataFrame,
        fast: int = 12,
        slow: int = 26,
        signal: int = 9,
    ) -> pd.DataFrame:
        ema_fast = df["Close"].ewm(span=fast, adjust=False).mean()
        ema_slow = df["Close"].ewm(span=slow, adjust=False).mean()
        df["MACD"]        = ema_fast - ema_slow
        df["MACD_Signal"] = df["MACD"].ewm(span=signal, adjust=False).mean()
        df["MACD_Hist"]   = df["MACD"] - df["MACD_Signal"]
        return df

    def _add_stochastic(self, df: pd.DataFrame, k: int = 14, d: int = 3) -> pd.DataFrame:
        low_k  = df["Low"].rolling(k).min()
        high_k = df["High"].rolling(k).max()
        df["Stoch_K"] = 100 * (df["Close"] - low_k) / (high_k - low_k).replace(0, np.nan)
        df["Stoch_D"] = df["Stoch_K"].rolling(d).mean()
        return df

    def _add_williams_r(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        high_p = df["High"].rolling(period).max()
        low_p  = df["Low"].rolling(period).min()
        df["Williams_R"] = -100 * (high_p - df["Close"]) / (high_p - low_p).replace(0, np.nan)
        return df

    # ── Volatility ────────────────────────────────────────────────────────────

    def _add_bollinger_bands(self, df: pd.DataFrame, period: int = 20, std: float = 2.0) -> pd.DataFrame:
        sma    = df["Close"].rolling(period).mean()
        sigma  = df["Close"].rolling(period).std()
        df["BB_Middle"] = sma
        df["BB_Upper"]  = sma + std * sigma
        df["BB_Lower"]  = sma - std * sigma
        df["BB_Width"]  = (df["BB_Upper"] - df["BB_Lower"]) / df["BB_Middle"]
        df["BB_Pct_B"]  = (df["Close"] - df["BB_Lower"]) / (df["BB_Upper"] - df["BB_Lower"]).replace(0, np.nan)
        return df

    def _add_atr(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        prev_close = df["Close"].shift(1)
        tr = pd.concat([
            df["High"] - df["Low"],
            (df["High"] - prev_close).abs(),
            (df["Low"]  - prev_close).abs(),
        ], axis=1).max(axis=1)
        df[f"ATR_{period}"] = tr.ewm(com=period - 1, min_periods=period).mean()
        return df

    # ── Volume ────────────────────────────────────────────────────────────────

    def _add_obv(self, df: pd.DataFrame) -> pd.DataFrame:
        if "Volume" not in df.columns:
            return df
        direction = np.sign(df["Close"].diff()).fillna(0)
        df["OBV"] = (direction * df["Volume"].fillna(0)).cumsum()
        return df

    def _add_vwap(self, df: pd.DataFrame) -> pd.DataFrame:
        if "Volume" not in df.columns:
            return df
        typical = (df["High"] + df["Low"] + df["Close"]) / 3
        cum_tp_vol = (typical * df["Volume"].fillna(0)).cumsum()
        cum_vol    = df["Volume"].fillna(0).cumsum()
        df["VWAP"] = cum_tp_vol / cum_vol.replace(0, np.nan)
        return df

    def _add_volume_sma(self, df: pd.DataFrame, period: int = 20) -> pd.DataFrame:
        if "Volume" not in df.columns:
            return df
        df[f"Volume_SMA_{period}"] = df["Volume"].rolling(period).mean()
        return df

    # ── Signals ───────────────────────────────────────────────────────────────

    def _add_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        signals = []

        # SMA Golden/Death Cross
        if "SMA_50" in df.columns and "SMA_200" in df.columns:
            sma_cross = pd.Series("NEUTRAL", index=df.index)
            sma_cross[df["SMA_50"] > df["SMA_200"]] = "BUY"
            sma_cross[df["SMA_50"] < df["SMA_200"]] = "SELL"
            df["Signal_SMA"] = sma_cross
            signals.append(sma_cross)

        # RSI
        if "RSI_14" in df.columns:
            rsi_sig = pd.Series("NEUTRAL", index=df.index)
            rsi_sig[df["RSI_14"] < 30] = "BUY"
            rsi_sig[df["RSI_14"] > 70] = "SELL"
            df["Signal_RSI"] = rsi_sig
            signals.append(rsi_sig)

        # MACD
        if "MACD_Hist" in df.columns:
            macd_sig = pd.Series("NEUTRAL", index=df.index)
            macd_sig[df["MACD_Hist"] > 0] = "BUY"
            macd_sig[df["MACD_Hist"] < 0] = "SELL"
            df["Signal_MACD"] = macd_sig
            signals.append(macd_sig)

        # Bollinger Bands
        if "BB_Pct_B" in df.columns:
            bb_sig = pd.Series("NEUTRAL", index=df.index)
            bb_sig[df["BB_Pct_B"] < 0]  = "BUY"
            bb_sig[df["BB_Pct_B"] > 1]  = "SELL"
            df["Signal_BB"] = bb_sig
            signals.append(bb_sig)

        # Overall consensus
        if signals:
            def consensus(row):
                buys  = sum(1 for s in row if s == "BUY")
                sells = sum(1 for s in row if s == "SELL")
                total = len(row)
                if buys / total >= 0.6:   return "BUY"
                if sells / total >= 0.6:  return "SELL"
                return "NEUTRAL"

            sig_df = pd.concat(signals, axis=1)
            df["Overall_Signal"] = sig_df.apply(consensus, axis=1)

        return df

    # ── Summary ───────────────────────────────────────────────────────────────

    def summary(self) -> dict:
        """
        Return a summary dict of the latest indicator values.

        Returns
        -------
        dict
            Latest values for key indicators + overall signal.
        """
        df  = self.compute_all()
        row = df.iloc[-1]

        def _v(col: str):
            return round(row[col], 2) if col in row.index and pd.notna(row[col]) else None

        return {
            "date":            str(df.index[-1].date()),
            "close":           _v("Close"),
            "sma_20":          _v("SMA_20"),
            "sma_50":          _v("SMA_50"),
            "sma_200":         _v("SMA_200"),
            "ema_20":          _v("EMA_20"),
            "rsi_14":          _v("RSI_14"),
            "macd":            _v("MACD"),
            "macd_signal":     _v("MACD_Signal"),
            "macd_hist":       _v("MACD_Hist"),
            "bb_upper":        _v("BB_Upper"),
            "bb_lower":        _v("BB_Lower"),
            "bb_width":        _v("BB_Width"),
            "atr_14":          _v("ATR_14"),
            "stoch_k":         _v("Stoch_K"),
            "stoch_d":         _v("Stoch_D"),
            "williams_r":      _v("Williams_R"),
            "signal_sma":      row.get("Signal_SMA", None),
            "signal_rsi":      row.get("Signal_RSI", None),
            "signal_macd":     row.get("Signal_MACD", None),
            "signal_bb":       row.get("Signal_BB", None),
            "overall_signal":  row.get("Overall_Signal", None),
        }
