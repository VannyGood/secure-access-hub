import { useEffect, useState } from 'react';

export interface TelegramUser {
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  id?: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export function useTelegramUser(): TelegramUser {
  const [user, setUser] = useState<TelegramUser>({ firstName: 'User' });

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready?.();
        tg.expand?.();
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) {
          setUser({
            firstName: tgUser.first_name || 'User',
            lastName: tgUser.last_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
            id: tgUser.id,
          });
          return;
        }
      }

      const params = new URLSearchParams(window.location.search);
      const tgParam = params.get('tg');
      if (tgParam) {
        const id = Number(tgParam);
        if (!Number.isNaN(id)) {
          setUser({
            firstName: 'Dev',
            username: 'local_dev',
            id,
          });
          return;
        }
      }

      const envDev = import.meta.env.VITE_DEV_TELEGRAM_ID;
      if (envDev) {
        const id = Number(envDev);
        if (!Number.isNaN(id)) {
          setUser({
            firstName: 'Dev',
            username: 'local_dev',
            id,
          });
        }
      }
    } catch {
      // Not in Telegram environment
    }
  }, []);

  return user;
}
