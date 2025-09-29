import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import { fetchWeeklyWatchlist } from '../services/api';
import WeeklyWatchlistTable from '../components/WeeklyWatchlistTable';

export default function WeeklyWatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        <WeeklyWatchlistTable data={watchlist} loading={loading} error={error} />
      </div>
    </>
  );
}