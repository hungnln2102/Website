import type { Request, Response } from 'express';
import prisma from '@my-store/db';

/**
 * Basic health check endpoint
 */
export async function healthCheck(_req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Database health check endpoint
 */
export async function healthCheckDatabase(_req: Request, res: Response) {
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Readiness probe - checks if the application is ready to serve traffic
 */
export async function readinessCheck(_req: Request, res: Response) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Add more checks here as needed (e.g., external services)
    
    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      checks: {
        database: 'failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Liveness probe - checks if the application is alive
 */
export function livenessCheck(_req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}
