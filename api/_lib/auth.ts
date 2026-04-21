import jwt from 'jsonwebtoken';
import type { ApiRequest, ApiResponse } from './http';

export type AuthContext = {
  userId: string;
  telegramId: string;
};

function getBearerToken(req: ApiRequest): string | null {
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export function requireAuth(req: ApiRequest, res: ApiResponse): AuthContext | null {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded &&
      'telegramId' in decoded &&
      typeof (decoded as Record<string, unknown>).userId === 'string' &&
      typeof (decoded as Record<string, unknown>).telegramId === 'string'
    ) {
      return {
        userId: (decoded as Record<string, unknown>).userId as string,
        telegramId: (decoded as Record<string, unknown>).telegramId as string,
      };
    }
    res.status(401).json({ error: 'Invalid token' });
    return null;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}

