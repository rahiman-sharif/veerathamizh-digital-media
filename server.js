// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const JSONStore = require('express-session-json')(session);
const cookieParser = require('cookie-parser');
const fs = require('fs');
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create sessions directory if it doesn't exist
const sessionsDir = path.join(__dirname, 'src', 'data', 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Initialize JSON files if they don't exist
const usersFile = path.join(dataDir, 'users.json');
const ordersFile = path.join(dataDir, 'orders.json');

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Enhanced session configuration with persistent store
app.use(session({
    store: new JSONStore({
        path: path.join(__dirname, 'src', 'data', 'sessions')
    }),
    secret: process.env.SESSION_SECRET || 'veerathamizhdigitalmedia-session-secret-key-2025',
    resave: false,
    saveUninitialized: false, // Changed to false for better security
    name: 'vdm.session.id', // Custom session name
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        httpOnly: true, // Prevent XSS attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days instead of 1 day
        sameSite: 'lax' // CSRF protection
    },
    rolling: true // Reset expiry on each request
}));

// Make user information available in all templates
const { setUserLocals } = require('./src/middlewares/authMiddleware');
app.use(setUserLocals);

app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const confirmationRoutes = require('./src/routes/confirmationRoutes');
const homeRoutes = require('./src/routes/homeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/order', orderRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/confirmation', confirmationRoutes);
app.use('/admin', adminRoutes);
app.use('/', homeRoutes);

// Error Handling Middleware
const { errorHandler } = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3002; // Changed from 3001 to avoid EADDRINUSE error
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
