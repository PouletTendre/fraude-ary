"""Stock valuation methods — pure Python implementations. No external libs required."""

from typing import Dict, Optional


def dcf_intrinsic_value(
    fcf: float,
    discount_rate: float = 0.10,
    growth_rate: float = 0.05,
    terminal_growth: float = 0.025,
    projection_years: int = 10,
    shares_outstanding: Optional[int] = None,
) -> float:
    """
    Discounted Cash Flow valuation.
    Projects FCF growing at growth_rate for projection_years, then adds terminal value.
    Returns intrinsic value per share (if shares_outstanding provided) or total value.
    """
    cash_flows = []
    for t in range(1, projection_years + 1):
        fcf_t = fcf * ((1 + growth_rate) ** t)
        pv = fcf_t / ((1 + discount_rate) ** t)
        cash_flows.append(pv)

    fcf_terminal = fcf * ((1 + growth_rate) ** projection_years) * (1 + terminal_growth)
    terminal_value = fcf_terminal / (discount_rate - terminal_growth)
    pv_terminal = terminal_value / ((1 + discount_rate) ** projection_years)

    total_value = sum(cash_flows) + pv_terminal

    if shares_outstanding and shares_outstanding > 0:
        return total_value / shares_outstanding
    return total_value


def graham_intrinsic_value(
    eps: float,
    growth_rate: float = 0.07,
    bond_yield: float = 0.05,
) -> float:
    """
    Benjamin Graham's original formula.
    V = EPS * (8.5 + 2g) * 4.4 / Y
    """
    if bond_yield <= 0:
        return eps * 15.0
    multiplier = 8.5 + (2 * growth_rate * 100)
    return eps * multiplier * (4.4 / (bond_yield * 100))


def graham_revised_intrinsic_value(
    eps: float,
    growth_rate: float = 0.07,
    bond_yield: float = 0.05,
) -> float:
    """
    Graham Revised formula (more conservative).
    V = EPS * (7 + g) * 4.4 / Y
    """
    if bond_yield <= 0:
        return eps * 15.0
    multiplier = 7.0 + (growth_rate * 100)
    return eps * multiplier * (4.4 / (bond_yield * 100))


def pe_multiple_intrinsic_value(
    eps: float,
    industry_pe: float = 15.0,
) -> float:
    """
    P/E Multiple valuation.
    Fair Value = EPS * industry_average_PE
    """
    if eps <= 0:
        return 0.0
    return eps * industry_pe


def weighted_average_intrinsic_value(
    values: Dict[str, float],
) -> float:
    """
    Weighted average of all methods.
    DCF 40%, Graham 20%, Graham Revised 20%, P/E 20%
    """
    weights = {
        "dcf": 0.40,
        "graham": 0.20,
        "graham_revised": 0.20,
        "pe_multiple": 0.20,
    }
    total_weight = 0.0
    weighted_sum = 0.0
    for method, weight in weights.items():
        if method in values and values[method] is not None and values[method] > 0:
            weighted_sum += values[method] * weight
            total_weight += weight
    if total_weight == 0:
        return 0.0
    return weighted_sum / total_weight


def calculate_margin_of_safety(
    intrinsic_value: float,
    market_price: float,
) -> tuple:
    """
    Return (margin_pct, label).
    label: 'undervalued', 'overvalued', or 'fair'
    """
    if market_price <= 0:
        return (0.0, "fair")
    diff_pct = (intrinsic_value - market_price) / market_price
    if diff_pct > 0.15:
        return (round(diff_pct, 4), "undervalued")
    elif diff_pct < -0.15:
        return (round(diff_pct, 4), "overvalued")
    else:
        return (round(diff_pct, 4), "fair")


def calculate_scenarios(
    base_value: float,
    variation: float = 0.15,
) -> Dict[str, float]:
    """Bear (-variation%), Base, Bull (+variation%) scenarios."""
    return {
        "bear": round(base_value * (1 - variation), 4),
        "base": round(base_value, 4),
        "bull": round(base_value * (1 + variation), 4),
    }


def calculate_valuation(
    symbol: str,
    market_price: float,
    financial_data: Dict[str, Optional[float]],
) -> Dict:
    """
    Full valuation report with all methods and weighted conclusion.

    financial_data expected keys:
        fcf, eps, shares_outstanding, pe_ratio, revenue_growth
    Returns a complete valuation dict.
    """
    fcf = financial_data.get("fcf")
    eps = financial_data.get("eps")
    shares = financial_data.get("shares_outstanding")
    pe_ratio = financial_data.get("pe_ratio")
    revenue_growth = financial_data.get("revenue_growth", 0.0) or 0.0
    is_estimated = financial_data.get("is_estimated", False)
    currency = financial_data.get("currency", "USD")

    growth_rate_for_dcf = max(0.01, min(revenue_growth / 100.0, 0.20)) if revenue_growth else 0.05
    growth_rate_for_graham = max(0.01, min(revenue_growth / 100.0, 0.25)) if revenue_growth else 0.07

    methods = {}

    # DCF
    if fcf and fcf > 0:
        methods["dcf"] = round(dcf_intrinsic_value(
            fcf=fcf,
            growth_rate=growth_rate_for_dcf,
            shares_outstanding=shares,
        ), 4)
    else:
        methods["dcf"] = None

    # Graham
    if eps and eps > 0:
        methods["graham"] = round(graham_intrinsic_value(
            eps=eps,
            growth_rate=growth_rate_for_graham,
        ), 4)
    else:
        methods["graham"] = None

    # Graham Revised
    if eps and eps > 0:
        methods["graham_revised"] = round(graham_revised_intrinsic_value(
            eps=eps,
            growth_rate=growth_rate_for_graham,
        ), 4)
    else:
        methods["graham_revised"] = None

    # P/E Multiple
    industry_pe = pe_ratio if (pe_ratio and pe_ratio > 0) else 15.0
    if eps and eps > 0:
        methods["pe_multiple"] = round(pe_multiple_intrinsic_value(
            eps=eps,
            industry_pe=industry_pe,
        ), 4)
    else:
        methods["pe_multiple"] = None

    # Weighted average
    avg_value = weighted_average_intrinsic_value(methods)
    if avg_value <= 0:
        avg_value = market_price

    margin_pct, label = calculate_margin_of_safety(avg_value, market_price)
    scenarios = calculate_scenarios(avg_value)

    method_list = []
    method_labels = {
        "dcf": "DCF",
        "graham": "Graham",
        "graham_revised": "Graham Revised",
        "pe_multiple": "P/E Multiple",
    }
    for key, val in methods.items():
        if val is not None and val > 0:
            m, l = calculate_margin_of_safety(val, market_price)
            method_list.append({
                "method": method_labels.get(key, key),
                "intrinsic_value": val,
                "margin_pct": m,
                "label": l,
            })

    return {
        "symbol": symbol.upper(),
        "market_price": market_price,
        "currency": currency,
        "intrinsic_value": round(avg_value, 4),
        "margin_pct": margin_pct,
        "label": label,
        "methods": method_list,
        "scenarios": scenarios,
        "financial_data": financial_data,
        "is_estimated": is_estimated,
    }
