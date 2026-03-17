from pydantic import BaseModel


class PullCheckpoint(BaseModel):
    updated_at: int = 0
    id: str = ""


class PullRequest(BaseModel):
    checkpoint: PullCheckpoint | None = None
    limit: int = 100


class CategoryData(BaseModel):
    id: str
    name: str
    sort_order: int
    created_at: int
    updated_at: int


class ProductData(BaseModel):
    id: str
    category_id: str
    name: str
    price: int
    stock: int | None = None
    barcode: str | None = None
    is_active: bool = True
    sort_order: int = 0
    created_at: int
    updated_at: int


class OrderItemData(BaseModel):
    product_id: str
    product_name: str
    unit_price: int
    quantity: int
    subtotal: int


class OrderData(BaseModel):
    id: str
    order_number: str
    items: list[OrderItemData]
    total_amount: int
    payment_method: str
    note: str | None = None
    device_id: str
    created_at: int
    synced_at: int | None = None


class PullResponse(BaseModel):
    documents: list[dict]
    checkpoint: PullCheckpoint


class PushRow(BaseModel):
    newDocumentState: dict
    assumedMasterState: dict | None = None


class PushRequest(BaseModel):
    changeRows: list[PushRow]


class PushResponse(BaseModel):
    conflicts: list[dict] = []
