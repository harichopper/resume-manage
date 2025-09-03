const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.error("Auth middleware: No Authorization header provided");
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    console.error("Auth middleware: Malformed Authorization header");
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      console.error("Auth middleware: Token payload missing userId", decoded);
      return res.status(400).json({ error: 'Invalid token: Missing user ID' });
    }
    req.user = { id: decoded.userId, email: decoded.email };
    console.log("Auth middleware - req.user:", req.user);
    next();
  } catch (err) {
    console.error("Auth middleware error:", {
      message: err.message,
      token: token.slice(0, 20) + '...',
    });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};  