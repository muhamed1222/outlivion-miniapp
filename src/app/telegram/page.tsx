'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { userApi, User, Subscription } from '@/lib/api';
import { tokenStorage } from '@/lib/storage';
import { hapticImpact } from '@/lib/telegram';
import { Settings, User as UserIcon, HelpCircle } from 'lucide-react';

export default function TelegramHomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchData() {
      // Check if we have an auth token before making requests
      const token = tokenStorage.getAccessToken();
      if (!token) {
        console.log('No auth token found, skipping data fetch');
        setLoading(false);
        return;
      }

      try {
        const [userData, subscriptionData] = await Promise.all([
          userApi.getUser(),
          userApi.getSubscription(),
        ]);

        setUser(userData);
        setSubscription(subscriptionData);
      } catch (error: any) {
        // Тихая обработка ошибок авторизации (нормально для разработки без Telegram)
        if (error?.response?.status === 401 || error?.message?.includes('No token')) {
          console.log('User not authenticated, continuing without user data');
        } else {
          console.error('Failed to fetch data:', error);
          showToast(error.message || 'Ошибка загрузки данных', 'error');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const handleNavigation = (path: string) => {
    hapticImpact('light');
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#F55128] border-t-transparent"></div>
      </div>
    );
  }

  // Format date for display (e.g., "8 декабря 2025")
  const formatSubscriptionDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'Подписка не активна';
    const date = new Date(dateString);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `до ${day} ${month} ${year}`;
  };

  // Calculate subscription status text
  const isSubActive = subscription?.status === 'active';
  const subStatusText = isSubActive ? 'Активная подписка' : 'пробный период';
  const subDateText = formatSubscriptionDate(subscription?.endDate);

  // Device detection (simplified)
  const devicePlatform = 'macOS'; // In a real app, detect UA or user pref

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-hidden font-sans selection:bg-[#F55128]/30">
      
      {/* Background Gradients (Ellipses from Figma) */}
      <div className="absolute top-[-50px] left-[-50px] w-[450px] h-[450px] bg-[#F55128] rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute top-[10%] right-[-100px] w-[300px] h-[300px] bg-[#F55128] rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[20%] w-[350px] h-[350px] bg-[#F55128] rounded-full blur-[130px] opacity-15 pointer-events-none" />

      {/* Header */}
      <header className="absolute top-[-2px] left-[2px] w-fit p-6 z-20">
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-between min-h-screen px-4 pb-8 pt-20">
        
        {/* Center Status Element */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[320px]">
          {/* Glowing Circles Effect */}
          <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-8">
            {/* Outer rings */}
            <div className="absolute inset-0 border border-[#F55128]/5 rounded-full scale-150" />
            <div className="absolute inset-0 border border-[#F55128]/10 rounded-full scale-125" />
            <div className="absolute inset-0 border border-[#F55128]/20 rounded-full" />
            
            {/* Center Glow */}
            <div className="absolute inset-0 bg-[#F55128] rounded-full blur-[60px] opacity-10 animate-pulse" />
            
            {/* Logo/Icon Container */}
            <div className="relative z-10 flex flex-col items-center">
               <div className="w-24 h-24 mb-4 flex items-center justify-center">
                  <svg width="104" height="92" viewBox="0 0 104 92" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M52 0L103.962 30V92H0.0384521V30L52 0Z" fill="url(#paint0_linear)" fillOpacity="0.2"/>
                    <path d="M52 2L101 31V90H3V31L52 2Z" stroke="#F55128" strokeWidth="2"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="52" y1="0" x2="52" y2="92" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F55128"/>
                        <stop offset="1" stopColor="#F55128" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Text Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pt-2">
                    <span className="text-2xl font-bold tracking-wider text-white">O</span>
                  </div>
               </div>
            </div>
          </div>

        </div>

        {/* Bottom Actions Card (Glassmorphism) */}
        <div className="w-full max-w-md bg-[#0D0D0D]/60 backdrop-blur-xl border border-[#F55128]/20 rounded-[32px] p-4 space-y-2.5 shadow-2xl shadow-black/50 flex flex-col gap-2">
           {/* Status Text and Title Container */}
           <div className="flex flex-row text-center gap-0 justify-between items-end z-10 w-full self-center">
             <p className="text-white/40 text-sm font-medium w-fit">
               {subDateText}
             </p>
             <p className="text-[#F55128] text-lg font-medium tracking-wide">
               {subStatusText}
             </p>
             <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-lg w-fit self-center">OutlivionVPN</h1>
           </div>
           
           {/* Buy Subscription Button */}
           <button
             onClick={() => handleNavigation('/telegram/billing')}
             className="group w-full flex items-center justify-between p-4 bg-[#F55128] active:bg-[#D93F1A] rounded-[24px] transition-all duration-200 active:scale-[0.98] h-[51px] mt-0"
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-medium text-white text-[16px]">Купить подписку</span>
              </div>
              <span className="text-sm font-medium text-white/90">от 150 ₽</span>
           </button>

           {/* Setup Button */}
           <button
              onClick={() => handleNavigation('/telegram/servers')}
              className="group w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#92351D] to-[#C93D1A] border border-[#F55128]/30 active:border-[#F55128]/50 rounded-[24px] transition-all duration-200 active:scale-[0.98] h-[51px] mt-0"
              style={{ marginTop: '0px' }}
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/10 rotate-45 transform scale-150" />
                    <Settings className="w-4 h-4 text-white relative z-10" />
                 </div>
                 <span className="font-medium text-white text-[16px]">Установка и настройка</span>
              </div>
              <span className="text-sm font-medium text-white/80">
                 {devicePlatform}
              </span>
           </button>

           {/* Grid for Profile & Support */}
           <div className="flex gap-2 !mt-0">
              <button 
                onClick={() => handleNavigation('/telegram/profile')} // Assuming profile route exists or adding logic later
                className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-r from-[#92351D] to-[#C93D1A] border border-[#F55128]/30 active:border-[#F55128]/50 rounded-[24px] transition-all duration-200 active:scale-[0.98] h-[51px]"
              >
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-medium text-white text-[16px]">Профиль</span>
              </button>
              
              <button 
                 onClick={() => handleNavigation('/telegram/faq')} // Or link to support bot
                 className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-r from-[#92351D] to-[#C93D1A] border border-[#F55128]/30 active:border-[#F55128]/50 rounded-[24px] transition-all duration-200 active:scale-[0.98] h-[51px]"
              >
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-medium text-white text-[16px]">Поддержка</span>
              </button>
           </div>

        </div>
      </main>
    </div>
  );
}
