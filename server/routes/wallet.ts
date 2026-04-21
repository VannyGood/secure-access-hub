import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

// Get User & Balance
router.get('/user', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Transactions
router.get('/transactions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: req.user!.userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deposit - Generate pending transaction
router.post('/deposit', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, method } = req.body;
  
  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  if (method !== 'TON' && method !== 'TRC20') {
    res.status(400).json({ error: 'Invalid method' });
    return;
  }

  try {
    const payment_id = uuidv4().substring(0, 8).toUpperCase(); // Generating a unique memo

    const transaction = await prisma.transaction.create({
      data: {
        user_id: req.user!.userId,
        amount: parseFloat(amount),
        method,
        status: 'pending',
        payment_id,
      }
    });

    // Static wallet addresses (requested)
    const walletAddress = method === 'TON'
      ? 'UQAY0pUwY8fkhDqyqM8Ac2MKg7go4QLiqo1OtP836vBjmLbi'
      : 'TMVy2tQnWfJcatM1ttVrRypa1TuGu6VxQK';

    res.json({
      transactionId: transaction.id,
      amount: transaction.amount,
      method: transaction.method,
      walletAddress,
      payment_id
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock confirm payment endpoint
router.post('/confirm', async (req: AuthRequest, res: Response): Promise<void> => {
  const { transactionId } = req.body;

  if (!transactionId) {
    res.status(400).json({ error: 'Transaction ID is required' });
    return;
  }

  try {
    // Start a transaction: confirm payment and increase balance
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      
      if (!transaction) throw new Error('Transaction not found');
      if (transaction.status === 'confirmed') throw new Error('Already confirmed');
      if (transaction.user_id !== req.user!.userId) throw new Error('Unauthorized');

      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'confirmed' }
      });

      const updatedUser = await tx.user.update({
        where: { id: req.user!.userId },
        data: { balance: { increment: transaction.amount } }
      });

      return { transaction: updatedTx, balance: updatedUser.balance };
    });

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Confirm error:', message);
    res.status(400).json({ error: message });
  }
});

export default router;
