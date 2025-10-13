import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchStockHistory } from '../services/api'; 
import moment from 'moment-jalaali'; 

// کامپوننت نمودار را به صورت پویا و فقط در سمت کلاینت لود می‌کنیم
const CandlestickChart = dynamic(
    () => import('./CandlestickChart'),
    { 
        ssr: false, // غیرفعال کردن رندر سمت سرور
        loading: () => <div className="chart-loading-placeholder">در حال بارگذاری نمودار...</div>
    } 
);

// ---------- توابع کمکی ----------
const formatNumber = (value) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 }); 
};

const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', { 
        style: 'decimal', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(value);
};

const getChangeColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '#6b7280';
    return value > 0 ? 'var(--success, #48bb78)' : (value < 0 ? 'var(--danger, #f56565)' : 'var(--text-muted, #a0aec0)');
};

const formatJalaliDate = (dateString) => {
    if (!dateString) return '—';
    try {
        // فرض می‌کنیم dateString همان تاریخ میلادی ISO است که بک‌اند برمی‌گرداند
        return moment(dateString, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
    } catch {
        return dateString;
    }
};

// ---------- کامپوننت اصلی ----------
const StockDetailView = ({ symbol, symbolName, days = 61 }) => {
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadHistory = async () => {
            if (!symbol) return;
            try {
                setLoading(true);
                setError(null);
                const data = await fetchStockHistory(symbol, { days }); 
                
                if (data?.history && Array.isArray(data.history)) {
                    // ✅ اصلاح منطقی: حذف مرتب‌سازی تکراری در فرانت‌اند.
                    // داده‌ها از بک‌اند به صورت مرتب (قدیم به جدید) می‌رسند.
                    setHistory(data.history); 
                } else {
                    setHistory([]);
                    if (data?._error) {
                        throw new Error(data._error);
                    }
                }
            } catch (err) {
                setError(err.message || 'خطا در بارگذاری سابقه معاملات.');
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [symbol, days]);

    // برای نمایش جدول (آخرین روز در بالا)، تاریخچه را برعکس می‌کنیم
    const reversedHistory = [...history].reverse();

    // --- آماده‌سازی داده‌ها برای پراپ legendData کامپوننت نمودار ---
    const legendDataForChart = (() => {
        if (history.length < 1) {
            return {
                symbolName: symbolName,
                lastPrice: 0,
                changePercent: 0,
            };
        }
        
        const latestData = history[history.length - 1];
        
        // ✅ بهبود: استفاده مستقیم از درصد تغییر پایانی (final_change_percent) از داده‌های بک‌اند
        const changePercent = latestData.final_change_percent || 0;

        return {
            symbolName: symbolName,
            // 'close' در بک‌اند معادل Final Price است که برای نمایش نمودار و لِجند مناسب است
            lastPrice: latestData.close, 
            changePercent: changePercent,
        };
    })();
    // ----------------------------------------------------------------

    if (loading) {
        return (
            <div className="detail-container loading-state">
                <div className="loading-spinner"></div>
                <p>در حال بارگذاری سابقه {symbolName || symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container error-state">
                <p>⚠️ **خطا:** {error}</p>
            </div>
        );
    }

    return (
        <div className="stock-detail-view-container">
            <h3 className="detail-title">
                سابقه معاملات {symbolName || symbol} ({days} روز اخیر)
            </h3>

            {history.length > 0 ? (
                <CandlestickChart 
                    data={history} // history باید شامل فیلد volume هم باشد
                    legendData={legendDataForChart} 
                />
            ) : (
                <div className="no-chart-data">
                    <p>داده‌ای برای رسم نمودار وجود ندارد.</p>
                </div>
            )}

            <h4 className="table-title">جدول جزئیات روزانه</h4>
            <div className="history-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th className="sticky-col">تاریخ</th>
                            <th>باز</th>
                            <th>بیشترین</th>
                            <th>کمترین</th>
                            <th>پایانی</th>
                            <th>% تغییر پایانی</th>
                            <th>آخرین</th>
                            <th>% تغییر آخرین</th>
                            <th>حجم</th>
                            <th>ارزش (میلیون)</th>
                            <th>دفعات</th>
                            <th>خریداران</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reversedHistory.length === 0 ? (
                            <tr>
                                <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>داده‌ای برای نمایش وجود ندارد.</td>
                            </tr>
                        ) : (
                            reversedHistory.map((day, index) => (
                                <tr key={day.date || index} style={{ backgroundColor: index % 2 !== 0 ? 'rgba(240, 240, 240, 0.5)' : 'transparent' }}>
                                    <td className="sticky-col date-cell">{formatJalaliDate(day.date)}</td>
                                    <td>{formatNumber(day.open)}</td>
                                    <td>{formatNumber(day.high)}</td>
                                    <td>{formatNumber(day.low)}</td>
                                    <td>{formatNumber(day.close)}</td>
                                    <td className="change-cell" style={{ color: getChangeColor(day.final_change_percent) }}>{formatPercentage(day.final_change_percent)}%</td>
                                    <td>{formatNumber(day.last_price)}</td>
                                    <td className="change-cell" style={{ color: getChangeColor(day.last_change_percent) }}>{formatPercentage(day.last_change_percent)}%</td>
                                    <td className="volume-cell">{formatNumber(day.volume)}</td>
                                    <td className="value-cell">{formatNumber(day.value / 1000000)}</td> 
                                    <td>{formatNumber(day.trades_count)}</td>
                                    <td>{formatNumber(day.buyers_count)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockDetailView;