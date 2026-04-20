import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

function marzbanBaseUrl(): string {
  return (process.env.MARZBAN_URL || 'http://localhost:8000').replace(/\/$/, '');
}

function marzbanCredentials() {
  return {
    username: process.env.MARZBAN_USERNAME || 'admin',
    password: process.env.MARZBAN_PASSWORD || 'admin',
  };
}

/** Marzban usernames: 3–32 chars, letters, digits, underscores */
export function toMarzbanUsername(raw: string): string {
  let s = raw.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (s.length < 3) {
    s = `usr_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  }
  if (s.length > 32) {
    s = s.slice(0, 32).replace(/_+$/, '');
    if (s.length < 3) s = `usr_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  }
  return s;
}

let adminToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  if (adminToken && Date.now() < tokenExpiresAt) {
    return adminToken;
  }

  const base = marzbanBaseUrl();
  const { username, password } = marzbanCredentials();

  try {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${base}/api/admin/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    adminToken = response.data.access_token as string;
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;

    return adminToken;
  } catch (error) {
    console.error('Failed to get Marzban admin token:', error);
    throw new Error('Marzban Authentication Failed');
  }
}

export async function createMarzbanUser(
  username: string,
  expireDate: Date
): Promise<{ uuid: string; subscription_url: string }> {
  const safeUsername = toMarzbanUsername(username);

  if (process.env.MOCK_MARZBAN === 'true') {
    const mockUuid = uuidv4();
    const base = marzbanBaseUrl();
    return {
      uuid: mockUuid,
      subscription_url: `${base}/sub/${mockUuid}`,
    };
  }

  try {
    const token = await getAdminToken();
    const base = marzbanBaseUrl();

    const data = {
      username: safeUsername,
      proxies: {
        vless: {},
      },
      expire: Math.floor(expireDate.getTime() / 1000),
      data_limit: 0,
      status: 'active',
    };

    const response = await axios.post(`${base}/api/user`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = response.data as {
      proxies?: { vless?: { id?: string } };
      links?: string[];
      subscription_url?: string;
    };

    const links = Array.isArray(body.links) ? body.links : [];
    const subscription_url =
      body.subscription_url || (links.length > 0 ? links[0] : '') || '';

    const vlessId = body.proxies?.vless?.id;
    const uuid =
      typeof vlessId === 'string' && vlessId.length > 0 ? vlessId : uuidv4();

    return {
      uuid,
      subscription_url,
    };
  } catch (error) {
    console.error('Failed to create Marzban VPN user:', error);
    throw new Error('Failed to create VPN account');
  }
}
