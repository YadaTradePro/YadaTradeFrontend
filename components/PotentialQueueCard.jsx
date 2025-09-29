import React, { useState, useEffect } from 'react';
import { fetchPotentialQueues } from '../services/api';

const PotentialQueueCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const queueData = await fetchPotentialQueues();
        
        // ✅ اصلاح ۱: استخراج آرایه top_queues از آبجکت پاسخ Backend
        if (queueData && Array.isArray(queueData.top_queues)) {
            setData(queueData.top_queues);
            setError(null);
        } else {
            // اگر داده‌ای نبود یا فرمت آن اشتباه بود
            setData([]);
            setError('No queue data available in the expected format.');
            console.warn('Potential Queues response missing top_queues array:', queueData);
        }
      } catch (err) {
        setError('Failed to load Potential Queues data');
        console.error('Error loading potential queues:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Potential Buy Queues</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading queue data...</p>
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Potential Buy Queues</h2>
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
    if (!value && value !== 0) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat().format(value);
  };

  const getChangeColor = (value) => {
    if (!value && value !== 0) return '#6b7280';
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className="card">
      <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>Potential Buy Queues</h2>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No queue data available</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {data.slice(0, 10).map((queue, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              background: '#f8f9ff', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#1f2937' }}>
                    {/* ✅ اصلاح ۲: استفاده از symbol_name */}
                    {queue.symbol_name || 'N/A'} 
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Matched Filters: {queue.matched_filters?.length || 0}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '600', 
                       // ✅ اصلاح ۳: استفاده از volume_change_percent
                       color: getChangeColor(queue.volume_change_percent) }}> 
                    {/* ✅ اصلاح ۴: استفاده از volume_change_percent */}
                    {formatPercent(queue.volume_change_percent)} 
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Volume Change</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Buyer Power Ratio</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {queue.real_buyer_power_ratio ? `${(queue.real_buyer_power_ratio * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Current Price</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {/* این فیلد در هر دو طرف درست نامگذاری شده بود */}
                    {formatNumber(queue.current_price)}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  background: '#dcfce7', 
                  color: '#166534', 
                  borderRadius: '4px' 
                }}>
                  Queue Strength: {queue.queue_strength || 'Medium'}
                </span>
                {queue.market_cap && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    borderRadius: '4px' 
                  }}>
                    Cap: {formatNumber(queue.market_cap)}
                  </span>
                )}
              </div>
              
              {/* نام فیلد analysis در Backend به صورت reason آمده است، که اینجا باید اصلاح شود */}
              {(queue.analysis || queue.reason) && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem', fontStyle: 'italic' }}>
                  {queue.analysis || queue.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PotentialQueueCard;