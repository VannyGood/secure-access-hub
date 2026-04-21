import { v4 as uuidv4 } from 'uuid';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import { allowJson } from '../_lib/http';
import { requireAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';

type Body = {
  amount?: number;
  method?: 'TON' | 'TRC20';
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  allowJson(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  const body = (req.body || {}) as Partial<Body>;
  const amount = body.amount;
  const method = body.method;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  if (method !== 'TON' && method !== 'TRC20') {
    res.status(400).json({ error: 'Invalid method' });
    return;
  }

  try {
    const payment_id = uuidv4().substring(0, 8).toUpperCase();

    const transaction = await prisma.transaction.create({
      data: {
        user_id: auth.userId,
        amount: amount,
        method,
        status: 'pending',
        payment_id,
      },
    });

    const walletAddress =
      method === 'TON'
        ? 'UQAY0pUwY8fkhDqyqM8Ac2MKg7go4QLiqo1OtP836vBjmLbi'
        : 'TMVy2tQnWfJcatM1ttVrRypa1TuGu6VxQK';

    res.status(200).json({
      transactionId: transaction.id,
      amount: transaction.amount,
      method: transaction.method,
      walletAddress,
      payment_id,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

