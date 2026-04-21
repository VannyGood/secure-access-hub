import { useState, useCallback, useEffect } from 'react';

export interface Transaction {
  id: string;
  type: 'deposit' | 'purchase';
  amount: number;
  description: string;
  date: string;
}

export interface Subscription {
  active: boolean;
  plan: string | null;
  expiryDate: string | null;
  subscriptionUrl: string | null;
}

type DepositMethod = 'TON' | 'TRC20';

type WalletApiTransaction = {
  id: string;
  amount: number;
  payment_id: string | null;
  created_at: string;
};

type DepositResponse = {
  transactionId: string;
  amount: number;
  method: DepositMethod;
  walletAddress: string;
  payment_id: string;
};

type ApiError = { error: string };

export interface AppState {
  balance: number;
  transactions: Transaction[];
  subscription: Subscription;
  walletConnected: boolean;
  walletAddress: string | null;
}

const SERVER_LOCATIONS = [
  { flag: '🇺🇸', name: 'United States – Los Angeles', status: 'online' },
  { flag: '🇩🇪', name: 'Germany – Frankfurt', status: 'online' },
  { flag: '🇳🇱', name: 'Netherlands – Amsterdam', status: 'online' },
  { flag: '🇸🇬', name: 'Singapore', status: 'online' },
  { flag: '🇬🇧', name: 'United Kingdom – London', status: 'online' },
];

export { SERVER_LOCATIONS };

/** Backend base URL in production (set in Vercel: same value as your deployed API). Empty = same origin `/api…` (dev proxy or Vercel rewrite). */
function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function useAppStore(telegramId?: number, telegramUsername?: string, initData?: string) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({
    active: false,
    plan: null,
    expiryDate: null,
    subscriptionUrl: null,
  });
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));

  // Auth
  useEffect(() => {
    if (telegramId && !token) {
      fetch(apiUrl('/api/auth/telegram'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: telegramId, username: telegramUsername, initData })
      }).then(r => r.json()).then(data => {
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('jwt_token', data.token);
        }
      }).catch(console.error);
    }
  }, [telegramId, telegramUsername, initData, token]);

  const fetchUserData = useCallback(async () => {
    if (!token) return;
    try {
      const uRes = await fetch(apiUrl('/api/wallet/user'), { headers: { Authorization: `Bearer ${token}` } });
      const tRes = await fetch(apiUrl('/api/wallet/transactions'), { headers: { Authorization: `Bearer ${token}` } });
      const cRes = await fetch(apiUrl('/api/subscription/config'), { headers: { Authorization: `Bearer ${token}` } });
      
      if (uRes.ok) {
        const user = await uRes.json();
        setBalance(user.balance);
      }
      
      if (tRes.ok) {
        const txs: WalletApiTransaction[] = await tRes.json();
        setTransactions(txs.map((t) => ({
          id: t.id,
          type: t.amount < 0 ? 'purchase' : 'deposit',
          amount: t.amount,
          description: t.payment_id || 'Transaction',
          date: new Date(t.created_at).toISOString().split('T')[0]
        })));
      }

      if (cRes.ok) {
        const conf = await cRes.json();
        setSubscription({
          active: true,
          plan: 'Active Plan',
          expiryDate: 'N/A', // could fetch real expiry date if needed
          subscriptionUrl: conf.config
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const setWalletConnection = useCallback((connected: boolean, address: string | null) => {
    setWalletConnected(connected);
    setWalletAddress(address);
  }, []);

  const addFunds = useCallback(async (amount: number, method: DepositMethod): Promise<DepositResponse | ApiError> => {
    if (!token) return { error: 'Not authenticated yet. Please open the app from Telegram and wait 1-2 seconds.' };
    try {
      const res = await fetch(apiUrl('/api/wallet/deposit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, method })
      });
      const payload = (await res.json().catch(() => ({}))) as Partial<DepositResponse & ApiError>;
      if (!res.ok) return { error: payload.error || `Deposit failed (${res.status})` };
      return payload as DepositResponse;
    } catch (e) {
      console.error(e);
      return { error: 'Network error while creating deposit.' };
    }
  }, [token]);

  const confirmDeposit = useCallback(async (transactionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/wallet/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId })
      });
      if (res.ok) fetchUserData();
    } catch (e) {
      console.error(e);
    }
  }, [token, fetchUserData]);

  const buyPlan = useCallback(async (planName: string, price: number, months: number): Promise<boolean> => {
    if (!token || balance < price) return false;
    try {
      const res = await fetch(apiUrl('/api/subscription/buy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planName })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(err?.error || res.statusText);
        return false;
      }
      await fetchUserData();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [token, balance, fetchUserData]);

  return {
    balance, transactions, subscription, walletConnected, walletAddress,
    addFunds, confirmDeposit, buyPlan, setWalletConnection,
  };
}
