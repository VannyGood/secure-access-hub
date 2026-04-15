import { Home, Wallet, FileCode, User } from 'lucide-react';

type Tab = 'home' | 'wallet' | 'config' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'config', label: 'Config', icon: FileCode },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-[56px] ${
                isActive ? 'tab-active' : ''
              }`}
            >
              <Icon
                size={20}
                className={`transition-all duration-300 ${
                  isActive ? 'text-primary drop-shadow-[0_0_8px_hsl(220,90%,56%,0.5)]' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
