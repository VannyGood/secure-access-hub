import { Shield, Wallet, Calendar, User } from 'lucide-react';
import type { Subscription } from '../store/useAppStore';
import type { TelegramUser } from '../hooks/useTelegramUser';

interface ProfileScreenProps {
  balance: number;
  subscription: Subscription;
  walletConnected: boolean;
  walletAddress: string | null;
  telegramUser: TelegramUser;
}

export function ProfileScreen({ balance, subscription, walletConnected, walletAddress, telegramUser }: ProfileScreenProps) {
  const displayName = telegramUser.username
    ? `@${telegramUser.username}`
    : `${telegramUser.firstName}${telegramUser.lastName ? ' ' + telegramUser.lastName : ''}`;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-slide-up">
      <h1 className="text-foreground font-bold text-xl">Profile</h1>

      <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3">
        {telegramUser.photoUrl ? (
          <img src={telegramUser.photoUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl">
            {telegramUser.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center">
          <h2 className="text-foreground font-bold text-lg">{displayName}</h2>
          {telegramUser.id && <p className="text-muted-foreground text-xs font-mono mt-1">ID: {telegramUser.id}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-glow flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">Wallet Balance</p>
            <p className="text-foreground font-bold">${balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${subscription.active ? 'bg-success/20' : 'bg-destructive/20'}`}>
            <Shield size={16} className={subscription.active ? 'text-success' : 'text-destructive'} />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">Subscription</p>
            <p className={`font-bold text-sm ${subscription.active ? 'text-success' : 'text-destructive'}`}>
              {subscription.active ? `${subscription.plan} — Active` : 'No active plan'}
            </p>
          </div>
        </div>

        {subscription.expiryDate && (
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-glow flex items-center justify-center">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Expires</p>
              <p className="text-foreground font-bold text-sm">{subscription.expiryDate}</p>
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${walletConnected ? 'bg-success/20' : 'bg-muted'}`}>
            <User size={16} className={walletConnected ? 'text-success' : 'text-muted-foreground'} />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">TON Wallet</p>
            <p className="text-foreground font-bold text-sm">{walletConnected ? walletAddress : 'Not connected'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
