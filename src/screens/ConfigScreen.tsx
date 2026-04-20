import { useState } from 'react';
import { Copy, AlertTriangle, CheckCircle, Globe, Smartphone, Info, CreditCard, Check, Star, Zap, Crown, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import type { Subscription } from '../store/useAppStore';
import { SERVER_LOCATIONS } from '../store/useAppStore';

interface ConfigScreenProps {
  subscription: Subscription;
  balance: number;
  walletConnected: boolean;
  onNavigate: (tab: 'wallet' | 'config') => void;
  onBuyPlan: (name: string, price: number, months: number) => Promise<boolean>;
}

// Prices must match server/routes/subscription.ts PLAN_PRICES
const plans = [
  { name: '1 Month', price: 4.99, months: 1, icon: Zap, benefits: ['5 server locations', 'Unlimited bandwidth', 'No-log policy'] },
  { name: '3 Months', price: 12.99, months: 3, icon: Star, popular: true, benefits: ['Everything in 1 Month', 'Priority support', 'Save ~13%'] },
  { name: '12 Months', price: 49.99, months: 12, icon: Crown, benefits: ['Everything in 3 Months', 'Dedicated IP option', 'Save vs monthly'] },
];

export function ConfigScreen({ subscription, balance, walletConnected, onNavigate, onBuyPlan }: ConfigScreenProps) {
  const [copied, setCopied] = useState(false);
  const [buying, setBuying] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard! Open Happ and import from clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBuy = async (plan: typeof plans[0]) => {
    if (balance < plan.price) {
      toast.error(`Insufficient balance. You need $${(plan.price - balance).toFixed(2)} more.`);
      return;
    }
    setBuying(true);
    try {
      const ok = await onBuyPlan(plan.name, plan.price, plan.months);
      if (ok) toast.success('Subscription activated! Your config is ready.');
      else toast.error('Purchase failed. Check balance and Marzban connection.');
    } finally {
      setBuying(false);
    }
  };

  // Active subscription — show config URL
  if (subscription.active) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-5 animate-slide-up">
        <h1 className="text-foreground font-bold text-xl">Your Config</h1>

        {/* How to use */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-primary" />
            <p className="text-foreground font-semibold text-sm">How to connect</p>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {[
              <>Download <strong className="text-foreground">Happ</strong> from your app store</>,
              <>Copy the subscription URL below</>,
              <>Open Happ → tap <strong className="text-foreground">"Import from Clipboard"</strong></>,
              <>All 5 server locations will be added automatically</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="gradient-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Subscription URL */}
        <div className="space-y-2">
          <p className="text-foreground font-semibold text-sm px-1">Subscription URL</p>
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <code className="text-xs text-muted-foreground break-all leading-relaxed">
              {subscription.subscriptionUrl}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(subscription.subscriptionUrl!)}
            className={`w-full rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${
              copied
                ? 'bg-success/20 text-success border border-success/30'
                : 'gradient-primary text-primary-foreground'
            }`}
          >
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied ? 'Copied! Now open Happ' : 'Copy Subscription URL'}
          </button>
        </div>

        {/* Included Servers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Globe size={14} className="text-primary" />
            <p className="text-foreground font-semibold text-sm">Included Servers (5)</p>
          </div>
          <div className="glass-card rounded-xl divide-y divide-border">
            {SERVER_LOCATIONS.map((loc, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{loc.flag}</span>
                  <span className="text-sm text-foreground">{loc.name}</span>
                </div>
                <span className="text-xs font-medium text-success">● Online</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
          <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-primary text-xs leading-relaxed">
            This URL auto-updates with the best configs. No need to re-import — Happ will refresh automatically.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning flex-shrink-0" />
          <p className="text-warning text-xs font-medium">Do not share this URL with others</p>
        </div>
      </div>
    );
  }

  // Not connected — prompt to connect wallet first
  if (!walletConnected) {
    return (
      <div className="px-4 pt-6 pb-4 flex flex-col items-center justify-center h-[60vh] gap-4 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl gradient-glow flex items-center justify-center">
          <Wallet size={28} className="text-primary" />
        </div>
        <h2 className="text-foreground font-bold text-lg">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-sm text-center">Connect your TON wallet first, add funds, then buy a plan here.</p>
        <button
          onClick={() => onNavigate('wallet')}
          className="gradient-primary rounded-xl px-6 py-3 font-semibold text-primary-foreground text-sm mt-2"
        >
          Go to Wallet
        </button>
      </div>
    );
  }

  // Connected but no balance
  if (balance <= 0) {
    return (
      <div className="px-4 pt-6 pb-4 flex flex-col items-center justify-center h-[60vh] gap-4 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <AlertTriangle size={28} className="text-warning" />
        </div>
        <h2 className="text-foreground font-bold text-lg">No Funds Available</h2>
        <p className="text-muted-foreground text-sm text-center">Add funds to your wallet first, then come back to buy a plan.</p>
        <button
          onClick={() => onNavigate('wallet')}
          className="gradient-primary rounded-xl px-6 py-3 font-semibold text-primary-foreground text-sm mt-2"
        >
          Add Funds
        </button>
      </div>
    );
  }

  // Has balance — show plans to buy
  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-slide-up">
      <h1 className="text-foreground font-bold text-xl">Choose a Plan</h1>

      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-muted-foreground text-sm">
          Your balance: <span className="gradient-text font-bold">${balance.toFixed(2)}</span>
        </p>
      </div>

      {buying && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Processing purchase...</p>
        </div>
      )}

      {!buying && (
        <div className="space-y-4">
          {plans.map(plan => {
            const Icon = plan.icon;
            const canAfford = balance >= plan.price;
            return (
              <div
                key={plan.name}
                className={`glass-card rounded-2xl p-5 relative overflow-hidden ${
                  plan.popular ? 'ring-1 ring-primary/50 glow-shadow' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.popular ? 'gradient-primary' : 'gradient-glow'}`}>
                    <Icon size={22} className={plan.popular ? 'text-primary-foreground' : 'text-primary'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-bold">{plan.name}</h3>
                    <p className="gradient-text font-extrabold text-2xl mt-1">${plan.price}</p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.benefits.map(b => (
                        <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check size={14} className="text-success flex-shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleBuy(plan)}
                      disabled={!canAfford}
                      className={`mt-4 w-full rounded-xl py-3 font-semibold text-sm active:scale-[0.97] transition-all duration-200 ${
                        canAfford
                          ? plan.popular
                            ? 'gradient-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-muted'
                          : 'bg-muted text-muted-foreground opacity-50'
                      }`}
                    >
                      {canAfford ? 'Buy with Wallet' : `Need $${(plan.price - balance).toFixed(2)} more`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => onNavigate('wallet')}
        className="w-full text-center text-primary text-sm font-medium py-2"
      >
        Need more funds? Top up wallet →
      </button>
    </div>
  );
}
