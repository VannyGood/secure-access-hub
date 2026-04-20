import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

// Get User & Balance
router.get('/user', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Transactions
router.get('/transactions', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: req.user!.userId },
      orderBy: { created_at: 'desc' }
    });
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Deposit - Generate pending transaction
router.post('/deposit', async (req: AuthRequest, res: Response): Promise<any> => {
  const { amount, method } = req.body;
  
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (method !== 'TON' && method !== 'TRC20') return res.status(400).json({ error: 'Invalid method' });

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

    // Provide the static wallet addresses based on user request
    const walletAddress = method === 'TON' 
      ? 'UQBw53idPDcfAewiSiR1eWO3eCHO2XhHa5-E_Km6HscIuwhd'
      : 'TMVy2tQnWfJcatM1ttVrRypa1TuGu6VxQK';

    return res.json({
      transactionId: transaction.id,
      amount: transaction.amount,
      method: transaction.method,
      walletAddress,
      payment_id
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock confirm payment endpoint
router.post('/confirm', async (req: AuthRequest, res: Response): Promise<any> => {
  const { transactionId } = req.body;

  if (!transactionId) return res.status(400).json({ error: 'Transaction ID is required' });

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

    return res.json(result);
  } catch (error: any) {
    console.error('Confirm error:', error.message);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
