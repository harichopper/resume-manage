const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// ✅ Validate environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'POLLINATION_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Error: Missing environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/v1/suggestions', require('./routes/suggestions'));

// ✅ Root Redirect → Frontend Login Page
app.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL + '/login' || 'http://localhost:3000/login');
});

// ✅ Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', mongodb: mongoose.connection.readyState });
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
