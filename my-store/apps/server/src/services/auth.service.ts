import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// SECURITY: JWT secrets MUST be set via environment variables
const _JWT_SECRET = process.env.JWT_SECRET;
const _JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!_JWT_SECRET || !_JWT_REFRESH_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET and JWT_REFRESH_SECRET environment variables must be set. ' +
    'Generate secure random strings (min 32 characters) for production.'
  );
}
const JWT_SECRET: string = _JWT_SECRET;
const JWT_REFRESH_SECRET: string = _JWT_REFRESH_SECRET;

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

export class AuthService {
  /**
   * Hash password using bcrypt with cost factor 12
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // Cost factor 12 for strong security
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password against hash
   * @param password Plain text password
   * @param hash Hashed password from database
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token (short-lived: 15 minutes)
   * @param payload User information
   * @returns JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   * @param userId User ID
   * @returns JWT refresh token
   */
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify and decode access token
   * @param token JWT access token
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify and decode refresh token
   * @param token JWT refresh token
   * @returns User ID
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param payload User information
   * @returns Object with both tokens
   */
  generateTokenPair(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload.userId),
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
