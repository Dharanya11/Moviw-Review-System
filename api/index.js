const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Authorization middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // For simplicity, we'll use token as user_id (in production, use JWT)
  req.user = { id: token };
  next();
}

// CORS and middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Database connection for Vercel
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('MySQL Connected...');
});

// API Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.query('SELECT * FROM users WHERE username=? AND password=?', [username, password], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ 
      id: result[0].id, 
      username: result[0].username, 
      role: result[0].role,
      token: result[0].id.toString() 
    });
  });
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, 'user'], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'User registered successfully', userId: result.insertId });
  });
});

app.get('/movies', (req, res) => {
  db.query('SELECT * FROM movies ORDER BY id DESC', (err, result) => res.json(result));
});

app.post('/addMovie', upload.single('image'), (req, res) => {
  const { title, category, description } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.query('INSERT INTO movies (title, category, description, image) VALUES (?, ?, ?, ?)', 
    [title, category, description, imagePath], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add movie' });
    res.json({ message: "Movie Added successfully", movieId: result.insertId });
  });
});

app.post('/addReview', authenticateToken, (req, res) => {
  const { movie_id, user_id, rating, comment } = req.body;
  
  db.query('INSERT INTO reviews (movie_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', 
    [movie_id, user_id, rating, comment], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add review' });
    res.json({ message: 'Review added successfully', reviewId: result.insertId });
  });
});

app.get('/reviews/:id', (req, res) => {
  db.query(`SELECT reviews.*, users.username 
            FROM reviews 
            JOIN users ON reviews.user_id = users.id 
            WHERE movie_id=?`, [req.params.id], (err, result) => res.json(result));
});

// User Management CRUD Routes
app.get('/users', (req, res) => {
  db.query("SELECT id, username, role FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(result);
  });
});

app.put('/users/:id', (req, res) => {
  const { username, role } = req.body;
  const userId = req.params.id;
  
  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }
  
  db.query("UPDATE users SET username=?, role=? WHERE id=?", [username, role, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update user' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  
  console.log('Attempting to delete user:', userId);
  
  // First check if user has reviews
  db.query("SELECT COUNT(*) as reviewCount FROM reviews WHERE user_id=?", [userId], (err, reviewResult) => {
    if (err) {
      console.log('Error checking user reviews:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const reviewCount = reviewResult[0].reviewCount;
    console.log('User has', reviewCount, 'reviews');
    
    if (reviewCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing reviews. Please delete their reviews first.' 
      });
    }
    
    // Delete user
    db.query("DELETE FROM users WHERE id=?", [userId], (err, result) => {
      if (err) {
        console.log('Error deleting user:', err);
        return res.status(500).json({ error: 'Failed to delete user: ' + err.message });
      }
      if (result.affectedRows === 0) {
        console.log('User not found:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('User deleted successfully:', userId);
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Get all reviews with movie and user info
app.get('/all-reviews', (req, res) => {
  db.query(`
      SELECT reviews.*, movies.title as movie_title, users.username
      FROM reviews 
      JOIN movies ON reviews.movie_id = movies.id 
      JOIN users ON reviews.user_id = users.id 
      ORDER BY reviews.id DESC
  `, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(result);
  });
});

// Delete individual review
app.delete('/reviews/:id', (req, res) => {
  const reviewId = req.params.id;
  
  db.query("DELETE FROM reviews WHERE id=?", [reviewId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete review' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend files
app.use(express.static('frontend'));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
