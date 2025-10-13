import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchPotentialQueues } from '../services/api';

export default function PotentialQueuesPage() {
  const [potentialQueues, setPotentialQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // اضافه کردن متادیتای جدید
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filtersList, setFiltersList] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchPotentialQueues();
        console.log("📊 Potential Queues raw response:", data);
        
        // **✅ اصلاح کلیدی برای تطبیق با ساختار جدید پاسخ بک‌اند:**
        if (data) {
          if (Array.isArray(data.top_queues)) {
            console.log("📊 Setting potential queues with:", data.top_queues);
            setPotentialQueues(data.top_queues);
          } else {
            console.warn("📊 No top_queues array found in response:", data);
            setPotentialQueues([]);
          }
          // تنظیم متادیتای جدید
          setLastUpdated(data.last_updated);
          setFiltersList(data.technical_filters || []);
        } else {
          setPotentialQueues([]);
        }

        setError(null);
      } catch (err) {
        setError('خطا در بارگذاری احتمال صف خرید');
        console.error('Error loading potential queues:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'بدون داده';
    // از toLocaleString برای نمایش اعداد با جداکننده هزارگان فارسی استفاده می‌شود
    // اطمینان از اینکه ورودی عدد است
    const num = Number(value);
    if (isNaN(num)) return 'بدون داده';
    return num.toLocaleString('fa-IR'); 
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>احتمال صف خرید - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="📈 احتمال صف خرید" subtitle="سهام با احتمال تشکیل صف خرید" />
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
          <title>احتمال صف خرید - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="📈 احتمال صف خرید" subtitle="سهام با احتمال تشکیل صف خرید" />
        <div className="dashboard-container">
          <div className="empty-state">
            <p style={{ color: '#f56565' }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!potentialQueues.length) {
    return (
      <>
        <Head>
          <title>احتمال صف خرید - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="📈 احتمال صف خرید" subtitle={`سهام با احتمال تشکیل صف خرید. (آخرین به‌روزرسانی: ${lastUpdated || 'نامشخص'})`} />
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
        <title>احتمال صف خرید - داشبورد بورس</title>
        <meta name="description" content="سهام با احتمال تشکیل صف خرید" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      <PageHeader 
        title="📈 احتمال صف خرید" 
        subtitle={`سهام با احتمال تشکیل صف خرید. (آخرین به‌روزرسانی: ${lastUpdated || 'نامشخص'})`} 
      />

      <div className="dashboard-container">
        {/* بخش نمایش فیلترها (اختیاری) */}
        {filtersList.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '10px', background: 'var(--bg-light)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
            <span style={{ fontWeight: 'bold' }}>فیلترهای فعال: </span>
            {filtersList.map(f => f.name).join(' | ')}
          </div>
        )}
        
        <div className="grid-4">
          {potentialQueues.map((item, index) => (
            <div key={index} className="card">
              <div className="card-header">
                <h3 className="card-title">{item.symbol_name || item.symbol_id || 'نامشخص'}</h3> 
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div className="card-value">
                  {/* ✅ نمایش درصد احتمال به جای نام شرکت */}
                  <span style={{ fontWeight: 'bold', fontSize: '24px', color: item.probability_percent >= 70 ? 'var(--success)' : item.probability_percent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {formatNumber(item.probability_percent)}% 
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginRight: '5px' }}>احتمال</span>
                </div> 
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>قیمت:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', direction: 'ltr' }}>
                    {formatNumber(item.current_price)} 
                  </div>
                </div>
                
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>قدرت خریدار (حقیقی):</span>
                  <div style={{ 
                    fontWeight: '600', 
                    marginTop: '2px',
                    // ✅ استفاده از real_buyer_power_ratio
                    color: item.real_buyer_power_ratio >= 1 ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {/* ✅ استفاده از real_buyer_power_ratio */}
                    {item.real_buyer_power_ratio !== null && item.real_buyer_power_ratio !== undefined
                        ? formatNumber(item.real_buyer_power_ratio.toFixed(2))
                        : 'بدون داده'}
                  </div>
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>فیلترهای منطبق:</span>
                  <div style={{ fontWeight: '500', marginTop: '2px', fontSize: '11px' }}>
                    {/* ✅ نمایش لیست فیلترهای منطبق (که باید یک آرایه باشد) */}
                    {(Array.isArray(item.matched_filters) ? item.matched_filters.join(' | ') : item.reason) || 'ندارد'}
                  </div>
                </div>
              </div>
              
              {item.reason && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'var(--accent-pink)', borderRadius: 'var(--radius)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>تحلیل اصلی:</span>
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