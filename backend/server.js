const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

    // For simplicity, we'll use the token as user_id (in production, use JWT)
    req.user = { id: token };
    next();
}

const db = mysql.createConnection({
    host: 'localhost',
    user: 'rootuser',
    password: 'rootuser@123',
    database: 'movie_db'
});

db.connect(err => {
    if (err) {
        console.log("Database not connected");
    } else {
        console.log("Database connected");
    }
    console.log("MySQL Connected...");
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err, result) => {
        if (result.length > 0) {
            // Return user info with a simple token (user id)
            res.json({
                ...result[0],
                token: result[0].id.toString() // Simple token for demo
            });
        } else {
            res.json(null);
        }
    });
});

app.post('/signup', (req, res) => {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user already exists
    db.query("SELECT * FROM users WHERE username=?", [username], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (result.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Insert new user
        db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [username, password, role], (err, result) => {
                if (err) return res.status(500).json({ error: 'Failed to create user' });

                // Return the created user with token
                db.query("SELECT * FROM users WHERE id=?", [result.insertId], (err, users) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    res.json({
                        ...users[0],
                        token: users[0].id.toString()
                    });
                });
            }
        );
    });
});

app.post('/addMovie', upload.single('image'), (req, res) => {
    console.log('Request received:', req.body);
    console.log('File uploaded:', req.file);

    const { title, description, category } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !category || !imagePath) {
        console.log('Missing fields:', { title, description, category, imagePath });
        return res.status(400).json({ error: 'All fields including image are required' });
    }

    db.query("INSERT INTO movies (title, image, description, category) VALUES (?, ?, ?, ?)",
        [title, imagePath, description, category], (err, result) => {
            if (err) {
                console.log('Database error:', err);
                return res.status(500).json({ error: 'Failed to add movie' });
            }
            console.log('Movie added successfully');
            res.json({ message: "Movie Added successfully", movieId: result.insertId });
        }
    );
});

app.get('/movies', (req, res) => {
    db.query("SELECT * FROM movies", (err, result) => res.json(result));
});

app.post('/addReview', authenticateToken, (req, res) => {
    const { movie_id, user_id, rating, comment } = req.body;

    if (!movie_id || !user_id || !rating || !comment) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    db.query("INSERT INTO reviews (movie_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [movie_id, user_id, rating, comment], (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to add review' });
            res.json({ message: "Review Added successfully" });
        }
    );
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

        // Delete the user
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
// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Use environment variable for port or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle EADDRINUSE error
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
    } else {
        throw err;
    }
});
