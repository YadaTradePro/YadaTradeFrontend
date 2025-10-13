import React, { useState, useEffect } from 'react';
import { fetchMarketOverview } from '../services/api';
import { 
  formatNumber, 
  formatPercent, 
  getChangeColor 
} from '../utils/formatters'; // (1) Import formatters

const MarketOverviewCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const marketData = await fetchMarketOverview();
        setData(marketData);
        setError(null);
      } catch (err) {
        setError('Failed to load market data');
        console.error('Error loading market overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
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
  
  // (2) Removed formatNumber, formatPercent, getChangeColor functions

  return (
    <div className="card">
      <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>📊 Market Overview</h2>
      
      {/* Market Indices */}
      {data?.indices && data.indices.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Market Indices</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {data.indices.map((index, idx) => (
              <div key={idx} style={{ padding: '1rem', background: '#f8f9ff', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{index.title || index.name}</p>
                <p className="english-numbers" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {formatNumber(index.value || index.price)}
                </p>
                <p className="english-numbers" style={{ fontSize: '0.875rem', color: getChangeColor(index.percent) }}>
                  {formatPercent(index.percent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gold Section */}
      {data?.gold && Object.keys(data.gold).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Gold Prices</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {/* Assuming gold items in overview are an array now, but keeping the map over object entries for robustness based on the original data structure */}
            {data.gold.map((info, idx) => (
              <div key={idx} style={{ padding: '1rem', background: '#fef7e0', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>
                  {info.title || info.name}
                </p>
                <p className="english-numbers" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {formatNumber(info.price || info.value)}
                </p>
                <p className="english-numbers" style={{ fontSize: '0.875rem', color: getChangeColor(info.change_percent || info.percent) }}>
                  {formatPercent(info.change_percent || info.percent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forex Section - The original code used Object.entries for gold, but an array for forex. Assuming the array structure for forex/funds is still in use. */}
      {data?.forex && data.forex.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Foreign Exchange</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {data.forex.map((currency, idx) => (
              <div key={idx} style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem' }}>
                  {currency.name}
                </p>
                <p className="english-numbers" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {formatNumber(currency.value)}
                </p>
                <p className="english-numbers" style={{ fontSize: '0.875rem', color: getChangeColor(currency.percent) }}>
                  {formatPercent(currency.percent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Funds */}
      {data?.funds && data.funds.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Investment Funds</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {data.funds.map((fund, idx) => (
              <div key={idx} style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#0c4a6e', marginBottom: '0.5rem' }}>
                  {fund.name}
                </p>
                <p className="english-numbers" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {formatNumber(fund.value)}
                </p>
                <p className="english-numbers" style={{ fontSize: '0.875rem', color: getChangeColor(fund.percent) }}>
                  {formatPercent(fund.percent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Status Indicator */}
      {data?._cached && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.5rem',
          backgroundColor: data._stale ? '#fef3c7' : '#f0f9ff',
          borderRadius: '6px',
          fontSize: '0.8rem',
          color: data._stale ? '#92400e' : '#1e40af'
        }}>
          {data._stale ? '🔄 Using cached data' : '📦 Data cached'} • 
          Last updated: {data._lastUpdate?.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default MarketOverviewCard;