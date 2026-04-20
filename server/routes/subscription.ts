import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createMarzbanUser } from '../services/marzban.js';

const router = Router();
router.use(authenticate);

const PLAN_PRICES: Record<string, { price: number, months: number }> = {
  '1 Month': { price: 4.99, months: 1 },
  '3 Months': { price: 12.99, months: 3 },
  '12 Months': { price: 49.99, months: 12 },
};

// Purchase a new subscription
router.post('/buy', async (req: AuthRequest, res: Response): Promise<any> => {
  const { plan } = req.body;
  const planInfo = PLAN_PRICES[plan];

  if (!planInfo) return res.status(400).json({ error: 'Invalid plan selected' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) throw new Error('User not found');

      if (user.balance < planInfo.price) {
        throw new Error('Insufficient balance');
      }

      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: planInfo.price } }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          user_id: user.id,
          amount: -planInfo.price, // negative for purchase
          method: null,
          status: 'confirmed',
          payment_id: `Purchase: ${plan}`,
        }
      });

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + planInfo.months);

      // Unique Marzban username per purchase (avoid 409 if user buys again)
      const marzbanUsername = `u${user.telegram_id}_${Date.now().toString(36)}`;
      const vpnData = await createMarzbanUser(marzbanUsername, expiryDate);

      // Save Subscription
      const subscription = await tx.subscription.create({
        data: {
          user_id: user.id,
          plan: plan,
          status: 'active',
          expiry_date: expiryDate
        }
      });

      // Save VPN Account Config
      const vpnAccount = await tx.vpnAccount.create({
        data: {
          user_id: user.id,
          uuid: vpnData.uuid,
          subscription_url: vpnData.subscription_url
        }
      });

      return {
        balance: updatedUser.balance,
        subscription,
        vpnAccount
      };
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Purchase failed' });
  }
});

// Get Configuration for active subscription
router.get('/config', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const vpnAccount = await prisma.vpnAccount.findFirst({
      where: { user_id: req.user!.userId },
      orderBy: { id: 'desc' }
    });
    
    if (!vpnAccount) return res.status(404).json({ error: 'No active VPN configuration found' });

    return res.json({ config: vpnAccount.subscription_url });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
