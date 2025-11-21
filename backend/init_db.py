#!/usr/bin/env python3
"""
Database initialization script for ContentHub
Run this script to create database tables
"""

import asyncio
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from models import Base
from config import settings
from sqlalchemy.ext.asyncio import create_async_engine

async def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    try:
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        print("SUCCESS: Database tables created successfully!")
        
    except Exception as e:
        print(f"ERROR: Error creating tables: {e}")
        sys.exit(1)
    
    finally:
        await engine.dispose()

async def create_admin_user():
    """Create an initial admin user (optional)"""
    from sqlalchemy.ext.asyncio import async_sessionmaker
    from models import User
    from auth import get_password_hash
    
    print("\nCreating admin user...")
    
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            # Check if admin already exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.username == 'admin')
            )
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("Admin user already exists!")
                return
            
            # Create admin user
            admin_user = User(
                username='admin',
                email='admin@contenthub.com',
                password_hash=get_password_hash('admin123'),
                is_creator=True,
                creator_name='ContentHub Admin'
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("SUCCESS: Admin user created!")
            print("  Username: admin")
            print("  Password: admin123")
            print("  WARNING: Change this password in production!")
            
    except Exception as e:
        print(f"ERROR: Error creating admin user: {e}")
    
    finally:
        await engine.dispose()

async def main():
    """Main initialization function"""
    print("ContentHub Database Initialization")
    print("=====================================")
    
    # Create tables
    await create_tables()
    
    # Ask if user wants to create admin user
    create_admin = input("\nCreate admin user? (y/N): ").lower().strip()
    if create_admin == 'y':
        await create_admin_user()
    
    print("\nSUCCESS: Database initialization complete!")

if __name__ == "__main__":
    asyncio.run(main())
