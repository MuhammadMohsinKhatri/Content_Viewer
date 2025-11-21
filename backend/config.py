import os
from typing import Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

class Settings(BaseSettings):
    # App settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60  # 30 days
    BASE_URL: str = "http://localhost:8000"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./content_platform.db"
    
    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "content-platform-bucket"
    
    # Payway Settings
    PAYWAY_API_URL: str = "https://api.payway.co.ke"
    PAYWAY_API_KEY: Optional[str] = None
    
    # Content Settings
    CONTENT_PRICE: float = 5.0  # KSH 5 per content view
    PLATFORM_COMMISSION: float = 0.5  # 50% to platform, 50% to creator
    CONTENT_EXPIRY_DAYS: int = 14  # Content expires after 2 weeks
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500MB
    ALLOWED_AUDIO_TYPES: list = ["audio/mpeg", "audio/wav", "audio/ogg"]
    ALLOWED_VIDEO_TYPES: list = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]
    
    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}

settings = Settings()
