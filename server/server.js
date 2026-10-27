// Lokal ishga tushirish uchun. Vercel'da esa api/index.js app.js'ni to'g'ridan-to'g'ri ishlatadi
const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
