const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Add mongoose for ObjectId validation
const User = require('../models/User');
const router = express.Router();

// Utility to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const createToken = (user) => {
  if (!isValidObjectId(user._id)) {
    throw new Error('Invalid user ID in database');
  }
  return jwt.sign(
    { userId: user._id.toString(), email: user.email }, // Ensure userId is a string
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User({ email, password });
    await user.save();

    const token = createToken(user);
    res.status(201).json({ 
      token, 
      user: { id: user._id.toString(), email: user.email } 
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ 
      token, 
      user: { id: user._id.toString(), email: user.email } 
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

module.exports = router;