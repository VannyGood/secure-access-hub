import type { ApiRequest, ApiResponse } from '../_lib/http';
import { allowJson } from '../_lib/http';
import { requireAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  allowJson(res);

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: auth.userId },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json(transactions);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

