const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create JWT
const createToken = (user) => {
  if (!isValidObjectId(user._id)) {
    throw new Error("Invalid user ID in database");
  }
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // ⏳ extended validity
  );
};

// Signup
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // 🔑 Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = createToken(user);

    res.status(201).json({
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    console.error("❌ Signup error:", err.message, err.stack);
    next(err); // pass to global error handler
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🔑 Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message, err.stack);
    next(err); // pass to global error handler
  }
});

module.exports = router;
