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
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

