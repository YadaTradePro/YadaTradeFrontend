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
  Cog6ToothIcon // این آیکون برای "سایر" استفاده می‌شود، اما ما آن را به صفحه تحلیل سهام لینک خواهیم کرد.
} from '@heroicons/react/24/outline';
import { 
  formatNumber, 
  normalizeChangePercent 
} from '../utils/formatters'; // (1) Import formatters

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
  // const indicesItems = marketData?.indices || []; // دیگر برای نمایش استفاده نمی‌شود
  const globalCommodities = marketData?.global_commodities || {};

    // Transform global commodities to array format
    const globalCommoditiesArray = Object.entries(globalCommodities).map(([key, value]) => {
      const titleMap = {
        gold: 'طلای جهانی (اونس)',
        silver: 'نقره جهانی (اونس)',
        platinum: 'پلاتین جهانی (اونس)',
        copper: 'مس جهانی (اونس)'
      };
      return {
        title: titleMap[key] || key,
        price: value?.value !== null && value?.value !== undefined ? new Intl.NumberFormat('fa-IR-u-nu-latn', { maximumFractionDigits: 4 }).format(value.value): 'بدون داده',
        change_percent: normalizeChangePercent(null)
      };
    });


    const lastUpdateString = marketData?._lastUpdate 
    ? new Intl.DateTimeFormat('fa-IR-u-nu-latn', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false 
      }).format(new Date(marketData._lastUpdate))
    : '';

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
                  title: 'تحلیل سهام', // 💡 عنوان تغییر داده نشد اما لینک تغییر می‌کند
                  description: 'بررسی وضعیت بازار و تحلیل نمادها', // 💡 توضیحات به‌روز شد
                  icon: Cog6ToothIcon,
                  href: '/stock-review', // 🔑 تغییر از '/settings' به '/stock-review'
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


        <p className="section-subtitle">
          {lastUpdateString && (
            <span style={{ marginRight: "22px", color: "gray", fontSize: "22px" }}>
                آخرین بروزرسانی: {lastUpdateString}
            </span>
          )}
        </p>


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
                    value={item.price} // Already formatted or 'بدون داده'
                    change={null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Market Indices Section - 🗑️ این بخش حذف شد */}
          {/* {indicesItems.length > 0 && (
            <section className="section">
               ... کد مربوط به شاخص‌های بورس ...
            </section>
          )} */}

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
                    value={formatNumber(item.price)} // (3) Use formatNumber
                    change={normalizeChangePercent(item.change_percent)} // (3) Use normalizeChangePercent
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
                    value={formatNumber(item.price)} // (3) Use formatNumber
                    change={normalizeChangePercent(item.change_percent)} // (3) Use normalizeChangePercent
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
                    value={formatNumber(item.price)} // (3) Use formatNumber
                    change={normalizeChangePercent(item.change_percent)} // (3) Use normalizeChangePercent
                    historyData={item.history}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {/* توجه: indicesItems از این بررسی حذف شد چون همیشه نمایش داده نمی‌شود */}
          {!goldItems.length && !coinItems.length && !fundsItems.length && (
            <div className="empty-state">
              <p>داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>
      </>
    );
}
