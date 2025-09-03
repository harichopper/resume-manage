const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    const error = new Error('No token provided');
    error.statusCode = 401;
    return next(error);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    next(error);
  }
};

// Static skill map (fallback)
const staticSkillMap = {
  'software engineer': ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'GraphQL'],
  'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Pandas', 'TensorFlow'],
  'designer': ['Figma', 'Adobe XD', 'UI/UX', 'Photoshop', 'Illustrator', 'Sketch'],
};

// Pollinations AI integration
const getAISuggestions = async (role, context) => {
  try {
    const response = await axios.post(
      'https://api.pollinations.ai/v1/suggestions', // Replace with actual endpoint
      {
        prompt: `Generate a list of relevant skills for a ${role} in the context of ${context}`,
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.POLLINATION_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.skills || response.data.result?.split(',').map((s) => s.trim()) || [];
  } catch (err) {
    console.error('Pollinations AI error:', err.message);
    return staticSkillMap[role.toLowerCase()] || ['Communication', 'Teamwork', 'Problem Solving'];
  }
};

// POST /v1/suggestions - Get skill suggestions
router.post('/', authMiddleware, async (req, res, next) => {
  const { role, context } = req.body;
  if (!role || !context) {
    const error = new Error('Role and context are required');
    error.statusCode = 400;
    return next(error);
  }
  try {
    const skills = await getAISuggestions(role, context);
    res.json({ skills });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
});

module.exports = router;