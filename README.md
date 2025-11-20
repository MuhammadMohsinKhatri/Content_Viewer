# ContentHub - Creator Monetization Platform

A modern platform where creators can upload and monetize audio/video content, with viewers paying KSH 5 per content piece. Built with FastAPI backend and React frontend.

## 🚀 Features

- **Content Upload & Management**: Creators can upload audio/video files to AWS S3
- **Payment Processing**: Integrated with Payway for M-Pesa payments
- **Revenue Sharing**: 50/50 split between platform and creators
- **Auto-Expiry**: Content automatically expires after 2 weeks
- **Weekly Payouts**: Automated Excel reports for creator payments
- **Modern UI**: Responsive React frontend with Tailwind CSS
- **Real-time Updates**: Fast API with async operations

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM with async support
- **SQLite/PostgreSQL** - Database (configurable)
- **AWS S3** - File storage
- **Payway API** - Payment processing
- **Pandas** - Excel report generation

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **React Query** - API state management
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- AWS Account (for S3 storage)
- Payway Account (for payments)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Content_Viewer
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
# Create .env.local for any frontend-specific variables
```

### 4. Configuration

Edit `backend/.env` with your settings:

```env
# App Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
BASE_URL=http://localhost:8000

# Database Configuration
DATABASE_URL=sqlite+aiosqlite:///./content_platform.db

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=content-platform-bucket

# Payway Payment Configuration
PAYWAY_API_URL=https://api.payway.co.ke
PAYWAY_API_KEY=your-payway-api-key

# Content Settings
CONTENT_PRICE=5.0
PLATFORM_COMMISSION=0.5
CONTENT_EXPIRY_DAYS=14
```

### 5. Database Initialization

```bash
# From backend directory
python -c "
import asyncio
from database import create_tables
asyncio.run(create_tables())
"
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend** (from `backend/` directory):
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Start Frontend** (from `frontend/` directory):
```bash
npm start
```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📊 Business Model

### Revenue Structure
- **Content Price**: KSH 5.00 per view
- **Creator Share**: KSH 2.50 (50%)
- **Platform Share**: KSH 2.50 (50%)

### Payout Schedule
- **Frequency**: Weekly (Fridays)
- **Method**: Manual transfer based on Excel reports
- **Minimum**: No minimum payout threshold

### Content Lifecycle
- **Upload**: Creators upload audio/video content
- **Duration**: Content available for 2 weeks
- **Auto-cleanup**: Expired content removed from S3

## 🎯 User Roles

### Viewers
- Browse and preview content
- Pay KSH 5 to access full content
- View purchased content library
- Support favorite creators

### Creators
- Upload audio/video content
- Set content title and description
- Track views and earnings
- Receive weekly payouts
- Manage content library

### Admin
- Generate weekly earning reports
- Export Excel files for payouts
- Monitor platform performance
- Manage user accounts

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File type and size restrictions
- Secure S3 file uploads

## 📱 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Content
- `GET /api/content` - List all content
- `GET /api/content/{id}` - Get specific content
- `POST /api/content` - Upload new content (creators only)

### Payments
- `POST /api/payments/initiate` - Start payment process
- `POST /api/payments/callback` - Payment webhook

### Dashboard
- `GET /api/dashboard/creator` - Creator statistics
- `GET /api/dashboard/user` - User purchase history

### Admin
- `GET /api/admin/weekly-earnings` - Get earnings data
- `GET /api/admin/export-earnings` - Download Excel report

## 🚀 Deployment

### AWS S3 Setup
1. Create S3 bucket for file storage
2. Configure CORS for web uploads
3. Set up IAM user with S3 permissions
4. Update environment variables

### Payway Integration
1. Sign up for Payway account
2. Get API credentials
3. Configure webhook URLs
4. Test payment flow

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy backend (AWS/Heroku/DigitalOcean)
4. Deploy frontend (Netlify/Vercel/S3)
5. Set up domain and SSL

## 📈 Scaling Considerations

### Current Limits
- 500MB max file size
- 2-week content retention
- Manual payout process
- SQLite database (dev)

### Future Enhancements
- CDN integration for faster delivery
- Automated payout processing
- Content recommendation system
- Mobile app development
- Advanced analytics dashboard

## 🐛 Troubleshooting

### Common Issues

1. **S3 Upload Fails**
   - Check AWS credentials
   - Verify bucket permissions
   - Ensure CORS configuration

2. **Payment Processing Fails**
   - Verify Payway API credentials
   - Check webhook URLs
   - Test with valid phone numbers

3. **Database Errors**
   - Ensure database is initialized
   - Check connection string
   - Verify table creation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Create an issue on GitHub
- Check API documentation at `/docs`
- Review troubleshooting guide

---

**Happy Creating! 🎨✨**