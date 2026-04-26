"""Technical indicators - pure Python implementations. No external libs required."""

from typing import List, Dict, Optional

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def _sma(data: List[float], period: int) -> float:
    if len(data) < period or period <= 0:
        return 0.0
    window = data[-period:]
    return sum(window) / period


def _ema(data: List[float], period: int) -> float:
    if len(data) < period or period <= 0:
        return 0.0
    if HAS_NUMPY:
        arr = np.array(data[-period:], dtype=np.float64)
        alpha = 2.0 / (period + 1)
        ema_val = arr[0]
        for price in arr[1:]:
            ema_val = alpha * price + (1 - alpha) * ema_val
        return float(ema_val)
    alpha = 2.0 / (period + 1)
    ema_val = data[-period]
    for price in data[-(period - 1):]:
        ema_val = alpha * price + (1 - alpha) * ema_val
    return ema_val


def _ema_full(data: List[float], period: int) -> List[float]:
    """Return EMA series for all data points."""
    if len(data) < period or period <= 0:
        return [0.0] * len(data)
    alpha = 2.0 / (period + 1)
    ema_vals = [0.0] * len(data)
    ema_vals[period - 1] = sum(data[:period]) / period
    for i in range(period, len(data)):
        ema_vals[i] = alpha * data[i] + (1 - alpha) * ema_vals[i - 1]
    return ema_vals


def _std(data: List[float], period: int) -> float:
    if len(data) < period or period <= 1:
        return 0.0
    window = data[-period:]
    if HAS_NUMPY:
        return float(np.std(window, ddof=1))
    mean = sum(window) / period
    return (sum((x - mean) ** 2 for x in window) / (period - 1)) ** 0.5


def _wilder_smooth(data: List[float], period: int) -> float:
    """Wilder's smoothing: first value is simple average, subsequent use EMA-like smoothing."""
    if not data or period <= 0:
        return 0.0
    if len(data) <= period:
        return sum(data) / len(data)
    smoothed = sum(data[:period]) / period
    for i in range(period, len(data)):
        smoothed = (smoothed * (period - 1) + data[i]) / period
    return smoothed


def rsi(close_prices: List[float], period: int = 14) -> float:
    """Relative Strength Index."""
    if len(close_prices) < period + 1:
        return 0.0
    gains = []
    losses = []
    for i in range(len(close_prices) - period, len(close_prices)):
        diff = close_prices[i] - close_prices[i - 1]
        if diff >= 0:
            gains.append(diff)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(diff))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def macd(close_prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, Optional[float]]:
    """MACD: returns macd_line, signal_line, histogram."""
    if len(close_prices) < slow + signal:
        return {"macd_line": None, "signal_line": None, "histogram": None}
    ema_fast = _ema(close_prices, fast)
    ema_slow = _ema(close_prices, slow)
    macd_line = ema_fast - ema_slow
    ema_fast_full = _ema_full(close_prices, fast)
    ema_slow_full = _ema_full(close_prices, slow)
    macd_values = [
        0.0 if i < slow - 1 else ema_fast_full[i] - ema_slow_full[i]
        for i in range(len(close_prices))
    ]
    valid_macd = [v for v in macd_values if v != 0.0 or close_prices[macd_values.index(v)] != 0.0]
    if len(valid_macd) < signal:
        return {"macd_line": round(macd_line, 4), "signal_line": None, "histogram": None}
    alpha = 2.0 / (signal + 1)
    signal_val = sum(valid_macd[:signal]) / signal
    for v in valid_macd[signal:]:
        signal_val = alpha * v + (1 - alpha) * signal_val
    return {
        "macd_line": round(macd_line, 4),
        "signal_line": round(signal_val, 4),
        "histogram": round(macd_line - signal_val, 4),
    }


def bollinger_bands(close_prices: List[float], period: int = 20, std_dev: float = 2.0) -> Dict[str, Optional[float]]:
    """Bollinger Bands: upper, middle, lower."""
    if len(close_prices) < period:
        return {"upper": None, "middle": None, "lower": None}
    middle = _sma(close_prices, period)
    stdev = _std(close_prices, min(period, len(close_prices)))
    return {
        "upper": round(middle + std_dev * stdev, 4),
        "middle": round(middle, 4),
        "lower": round(middle - std_dev * stdev, 4),
    }


def sma(data: List[float], period: int) -> float:
    """Simple Moving Average."""
    return _sma(data, period)


def ema(data: List[float], period: int) -> float:
    """Exponential Moving Average."""
    return _ema(data, period)


