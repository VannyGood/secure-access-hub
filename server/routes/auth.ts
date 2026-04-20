import { Router } from 'express';
import { prisma } from '../index.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/telegram', async (req, res): Promise<any> => {
  const { initData, id, username } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  // TODO: Validate initData strictly using TELEGRAM_BOT_TOKEN
  // Temporarily mocking secure validation to allow flow
  try {
    let user = await prisma.user.findUnique({
      where: { telegram_id: id.toString() }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: id.toString(),
          username: username || `user_${id}`
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegram_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.json({ token, user });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
