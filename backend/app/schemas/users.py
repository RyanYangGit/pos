from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    display_name: str
    role: str  # "admin" | "cashier"
    company_id: Optional[str] = None  # only super_admin can set this


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    company_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    role: str
    company_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
