// فایل: WeeklyWatchlistPage.js

import React, { useState, useEffect } from 'react'; // ⬅️ اصلاح شد: useState و useEffect اضافه شدند
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchWeeklyWatchlist, fetchStockHistory } from '../services/api'; 
import WeeklyWatchlistTable from '../components/WeeklyWatchlistTable';
// ✅ وارد کردن کامپوننت جزئیات
import StockDetailView from '../components/StockDetailView'; 

export default function WeeklyWatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State های مورد نیاز برای مدیریت جزئیات نماد
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    // ... (منطق واکشی واچ‌لیست بدون تغییر)
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchWeeklyWatchlist();

        console.log("📊 Weekly Watchlist raw response:", data);

        if (data && Array.isArray(data.top_watchlist_stocks)) {
          console.log("📊 Setting watchlist with:", data.top_watchlist_stocks);
          setWatchlist(data.top_watchlist_stocks);
        } else {
          console.warn("📊 No top_watchlist_stocks found in response:", data);
          setWatchlist([]);
        }
        setError(null);
      } catch (err) {
        setError('خطا در بارگذاری واچ‌لیست هفتگی');
        console.error('Error loading weekly watchlist:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  // ✅ تابع هندلر کلیک: اکنون کل شیء آیتم (item) را از جدول دریافت می‌کند
  const handleDetailClick = (item) => { 
    // item.symbol_name را برای StockDetailView استفاده می‌کنیم
    const newStockData = {
      symbol: item.symbol_name, 
      symbolName: item.company_name || item.symbol_name, // از company_name استفاده می‌کنیم اگر موجود باشد
    };

    // در صورت کلیک مجدد روی همان نماد، بستن بخش جزئیات (Toggle)
    if (selectedStock && selectedStock.symbol === newStockData.symbol) {
      setSelectedStock(null);
    } else {
      setSelectedStock(newStockData);
      
      // اسکرول کردن به سمت بخش جزئیات پس از انتخاب 
      setTimeout(() => {
        document
          .getElementById('stock-detail-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };


  return (
    <>
      <Head>
        <title>واچ‌لیست هفتگی - داشبورد بورس</title>
        <meta name="description" content="واچ‌لیست هفتگی سهام پیشنهادی" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <PageHeader title="📊 واچ‌لیست هفتگی" subtitle="سهام پیشنهادی هفته جاری" />
      <div className="dashboard-container">
        
        {/* ✅ ارسال تابع هندلر با نام onDetailClick */}
        <WeeklyWatchlistTable 
          data={watchlist} 
          loading={loading} 
          error={error} 
          onDetailClick={handleDetailClick} // ⬅️
        />

        {/* رندر مشروط کامپوننت جزئیات */}
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