import { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, Loader2, Wallet as WalletIcon, Unplug } from 'lucide-react';
import type { Transaction } from '../store/useAppStore';
import { TonConnectButton } from '@tonconnect/ui-react';

interface WalletScreenProps {
  balance: number;
  transactions: Transaction[];
  walletConnected: boolean;
  walletAddress: string | null;
  onAddFunds: (amount: number) => void;
  onDisconnectWallet: () => void;
}

const PRESETS = [5, 10, 25];

export function WalletScreen({
  balance, transactions, walletConnected, walletAddress,
  onAddFunds, onDisconnectWallet,
}: WalletScreenProps) {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleAdd = (amount: number) => {
    if (!walletConnected) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onAddFunds(amount);
      setTimeout(() => {
        setSuccess(false);
        setShowAddFunds(false);
        setCustomAmount('');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-slide-up">
      <h1 className="text-foreground font-bold text-xl">Wallet</h1>

      {/* Telegram Wallet Connection */}
      <div className="glass-card rounded-2xl p-4">
        {!walletConnected ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-12 h-12 rounded-xl gradient-glow flex items-center justify-center">
              <WalletIcon size={22} className="text-primary" />
            </div>
            <div className="text-center mb-2">
              <p className="text-foreground font-semibold text-sm">Connect TON Wallet</p>
              <p className="text-muted-foreground text-xs mt-1">Link your Telegram wallet to add funds</p>
            </div>
            <TonConnectButton className="my-2" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle size={16} className="text-success" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">TON Wallet Connected</p>
                <p className="text-muted-foreground text-xs font-mono">{walletAddress}</p>
              </div>
            </div>
            <button
              onClick={onDisconnectWallet}
              className="text-muted-foreground hover:text-destructive transition-colors p-2"
            >
              <Unplug size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="glass-card rounded-2xl p-6 text-center animate-pulse-glow">
        <p className="text-muted-foreground text-sm mb-2">Current Balance</p>
        <p className="text-4xl font-extrabold gradient-text">${balance.toFixed(2)}</p>
      </div>

      {/* Add Funds */}
      {walletConnected && (
        <>
          {!showAddFunds ? (
            <button
              onClick={() => setShowAddFunds(true)}
              className="w-full gradient-primary rounded-xl py-3.5 font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={18} /> Add Funds
            </button>
          ) : (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={36} className="text-primary animate-spin" />
                  <p className="text-muted-foreground text-sm">Processing payment...</p>
                </div>
              ) : success ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <CheckCircle size={48} className="text-success animate-success-pop" />
                  <p className="text-success font-semibold">Payment Successful!</p>
                </div>
              ) : (
                <>
                  <p className="text-foreground font-semibold text-sm">Select Amount</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleAdd(amt)}
                        className="glass-card rounded-xl py-3 text-center font-semibold text-foreground hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      className="flex-1 bg-muted rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    />
                    <button
                      onClick={() => {
                        const amt = parseFloat(customAmount);
                        if (amt > 0) handleAdd(amt);
                      }}
                      className="gradient-primary rounded-xl px-5 py-3 font-semibold text-primary-foreground text-sm hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAddFunds(false)}
                    className="w-full text-muted-foreground text-sm py-2"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {!walletConnected && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
          <p className="text-primary text-xs">Connect your TON wallet to add funds</p>
        </div>
      )}

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-foreground font-semibold text-sm px-1">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No transactions yet</p>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-success/20' : 'bg-primary/20'}`}>
                {tx.type === 'deposit' ? (
                  <ArrowDownLeft size={16} className="text-success" />
                ) : (
                  <ArrowUpRight size={16} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{tx.description}</p>
                <p className="text-muted-foreground text-xs">{tx.date}</p>
              </div>
              <p className={`font-semibold text-sm ${tx.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
