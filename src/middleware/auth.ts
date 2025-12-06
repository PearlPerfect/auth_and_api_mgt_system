import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ApiKey from '../models/ApiKey';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      apiKey?: any;
      authType?: 'jwt' | 'apiKey';
    }
  }
}

// JWT Authentication Middleware
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = user;
    req.authType = 'jwt';
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else {
      console.error('JWT authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

// API Key Authentication Middleware
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKeyHeader = req.headers['x-api-key'] as string || req.headers['api-key'] as string;
    
    if (!apiKeyHeader) {
      res.status(401).json({ error: 'No API key provided' });
      return;
    }

    const apiKey = await ApiKey.findOne({
      where: {
        key: apiKeyHeader,
        is_active: true,
      }
    });

    if (!apiKey) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    // Check if expired
    const apiKeyObj = apiKey as any;
    if (apiKeyObj.isExpired && apiKeyObj.isExpired()) {
      res.status(401).json({ error: 'API key expired' });
      return;
    }

    // Get user
    const user = await User.findByPk(apiKey.user_id);
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Update API key usage
    if (apiKeyObj.updateLastUsed) {
      await apiKeyObj.updateLastUsed();
    }

    req.user = user;
    req.apiKey = apiKeyObj;
    req.authType = 'apiKey';
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'API key authentication failed' });
  }
};

// Combined Authentication Middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization as string;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    await authenticateJWT(req, res, next);
  } else if (req.headers['x-api-key'] || req.headers['api-key']) {
    await authenticateApiKey(req, res, next);
  } else {
    res.status(401).json({ error: 'No authentication method provided' });
  }
};

// Permission Middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.authType === 'jwt') {
        // For JWT users, check role
        if (req.user.role === 'admin') {
          next();
          return;
        }
        
        if (req.user.role === 'user' && permission === 'read') {
          next();
          return;
        }
        
        res.status(403).json({ error: 'Insufficient permissions' });
      } else if (req.authType === 'apiKey' && req.apiKey) {
        // Check API key permissions
        const apiKey = req.apiKey as any;
        if (apiKey.hasPermission && apiKey.hasPermission(permission)) {
          next();
        } else {
          res.status(403).json({ error: 'Insufficient API key permissions' });
        }
      } else {
        res.status(403).json({ error: 'Access denied' });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Admin Middleware
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Admin check failed' });
  }
};