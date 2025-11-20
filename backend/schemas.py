from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_creator: bool = False
    creator_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_creator: bool
    creator_name: Optional[str]
    phone_number: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Content schemas
class ContentCreate(BaseModel):
    title: str
    description: Optional[str]

class ContentUpload(BaseModel):
    title: str
    description: Optional[str]
    file_type: str

class ContentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    file_url: str
    file_type: str
    creator_name: str
    price: float
    views: int
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

# Payment schemas
class PaymentCreate(BaseModel):
    content_id: str
    phone_number: str

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    content_id: str
    amount: float
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Earnings schemas
class EarningsResponse(BaseModel):
    id: int
    creator_id: int
    content_id: str
    amount: float
    week_start: date
    week_end: date
    paid_out: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class CreatorDashboard(BaseModel):
    content_count: int
    total_earnings: float
    content_items: List[dict]

class UserDashboard(BaseModel):
    purchased_count: int
    purchased_content: List[dict]

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
