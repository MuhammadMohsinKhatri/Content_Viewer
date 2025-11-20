# ContentHub Deployment Guide

This guide covers deploying ContentHub to production environments.

## 🚀 Quick Start (Development)

1. **Run the setup script:**
```bash
python setup.py
```

2. **Configure your environment:**
   - Edit `backend/.env` with your AWS S3 and Payway credentials
   - Ensure all required services are configured

3. **Start the application:**
   - Windows: `start-dev.bat`
   - Unix/Mac: `./start-dev.sh`

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Manual Setup (Alternative)

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Unix/Mac
source venv/bin/activate

pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🌐 Production Deployment

### 1. AWS S3 Setup

**Create S3 Bucket:**
```bash
# Using AWS CLI
aws s3 mb s3://your-content-platform-bucket --region us-east-1
```

**Configure CORS:**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

**IAM Policy for S3 Access:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-content-platform-bucket/*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::your-content-platform-bucket"
        }
    ]
}
```

### 2. Database Setup (PostgreSQL)

**Install PostgreSQL and create database:**
```sql
CREATE DATABASE content_platform;
CREATE USER content_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE content_platform TO content_user;
```

**Update DATABASE_URL:**
```env
DATABASE_URL=postgresql+asyncpg://content_user:secure_password@localhost/content_platform
```

### 3. Backend Deployment (Digital Ocean/AWS EC2)

**Install dependencies:**
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx
```

**Deploy application:**
```bash
git clone <your-repo>
cd content_platform/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

**Create systemd service (`/etc/systemd/system/contenthub.service`):**
```ini
[Unit]
Description=ContentHub FastAPI app
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/content_platform/backend
Environment="PATH=/path/to/content_platform/backend/venv/bin"
EnvironmentFile=/path/to/content_platform/backend/.env
ExecStart=/path/to/content_platform/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Configure Nginx (`/etc/nginx/sites-available/contenthub`):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /path/to/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable and start services:**
```bash
sudo systemctl enable contenthub
sudo systemctl start contenthub
sudo systemctl enable nginx
sudo systemctl start nginx
sudo ln -s /etc/nginx/sites-available/contenthub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Frontend Deployment

**Build for production:**
```bash
cd frontend
npm install
npm run build
```

**Deploy to Netlify/Vercel:**
- Connect your Git repository
- Set build command: `npm run build`
- Set publish directory: `build`
- Add environment variables if needed

**Deploy to S3 + CloudFront:**
```bash
# Upload build files
aws s3 sync build/ s3://your-frontend-bucket --delete

# Configure S3 for static website hosting
aws s3 website s3://your-frontend-bucket --index-document index.html --error-document index.html
```

### 5. Payway Integration

**Configure webhook URL:**
- Login to Payway dashboard
- Set webhook URL: `https://your-api-domain.com/api/payments/callback`
- Configure authentication if required

**Test payments:**
- Use Payway sandbox for testing
- Switch to production credentials when ready

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY in production
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Implement rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates

## 📊 Monitoring & Maintenance

### Logging
```bash
# View application logs
sudo journalctl -u contenthub -f

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backups
```bash
# PostgreSQL backup
pg_dump -h localhost -U content_user content_platform > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U content_user content_platform > $BACKUP_DIR/contenthub_$DATE.sql
find $BACKUP_DIR -name "contenthub_*.sql" -mtime +7 -delete
```

### S3 Cleanup
The application automatically cleans up expired content, but you can also set up S3 lifecycle rules:

```json
{
    "Rules": [
        {
            "ID": "ContentExpiry",
            "Status": "Enabled",
            "Filter": {},
            "Expiration": {
                "Days": 14
            }
        }
    ]
}
```

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check DATABASE_URL format
   - Verify database credentials
   - Ensure database server is running

2. **S3 Upload Fails:**
   - Verify AWS credentials
   - Check bucket permissions
   - Ensure CORS is configured

3. **Payment Processing Fails:**
   - Check Payway API credentials
   - Verify webhook URL is accessible
   - Test with valid Kenyan phone numbers

4. **Frontend Not Loading:**
   - Check if build files are served correctly
   - Verify API proxy configuration
   - Check browser console for errors

### Performance Optimization:

1. **Database:**
   - Add database indexes for frequent queries
   - Use connection pooling
   - Monitor query performance

2. **File Storage:**
   - Use CloudFront CDN for S3
   - Optimize file compression
   - Implement progressive loading

3. **Caching:**
   - Add Redis for session caching
   - Implement API response caching
   - Use browser caching headers

## 📈 Scaling Considerations

### Load Balancing
```nginx
upstream app_servers {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location /api/ {
        proxy_pass http://app_servers;
        # ... other config
    }
}
```

### Database Scaling
- Read replicas for analytics
- Connection pooling
- Query optimization
- Horizontal sharding if needed

### Monitoring
- Set up application monitoring (New Relic, DataDog)
- Configure alerts for errors and performance
- Monitor file storage costs
- Track payment processing metrics

---

🎉 **Your ContentHub platform is now ready for production!**

For support or questions, please refer to the main README or create an issue.
