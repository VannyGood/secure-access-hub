import { Shield, Plus, FileCode, ChevronRight, Wallet } from 'lucide-react';
import type { Subscription } from '../store/useAppStore';
import type { TelegramUser } from '../hooks/useTelegramUser';

interface HomeScreenProps {
  balance: number;
  subscription: Subscription;
  walletConnected: boolean;
  telegramUser: TelegramUser;
  onNavigate: (tab: 'wallet' | 'config') => void;
}

export function HomeScreen({ balance, subscription, walletConnected, telegramUser, onNavigate }: HomeScreenProps) {
  const displayName = telegramUser.username
    ? `@${telegramUser.username}`
    : telegramUser.firstName;

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        {telegramUser.photoUrl ? (
          <img
            src={telegramUser.photoUrl}
            alt="avatar"
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {telegramUser.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-foreground font-bold text-lg">{displayName}</h1>
        </div>
      </div>

      {/* Wallet Connection Banner */}
      {!walletConnected && (
        <button
          onClick={() => onNavigate('wallet')}
          className="w-full glass-card rounded-xl p-3.5 flex items-center gap-3 border border-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="w-9 h-9 rounded-lg gradient-glow flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-foreground text-sm font-semibold">Connect TON Wallet</p>
            <p className="text-muted-foreground text-xs">Link your wallet to start</p>
          </div>
          <ChevronRight size={16} className="text-primary" />
        </button>
      )}

      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-5 animate-pulse-glow">
        <p className="text-muted-foreground text-sm mb-1">Wallet Balance</p>
        <p className="text-3xl font-extrabold gradient-text">${balance.toFixed(2)}</p>
      </div>

      {/* Subscription Status */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subscription.active ? 'bg-success/20' : 'bg-destructive/20'}`}>
              <Shield size={20} className={subscription.active ? 'text-success' : 'text-destructive'} />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">VPN Status</p>
              <p className={`text-xs font-medium ${subscription.active ? 'text-success' : 'text-destructive'}`}>
                {subscription.active ? 'Active' : 'No active plan'}
                {subscription.plan && ` · ${subscription.plan}`}
              </p>
            </div>
          </div>
          {subscription.expiryDate && (
            <p className="text-muted-foreground text-xs">
              Exp: {subscription.expiryDate}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-foreground font-semibold text-sm px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Add Funds', icon: Plus, tab: 'wallet' as const },
            { label: 'My Config', icon: FileCode, tab: 'config' as const },
          ].map(({ label, icon: Icon, tab }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
            >
              <div className="w-10 h-10 rounded-xl gradient-glow flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <button
        onClick={() => onNavigate('wallet')}
        className="glass-card rounded-xl p-4 flex items-center justify-between w-full hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200"
      >
        <span className="text-sm font-medium text-foreground">View Transaction History</span>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
    </div>
  );
}
