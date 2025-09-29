
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import MarketCard from '../components/MarketCard';
import { fetchMarketOverview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  KeyIcon, 
  EyeIcon, 
  ArrowTrendingUpIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const { isAuth, isLoading: authLoading } = useAuth();
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMarketData = async () => {
      // Don't fetch data if user is not authenticated
      if (!isAuth) {
        setMarketData(null);
        setError('لطفاً برای مشاهده داده‌های بازار وارد شوید');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchMarketOverview();
        setMarketData(data);
        console.log("Market Data received:", data);
      } catch (err) {
        console.error('Error loading market overview:', err);
        setError('خطا در بارگذاری داده‌های بازار');
      } finally {
        setLoading(false);
      }
    };
    
    // Only load data when auth state is determined and user is authenticated
    if (!authLoading) {
      loadMarketData();
    }
  }, [isAuth, authLoading]);

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>داشبورد بورس - نمای کلی بازار</title>
          <meta name="description" content="تحلیل جامع بازار بورس، طلا، سکه و کالاهای جهانی" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Navbar />
        <div className="dashboard-container" style={{ paddingTop: '40px' }}>
          <div className="loading" style={{ minHeight: '400px' }}>
            <div className="loading-spinner"></div>
            {authLoading ? 'در حال بررسی احراز هویت...' : 'در حال بارگذاری داده‌های بازار...'}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>داشبورد بورس - نمای کلی بازار</title>
        </Head>
        <Navbar />
        <div className="dashboard-container" style={{ paddingTop: '40px' }}>
          <div className="empty-state">
            <p style={{ color: '#f56565' }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const goldItems = marketData?.gold || [];
  const coinItems = marketData?.coin || [];
  const fundsItems = marketData?.funds || [];
  const indicesItems = marketData?.indices || [];
  const globalCommodities = marketData?.global_commodities || {};

    // Transform global commodities to array format without filtering
    const globalCommoditiesArray = Object.entries(globalCommodities).map(([key, value]) => {
      const titleMap = {
        gold: 'طلای جهانی (اونس)',
        silver: 'نقره جهانی (اونس)',
        platinum: 'پلاتین جهانی (اونس)',
        copper: 'مس جهانی (اونس)'
      };
      return {
        title: titleMap[key] || key,
        // Provide a fallback string if the price value is null or undefined
        price: value !== null && value !== undefined ? value : 'بدون داده',
        change_percent: null
      };
    });

    return (
      <>
        <Head>
          <title>داشبورد بورس - نمای کلی بازار</title>
          <meta name="description" content="تحلیل جامع بازار بورس، طلا، سکه و کالاهای جهانی" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Navbar />
        <div className="dashboard-container" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
          
          {/* Navigation Tab-Boxes */}
          <section className="section" style={{ marginBottom: '40px' }}>
            <div className="grid-4">
              {[
                {
                  title: 'کلید طلایی',
                  description: 'تحلیل و پیش‌بینی بازار طلا',
                  icon: KeyIcon,
                  href: '/golden-key',
                  color: '#f59e0b'
                },
                {
                  title: 'واچ‌لیست هفتگی',
                  description: 'سهام پیشنهادی هفته جاری',
                  icon: EyeIcon,
                  href: '/weekly-watchlist',
                  color: '#3b82f6'
                },
                {
                  title: 'احتمال صف خرید',
                  description: 'سهام با احتمال تشکیل صف خرید',
                  icon: ArrowTrendingUpIcon,
                  href: '/potential-queues',
                  color: '#10b981'
                },
                {
                  title: 'سایر',
                  description: 'تنظیمات و ابزارهای جانبی',
                  icon: Cog6ToothIcon,
                  href: '/settings',
                  color: '#718096'
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                
                return (
                  <Link key={index} href={item.href} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid var(--border-color)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
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
                  </Link>
                );
              })}
            </div>
          </section>
          {/* Global Commodities Section */}
          {/* The section is now always rendered as the array won't be empty due to null prices */}
          {globalCommoditiesArray.length > 0 && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    🌍 کالاهای جهانی
                  </h2>
                  <p className="section-subtitle">قیمت کالاهای گرانبها در بازارهای جهانی</p>
                </div>
              </div>
              <div className="grid-4">
                {globalCommoditiesArray.map((item, index) => (
                  <MarketCard
                    key={index}
                    title={item.title}
                    value={item.price}
                    change={null}
                  />
                ))}
              </div>
            </section>
        )}

        {/* Market Indices Section */}
        {indicesItems.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  📊 شاخص‌های بورس ایران
                </h2>
                <p className="section-subtitle">شاخص‌های کلان بازار سرمایه</p>
              </div>
            </div>
            <div className="grid-4">
              {indicesItems.map((item, index) => (
                <MarketCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  change={item.percent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Gold Section */}
        {goldItems.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  🏆 قیمت طلا
                </h2>
                <p className="section-subtitle">قیمت طلا در بازار داخلی</p>
              </div>
            </div>
            <div className="grid-2">
              {goldItems.map((item, index) => (
                <MarketCard
                  key={index}
                  title={item.title}
                  value={item.price}
                  change={item.change_percent}
                  historyData={item.history}
                />
              ))}
            </div>
          </section>
        )}

        {/* Coins Section */}
        {coinItems.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  🪙 قیمت سکه
                </h2>
                <p className="section-subtitle">قیمت انواع سکه طلا</p>
              </div>
            </div>
            <div className="grid-4">
              {coinItems.map((item, index) => (
                <MarketCard
                  key={index}
                  title={item.title}
                  value={item.price}
                  change={item.change_percent}
                  historyData={item.history}
                />
              ))}
            </div>
          </section>
        )}

        {/* ETF Funds Section */}
        {fundsItems.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  💎 صندوق‌های طلا
                </h2>
                <p className="section-subtitle">صندوق‌های قابل معامله در بورس</p>
              </div>
            </div>
            <div className="grid-4">
              {fundsItems.map((item, index) => (
                <MarketCard
                  key={index}
                  title={item.displayName || item.title}
                  value={item.price}
                  change={item.change_percent}
                  historyData={item.history}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!goldItems.length && !coinItems.length && !fundsItems.length && !indicesItems.length && (
          <div className="empty-state">
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        )}
      </div>
    </>
  );
}