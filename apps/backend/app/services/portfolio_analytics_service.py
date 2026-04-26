"""Portfolio analytics: Sharpe, Sortino, VaR, drawdowns, efficient frontier."""

from typing import List, Dict, Optional, Tuple
import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _std(values: List[float], ddof: int = 1) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    return math.sqrt(sum((x - m) ** 2 for x in values) / (len(values) - ddof))


def _annualize_return(daily_return: float, periods: int = 252) -> float:
    return (1 + daily_return) ** periods - 1


def calculate_returns(price_history: List[float]) -> List[float]:
    if len(price_history) < 2:
        return []
    return [(price_history[i] - price_history[i - 1]) / price_history[i - 1]
            for i in range(1, len(price_history))]


def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02, periods: int = 252) -> Optional[float]:
    if not returns or len(returns) < 2:
        return None
    mean_return = _mean(returns) * periods
    std_return = _std(returns) * math.sqrt(periods)
    if std_return == 0:
        return None
    rf_daily = (1 + risk_free_rate) ** (1.0 / periods) - 1
    excess_return = mean_return - risk_free_rate
    return excess_return / std_return


def calculate_sortino_ratio(returns: List[float], risk_free_rate: float = 0.02, periods: int = 252) -> Optional[float]:
    if not returns or len(returns) < 2:
        return None
    mean_return = _mean(returns) * periods
    downside = [min(r, 0) for r in returns]
    if HAS_NUMPY:
        dd = float(np.std(downside, ddof=1)) * math.sqrt(periods)
    else:
        dd = _std(downside) * math.sqrt(periods)
    if dd == 0:
        return None
    rf_daily = (1 + risk_free_rate) ** (1.0 / periods) - 1
    return (mean_return - risk_free_rate) / dd


def calculate_max_drawdown(portfolio_values: List[float]) -> Optional[float]:
    if not portfolio_values or len(portfolio_values) < 2:
        return None
    peak = portfolio_values[0]
    max_dd = 0.0
    for v in portfolio_values:
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd
    return max_dd


def calculate_var(returns: List[float], confidence: float = 0.95) -> Optional[float]:
    """Historical Value at Risk."""
    if not returns:
        return None
    sorted_returns = sorted(returns)
    index = int((1 - confidence) * len(sorted_returns))
    return abs(sorted_returns[max(0, index)])


def calculate_cvar(returns: List[float], confidence: float = 0.95) -> Optional[float]:
    """Conditional Value at Risk (expected shortfall)."""
    if not returns:
        return None
    sorted_returns = sorted(returns)
    index = int((1 - confidence) * len(sorted_returns))
    tail = sorted_returns[:max(1, index)]
    return abs(_mean(tail))


def calculate_beta(asset_returns: List[float], benchmark_returns: List[float]) -> Optional[float]:
    """Beta: covariance(asset, benchmark) / variance(benchmark)."""
    n = min(len(asset_returns), len(benchmark_returns))
    if n < 2:
        return None
    a = asset_returns[:n]
    b = benchmark_returns[:n]
    mean_a = _mean(a)
    mean_b = _mean(b)
    cov = sum((a[i] - mean_a) * (b[i] - mean_b) for i in range(n)) / (n - 1)
    var_b = sum((x - mean_b) ** 2 for x in b) / (n - 1)
    if var_b == 0:
        return None
    return cov / var_b


