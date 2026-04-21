import type { ApiRequest, ApiResponse } from '../_lib/http';
import { allowJson } from '../_lib/http';
import { requireAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';

type Body = {
  transactionId?: string;
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
  const { transactionId } = body;

  if (!transactionId) {
    res.status(400).json({ error: 'Transaction ID is required' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });

      if (!transaction) throw new Error('Transaction not found');
      if (transaction.status === 'confirmed') throw new Error('Already confirmed');
      if (transaction.user_id !== auth.userId) throw new Error('Unauthorized');

      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'confirmed' },
      });

      const updatedUser = await tx.user.update({
        where: { id: auth.userId },
        data: { balance: { increment: transaction.amount } },
      });

      return { transaction: updatedTx, balance: updatedUser.balance };
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(400).json({ error: message });
  }
}

