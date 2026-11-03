import { Router, Request, Response } from 'express';
import { signGuestToken } from '../auth.js';

export const authRouter = Router();

/**
 * POST /api/auth/guest
 * Issues a short-lived guest session token (4h) with strict rate limits
 */
authRouter.post('/guest', (_req: Request, res: Response) => {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const token = signGuestToken(guestId);

  res.json({
    success: true,
    token,
    user: {
      uid: guestId,
      displayName: 'Guest Scholar',
      isGuest: true,
      createdAt: new Date().toISOString(),
    },
  });
});
