from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import selectinload
from sqlalchemy import select, and_, func
from contextlib import asynccontextmanager
import os
import uuid
import boto3
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Optional
import asyncio
import aiofiles
import requests
from io import BytesIO
import json
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import atexit

from models import User, Content, Payment, Earnings, Base
from schemas import (
    UserCreate, UserResponse, UserLogin, ContentCreate, ContentResponse, 
    PaymentCreate, PaymentResponse, EarningsResponse, ContentUpload
)
from auth import create_access_token, verify_password, get_password_hash, get_current_user
from config import settings

# Initialize scheduler for background tasks
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.start()
    scheduler.add_job(cleanup_expired_content, "cron", hour=2)  # Run at 2 AM daily
    yield
    # Shutdown
    scheduler.shutdown()

# Initialize FastAPI app
app = FastAPI(
    title="Content Platform API",
    description="A platform for creators to upload and monetize audio/video content",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
from database import async_session, get_db

# AWS S3 setup
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Utility functions
async def upload_to_s3(file: UploadFile, filename: str) -> str:
    """Upload file to AWS S3 and return the URL"""
    try:
        file_content = await file.read()
        s3_client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=filename,
            Body=file_content,
            ContentType=file.content_type
        )
        return f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{filename}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")

async def process_payway_payment(user_id: int, content_id: str, amount: float, phone_number: str):
    """Process payment through Payway API"""
    payload = {
        'amount': amount,
        'phone_number': phone_number,
        'description': f'Payment for content {content_id}',
        'callback_url': f"{settings.BASE_URL}/api/payments/callback"
    }
    
    headers = {
        'Authorization': f'Bearer {settings.PAYWAY_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(f"{settings.PAYWAY_API_URL}/payments", 
                               json=payload, headers=headers, timeout=30)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

async def cleanup_expired_content():
    """Remove expired content from S3 and database"""
    async with async_session() as session:
        # Get expired content
        result = await session.execute(
            select(Content).where(
                and_(Content.expires_at < datetime.utcnow(), Content.is_active == True)
            )
        )
        expired_content = result.scalars().all()
        
        for content in expired_content:
            # Delete from S3
            try:
                filename = content.file_url.split('/')[-1]
                s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=filename)
            except Exception as e:
                print(f"Error deleting {content.id} from S3: {e}")
            
            # Mark as inactive
            content.is_active = False
        
        await session.commit()

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        is_creator=user_data.is_creator,
        creator_name=user_data.creator_name,
        phone_number=user_data.phone_number
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        is_creator=db_user.is_creator,
        creator_name=db_user.creator_name,
        phone_number=db_user.phone_number,
        created_at=db_user.created_at
    )

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_creator=current_user.is_creator,
        creator_name=current_user.creator_name,
        phone_number=current_user.phone_number,
        created_at=current_user.created_at
    )

# Content endpoints
@app.get("/api/content", response_model=List[ContentResponse])
async def get_content(
    skip: int = 0, 
    limit: int = 20, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Content)
        .options(selectinload(Content.creator))
        .where(Content.is_active == True)
        .order_by(Content.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    content_items = result.scalars().all()
    
    return [
        ContentResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            file_url=item.file_url,
            file_type=item.file_type,
            creator_name=item.creator.creator_name or item.creator.username,
            price=item.price,
            views=item.views,
            created_at=item.created_at,
            expires_at=item.expires_at
        )
        for item in content_items
    ]

@app.post("/api/content", response_model=ContentResponse)
async def create_content(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_creator:
        raise HTTPException(status_code=403, detail="Only creators can upload content")
    
    # Validate file type
    allowed_types = {'audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime', 'video/x-msvideo'}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    
    # Upload to S3
    file_url = await upload_to_s3(file, filename)
    
    # Determine file type
    file_type = 'audio' if file.content_type.startswith('audio') else 'video'
    
    # Create content record
    content = Content(
        title=title,
        description=description,
        file_url=file_url,
        file_type=file_type,
        file_size=file.size,
        creator_id=current_user.id,
        price=settings.CONTENT_PRICE
    )
    
    db.add(content)
    await db.commit()
    await db.refresh(content)
    
    return ContentResponse(
        id=content.id,
        title=content.title,
        description=content.description,
        file_url=content.file_url,
        file_type=content.file_type,
        creator_name=current_user.creator_name or current_user.username,
        price=content.price,
        views=content.views,
        created_at=content.created_at,
        expires_at=content.expires_at
    )

@app.get("/api/content/{content_id}", response_model=ContentResponse)
async def get_content_by_id(content_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Content)
        .options(selectinload(Content.creator))
        .where(and_(Content.id == content_id, Content.is_active == True))
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return ContentResponse(
        id=content.id,
        title=content.title,
        description=content.description,
        file_url=content.file_url,
        file_type=content.file_type,
        creator_name=content.creator.creator_name or content.creator.username,
        price=content.price,
        views=content.views,
        created_at=content.created_at,
        expires_at=content.expires_at
    )

# Payment endpoints
@app.post("/api/payments/initiate")
async def initiate_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if content exists
    result = await db.execute(select(Content).where(Content.id == payment_data.content_id))
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if user already paid for this content
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == current_user.id,
                Payment.content_id == payment_data.content_id,
                Payment.status == 'completed'
            )
        )
    )
    existing_payment = result.scalar_one_or_none()
    
    if existing_payment:
        raise HTTPException(status_code=400, detail="You have already paid for this content")
    
    # Process payment with Payway
    payway_response = await process_payway_payment(
        current_user.id, 
        payment_data.content_id, 
        content.price, 
        payment_data.phone_number
    )
    
    # Create payment record
    payment = Payment(
        user_id=current_user.id,
        content_id=payment_data.content_id,
        amount=content.price,
        payway_transaction_id=payway_response.get('transaction_id'),
        status='pending'
    )
    
    db.add(payment)
    await db.commit()
    
    return {"message": "Payment initiated", "transaction_id": payment.payway_transaction_id}

