import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchPotentialQueues } from '../services/api';

export default function PotentialQueuesPage() {
  const [potentialQueues, setPotentialQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchPotentialQueues();
        console.log("📊 Potential Queues raw response:", data);
        
        if (data && Array.isArray(data.top_queues)) {
          console.log("📊 Setting potential queues with:", data.top_queues);
          setPotentialQueues(data.top_queues);
        } else {
          console.warn("📊 No top_queues found in response:", data);
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
    return value.toLocaleString('fa-IR'); 
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
        <PageHeader title="📈 احتمال صف خرید" subtitle="سهام با احتمال تشکیل صف خرید" />
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
      <PageHeader title="📈 احتمال صف خرید" subtitle="سهام با احتمال تشکیل صف خرید" />

      <div className="dashboard-container">
        <div className="grid-4">
          {potentialQueues.map((item, index) => (
            <div key={index} className="card">
              <div className="card-header">
                {/* ✅ اصلاح: استفاده از symbol_name */}
                <h3 className="card-title">{item.symbol_name || item.symbol_id || 'نامشخص'}</h3> 
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                {/* ✅ اصلاح: استفاده از symbol_name (به جای company_name مفقود) */}
                <div className="card-value">{item.symbol_name || item.company_name || item.name || 'نام نامشخص'}</div> 
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>قیمت:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', direction: 'ltr' }}>
                    {/* ✅ اصلاح: استفاده از current_price */}
                    {formatNumber(item.current_price)} 
                  </div>
                </div>
                
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>تغییر روزانه:</span>
                  <div style={{ 
                    fontWeight: '600', 
                    marginTop: '2px',
                    // ✅ اصلاح: استفاده از volume_change_percent
                    color: item.volume_change_percent >= 0 ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {/* ✅ اصلاح: استفاده از volume_change_percent و مدیریت 0 */}
                    {item.volume_change_percent !== null && item.volume_change_percent !== undefined
                        ? `${item.volume_change_percent >= 0 ? '+' : ''}${item.volume_change_percent}%` 
                        : 'بدون داده'}
                  </div>
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>حجم معاملات:</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', direction: 'ltr' }}>
                    {/* ⚠️ نکته: فیلد volume در JSON پاسخ Backend وجود ندارد و همچنان "بدون داده" خواهد بود */}
                    {formatNumber(item.volume)} 
                  </div>
                </div>
              </div>
              
              {item.reason && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'var(--accent-pink)', borderRadius: 'var(--radius)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>تحلیل:</span>
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