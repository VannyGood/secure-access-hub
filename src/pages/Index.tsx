import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { HomeScreen } from '../screens/HomeScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ConfigScreen } from '../screens/ConfigScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppStore } from '../store/useAppStore';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { useEffect } from 'react';

type Tab = 'home' | 'wallet' | 'config' | 'profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const telegramUser = useTelegramUser();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const {
    balance, transactions, subscription, walletConnected, walletAddress,
    addFunds, confirmDeposit, buyPlan, setWalletConnection,
  } = useAppStore(telegramUser.id, telegramUser.username);

  useEffect(() => {
    if (wallet) {
      // In a real app we parse wallet.account.address with ton core if needed, here we just use it directly
      const addr = wallet.account.address;
      const shortAddr = addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : null;
      setWalletConnection(true, shortAddr);
    } else {
      setWalletConnection(false, null);
    }
  }, [wallet, setWalletConnection]);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <div className="pb-24 overflow-y-auto min-h-screen">
        {activeTab === 'home' && (
          <HomeScreen
            balance={balance}
            subscription={subscription}
            walletConnected={walletConnected}
            telegramUser={telegramUser}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'wallet' && (
          <WalletScreen
            balance={balance}
            transactions={transactions}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onAddFunds={addFunds}
            onConfirmDeposit={confirmDeposit}
            onDisconnectWallet={() => tonConnectUI.disconnect()}
          />
        )}
        {activeTab === 'config' && (
          <ConfigScreen
            subscription={subscription}
            balance={balance}
            walletConnected={walletConnected}
            onNavigate={setActiveTab}
            onBuyPlan={buyPlan}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            balance={balance}
            subscription={subscription}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            telegramUser={telegramUser}
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
