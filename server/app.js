const express = require('express');
require('express-async-errors');
const cors = require('cors');
require('./config/env');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Routes Files
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ExamGrid API is running' });
});

app.get('/api/health/db', async (req, res) => {
    const db = require('./database/db');
    try {
        await db.query('SELECT 1 FROM admins LIMIT 1');
        res.json({ status: 'ok', database: 'ready' });
    } catch (error) {
        console.error('Database readiness check failed:', error.message);
        res.status(503).json({ status: 'error', database: 'unavailable' });
    }
});

app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

// Includes rejected promises from Express 4 route handlers (e.g. pool.connect()).
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error('API error:', error.message);
    const status = error.status || 500;
    res.status(status).json({
        message: status === 413 ? 'Import hajmi 4 MB dan oshmasligi kerak' : 'Server error',
    });
});

module.exports = app;
