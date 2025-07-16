const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// In-memory user storage (use database in production)
const users = [
  {
    id: 1,
    email: 'john@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    name: 'John Doe'
  }
];

// Helper function to find user by email
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }
    
    // Check if user already exists
    if (findUserByEmail(email)) {
      return res.status(409).json({ 
        message: 'User already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name
    };
    
    users.push(newUser);
    
    // Generate token
    const token = generateToken(newUser);
    
    // Return user data (excluding password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    };
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name
  });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;