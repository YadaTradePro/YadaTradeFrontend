
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Sparklines, SparklinesLine } from 'react-sparklines';

export default function MarketCard({ title, value, change, historyData, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="loading-spinner"></div>
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') {
      return 'بدون داده';
    }
    if (typeof val === 'number') {
      return val.toLocaleString('fa-IR');
    }
    return val.toString();
  };

  const formatChange = (changeValue) => {
    if (!changeValue && changeValue !== 0) return null;
    
    const cleanChange = changeValue.toString().replace(/[%()]/g, '');
    const numericChange = parseFloat(cleanChange);
    
    if (isNaN(numericChange) || numericChange === 0) return null;
    
    return {
      value: numericChange,
      formatted: `${numericChange >= 0 ? '+' : ''}${numericChange.toFixed(2)}%`,
      isPositive: numericChange >= 0
    };
  };

const changeData = formatChange(change);
const hasValidHistory = historyData && Array.isArray(historyData) && historyData.length > 1;

return (
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">{title || 'Unknown'}</h3>
    </div>
    
    <div className="card-value">
      {formatValue(value)}
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '24px' }}>
      {changeData && (
        <div className={`card-change ${changeData.isPositive ? 'positive' : 'negative'}`}>
          {changeData.isPositive ? (
            <ArrowUpIcon className="icon-sm" />
          ) : (
            <ArrowDownIcon className="icon-sm" />
          )}
          <span>{changeData.formatted}</span>
        </div>
      )}

      {hasValidHistory && (
        <div className="sparkline">
          <Sparklines data={historyData}>
            <SparklinesLine 
              color={changeData?.isPositive ? '#48bb78' : '#f56565'} 
              style={{ strokeWidth: 1.5, fill: 'none' }}
            />
          </Sparklines>
        </div>
      )}

        
        {hasValidHistory && (
          <div className="sparkline">
            <Sparklines data={historyData}>
              <SparklinesLine 
                color={changeData?.isPositive ? '#48bb78' : '#f56565'} 
                style={{ strokeWidth: 1.5, fill: 'none' }}
              />
            </Sparklines>
          </div>
        )}
      </div>
    </div>
  );
}
