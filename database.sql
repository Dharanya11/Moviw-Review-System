-- Movie Review System Database Schema
-- Run this script to create the required tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample movies
INSERT INTO movies (title, description, category, image) VALUES 
('The Shawshank Redemption', 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.', 'Drama', 'https://via.placeholder.com/300x450/333/fff?text=Shawshank'),
('The Dark Knight', 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.', 'Action', 'https://via.placeholder.com/300x450/333/fff?text=Dark+Knight'),
('Inception', 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', 'Sci-Fi', 'https://via.placeholder.com/300x450/333/fff?text=Inception')
ON DUPLICATE KEY UPDATE title = title;