def atr(high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
    """Average True Range (Wilder's smoothing)."""
    n = min(len(high), len(low), len(close))
    if n < period + 1:
        return 0.0
    tr_values = []
    for i in range(1, n):
        hl = abs(high[i] - low[i])
        hc = abs(high[i] - close[i - 1])
        lc = abs(low[i] - close[i - 1])
        tr_values.append(max(hl, hc, lc))
    return round(_wilder_smooth(tr_values, period), 4)


def obv(close: List[float], volume: List[float]) -> float:
    """On-Balance Volume (cumulative)."""
    n = min(len(close), len(volume))
    if n < 2:
        return 0.0
    obv_val = 0.0
    for i in range(1, n):
        if close[i] > close[i - 1]:
            obv_val += volume[i]
        elif close[i] < close[i - 1]:
            obv_val -= volume[i]
    return obv_val


def stochastic(high: List[float], low: List[float], close: List[float],
               k_period: int = 14, d_period: int = 3) -> Dict[str, Optional[float]]:
    """Stochastic Oscillator: %K and %D."""
    n = min(len(high), len(low), len(close))
    if n < k_period:
        return {"k": None, "d": None}
    k_values = []
    for i in range(k_period - 1, n):
        highest = max(high[i - k_period + 1:i + 1])
        lowest = min(low[i - k_period + 1:i + 1])
        if highest - lowest == 0:
            k_values.append(0.0)
        else:
            k_values.append(((close[i] - lowest) / (highest - lowest)) * 100.0)
    if not k_values:
        return {"k": None, "d": None}
    k = k_values[-1]
    d = sum(k_values[-min(d_period, len(k_values)):]) / min(d_period, len(k_values))
    return {"k": round(k, 4), "d": round(d, 4)}


def mfi(high: List[float], low: List[float], close: List[float],
        volume: List[float], period: int = 14) -> float:
    """Money Flow Index."""
    n = min(len(high), len(low), len(close), len(volume))
    if n < period + 1:
        return 0.0
    pos_flow = []
    neg_flow = []
    for i in range(n - period, n):
        typical = (high[i] + low[i] + close[i]) / 3.0
        prev_typical = (high[i - 1] + low[i - 1] + close[i - 1]) / 3.0 if i > 0 else typical
        raw_flow = typical * volume[i]
        if typical > prev_typical:
            pos_flow.append(raw_flow)
            neg_flow.append(0.0)
        else:
            pos_flow.append(0.0)
            neg_flow.append(raw_flow)
    sum_pos = sum(pos_flow) or 0.0
    sum_neg = sum(neg_flow) or 0.0
    if sum_neg == 0:
        return 100.0
    mfr = sum_pos / sum_neg
    return 100.0 - (100.0 / (1.0 + mfr))


def adx(high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
    """Average Directional Index."""
    n = min(len(high), len(low), len(close))
    if n < period * 2:
        return 0.0
    tr_values = []
    plus_dm = []
    minus_dm = []
    for i in range(1, n):
        hl = abs(high[i] - low[i])
        hc = abs(high[i] - close[i - 1])
        lc = abs(low[i] - close[i - 1])
        tr_values.append(max(hl, hc, lc))
        up = high[i] - high[i - 1]
        down = low[i - 1] - low[i]
        if up > down and up > 0:
            plus_dm.append(up)
        else:
            plus_dm.append(0.0)
        if down > up and down > 0:
            minus_dm.append(down)
        else:
            minus_dm.append(0.0)
    tr_smooth = _wilder_smooth(tr_values, period)
    plus_smooth = _wilder_smooth(plus_dm, period)
    minus_smooth = _wilder_smooth(minus_dm, period)
    if tr_smooth == 0:
        return 0.0
    plus_di = (plus_smooth / tr_smooth) * 100
    minus_di = (minus_smooth / tr_smooth) * 100
    di_sum = plus_di + minus_di
    if di_sum == 0:
        return 0.0
    dx = abs(plus_di - minus_di) / di_sum * 100
    return round(dx, 4)


def compute_all_indicators(close_prices: List[float], high_prices: List[float] = None,
                           low_prices: List[float] = None, volumes: List[float] = None) -> Dict:
    """Compute all indicators from price data."""
    n = len(close_prices)
    high_prices = high_prices or close_prices
    low_prices = low_prices or close_prices
    volumes = volumes or [1.0] * n

    result = {
        "rsi": round(rsi(close_prices), 2) if n >= 15 else None,
        "macd": macd(close_prices),
        "bollinger": bollinger_bands(close_prices),
        "sma_20": round(sma(close_prices, 20), 4) if n >= 20 else None,
        "sma_50": round(sma(close_prices, 50), 4) if n >= 50 else None,
        "sma_200": round(sma(close_prices, 200), 4) if n >= 200 else None,
        "ema_12": round(ema(close_prices, 12), 4) if n >= 12 else None,
        "ema_26": round(ema(close_prices, 26), 4) if n >= 26 else None,
        "atr": round(atr(high_prices, low_prices, close_prices), 4) if n >= 15 else None,
        "obv": round(obv(close_prices, volumes), 2) if n >= 2 else None,
        "stochastic": stochastic(high_prices, low_prices, close_prices),
        "mfi": round(mfi(high_prices, low_prices, close_prices, volumes), 2) if n >= 15 else None,
        "adx": round(adx(high_prices, low_prices, close_prices), 2) if n >= 28 else None,
    }
    return result
