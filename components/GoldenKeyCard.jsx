import React, { useState, useEffect } from 'react';
import { fetchGoldenKey } from '../services/api';

const GoldenKeyCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const goldenKeyData = await fetchGoldenKey();
        
        // ✅ اصلاح کلیدی: استخراج آرایه از کلید 'top_stocks' 
        if (goldenKeyData && Array.isArray(goldenKeyData.top_stocks)) {
          setData(goldenKeyData.top_stocks);
        } else {
          // اگر فرمت نامعتبر بود، آرایه خالی تنظیم شود
          setData([]); 
          throw new Error('Invalid data format received from Golden Key API');
        }

        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load Golden Key data');
        console.error('Error loading golden key:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Golden Key Stocks</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading Golden Key data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Golden Key Stocks</h2>
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    // ✅ اصلاح: نمایش یک رقم اعشار (اگر 0.0 باشد، 0% نمایش داده شود)
    const formattedValue = Number(value).toFixed(1); 
    return `${sign}${formattedValue}%`;
  };

  const getChangeColor = (value) => {
    if (!value && value !== 0) return '#6b7280';
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className="card">
      <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Golden Key Stocks</h2>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No Golden Key data available</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {data.slice(0, 10).map((stock, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              background: '#f8f9ff', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  {/* ✅ اصلاح: استفاده از stock.symbol برای عنوان اصلی */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#1f2937' }}>
                    {stock.symbol || 'N/A'}
                  </h3>
                  {/* ✅ اضافه شدن نام کامل برای وضوح بیشتر */}
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {stock.symbol_name || 'N/A'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: getChangeColor(stock.weekly_growth) }}>
                    {formatPercent(stock.weekly_growth)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Weekly Growth</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  background: '#fef3c7', // استفاده از رنگ متفاوت برای Score
                  color: '#a16207', 
                  borderRadius: '4px' 
                }}>
                  Score: {stock.total_score || 'N/A'} {/* ✅ اضافه شدن مجدد Score */}
                </span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  background: '#dcfce7', 
                  color: '#166534', 
                  borderRadius: '4px' 
                }}>
                  {stock.satisfied_filters || 0} Filters Satisfied
                </span>
                {stock.technical_filters && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    borderRadius: '4px' 
                  }}>
                    Technical: {stock.technical_filters}
                  </span>
                )}
              </div>
              
              {stock.reason && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem', fontStyle: 'italic' }}>
                  {stock.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoldenKeyCard;