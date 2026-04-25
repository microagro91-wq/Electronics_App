from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


GST_RATE = 0.18
LOCAL_ITC_PROBABILITY = 1.0
ONLINE_ITC_PROBABILITY = 0.5
LOCAL_GATEWAY_FEE_PERCENTAGE = 0.0
ONLINE_GATEWAY_FEE_PERCENTAGE = 0.018
ONLINE_TRANSIT_DAMAGE_RATE = 0.035
MINIMUM_ARBITRAGE_THRESHOLD_RATE = 0.05
DAILY_SALES_MARGIN_PER_UNIT = 800.0
REPLACEMENT_COMPONENT_COST = 3000.0
ONLINE_DEFECT_PROBABILITY = 0.28

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "dist"
SPA_DIR = DIST_DIR / "spa"

app = FastAPI(title="Daily Sourcing Scanner API")

# This allows local development if frontend is served separately.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class MarketAnalysisRequest(BaseModel):
    localQuote: float = Field(..., gt=0)
    quantityNeeded: int = Field(..., gt=0)
    onlineQuote: float = Field(..., gt=0)
    onlineDeliveryDays: int = Field(..., ge=0)
    urgentRestock: bool = False


def calculate_itc_adjusted_cost(base_price: float, itc_probability: float) -> float:
    """Normalize landed cost using GST and ITC compliance probability."""
    gst_component = base_price * GST_RATE
    return base_price + gst_component - (gst_component * itc_probability)


def calculate_financial_cost(
    cost_itc_adjusted: float, gateway_fee_percentage: float
) -> float:
    """Apply hidden platform transaction friction."""
    return cost_itc_adjusted + (cost_itc_adjusted * gateway_fee_percentage)


def calculate_transit_damage_buffer(cost_financial: float, damage_rate: float) -> float:
    """Add expected transit-damage buffer for fragile shipments."""
    return cost_financial * damage_rate


def apply_final_decision_gate(tco_local: float, tco_online: float) -> tuple[str, float]:
    """
    Rule 4: Only switch online when savings clear MAT.

    IF TCO_Online <= (TCO_Local - MAT), choose online; otherwise choose local.
    """
    mat_value = tco_local * MINIMUM_ARBITRAGE_THRESHOLD_RATE
    online_switch_threshold = tco_local - mat_value
    recommendation = "online" if tco_online <= online_switch_threshold else "local"
    return recommendation, mat_value


def calculate_stockout_cost(
    quantity_needed: int, online_delivery_days: int, urgent_restock: bool
) -> float:
    """
    Rule 5: Opportunity cost from delayed availability.

    Applies only when urgent restock is true.
    """
    if not urgent_restock:
        return 0.0
    return (DAILY_SALES_MARGIN_PER_UNIT * quantity_needed) * online_delivery_days


def calculate_warranty_accrual(
    defect_probability: float, component_replacement_cost: float
) -> float:
    """
    Rule 6: Warranty accrual for defective online B-grade panels.

    Accrual_Warranty = rho_defect * Cost_component_replacement
    """
    return defect_probability * component_replacement_cost


