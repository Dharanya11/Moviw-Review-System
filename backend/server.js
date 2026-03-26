require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Simple auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  req.user = { id: token };
  next();
}

// ✅ Railway MySQL Connection (POOL - better)
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10
});

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("DB Connection Error:", err);
  } else {
    console.log("MySQL Connected ✅");
    connection.release();
  }
});


// ================= AUTH =================

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (result.length > 0) {
        res.json({
          ...result[0],
          token: result[0].id.toString()
        });
      } else {
        res.json(null);
      }
    }
  );
});

// Signup
app.post('/signup', (req, res) => {
  const { username, password, role = 'user' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.query("SELECT * FROM users WHERE username=?", [username], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, password, role],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Signup failed' });

        res.json({
          id: result.insertId,
          username,
          role,
          token: result.insertId.toString()
        });
      }
    );
  });
});


// ================= MOVIES =================

// Add Movie
app.post('/addMovie', upload.single('image'), (req, res) => {
  const { title, description, category } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !description || !category || !imagePath) {
    return res.status(400).json({ error: 'All fields including image are required' });
  }

  db.query(
    "INSERT INTO movies (title, image, description, category) VALUES (?, ?, ?, ?)",
    [title, imagePath, description, category],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to add movie' });
      }
      res.json({ message: "Movie added successfully", movieId: result.insertId });
    }
  );
});

// Get Movies
app.get('/movies', (req, res) => {
  db.query("SELECT * FROM movies", (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(result);
  });
});


// ================= REVIEWS =================

// Add Review
app.post('/addReview', authenticateToken, (req, res) => {
  const { movie_id, user_id, rating, comment } = req.body;

  if (!movie_id || !user_id || !rating || !comment) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.query(
    "INSERT INTO reviews (movie_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
    [movie_id, user_id, rating, comment],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to add review' });
      res.json({ message: "Review added successfully" });
    }
  );
});

// Get Reviews for a movie
app.get('/reviews/:id', (req, res) => {
  db.query(
    `SELECT reviews.*, users.username 
     FROM reviews 
     JOIN users ON reviews.user_id = users.id 
     WHERE movie_id=?`,
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(result);
    }
  );
});


// ================= USER MANAGEMENT =================

// Get Users
app.get('/users', (req, res) => {
  db.query("SELECT id, username, role FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(result);
  });
});

// Update User
app.put('/users/:id', (req, res) => {
  const { username, role } = req.body;

  db.query(
    "UPDATE users SET username=?, role=? WHERE id=?",
    [username, role, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ message: 'User updated' });
    }
  );
});

// Delete User
app.delete('/users/:id', (req, res) => {
  db.query("DELETE FROM users WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: 'User deleted' });
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
  db.query("DELETE FROM reviews WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: 'Review deleted' });
  });
});


// ================= START SERVER =================

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
console.log(process.env.MYSQLHOST);