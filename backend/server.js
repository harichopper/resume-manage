// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/v1/suggestions', require('./routes/suggestions'));

// Root redirect
app.get('/', (req, res) => {
  res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', mongodb: mongoose.connection.readyState });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.message);
  res.status(err.statusCode || 500).json({ error: err.message });
});

// 👉 Export Express app for Vercel
module.exports = app;
