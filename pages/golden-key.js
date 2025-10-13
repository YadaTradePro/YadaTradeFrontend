// فایل: GoldenKeyPage.js

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchGoldenKey } from '../services/api';
// وارد کردن کامپوننت جزئیات
import StockDetailView from '../components/StockDetailView';

export default function GoldenKeyPage() {
  const [goldenKey, setGoldenKey] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

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
        const stocks = data?.results;

        if (Array.isArray(stocks)) {
          setGoldenKey(stocks);
          setError(null);
        } else {
          clearGoldenKeyCache();
          throw new Error(
            'فرمت داده‌های دریافتی نامعتبر است. کش پاک شد. لطفا صفحه را مجددا بارگذاری کنید.'
          );
        }
      } catch (err) {
        console.error('Error loading golden key:', err);
        setError(err.message || 'خطا در بارگذاری داده‌های کلید طلایی');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCardClick = (item) => {
    const newStockData = {
      symbol: item.symbol,
      symbolName: item.symbol_name || item.symbol,
    };

    // در صورت کلیک مجدد روی همان کارت، بستن بخش جزئیات
    if (selectedStock && selectedStock.symbol === newStockData.symbol) {
      setSelectedStock(null);
    } else {
      setSelectedStock(newStockData);
      setTimeout(() => {
        document
          .getElementById('stock-detail-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'بدون داده';
    return value.toLocaleString('fa-IR');
  };

  // وضعیت بارگذاری / خطا
  if (loading || error || !goldenKey.length) {
    return (
      <>
        <Head>
          <title>کلید طلایی - داشبورد بورس</title>
        </Head>

        <Navbar />
        <PageHeader
          title="🔑 کلید طلایی"
          subtitle="سهام برتر با پتانسیل بالا"
        />

        <div className="dashboard-container">
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              در حال بارگذاری...
            </div>
          )}

          {error && (
            <div className="empty-state">
              <p style={{ color: '#f56565' }}>{error}</p>
            </div>
          )}

          {!loading && !error && !goldenKey.length && (
            <div className="empty-state">
              <p>داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // رندر اصلی صفحه
  return (
    <>
      <Head>
        <title>کلید طلایی - داشبورد بورس</title>
        <meta
          name="description"
          content="سهام برتر با پتانسیل بالا و تحلیل کلید طلایی"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      <PageHeader title="🔑 کلید طلایی" subtitle="سهام برتر با پتانسیل بالا" />

      <div className="dashboard-container">
        <div className="grid-4">
          {goldenKey.slice(0, 8).map((item, index) => {
            const isSelected =
              selectedStock && selectedStock.symbol === item.symbol;

            return (
              <div
                key={index}
                className={`card ${isSelected ? 'card-selected' : ''}`}
                onClick={() => handleCardClick(item)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#f8fafc')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#ffffff')
                }
              >
                <div className="card-header">
                  <h3 className="card-title">
                    {item.symbol || 'نامشخص'}
                  </h3>
                  <span
                    className={`card-change ${
                      item.outlook && item.outlook.includes('صعودی')
                        ? 'positive'
                        : 'neutral'
                    }`}
                  >
                    {item.outlook || item.status || 'نامشخص'}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div className="card-value">
                    {item.symbol_name || item.symbol || 'نام نامشخص'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      امتیاز کل:
                    </span>
                    <div
                      style={{
                        fontWeight: '600',
                        marginTop: '2px',
                      }}
                    >
                      {formatNumber(item.total_score)}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      قیمت ورود:
                    </span>
                    <div
                      style={{
                        fontWeight: '600',
                        marginTop: '2px',
                        direction: 'ltr',
                      }}
                    >
                      {formatNumber(item.entry_price)}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      چشم‌انداز ML:
                    </span>
                    <div
                      style={{
                        fontWeight: '600',
                        marginTop: '2px',
                        color:
                          item.outlook &&
                          item.outlook.includes('صعودی')
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    >
                      {item.outlook || 'بدون داده'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>وضعیت:</span>
                    <div
                      style={{
                        fontWeight: '600',
                        marginTop: '2px',
                      }}
                    >
                      {item.status || 'نامشخص'}
                    </div>
                  </div>
                </div>

                {/* دلیل انتخاب */}
                {item.reason && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'var(--secondary-bg)',
                      borderRadius: 'var(--radius)',
                      fontSize: '11px',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      دلیل انتخاب:
                    </span>
                    <div
                      style={{
                        marginTop: '2px',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.reason}
                    </div>
                  </div>
                )}

                {/* 🔍 راهنمای کلیک */}
                <div
                  style={{
                    textAlign: 'left',
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '8px',
                    direction: 'rtl',
                  }}
                >
                  برای دیدن جزئیات کلیک کنید 🖱️
                </div>
              </div>
            );
          })}
        </div>

        {/* نمایش جزئیات نماد انتخاب‌شده */}
        {selectedStock && (
          <div
            id="stock-detail-section"
            style={{
              marginTop: '40px',
              paddingBottom: '50px',
            }}
          >
            <StockDetailView
              symbol={selectedStock.symbol}
              symbolName={selectedStock.symbolName}
              days={30}
            />
          </div>
        )}
      </div>
    </>
  );
}