@app.post("/api/market-analysis")
def market_analysis(payload: MarketAnalysisRequest) -> dict:
    local_itc_adjusted_unit_cost = calculate_itc_adjusted_cost(
        payload.localQuote, LOCAL_ITC_PROBABILITY
    )
    online_itc_adjusted_unit_cost = calculate_itc_adjusted_cost(
        payload.onlineQuote, ONLINE_ITC_PROBABILITY
    )

    local_financial_unit_cost = calculate_financial_cost(
        local_itc_adjusted_unit_cost, LOCAL_GATEWAY_FEE_PERCENTAGE
    )
    online_financial_unit_cost = calculate_financial_cost(
        online_itc_adjusted_unit_cost, ONLINE_GATEWAY_FEE_PERCENTAGE
    )

    local_damage_unit_buffer = 0.0
    online_damage_unit_buffer = calculate_transit_damage_buffer(
        online_financial_unit_cost, ONLINE_TRANSIT_DAMAGE_RATE
    )

    local_final_unit_cost = local_financial_unit_cost + local_damage_unit_buffer
    online_final_unit_cost = online_financial_unit_cost + online_damage_unit_buffer

    local_total_cost = local_final_unit_cost * payload.quantityNeeded
    online_total_cost_before_stockout = online_final_unit_cost * payload.quantityNeeded
    stockout_cost = calculate_stockout_cost(
        quantity_needed=payload.quantityNeeded,
        online_delivery_days=payload.onlineDeliveryDays,
        urgent_restock=payload.urgentRestock,
    )
    local_warranty_accrual = 0.0
    online_warranty_accrual = calculate_warranty_accrual(
        defect_probability=ONLINE_DEFECT_PROBABILITY,
        component_replacement_cost=REPLACEMENT_COMPONENT_COST,
    )
    online_total_cost = (
        online_total_cost_before_stockout + stockout_cost + online_warranty_accrual
    )

    recommendation, mat_value = apply_final_decision_gate(
        tco_local=local_total_cost, tco_online=online_total_cost
    )

    return {
        "recommendation": recommendation,
        "local": {
            "basePrice": payload.localQuote,
            "itcProbability": LOCAL_ITC_PROBABILITY,
            "gatewayFeePercentage": LOCAL_GATEWAY_FEE_PERCENTAGE,
            "damageRate": 0.0,
            "itcAdjustedUnitCost": round(local_itc_adjusted_unit_cost, 2),
            "financialUnitCost": round(local_financial_unit_cost, 2),
            "damageUnitBuffer": round(local_damage_unit_buffer, 2),
            "finalUnitCost": round(local_final_unit_cost, 2),
            "finalTotalCost": round(local_total_cost, 2),
        },
        "online": {
            "basePrice": payload.onlineQuote,
            "itcProbability": ONLINE_ITC_PROBABILITY,
            "gatewayFeePercentage": ONLINE_GATEWAY_FEE_PERCENTAGE,
            "damageRate": ONLINE_TRANSIT_DAMAGE_RATE,
            "itcAdjustedUnitCost": round(online_itc_adjusted_unit_cost, 2),
            "financialUnitCost": round(online_financial_unit_cost, 2),
            "damageUnitBuffer": round(online_damage_unit_buffer, 2),
            "finalUnitCost": round(online_final_unit_cost, 2),
            "totalCostBeforeStockout": round(online_total_cost_before_stockout, 2),
            "stockoutCost": round(stockout_cost, 2),
            "defectProbability": ONLINE_DEFECT_PROBABILITY,
            "componentReplacementCost": REPLACEMENT_COMPONENT_COST,
            "warrantyAccrual": round(online_warranty_accrual, 2),
            "finalTotalCost": round(online_total_cost, 2),
        },
        "warrantyAccrual": {
            "local": round(local_warranty_accrual, 2),
            "online": round(online_warranty_accrual, 2),
        },
        "quantityNeeded": payload.quantityNeeded,
        "onlineDeliveryDays": payload.onlineDeliveryDays,
        "urgentRestock": payload.urgentRestock,
        "formulaRule1": "Cost_ITC_Adjusted = Base_Price + (Base_Price * 0.18) - (Base_Price * 0.18 * ITC_Probability)",
        "formulaRule2": "Cost_Financial = Cost_ITC_Adjusted + (Cost_ITC_Adjusted * Gateway_Fee_Percentage)",
        "formulaRule3": "Buffer_Damage = Cost_Financial * 0.035 (online only)",
        "formulaRule4": "MAT = TCO_Local * 0.05; switch online only if TCO_Online <= (TCO_Local - MAT)",
        "formulaRule5": "Cost_Stockout = (800 * Quantity_Needed) * Online_Delivery_Days, applied only when urgent restock is true",
        "formulaRule6": "Accrual_Warranty = rho_Defect * Cost_Component_Replacement (online only)",
        "matRate": MINIMUM_ARBITRAGE_THRESHOLD_RATE,
        "matValue": round(mat_value, 2),
        "onlineSwitchThreshold": round(local_total_cost - mat_value, 2),
    }


if SPA_DIR.exists() and (SPA_DIR / "index.html").exists():
    assets_dir = SPA_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        requested_path = SPA_DIR / full_path
        if full_path and requested_path.exists() and requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(SPA_DIR / "index.html")
else:
    @app.get("/")
    def frontend_not_built() -> dict:
        return {
            "message": "Frontend build not found.",
            "nextStep": "Run npm install && npm run build in the project root.",
        }
