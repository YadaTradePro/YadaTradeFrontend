import React, { useState, useEffect, Fragment } from 'react';
import Head from 'next/head';

// ✅ استفاده از کامپوننت‌های مشترک
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';

// 🛠️ اصلاح: ایمپورت توابع واقعی API از فایل مجزا (api.js)
// ⚠️ مسیر را بر اساس ساختار واقعی پروژه خود تنظیم کنید.
import { fetchMarketSummary, fetchFullAnalysis } from '../services/api';

// ------------------- بخش سرویس API (حذف شد) -------------------
// ❌ بخش Mock API و کش موقت (cache, CACHE_DURATION_MS, makeAPIRequest, makeCachedAPIRequest) 
// ❌ به‌طور کامل حذف شد.

// ------------------- RenderMarkdown -------------------
const RenderMarkdown = ({ text }) => {
	if (!text) return null;

	return text.split('\n').map((line, index) => {
		if (line.trim() === '') return <br key={index} />;
		if (line.startsWith('## ')) {
			return (
				<h2 key={index} style={{
					fontSize: '1.5rem',
					fontWeight: '600',
					color: '#1f2937',
					marginBottom: '1rem',
					borderBottom: '1px solid #e5e7eb',
					paddingBottom: '0.5rem'
				}}>
					{line.substring(3)}
				</h2>
			);
		}

		const parts = line.split('**');
		const styledLine = parts.map((part, i) => {
			if (i % 2 === 1) {
				let customStyle = {};
				if (part.includes('%') || part.includes('میلیارد تومان')) {
					const isPositive = part.includes('+') || part.includes('ورود');
					customStyle.color = isPositive ? '#10b981'
						: part.includes('-') || part.includes('خروج')
							? '#ef4444'
							: '#1f2937';
				}
				return <strong key={i} style={customStyle}>{part}</strong>;
			}
			return <Fragment key={i}>{part}</Fragment>
		});

		return <p key={index} style={{ marginBottom: '0.75rem', lineHeight: '1.7' }}>{styledLine}</p>;
	});
};

