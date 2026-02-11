import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { tokenBlacklistService } from '../services/token-blacklist.service';

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 * SECURITY: Also checks token blacklist for logged-out tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // SECURITY: Check if token has been blacklisted (logged out)
    if (await tokenBlacklistService.isBlacklisted(token)) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token has been revoked' 
      });
    }
    
    try {
      const decoded = authService.verifyAccessToken(token);
      
      // Attach user info to request object
      (req as any).user = decoded;
      
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      return res.status(401).json({ 
        error: 'Unauthorized',
        message 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if authenticated user has required role
 * @param roles Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }
    
    if (roles.length > 0 && !roles.includes(user.role || '')) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 * SECURITY: Also checks token blacklist
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // SECURITY: Check if token has been blacklisted
      if (await tokenBlacklistService.isBlacklisted(token)) {
        (req as any).user = null;
        return next();
      }
      
      try {
        const decoded = authService.verifyAccessToken(token);
        (req as any).user = decoded;
      } catch (error) {
        // Token invalid, but continue without user
        (req as any).user = null;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};
