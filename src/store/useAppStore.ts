import { useState, useCallback } from 'react';

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

export interface AppState {
  balance: number;
  transactions: Transaction[];
  subscription: Subscription;
  walletConnected: boolean;
  walletAddress: string | null;
}

// Subscription URL containing 5 server locations (US, EU, Asia, etc.)
const MOCK_SUBSCRIPTION_URL = 'https://sub.securenet.io/api/v1/client/subscribe?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.a3f5e2d1-8c4b-4a7e-9f1d-2b6c3e8d4f5a';

const SERVER_LOCATIONS = [
  { flag: '🇺🇸', name: 'United States – Los Angeles', status: 'online' },
  { flag: '🇩🇪', name: 'Germany – Frankfurt', status: 'online' },
  { flag: '🇳🇱', name: 'Netherlands – Amsterdam', status: 'online' },
  { flag: '🇸🇬', name: 'Singapore', status: 'online' },
  { flag: '🇬🇧', name: 'United Kingdom – London', status: 'online' },
];

export { SERVER_LOCATIONS };

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'deposit', amount: 25, description: 'Wallet top-up', date: '2026-04-10' },
  { id: '2', type: 'purchase', amount: -4.99, description: '1 Month VPN Plan', date: '2026-04-08' },
  { id: '3', type: 'deposit', amount: 10, description: 'Wallet top-up', date: '2026-04-05' },
];

export function useAppStore() {
  const [balance, setBalance] = useState(30.01);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [subscription, setSubscription] = useState<Subscription>({
    active: false,
    plan: null,
    expiryDate: null,
    subscriptionUrl: null,
  });
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const setWalletConnection = useCallback((connected: boolean, address: string | null) => {
    setWalletConnected(connected);
    setWalletAddress(address);
  }, []);

  const addFunds = useCallback((amount: number) => {
    setBalance(b => b + amount);
    setTransactions(t => [{
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      description: 'Wallet top-up via TON',
      date: new Date().toISOString().split('T')[0],
    }, ...t]);
  }, []);

  const buyPlan = useCallback((planName: string, price: number, months: number): boolean => {
    if (balance < price) return false;
    setBalance(b => b - price);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    setTransactions(t => [{
      id: Date.now().toString(),
      type: 'purchase',
      amount: -price,
      description: `${planName} VPN Plan`,
      date: new Date().toISOString().split('T')[0],
    }, ...t]);
    setSubscription({
      active: true,
      plan: planName,
      expiryDate: expiry.toISOString().split('T')[0],
      subscriptionUrl: MOCK_SUBSCRIPTION_URL,
    });
    return true;
  }, [balance]);

  return {
    balance, transactions, subscription, walletConnected, walletAddress,
    addFunds, buyPlan, setWalletConnection,
  };
}
