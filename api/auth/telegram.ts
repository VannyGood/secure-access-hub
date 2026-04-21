import jwt from 'jsonwebtoken';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import { allowJson } from '../_lib/http';
import { prisma } from '../_lib/prisma';

type Body = {
  initData?: string;
  id?: number;
  username?: string;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  allowJson(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as Partial<Body>;
  const { id, username } = body;

  if (!id) {
    res.status(400).json({ error: 'Telegram ID is required' });
    return;
  }

  // TODO: validate initData using TELEGRAM_BOT_TOKEN
  try {
    let user = await prisma.user.findUnique({
      where: { telegram_id: id.toString() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: id.toString(),
          username: username || `user_${id}`,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegram_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

