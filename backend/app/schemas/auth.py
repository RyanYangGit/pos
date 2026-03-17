from typing import Optional
from pydantic import BaseModel


class DeviceRegisterRequest(BaseModel):
    device_name: str
    exhibition_id: str


class DeviceRegisterResponse(BaseModel):
    device_id: str
    exhibition_id: str
    device_name: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    id: str
    username: str
    display_name: str
    role: str
    company_id: Optional[str]
