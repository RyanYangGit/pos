from pydantic import BaseModel


class DailyReportResponse(BaseModel):
    date: str
    total_revenue: int
    total_transactions: int
    avg_transaction: int
    payment_breakdown: list[dict]
    top_products: list[dict]
