# Database Setup Guide

## MySQL Configuration

### Option 1: PlanetScale (Recommended)
```bash
# Install CLI
npm install -g planetscale

# Create database
planetscale create movie-review-db

# Get connection string
planetscale connect movie-review-db

# Environment Variables:
MYSQLHOST=your-planetscale-host
MYSQLUSER=your-username
MYSQLPASSWORD=your-password
MYSQLDATABASE=movie_db
```

### Option 2: Railway
```bash
# Install CLI
npm install -g @railway/cli

# Create MySQL database
railway login
railway add mysql

# Get credentials from Railway dashboard
```

### Option 3: Local MySQL (Testing only)
```bash
# Create database
mysql -u root -p
CREATE DATABASE movie_db;
```

### Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
MYSQLHOST=your-host
MYSQLUSER=your-username  
MYSQLPASSWORD=your-password
MYSQLDATABASE=movie_db
MYSQLPORT=3306
```
