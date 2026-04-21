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
    const vpnAccount = await prisma.vpnAccount.findFirst({
      where: { user_id: auth.userId },
      orderBy: { id: 'desc' },
    });

    if (!vpnAccount) {
      res.status(404).json({ error: 'No active VPN configuration found' });
      return;
    }

    res.status(200).json({ config: vpnAccount.subscription_url });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

