import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchAppPerformance } from '../services/api';

export default function AppPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState('weekly');
  const [signalSource, setSignalSource] = useState('overall');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const performanceData = await fetchAppPerformance(false, periodType, signalSource);
        console.log("📊 App Performance raw response:", performanceData);
        setData(performanceData);
        setError(null);
      } catch (err) {
        setError('خطا در بارگذاری داده‌های عملکرد');
        console.error('Error loading app performance:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [periodType, signalSource]);

  const formatNumber = (value) => {
    if (value === undefined || value === null) return 'بدون داده';
    return new Intl.NumberFormat('fa-IR').format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return 'بدون داده';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>عملکرد اپلیکیشن - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="📊 عملکرد اپلیکیشن" subtitle="آمار و گزارش‌های عملکرد سیستم" />
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
          <title>عملکرد اپلیکیشن - داشبورد بورس</title>
        </Head>
        <Navbar />
        <PageHeader title="📊 عملکرد اپلیکیشن" subtitle="آمار و گزارش‌های عملکرد سیستم" />
        <div className="dashboard-container">
          <div className="empty-state">
            <p style={{ color: '#f56565' }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>عملکرد اپلیکیشن - داشبورد بورس</title>
        <meta name="description" content="آمار و گزارش‌های عملکرد سیستم" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      <PageHeader title="📊 عملکرد اپلیکیشن" subtitle="آمار و گزارش‌های عملکرد سیستم" />

      <div className="dashboard-container">
        {/* Filter Controls */}
        <section className="section">
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  دوره زمانی
                </label>
                <select 
                  value={periodType} 
                  onChange={(e) => setPeriodType(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="weekly">هفتگی</option>
                  <option value="annual">سالانه</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  منبع سیگنال
                </label>
                <select 
                  value={signalSource} 
                  onChange={(e) => setSignalSource(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="overall">کلی</option>
                  <option value="weekly_watchlist">لیست هفتگی</option>
                  <option value="golden_key">کلید طلایی</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Aggregated Performance */}
        {data?.overall_performance && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">آمار کلی عملکرد</h2>
              {data.last_updated && (
                <p className="section-subtitle">آخرین بروزرسانی: {data.last_updated}</p>
              )}
            </div>

            <div className="grid-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">تعداد سیگنال‌ها</h3>
                </div>
                <div className="card-value">
                  {formatNumber(data.overall_performance.total_signals_evaluated)}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">درصد برد کلی</h3>
                </div>
                <div className="card-value text-success">
                  {formatPercent(data.overall_performance.overall_win_rate)}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">میانگین سود معاملات موفق</h3>
                </div>
                <div className="card-value text-success">
                  {formatPercent(data.overall_performance.average_profit_per_win_overall)}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">میانگین زیان معاملات ناموفق</h3>
                </div>
                <div className="card-value text-danger">
                  {formatPercent(data.overall_performance.average_loss_per_loss_overall)}
                </div>
              </div>

              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <h3 className="card-title">سود خالص کلی</h3>
                </div>
                <div className="card-value" style={{ 
                  color: data.overall_performance.overall_net_profit_percent >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {formatPercent(data.overall_performance.overall_net_profit_percent)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Signal Details */}
        {data?.signals_details && data.signals_details.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">جزئیات سیگنال‌ها</h2>
              <p className="section-subtitle">{data.signals_details.length} سیگنال</p>
            </div>

            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>نماد</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>نام سهم</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>منبع سیگنال</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>چشم‌انداز</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>قیمت ورود</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>تاریخ ورود</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>قیمت خروج</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>تاریخ خروج</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>درصد سود/زیان</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>وضعیت</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>احتمال موفقیت</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>دلیل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.signals_details.map((signal, index) => (
                      <tr key={signal.signal_unique_id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{signal.symbol_id || 'نامشخص'}</td>
                        <td style={{ padding: '12px' }}>{signal.symbol_name || 'نامشخص'}</td>
                        <td style={{ padding: '12px' }}>{signal.signal_source || 'نامشخص'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: signal.outlook === 'Bullish' ? '#dcfce7' : signal.outlook === 'Bearish' ? '#fee2e2' : '#f3f4f6',
                            color: signal.outlook === 'Bullish' ? '#166534' : signal.outlook === 'Bearish' ? '#991b1b' : '#374151'
                          }}>
                            {signal.outlook || 'Neutral'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', direction: 'ltr' }}>
                          {formatNumber(signal.entry_price)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {signal.jentry_date || 'بدون داده'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', direction: 'ltr' }}>
                          {formatNumber(signal.exit_price)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {signal.jexit_date || 'بدون داده'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ 
                            color: signal.profit_loss_percent >= 0 ? 'var(--success)' : 'var(--danger)',
                            fontWeight: '600'
                          }}>
                            {formatPercent(signal.profit_loss_percent)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: signal.status === 'closed_win' ? '#dcfce7' : 
                                           signal.status === 'closed_loss' ? '#fee2e2' : 
                                           signal.status === 'active' ? '#dbeafe' : '#f3f4f6',
                            color: signal.status === 'closed_win' ? '#166534' : 
                                   signal.status === 'closed_loss' ? '#991b1b' : 
                                   signal.status === 'active' ? '#1e40af' : '#374151'
                          }}>
                            {signal.status === 'closed_win' ? 'بسته - سود' :
                             signal.status === 'closed_loss' ? 'بسته - زیان' :
                             signal.status === 'closed_neutral' ? 'بسته - بی‌تأثیر' :
                             signal.status === 'active' ? 'فعال' : 'نامشخص'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {formatPercent(signal.probability_percent)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          fontSize: '12px', 
                          color: '#6b7280',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {signal.reason || 'توضیحی ارائه نشده'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {!data?.overall_performance && !data?.signals_details?.length && (
          <div className="empty-state">
            <p>داده‌های عملکرد در دسترس نیست</p>
          </div>
        )}
      </div>
    </>
  );
}