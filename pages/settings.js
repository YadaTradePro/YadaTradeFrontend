
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { 
  UserIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const settingsItems = [
    {
      title: 'پروفایل کاربری',
      description: 'مشاهده و ویرایش اطلاعات حساب کاربری',
      icon: UserIcon,
      href: '/profile',
      color: '#48bb78'
    },
    {
      title: 'عملکرد اپلیکیشن',
      description: 'آمار و گزارش‌های عملکرد سیستم',
      icon: ChartBarIcon,
      href: '/app-performance',
      color: '#4299e1'
    },
    {
      title: 'تحلیل سهام',
      description: 'ابزار تحلیل تکنیکال و بنیادی سهام',
      icon: DocumentTextIcon,
      href: '/stock-review',
      color: '#9f7aea'
    },
    {
      title: 'تنظیمات',
      description: 'تنظیمات عمومی اپلیکیشن',
      icon: Cog6ToothIcon,
      href: '#',
      color: '#718096'
    }
  ];

  return (
    <>
      <Head>
        <title>سایر - داشبورد بورس</title>
        <meta name="description" content="تنظیمات و ابزارهای جانبی" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      <PageHeader title="⚙️ سایر" subtitle="تنظیمات و ابزارهای جانبی" />

      <div className="dashboard-container">
        <div className="grid-2">
          {settingsItems.map((item, index) => {
            const IconComponent = item.icon;
            const isClickable = item.href !== '#';
            
            const cardContent = (
              <div className="card" style={{ 
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isClickable ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent style={{ width: '24px', height: '24px', color: item.color }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      margin: '0 0 8px 0',
                      color: 'var(--text-primary)'
                    }}>
                      {item.title}
                    </h3>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );

            return isClickable ? (
              <Link key={index} href={item.href} style={{ textDecoration: 'none' }}>
                {cardContent}
              </Link>
            ) : (
              <div key={index}>
                {cardContent}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            درباره اپلیکیشن
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              داشبورد بورس ابزاری جامع برای تحلیل بازار سرمایه، طلا، سکه و کالاهای جهانی است.
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              <strong>نسخه:</strong> 1.0.0
            </p>
            <p style={{ margin: 0 }}>
              <strong>آخرین بروزرسانی:</strong> {new Date().toLocaleDateString('fa-IR')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
