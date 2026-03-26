# Movie Review System - Deployment Guide

## 🚀 Deploy to Render

This guide will help you deploy your Movie Review System to Render.com.

### 📋 Prerequisites

1. **Render Account**: Create a free account at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MySQL Database**: Set up a MySQL database (Render offers MySQL as a service)

### 🗄️ Database Setup

1. Create a new MySQL database on Render
2. Note the connection details:
   - Host
   - Database name
   - Username
   - Password
   - Port

### 🔧 Environment Variables

Set these environment variables in your Render dashboard:

#### Backend Service (movie-review-api)
```
NODE_ENV=production
PORT=10000
DB_HOST=your-mysql-host
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
```

#### Frontend Service (movie-review-frontend)
```
NODE_ENV=production
```

### 📁 Project Structure

```
movie-review-system/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── uploads/
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   └── images/
├── render.yaml
└── DEPLOYMENT.md
```

### 🚀 Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to render.com
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select "Existing Dockerfile" or "Runtime" (Node.js)

3. **Configure Backend Service**
   - Name: `movie-review-api`
   - Runtime: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Add environment variables

4. **Configure Frontend Service**
   - Name: `movie-review-frontend`
   - Runtime: Static
   - Publish Directory: `frontend`
   - Add rewrite rule for SPA routing

### 🔗 Update Frontend URLs

After deployment, update the API URLs in your frontend files:

**In `frontend/index.html`:**
```javascript
// Replace localhost with your Render API URL
fetch('https://movie-review-api.onrender.com/movies')
```

**In `frontend/admin.html`:**
```javascript
fetch('https://movie-review-api.onrender.com/users')
```

### 🗄️ Database Migration

Run these SQL commands to create the required tables:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT,
    user_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### ✅ Verification

1. Check if backend API is accessible
2. Test user registration and login
3. Verify movie uploads and reviews
4. Check admin panel functionality

### 🐛 Troubleshooting

**Common Issues:**
- **Database Connection**: Verify environment variables
- **CORS Errors**: Check allowed origins in backend
- **File Uploads**: Ensure uploads directory exists
- **Static Files**: Verify frontend build configuration

**Health Checks:**
- Backend: `GET /movies`
- Frontend: Visit your Render URL

### 📞 Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test database connection
4. Review this guide

---

**Happy Deploying! 🎬**
