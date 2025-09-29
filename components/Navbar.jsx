import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  KeyIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const router = useRouter();

  const navItems = [
    {
      id: 'home',
      label: 'نمای کلی',
      path: '/',
      icon: HomeIcon
    },
    {
      id: 'golden-key',
      label: 'کلید طلایی',
      path: '/golden-key',
      icon: KeyIcon
    },
    {
      id: 'weekly-watchlist',
      label: 'واچ‌لیست هفتگی',
      path: '/weekly-watchlist',
      icon: EyeIcon
    },
    {
      id: 'potential-queues',
      label: 'احتمال صف خرید',
      path: '/potential-queues',
      icon: ArrowTrendingUpIcon
    },
    {
      id: 'settings',
      label: 'سایر',
      path: '/settings',
      icon: Cog6ToothIcon
    }
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all authentication data
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_remember');
      
      // Clear all cached data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') || key.startsWith('api_timestamp_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('🔐 User logged out successfully');
      
      // Force page reload to clear any cached state
      window.location.href = '/login';
    }
  };

  return (
    <header className="nav-header">
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          📈 پلتفرم تحلیلی YADATradepro
        </Link>

        <nav>
          <ul className="nav-menu">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = router.pathname === item.path;

              return (
                <li key={item.id} className="nav-item">
                  <Link href={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                    <IconComponent className="icon-sm" />
                    {item.label}
                  </Link>
                </li>
              );
            })}

            

            <li className="nav-item">
              <button onClick={handleLogout} className="nav-link" style={{border: 'none', background: 'none'}}>
                <ArrowRightOnRectangleIcon className="icon-sm" />
                خروج
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}