@app.post("/api/payments/callback")
async def payment_callback(callback_data: dict, db: AsyncSession = Depends(get_db)):
    """Handle Payway payment callback"""
    transaction_id = callback_data.get('transaction_id')
    status = callback_data.get('status')
    
    result = await db.execute(
        select(Payment).where(Payment.payway_transaction_id == transaction_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if status == 'completed':
        payment.status = 'completed'
        payment.completed_at = datetime.utcnow()
        
        # Increment content views
        result = await db.execute(select(Content).where(Content.id == payment.content_id))
        content = result.scalar_one_or_none()
        if content:
            content.paid_views += 1
    
    elif status == 'failed':
        payment.status = 'failed'
    
    await db.commit()
    return {"message": "Payment status updated"}

# Dashboard endpoints
@app.get("/api/dashboard/creator")
async def get_creator_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_creator:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get creator's content
    result = await db.execute(
        select(Content).where(
            and_(Content.creator_id == current_user.id, Content.is_active == True)
        )
    )
    content_items = result.scalars().all()
    
    # Calculate total earnings (unpaid)
    result = await db.execute(
        select(func.sum(Earnings.amount)).where(
            and_(Earnings.creator_id == current_user.id, Earnings.paid_out == False)
        )
    )
    total_earnings = result.scalar() or 0
    
    return {
        "content_count": len(content_items),
        "total_earnings": float(total_earnings),
        "content_items": [
            {
                "id": item.id,
                "title": item.title,
                "views": item.views,
                "paid_views": item.paid_views,
                "created_at": item.created_at,
                "expires_at": item.expires_at
            }
            for item in content_items
        ]
    }

@app.get("/api/dashboard/user")
async def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get user's purchased content
    result = await db.execute(
        select(Content)
        .join(Payment)
        .options(selectinload(Content.creator))
        .where(
            and_(
                Payment.user_id == current_user.id,
                Payment.status == 'completed'
            )
        )
    )
    purchased_content = result.scalars().all()
    
    return {
        "purchased_count": len(purchased_content),
        "purchased_content": [
            {
                "id": item.id,
                "title": item.title,
                "file_url": item.file_url,
                "file_type": item.file_type,
                "creator_name": item.creator.creator_name or item.creator.username,
                "created_at": item.created_at
            }
            for item in purchased_content
        ]
    }

# Admin endpoints for weekly payouts
@app.get("/api/admin/weekly-earnings")
async def get_weekly_earnings(
    week_start: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # For now, this is open - in production you'd want admin authentication
    
    week_end = week_start + timedelta(days=6)
    
    # Get all earnings for the specified week
    result = await db.execute(
        select(Earnings)
        .options(selectinload(Earnings.creator))
        .where(
            and_(
                Earnings.week_start == week_start,
                Earnings.week_end == week_end,
                Earnings.paid_out == False
            )
        )
    )
    earnings = result.scalars().all()
    
    # Group by creator
    creator_earnings = {}
    for earning in earnings:
        creator_id = earning.creator_id
        if creator_id not in creator_earnings:
            creator_earnings[creator_id] = {
                'creator_name': earning.creator.creator_name or earning.creator.username,
                'phone_number': earning.creator.phone_number,
                'total_amount': 0,
                'content_count': 0
            }
        creator_earnings[creator_id]['total_amount'] += earning.amount
        creator_earnings[creator_id]['content_count'] += 1
    
    return creator_earnings

@app.get("/api/admin/export-earnings")
async def export_weekly_earnings(
    week_start: date,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export weekly earnings to Excel file"""
    
    week_end = week_start + timedelta(days=6)
    
    # Get earnings data
    result = await db.execute(
        select(Earnings)
        .options(selectinload(Earnings.creator), selectinload(Earnings.content))
        .where(
            and_(
                Earnings.week_start == week_start,
                Earnings.week_end == week_end,
                Earnings.paid_out == False
            )
        )
    )
    earnings = result.scalars().all()
    
    # Create DataFrame
    data = []
    for earning in earnings:
        data.append({
            'Creator Name': earning.creator.creator_name or earning.creator.username,
            'Phone Number': earning.creator.phone_number,
            'Content Title': earning.content.title,
            'Amount (KSH)': earning.amount,
            'Week Start': earning.week_start,
            'Week End': earning.week_end
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file
    filename = f"earnings_{week_start}_to_{week_end}.xlsx"
    filepath = f"/tmp/{filename}"
    df.to_excel(filepath, index=False)
    
    return FileResponse(
        filepath,
        filename=filename,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