// ------------------- کامپوننت اصلی صفحه -------------------
export default function StockReview() {
	const [marketSummary, setMarketSummary] = useState(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [initialError, setInitialError] = useState(null);

	const [symbol, setSymbol] = useState('');
	const [analysisResult, setAnalysisResult] = useState(null);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState(null);

	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setInitialError(null);
				setIsInitialLoading(true);
				// 🛠️ استفاده از تابع ایمپورت شده از api.js
				const summaryData = await fetchMarketSummary(); 
				setMarketSummary(summaryData);
			} catch (err) {
				setInitialError('خطا در دریافت خلاصه‌ی وضعیت بازار. لطفاً اتصال اینترنت خود را بررسی کرده و صفحه را رفرش کنید.');
				console.error("Error loading initial data:", err);
			} finally {
				setIsInitialLoading(false);
			}
		};
		loadInitialData();
	}, []);

	const handleAnalyze = async () => {
		if (!symbol.trim()) {
			setSearchError('لطفاً نماد سهام را وارد کنید');
			return;
		}
		try {
			setIsSearching(true);
			setSearchError(null);
			setAnalysisResult(null);
			// 🛠️ استفاده از تابع ایمپورت شده از api.js
			const result = await fetchFullAnalysis(symbol); 
			setAnalysisResult(result);
		} catch (err) {
			setSearchError('خطا در تحلیل داده‌های سهم. ممکن است نماد اشتباه باشد یا داده‌ای برای آن موجود نباشد.');
			console.error('Error analyzing stock:', err);
			setAnalysisResult(null);
		} finally {
			setIsSearching(false);
		}
	};

	const formatNumber = (value) => {
		if (value === null || value === undefined) return 'N/A';
		if (value > 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
		if (value > 1000000) return `${(value / 1000000).toFixed(2)}M`;

		if (typeof value === 'number' && value % 1 !== 0) {
			return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(value);
		}
		return new Intl.NumberFormat('fa-IR').format(value);
	};

	const getChangeColor = (value) => {
		if (value === null || value === undefined) return '#6b7280';
		return value > 0 ? '#10b981' : value < 0 ? '#ef4444' : '#6b7280';
	};

	const capitalizeAndFormatKey = (key) => {
		return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	};

	const renderDataGrid = (data, title) => {
		if (!data || Object.keys(data).length === 0) return null;
		return (
			<div className="card" style={{ marginBottom: '2rem' }}>
				<h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>{title}</h2>
				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '1rem'
				}}>
					{Object.entries(data).map(([key, value]) => (
						<div key={key} style={{
							padding: '1rem',
							background: '#f8f9ff',
							borderRadius: '8px'
						}}>
							<p style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								marginBottom: '0.5rem',
								textTransform: 'capitalize'
							}}>
								{capitalizeAndFormatKey(key)}
							</p>
							<p style={{
								fontSize: '1.1rem',
								fontWeight: '600',
								color: (typeof value === 'number' ? getChangeColor(value) : '#1f2937')
							}}>
								{(typeof value === 'number') ? formatNumber(value) : value || 'N/A'}
							</p>
						</div>
					))}
				</div>
			</div>
		);
	};

	const { fundamentalData } = analysisResult || {};

	return (
		<>
			<Head>
				<title>تحلیل سهام اختصاصی - داشبورد بورس</title>
				<meta name="description" content="تحلیل بنیادی، تکنیکال، و احساسات بازار برای نماد مورد نظر شما" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>

			<Navbar />
			<PageHeader
				title="📈 تحلیل اختصاصی نماد"
				subtitle="تحلیل بنیادی، تکنیکال، و احساسات بازار برای نماد مورد نظر شما"
			/>

			<div className="theme-purple" style={{ paddingBottom: '70px', minHeight: '100vh', background: '#f4f7ff' }}>
				<div className="page-content" style={{ padding: '0 0 20px 0' }}>
					<div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 15px' }}>

						{/* خلاصه وضعیت بازار */}
						<div className="card" style={{
							marginBottom: '2.5rem',
							background: 'linear-gradient(to right, #f3e8ff, #e8edff)',
							border: '1px solid #dcd1ff',
							padding: '2rem'
						}}>
							<h2 style={{
								fontSize: '1.8rem',
								fontWeight: '700',
								color: '#5a3d99',
								marginBottom: '1rem'
							}}>
								☀️ خلاصه وضعیت روزانه بازار
							</h2>
							{isInitialLoading && (
								<div style={{ textAlign: 'center', padding: '2rem' }}>
									<div className="loading-spinner"></div>
									<p style={{ color: '#6b7280', marginTop: '1rem' }}>
										در حال بارگذاری داده‌های بازار...
									</p>
								</div>
							)}
							{initialError && (
								<p style={{
									color: '#ef4444',
									background: '#fff1f1',
									padding: '1rem',
									borderRadius: '8px'
								}}>
									⚠️ {initialError}
								</p>
							)}
							{marketSummary && marketSummary.summary && (
								<div style={{ color: '#4a5568', fontSize: '1.1rem', direction: 'rtl' }}>
									<RenderMarkdown text={marketSummary.summary} />
								</div>
							)}
						</div>

						{/* Input نماد */}
						<div className="card" style={{ marginBottom: '2rem' }}>
							<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
								<input
									type="text"
									value={symbol}
									onChange={(e) => {
										setSymbol(e.target.value);
										if (searchError) setSearchError(null);
									}}
									placeholder="نماد سهام را وارد کنید (مثلاً شستا)"
									style={{
										flex: '1',
										minWidth: '200px',
										padding: '0.75rem',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '1rem',
										textAlign: 'right'
									}}
									onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
								/>
								<button
									onClick={handleAnalyze}
									disabled={isSearching}
									style={{
										minWidth: '120px',
										cursor: isSearching ? 'not-allowed' : 'pointer',
										background: '#7b61ff',
										color: 'white',
										border: 'none',
										padding: '0.75rem 1rem',
										borderRadius: '6px',
										fontWeight: '600',
										transition: 'background 0.3s'
									}}
								>
									{isSearching ? 'در حال تحلیل...' : 'تحلیل کن'}
								</button>
							</div>
							{searchError && (
								<p style={{
									color: '#ef4444',
									marginTop: '1rem',
									fontSize: '0.875rem',
									textAlign: 'right'
								}}>
									⚠️ {searchError}
								</p>
							)}
						</div>

						{/* نتایج */}
						{isSearching && (
							<div className="card">
								<div style={{ textAlign: 'center', padding: '2rem' }}>
									<div className="loading-spinner"></div>
									<p style={{ color: '#6b7280', marginTop: '1rem' }}>
										در حال تحلیل {symbol.toUpperCase()}...
									</p>
								</div>
							</div>
						)}

						{analysisResult && (
							<>
								{renderDataGrid(fundamentalData, `تحلیل بنیادی - ${symbol.toUpperCase()}`)}
								{analysisResult.technicalData === null && (
									<div className="card" style={{
										marginBottom: '2rem',
										padding: '2rem',
										textAlign: 'center',
										background: '#fff9e8',
										border: '1px solid #ffeeba'
									}}>
										<p style={{ color: '#9a7000' }}>
											داده‌های تحلیل تکنیکال برای این نماد هنوز در دسترس نیستند.
										</p>
									</div>
								)}
							</>
						)}

						{!isSearching && !analysisResult && !searchError && (
							<div className="card">
								<div style={{ textAlign: 'center', padding: '2rem' }}>
									<p style={{ color: '#6b7280' }}>
										لطفاً نماد مورد نظر خود را در فیلد بالا وارد کرده و دکمه "تحلیل کن" را بزنید تا گزارش کامل آن نمایش داده شود. 🚀
									</p>
								</div>
							</div>
						)}

					</div>
				</div>
			</div>

			<Navbar />
		</>
	);
}