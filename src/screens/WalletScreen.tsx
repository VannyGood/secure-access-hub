import { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, Loader2, Wallet as WalletIcon, Unplug, Copy } from 'lucide-react';
import type { Transaction } from '../store/useAppStore';
import { TonConnectButton } from '@tonconnect/ui-react';

interface WalletScreenProps {
  balance: number;
  transactions: Transaction[];
  walletConnected: boolean;
  walletAddress: string | null;
  onAddFunds: (amount: number, method: 'TON' | 'TRC20') => Promise<any>;
  onConfirmDeposit: (transactionId: string) => Promise<void>;
  onDisconnectWallet: () => void;
}

const PRESETS = [5, 10, 25];

export function WalletScreen({
  balance, transactions, walletConnected, walletAddress,
  onAddFunds, onConfirmDeposit, onDisconnectWallet,
}: WalletScreenProps) {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositMethod, setDepositMethod] = useState<'TON' | 'TRC20' | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateDeposit = async (amount: number) => {
    if (!walletConnected || !depositMethod) return;
    setLoading(true);
    const data = await onAddFunds(amount, depositMethod);
    setLoading(false);
    if (data && data.transactionId) {
      setPendingPayment(data);
    }
  };

  const handleConfirm = async () => {
    if (!pendingPayment) return;
    setLoading(true);
    await onConfirmDeposit(pendingPayment.transactionId);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setPendingPayment(null);
      setDepositMethod(null);
      setShowAddFunds(false);
      setCustomAmount('');
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Might want to add a small toast here if available, but simplest is just copying
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
                  <p className="text-muted-foreground text-sm">Processing request...</p>
                </div>
              ) : success ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <CheckCircle size={48} className="text-success animate-success-pop" />
                  <p className="text-success font-semibold">Payment Confirmed!</p>
                </div>
              ) : pendingPayment ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-foreground font-semibold">Waiting for Payment</p>
                    <p className="text-muted-foreground text-xs">Send exactly ${pendingPayment.amount} via {pendingPayment.method}</p>
                  </div>
                  
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Wallet Address:</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-foreground break-all mr-2">{pendingPayment.walletAddress}</p>
                      <button onClick={() => copyToClipboard(pendingPayment.walletAddress)} className="text-primary p-1">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Payment ID / Memo (Required):</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-foreground font-bold">{pendingPayment.payment_id}</p>
                      <button onClick={() => copyToClipboard(pendingPayment.payment_id)} className="text-primary p-1">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Mock confirmation button */}
                  <div className="pt-2">
                    <button
                      onClick={handleConfirm}
                      className="w-full bg-success/20 text-success rounded-xl py-3 font-semibold text-sm hover:bg-success/30 transition-all font-mono"
                    >
                      (MOCK) I Have Paid
                    </button>
                  </div>
                  <button onClick={() => setPendingPayment(null)} className="w-full text-muted-foreground text-sm py-2">
                    Cancel
                  </button>
                </div>
              ) : !depositMethod ? (
                <div className="space-y-3">
                  <p className="text-foreground font-semibold text-sm">Select Deposit Method</p>
                  <button onClick={() => setDepositMethod('TON')} className="w-full glass-card rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2">
                    TON
                  </button>
                  <button onClick={() => setDepositMethod('TRC20')} className="w-full glass-card rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2">
                    TRC20 (USDT)
                  </button>
                  <button onClick={() => setShowAddFunds(false)} className="w-full text-muted-foreground text-sm py-2 mt-2">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-foreground font-semibold text-sm">Select Amount</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleCreateDeposit(amt)}
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
                        if (amt > 0) handleCreateDeposit(amt);
                      }}
                      className="gradient-primary rounded-xl px-5 py-3 font-semibold text-primary-foreground text-sm hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      Next
                    </button>
                  </div>
                  <button
                    onClick={() => setDepositMethod(null)}
                    className="w-full text-muted-foreground text-sm py-2"
                  >
                    Back
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
              <p className={`font-semibold text-sm ${tx.type === 'deposit' ? 'text-success' : 'text-foreground'}`}>
                {tx.type === 'deposit' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
