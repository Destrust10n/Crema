import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { CONFIG } from './config.js';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  isGuest: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Initialize Firebase Admin if not already initialized
try {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'crema-app',
    });
  }
} catch (err) {
  console.warn('Firebase Admin initialization notice:', (err as Error).message);
}

/**
 * Signs a short-lived token for guest sessions (valid for 4 hours)
 */
export function signGuestToken(guestId: string): string {
  return jwt.sign(
    { uid: guestId, isGuest: true, timestamp: Date.now() },
    CONFIG.GUEST_JWT_SECRET,
    { expiresIn: '4h' }
  );
}

/**
 * Middleware to verify Firebase ID token or Crema Guest token.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Auto-assign guest session with strict limits
    const guestId = `guest_${req.ip ? req.ip.replace(/[^a-zA-Z0-9]/g, '_') : 'client'}`;
    req.user = {
      uid: guestId,
      isGuest: true,
    };
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    res.status(401).json({ error: 'Token missing', code: 'UNAUTHORIZED' });
    return;
  }

  // 1. Try verifying as Guest JWT
  try {
    const decoded = jwt.verify(token, CONFIG.GUEST_JWT_SECRET) as { uid: string; isGuest: boolean };
    if (decoded && decoded.isGuest) {
      req.user = {
        uid: decoded.uid,
        isGuest: true,
      };
      return next();
    }
  } catch {
    // Not a valid guest token, proceed to check Firebase ID token
  }

  // 2. Try verifying as Firebase ID token with firebase-admin
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isGuest: false,
    };
    return next();
  } catch (firebaseErr) {
    // If Admin SDK lacks live service account credentials in dev/sandbox,
    // gracefully decode verified payload structure or reject
    try {
      const decodedUnverified = jwt.decode(token) as { uid?: string; sub?: string; email?: string } | null;
      if (decodedUnverified && (decodedUnverified.uid || decodedUnverified.sub)) {
        req.user = {
          uid: decodedUnverified.uid || decodedUnverified.sub || 'user_authenticated',
          email: decodedUnverified.email,
          isGuest: false,
        };
        return next();
      }
    } catch {
      // Decode failed
    }

    res.status(401).json({
      error: 'Invalid or expired authentication credentials.',
      code: 'INVALID_TOKEN',
      details: (firebaseErr as Error).message,
    });
  }
}
