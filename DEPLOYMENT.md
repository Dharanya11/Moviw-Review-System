# Movie Review System - Vercel Deployment Guide

## 🚀 Deployment Setup

### 📋 Prerequisites
- Vercel Account (free)
- GitHub Account
- MySQL Database (external - required for Vercel)

### 🗂 Project Structure for Vercel

```
Movie Review System/
├── api/                    # Backend API for Vercel
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # Frontend static files
│   ├── index.html         # Main app
│   ├── admin.html         # Admin panel
│   ├── login.html         # Login page
│   └── images/           # Static assets
├── vercel.json            # Vercel configuration
└── README.md              # Documentation
```

### 📝 Step 1: Prepare Project

#### Create API Directory
I've already created the `api/` directory with:
- `index.js` - Optimized backend for Vercel
- `package.json` - Dependencies and scripts

#### Key Changes for Vercel:
1. **Database Connection**: Uses environment variables
2. **File Uploads**: Configured for Vercel's serverless environment
3. **Static Serving**: Frontend served from root
4. **SPA Support**: Catch-all route for frontend routing

### 📝 Step 2: Database Setup

#### Option A: PlanetScale (Recommended for Vercel)
```bash
# Install PlanetScale CLI
npm install -g planetscale

# Create database
planetscale create movie-review-db

# Get connection string
planetscale connect movie-review-db
```

#### Option B: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Create MySQL database
railway login
railway add mysql
```

#### Option C: Supabase
```bash
# Create project at supabase.com
# Get connection details from dashboard
```

### 📝 Step 3: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create GitHub repository
gh repo create movie-review-system
git remote add origin https://github.com/yourusername/movie-review-system.git
git push -u origin main
```

### 📝 Step 4: Deploy to Vercel

#### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: movie-review-system
# - Directory: ./api
# - Override settings? Yes
```

#### Method 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import GitHub repository
4. Select `movie-review-system` repo
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `api`
   - **Build Command**: `npm install`
   - **Output Directory**: `.`
   - **Install Command**: `npm install`

### ⚙️ Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
DB_HOST=your-db-host
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-database-name
```

### 🔧 Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/uploads/(.*)",
      "dest": "/api/uploads",
      "methods": ["GET", "HEAD", "OPTIONS"]
    }
  ],
  "env": {
    "DB_HOST": "@db_host",
    "DB_USER": "@db_user", 
    "DB_PASSWORD": "@db_password",
    "DB_NAME": "@db_name"
  }
}
```

### 🌐 Deployment URLs

After deployment:
- **Main App**: `https://movie-review-system.vercel.app`
- **API**: `https://movie-review-system.vercel.app/api`
- **Health Check**: `https://movie-review-system.vercel.app/api/health`

### ⚠️ Important Notes

#### File Uploads on Vercel
- Vercel's serverless functions have limitations
- File uploads work but with size restrictions
- Consider using cloud storage (AWS S3, Cloudinary) for production

#### Database Considerations
- External MySQL required (Vercel doesn't provide persistent storage)
- Free tier databases available (PlanetScale, Railway, Supabase)
- Connection pooling recommended for production

#### Performance Optimizations
- Enable Vercel Analytics
- Configure custom domain
- Set up CDN for static assets
- Monitor function execution time

### 🐛 Common Issues & Solutions

#### 1. Database Connection Failed
**Problem**: `ECONNREFUSED` error
**Solution**: Check environment variables in Vercel dashboard

#### 2. File Upload Not Working
**Problem**: 500 error on upload
**Solution**: Check multer configuration and file size limits

#### 3. CORS Issues
**Problem**: Frontend can't connect to API
**Solution**: Verify CORS configuration in `api/index.js`

#### 4. Build Failures
**Problem**: Deployment fails during build
**Solution**: Check `api/package.json` dependencies

### 🔍 Testing Deployment

```bash
# Test locally with Vercel dev
vercel dev

# Check logs
vercel logs

# Test API endpoints
curl https://movie-review-system.vercel.app/api/health
```

### 📊 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Real-time error tracking
- **Database Monitoring**: External service monitoring
- **Uptime Monitoring**: Set up health checks

### 🔄 CI/CD Pipeline

For automated deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 🎯 Production Checklist

- [ ] External MySQL database configured
- [ ] Environment variables set
- [ ] File upload testing completed
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Monitoring enabled
- [ ] Backup strategy planned
- [ ] Performance testing completed

---

**🚀 Your Movie Review System is now ready for Vercel deployment!**

For support, check the Vercel documentation or create an issue in your repository.