def calculate_efficient_frontier(expected_returns: List[float], cov_matrix: List[List[float]],
                                  num_portfolios: int = 100) -> List[Dict]:
    """Monte Carlo simulation for efficient frontier."""
    n = len(expected_returns)
    if n < 2 or num_portfolios < 1:
        return []
    import random
    random.seed(42)
    portfolios = []
    for _ in range(num_portfolios):
        weights = [random.random() for _ in range(n)]
        total = sum(weights)
        weights = [w / total for w in weights]
        port_return = sum(weights[i] * expected_returns[i] for i in range(n))
        port_vol = 0.0
        for i in range(n):
            for j in range(n):
                port_vol += weights[i] * weights[j] * cov_matrix[i][j]
        port_vol = math.sqrt(max(port_vol, 0))
        portfolios.append({
            "volatility": round(port_vol, 6),
            "return": round(port_return, 6),
            "weights": [round(w, 4) for w in weights],
        })
    portfolios.sort(key=lambda p: p["volatility"])
    seen_vols = set()
    frontier = []
    for p in portfolios:
        vol_rounded = round(p["volatility"], 4)
        if vol_rounded not in seen_vols:
            seen_vols.add(vol_rounded)
            frontier.append(p)
        elif p["return"] > frontier[-1]["return"]:
            frontier[-1] = p
    return frontier


def calculate_portfolio_metrics(holdings: List[Dict], price_history: List[List[float]]) -> Dict:
    """Comprehensive portfolio analysis.

    holdings: [{"symbol": str, "quantity": float, "current_price": float, ...}, ...]
    price_history: list of price series per holding (same order as holdings)
    """
    if not holdings:
        return {
            "total_value": 0.0,
            "sharpe_ratio": None,
            "sortino_ratio": None,
            "max_drawdown": None,
            "var_95": None,
            "cvar_95": None,
            "volatility_annual": None,
        }

    total_value = sum(h["quantity"] * h["current_price"] for h in holdings)

    portfolio_values = [0.0] * max(len(h) for h in price_history) if price_history else []
    if price_history:
        max_len = max(len(h) for h in price_history)
        for t in range(max_len):
            pv = 0.0
            for i, h in enumerate(holdings):
                if i < len(price_history) and t < len(price_history[i]):
                    pv += h["quantity"] * price_history[i][t]
                else:
                    pv += h["quantity"] * h["current_price"]
            portfolio_values[t] = pv

    returns = calculate_returns(portfolio_values) if len(portfolio_values) > 1 else []

    sharpe = calculate_sharpe_ratio(returns) if returns else None
    sortino = calculate_sortino_ratio(returns) if returns else None
    max_dd = calculate_max_drawdown(portfolio_values) if len(portfolio_values) > 1 else None
    var_95 = calculate_var(returns) if returns else None
    cvar_95 = calculate_cvar(returns) if returns else None
    vol_annual = (_std(returns) * math.sqrt(252)) if returns else None

    daily_ret = _mean(returns) if returns else None
    weekly_ret = None
    monthly_ret = None
    if daily_ret is not None:
        weekly_ret = ((1 + daily_ret) ** 5 - 1) if daily_ret != 0 else 0.0
        monthly_ret = ((1 + daily_ret) ** 21 - 1) if daily_ret != 0 else 0.0

    best_day = None
    worst_day = None
    if returns:
        best_idx = returns.index(max(returns))
        worst_idx = returns.index(min(returns))
        best_day = {"return": round(max(returns) * 100, 4), "index": best_idx}
        worst_day = {"return": round(min(returns) * 100, 4), "index": worst_idx}

    return {
        "total_value": round(total_value, 2),
        "daily_return": round(daily_ret, 6) if daily_ret is not None else None,
        "weekly_return": round(weekly_ret, 6) if weekly_ret is not None else None,
        "monthly_return": round(monthly_ret, 6) if monthly_ret is not None else None,
        "sharpe_ratio": round(sharpe, 4) if sharpe is not None else None,
        "sortino_ratio": round(sortino, 4) if sortino is not None else None,
        "max_drawdown": round(max_dd, 4) if max_dd is not None else None,
        "var_95": round(var_95, 4) if var_95 is not None else None,
        "cvar_95": round(cvar_95, 4) if cvar_95 is not None else None,
        "volatility_annual": round(vol_annual, 4) if vol_annual is not None else None,
        "best_day": best_day,
        "worst_day": worst_day,
    }
