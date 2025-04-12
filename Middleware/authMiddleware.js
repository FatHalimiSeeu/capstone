const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and extract user information
 * Use this on routes that require authentication
 */
const authMiddleware = (req, res, next) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  // Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data from token to request object
    req.user = decoded;
    req.isAdmin = decoded.role === 'ADMIN';
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
    
    // Handle other possible JWT errors
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;