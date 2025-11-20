from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    is_creator = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Creator profile fields
    creator_name = Column(String(100))
    phone_number = Column(String(15))
    bank_details = Column(Text)  # JSON string for bank details
    
    # Relationships
    content_items = relationship("Content", back_populates="creator")
    payments = relationship("Payment", back_populates="user")
    earnings = relationship("Earnings", back_populates="creator")

class Content(Base):
    __tablename__ = "content"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_url = Column(String(500), nullable=False)  # S3 URL
    file_type = Column(String(10), nullable=False)  # 'audio' or 'video'
    file_size = Column(Integer)  # File size in bytes
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price = Column(Float, default=5.0)  # KSH 5
    views = Column(Integer, default=0)
    paid_views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=14))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    creator = relationship("User", back_populates="content_items")
    payments = relationship("Payment", back_populates="content")
    earnings = relationship("Earnings", back_populates="content")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(String(36), ForeignKey("content.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payway_transaction_id = Column(String(100))
    status = Column(String(20), default='pending')  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    content = relationship("Content", back_populates="payments")

class Earnings(Base):
    __tablename__ = "earnings"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(String(36), ForeignKey("content.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Creator's 50% share
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    paid_out = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="earnings")
    content = relationship("Content", back_populates="earnings")
