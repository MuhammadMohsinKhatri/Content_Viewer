#!/usr/bin/env python3
"""
ContentHub Setup Script
Automates the setup process for the content platform
"""

import os
import sys
import subprocess
import asyncio
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a command and return the result"""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return None

def setup_backend():
    """Set up the FastAPI backend"""
    print("\n🔧 Setting up Backend...")
    
    backend_dir = Path("backend")
    
    # Check if Python is installed
    python_cmd = "python" if sys.platform == "win32" else "python3"
    
    # Create virtual environment
    print("Creating virtual environment...")
    venv_cmd = f"{python_cmd} -m venv venv"
    run_command(venv_cmd, cwd=backend_dir)
    
    # Determine activation command
    if sys.platform == "win32":
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install dependencies
    print("Installing Python dependencies...")
    install_cmd = f"{pip_cmd} install -r requirements.txt"
    run_command(install_cmd, cwd=backend_dir)
    
    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    env_example = backend_dir / ".env.example"
    
    if not env_file.exists():
        if env_example.exists():
            print("Creating .env file from example...")
            with open(env_example, 'r') as src, open(env_file, 'w') as dst:
                dst.write(src.read())
        else:
            print("Creating basic .env file...")
            with open(env_file, 'w') as f:
                f.write("""# ContentHub Configuration
SECRET_KEY=change-this-secret-key-in-production
DATABASE_URL=sqlite+aiosqlite:///./content_platform.db
BASE_URL=http://localhost:8000

# AWS S3 - Add your credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=content-platform-bucket

# Payway - Add your credentials
PAYWAY_API_URL=https://api.payway.co.ke
PAYWAY_API_KEY=your-payway-api-key

# Content Settings
CONTENT_PRICE=5.0
PLATFORM_COMMISSION=0.5
CONTENT_EXPIRY_DAYS=14
""")
    
    print("✅ Backend setup complete!")
    print(f"📝 Please edit {env_file} with your actual configuration")

def setup_frontend():
    """Set up the React frontend"""
    print("\n🎨 Setting up Frontend...")
    
    frontend_dir = Path("frontend")
    
    # Check if Node.js is installed
    node_check = run_command("node --version", check=False)
    if not node_check:
        print("❌ Node.js not found. Please install Node.js 16+ first.")
        return False
    
    # Install dependencies
    print("Installing Node.js dependencies...")
    run_command("npm install", cwd=frontend_dir)
    
    print("✅ Frontend setup complete!")
    return True

async def init_database():
    """Initialize the database"""
    print("\n🗄️  Initializing database...")
    
    try:
        # Add backend to Python path
        sys.path.append(str(Path("backend").absolute()))
        
        # Import and create tables
        from backend.models import Base
        from backend.database import engine
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print("You may need to run this manually after setting up the backend.")

def create_start_scripts():
    """Create convenient start scripts"""
    print("\n📜 Creating start scripts...")
    
    # Windows batch file
    with open("start-dev.bat", "w") as f:
        f.write("""@echo off
echo Starting ContentHub Development Environment...
echo.

echo Starting Backend...
start cmd /k "cd backend && venv\\Scripts\\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 > nul

echo Starting Frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ContentHub is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
pause
""")
    
    # Unix shell script
    with open("start-dev.sh", "w") as f:
        f.write("""#!/bin/bash
echo "Starting ContentHub Development Environment..."
echo

# Function to start backend
start_backend() {
    echo "Starting Backend..."
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "Starting Frontend..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Start services
start_backend
sleep 3
start_frontend

echo
echo "ContentHub is starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
""")
    
    # Make shell script executable
    if sys.platform != "win32":
        run_command("chmod +x start-dev.sh")
    
    print("✅ Start scripts created!")
    print("  - Windows: start-dev.bat")
    print("  - Unix/Mac: ./start-dev.sh")

def main():
    """Main setup function"""
    print("🚀 ContentHub Setup")
    print("==================")
    print("This script will set up the development environment for ContentHub.")
    print()
    
    # Check current directory
    if not (Path("backend").exists() and Path("frontend").exists()):
        print("❌ Please run this script from the project root directory.")
        print("Expected structure: backend/ and frontend/ directories")
        sys.exit(1)
    
    try:
        # Setup backend
        setup_backend()
        
        # Setup frontend
        frontend_ok = setup_frontend()
        
        if frontend_ok:
            # Initialize database
            asyncio.run(init_database())
            
            # Create start scripts
            create_start_scripts()
            
            print("\n🎉 Setup Complete!")
            print("==================")
            print()
            print("Next steps:")
            print("1. Edit backend/.env with your AWS S3 and Payway credentials")
            print("2. Run the development environment:")
            if sys.platform == "win32":
                print("   - Windows: start-dev.bat")
            else:
                print("   - Unix/Mac: ./start-dev.sh")
            print("3. Visit http://localhost:3000 to use the application")
            print("4. Check http://localhost:8000/docs for API documentation")
            print()
            print("Happy creating! 🎨✨")
        
    except KeyboardInterrupt:
        print("\n❌ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
