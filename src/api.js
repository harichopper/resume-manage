const axios = require('axios');

const enhanceWithAI = async (resume) => {
  try {
    const response = await axios.post('https://api.pollinations.ai/enhance', {
      resume: {
        name: resume.name,
        jobRole: resume.jobRole,
        skills: resume.skills,
        // Add other fields as needed
      },
    }, {
      headers: { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` },
    });
    return response.data.enhancedText || 'Enhanced resume content';
  } catch (err) {
    const error = new Error('Failed to enhance resume with AI');
    error.statusCode = 502; // Bad Gateway for external service failure
    throw error;
  }
};