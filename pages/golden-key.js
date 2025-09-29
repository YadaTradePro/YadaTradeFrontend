import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchGoldenKey } from '../services/api';

export default function GoldenKeyPage() {
  const [goldenKey, setGoldenKey] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // تابع کمکی برای پاک کردن کش کلید طلایی در صورت خطا
  const clearGoldenKeyCache = () => {
    if (typeof window !== 'undefined') {
      console.warn('🗑️ Clearing corrupted Golden Key cache...');
      localStorage.removeItem('api_cache_golden_key');
      localStorage.removeItem('api_timestamp_golden_key');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchGoldenKey();
        
        // استفاده از دسترسی امن data?.results (که توسط تابع اصلاح شده در api.js تولید می‌شود)
        const stocks = data?.results; 

        if (Array.isArray(stocks)) {
          setGoldenKey(stocks);
        } else {
          // اگر آرایه نبود، یعنی کش خراب است. کش را پاک می‌کنیم و خطا می‌دهیم.
          clearGoldenKeyCache(); 
          throw new Error('فرمت داده‌های دریافتی نامعتبر است. کش پاک شد. لطفا صفحه را مجددا بارگذاری کنید.');
        }

        setError(null);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری داده‌های کلید طلایی');
        console.error('Error loading golden key:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'بدون داده'; 
  return value.toLocaleString('fa-IR');
};

  if (loading) {
    return (
      <>
        <Head>
          <title>کلید طلایی - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="🔑 کلید طلایی" subtitle="سهام برتر با پتانسیل بالا" />
        <div className="dashboard-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            در حال بارگذاری...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>کلید طلایی - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="🔑 کلید طلایی" subtitle="سهام برتر با پتانسیل بالا" />
        <div className="dashboard-container">
          <div className="empty-state">
            <p style={{ color: '#f56565' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '1rem', 
                padding: '0.5rem 1rem', 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!goldenKey.length) {
    return (
      <>
        <Head>
          <title>کلید طلایی - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="🔑 کلید طلایی" subtitle="سهام برتر با پتانسیل بالا" />
        <div className="dashboard-container">
          <div className="empty-state">
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>کلید طلایی - داشبورد بورس</title>
        <meta name="description" content="سهام برتر با پتانسیل بالا و تحلیل کلید طلایی" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      <PageHeader title="🔑 کلید طلایی" subtitle="سهام برتر با پتانسیل بالا" />

      <div className="dashboard-container">
        <div className="grid-4">
          {goldenKey.map((item, index) => (
            <div key={index} className="card">
              <div className="card-header">
                {/* نمایش نام کوتاه نماد */}
                <h3 className="card-title">{item.symbol || 'نامشخص'}</h3> 
                {/* ✅ تغییر ۱: نمایش چشم انداز ML در هدر */}
                <span className={`card-change ${item.outlook && item.outlook.includes('صعودی') ? 'positive' : 'neutral'}`}>
                  {item.outlook || item.status || 'نامشخص'}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {/* ✅ تغییر ۲: استفاده از item.symbol به عنوان فال‌بک برای نام کامل */}
                <div className="card-value">{item.symbol_name || item.symbol || 'نام نامشخص'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>امتیاز کل:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px' }}>
                    {formatNumber(item.total_score)}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>قیمت ورود:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', direction: 'ltr' }}>
                    {formatNumber(item.entry_price)}
                  </div>
                </div>
                
                {/* ✅ تغییر ۳: اضافه کردن چشم‌انداز ML به عنوان فیلد جدید */}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>چشم انداز ML:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', color: item.outlook && item.outlook.includes('صعودی') ? 'var(--success)' : 'var(--warning)' }}>
                    {item.outlook || 'بدون داده'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>احتمال موفقیت:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', color: 'var(--success)' }}>
                    {item.probability_percent !== null && item.probability_percent !== undefined ? `${formatNumber(item.probability_percent)}%` : 'بدون داده'}
                  </div>
                </div>
                
                {/* ✅ تغییر ۴: حفظ و نمایش "وضعیت" اصلی (Rule-Based) */}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>وضعیت:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px' }}>
                    {item.status || 'نامشخص'} 
                  </div>
                </div>
                
                <div/> 
                
              </div>

              {item.reason && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'var(--accent-pink)', borderRadius: 'var(--radius)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>دلیل انتخاب:</span>
                  <div style={{ marginTop: '2px', lineHeight: '1.4' }}>{item.reason}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}