const express = require("express");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const auth = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();

// Utility to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

async function callPollinationsAPI(prompt) {
  const apiKey = process.env.POLLINATION_API_KEY;

  try {
    console.log("Trying Method 1: POST with JSON...");
    const response = await axios.post(
      "https://text.pollinations.ai/",
      {
        prompt: prompt,
        model: "openai",
        seed: Math.floor(Math.random() * 1000000),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
        timeout: 30000,
      }
    );
    console.log("Method 1 succeeded!");
    return response.data.text || response.data.output || response.data;
  } catch (err) {
    console.log("Method 1 failed:", err.response?.status, err.message);
  }

  try {
    console.log("Trying Method 2: GET with encoded prompt...");
    const response = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
        timeout: 30000,
      }
    );
    console.log("Method 2 succeeded!");
    return response.data;
  } catch (err) {
    console.log("Method 2 failed:", err.response?.status, err.message);
  }

  try {
    console.log("Trying Method 3: Alternative endpoint...");
    const response = await axios.post(
      "https://api.pollinations.ai/text",
      {
        prompt: prompt,
        apiKey: apiKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    console.log("Method 3 succeeded!");
    return response.data.text || response.data;
  } catch (err) {
    console.log("Method 3 failed:", err.response?.status, err.message);
  }

  try {
    console.log("Trying Method 4: Simple POST...");
    const response = await axios.post(
      "https://text.pollinations.ai/",
      {
        prompt: prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    console.log("Method 4 succeeded!");
    return response.data;
  } catch (err) {
    console.log("Method 4 failed:", err.response?.status, err.message);
  }

  throw new Error("All API methods failed");
}

router.get("/", auth, async (req, res) => {
  try {
    console.log("GET /api/resumes - req.user:", req.user);
    const userId = req.user.id || req.user._id;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID from authentication" });
    }
    const resumes = await Resume.find({ userId });
    res.json(resumes);
  } catch (err) {
    console.error("Get resumes error:", {
      message: err.message,
      stack: err.stack,
      user: req.user,
    });
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// POST a new resume
router.post("/", auth, async (req, res) => {
  try {
    console.log("POST /api/resumes - Incoming payload:", req.body);
    console.log("POST /api/resumes - req.user:", req.user);

    const userId = req.user.id || req.user._id;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID from authentication" });
    }

    const { userId: _, ...resumeData } = req.body;
    const payload = { ...resumeData, userId };

    const resume = new Resume(payload);
    await resume.save();
    res.status(201).json(resume);
  } catch (err) {
    console.error("Create resume error:", {
      message: err.message,
      stack: err.stack,
      payload: req.body,
    });
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(400).json({
      error: "Failed to save resume",
      details: err.message,
    });
  }
});

// GET a single resume by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id || req.user._id,
    });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(resume);
  } catch (err) {
    console.error("Get resume error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE a resume by ID
router.put("/:id", auth, async (req, res) => {
  try {
    const { userId: _, ...updateData } = req.body;
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id || req.user._id },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(resume);
  } catch (err) {
    console.error("Update resume error:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(400).json({ error: "Failed to update resume", details: err.message });
  }
});

// DELETE a resume by ID
router.delete("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id || req.user._id,
    });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ENHANCE a resume with AI
router.post("/enhance/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id || req.user._id,
    });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const prompt = `Enhance the following resume for better impact and clarity. Provide concise suggestions for improvement without modifying the core content:\n\n${JSON.stringify(
      req.body.resume,
      null,
      2
    )}`;
    const aiResponse = await callPollinationsAPI(prompt);
    const enhancedResume = { ...resume._doc, aiEnhanced: aiResponse };

    await Resume.findOneAndUpdate(
      { _id: req.params.id },
      { aiEnhanced: aiResponse },
      { new: true }
    );

    res.json(enhancedResume);
  } catch (err) {
    console.error("Enhance resume error:", err.message);
    res.status(500).json({ error: "Failed to enhance resume", details: err.message });
  }
});

module.exports = router;