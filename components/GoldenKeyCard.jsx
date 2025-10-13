// فایل: components/GoldenKeyCard.js
import React, { useState, useEffect } from 'react';
import { fetchGoldenKey } from '../services/api';

const GoldenKeyCard = ({ onSelectStock }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const goldenKeyData = await fetchGoldenKey();
        if (goldenKeyData && Array.isArray(goldenKeyData.top_stocks)) {
          setData(goldenKeyData.top_stocks);
        } else {
          setData([]);
          throw new Error('فرمت داده‌های دریافتی از API معتبر نیست.');
        }
        setError(null);
      } catch (err) {
        console.error('Error loading Golden Key data:', err);
        setError(err.message || 'خطا در بارگذاری داده‌های کلید طلایی');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(1)}%`;
  };

  const getChangeColor = (value) => {
    if (value === null || value === undefined) return '#6b7280';
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  // --------------------------
  // وضعیت بارگذاری / خطا
  // --------------------------
  if (loading) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>🔑 Golden Key Stocks</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>🔑 Golden Key Stocks</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#7b61ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // --------------------------
  // رندر اصلی
  // --------------------------
  return (
    <div className="card" style={{ background: '#ffffff' }}>
      <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>📊 سهام منتخب کلید طلایی</h2>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>داده‌ای برای نمایش وجود ندارد</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {data.slice(0, 8).map((stock, index) => {
            const outlookText = stock.outlook || 'بدون داده';
            const isBullish = outlookText.includes('صعودی');

            return (
              <div
                key={index}
                className="stock-card-item"
                onClick={() => onSelectStock && onSelectStock(stock)}
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
              >
                {/* نماد و چشم‌انداز ML در یک ردیف */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
                      {stock.symbol || '---'}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {stock.symbol_name || 'نام نامشخص'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isBullish ? '#10b981' : '#ef4444',
                    background: isBullish ? '#ecfdf5' : '#fef2f2',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {outlookText}
                  </span>
                </div>

                {/* آمار عددی */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '0.75rem'
                }}>
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    امتیاز کل: {stock.total_score ?? 'N/A'}
                  </span>
                  <span style={{
                    background: '#dbeafe',
                    color: '#1e40af',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    رشد هفتگی:{' '}
                    <span style={{ color: getChangeColor(stock.weekly_growth), fontWeight: 600 }}>
                      {formatPercent(stock.weekly_growth)}
                    </span>
                  </span>
                  <span style={{
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    فیلترهای تایید‌شده: {stock.satisfied_filters || 0}
                  </span>
                </div>

                {/* دلیل انتخاب */}
                {stock.reason && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.75rem',
                    lineHeight: '1.5'
                  }}>
                    📝 <strong>دلیل انتخاب:</strong> {stock.reason}
                  </p>
                )}

                {/* 🔍 راهنمای کلیک */}
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  left: '1rem',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  direction: 'rtl'
                }}>
                  برای دیدن جزئیات کلیک کنید 🖱️
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoldenKeyCard;