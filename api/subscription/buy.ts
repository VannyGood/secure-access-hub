import type { ApiRequest, ApiResponse } from '../_lib/http';
import { allowJson } from '../_lib/http';
import { requireAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { createMarzbanUser } from '../../server/services/marzban';

const PLAN_PRICES: Record<string, { price: number; months: number }> = {
  '1 Month': { price: 4.99, months: 1 },
  '3 Months': { price: 12.99, months: 3 },
  '12 Months': { price: 49.99, months: 12 },
};

type Body = {
  plan?: string;
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
  const plan = body.plan;
  const planInfo = plan ? PLAN_PRICES[plan] : undefined;

  if (!planInfo) {
    res.status(400).json({ error: 'Invalid plan selected' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: auth.userId } });
      if (!user) throw new Error('User not found');

      if (user.balance < planInfo.price) {
        throw new Error('Insufficient balance');
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: planInfo.price } },
      });

      await tx.transaction.create({
        data: {
          user_id: user.id,
          amount: -planInfo.price,
          method: null,
          status: 'confirmed',
          payment_id: `Purchase: ${plan}`,
        },
      });

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + planInfo.months);

      const marzbanUsername = `u${user.telegram_id}_${Date.now().toString(36)}`;
      const vpnData = await createMarzbanUser(marzbanUsername, expiryDate);

      const subscription = await tx.subscription.create({
        data: {
          user_id: user.id,
          plan: plan,
          status: 'active',
          expiry_date: expiryDate,
        },
      });

      const vpnAccount = await tx.vpnAccount.create({
        data: {
          user_id: user.id,
          uuid: vpnData.uuid,
          subscription_url: vpnData.subscription_url,
        },
      });

      return { balance: updatedUser.balance, subscription, vpnAccount };
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Purchase failed';
    res.status(400).json({ error: message });
  }
}

