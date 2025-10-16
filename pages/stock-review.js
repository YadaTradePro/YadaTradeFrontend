import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import StockDetailView from '../components/StockDetailView';
import { fetchMarketSummary } from '../services/api';

// ✅ ایمپورت استایل‌ها از CSS Module
import styles from './StockReview.module.css';

// ------------------- کامپوننت‌های UI بهبود یافته -------------------

// کامپوننت کوچک برای نمایش هر کارت در داشبورد (استفاده برای شاخص‌ها)
const IndexCard = ({ icon, title, value, subtitle, statusColor = 'neutral' }) => {
    const statusClass = {
        positive: styles.textPositive,
        negative: styles.textNegative,
        neutral: styles.textNeutral,
    }[statusColor];

    return (
        // کارت‌های کوچکتر شده
        <div className={`${styles.card} ${styles.indexCard}`}> 
            <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{icon}</span>
                <h3 className={styles.cardTitle}>{title}</h3>
            </div>
            {/* فونت بزرگتر و متمرکز برای value */}
            <p className={`${styles.cardBody} ${styles.largeValue}`}>
                {value}
            </p>
            {subtitle && <p className={`${styles.cardSubtitle} ${statusClass}`}>{subtitle}</p>}
        </div>
    );
};

// کامپوننت مخصوص نمایش جریان پول، قدرت خریدار و وضعیت کلی (مقایسه بصری)
const ComparisonCard = ({ title, primaryValue, primaryLabel, secondaryValue, secondaryLabel, statusColor = 'neutral', fullText, valueColorApplied = false, renderValue }) => {
    const statusClass = {
        positive: styles.textPositive,
        negative: styles.textNegative,
        neutral: styles.textNeutral,
    }[statusColor];
    
    // کلاسی که به خود مقدار اعمال می‌شود (برای جریان پول)
    const valueClass = valueColorApplied ? statusClass : styles.textNeutral;

    return (
        <div className={`${styles.card} ${styles.comparisonCard}`}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{title}</h3>
            </div>
            
            <div className={styles.comparisonBody}>
                {/* اگر renderValue تعریف شده باشد، از آن استفاده می‌شود (برای وضعیت کلی نمادها) */}
                {renderValue ? renderValue : (
                    <>
                        {/* مقادیر اصلی */}
                        <div className={styles.comparisonValueGroup}>
                            {/* اعمال رنگ وضعیت به عدد اصلی (برای جریان پول) */}
                            <span className={`${styles.comparisonPrimaryValue} ${valueClass}`}>{primaryValue}</span> 
                            <span className={styles.comparisonLabel}>{primaryLabel}</span>
                        </div>
                        
                        {/* مقادیر ثانویه/مقایسه‌ای */}
                        {(secondaryValue || secondaryLabel) && (
                            <div className={styles.comparisonSecondary}>
                                <span className={styles.comparisonSecondaryValue}>{secondaryValue}</span>
                                <span className={styles.comparisonLabel}>{secondaryLabel}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* توضیحات کامل‌تر با رنگ وضعیت */}
            {fullText && <p className={`${styles.cardSubtitle} ${statusClass}`} dangerouslySetInnerHTML={{ __html: fullText }} />}
        </div>
    );
};


// ------------------- کامپوننت‌های اصلی داشبورد -------------------

const MarketIndexDashboard = ({ sentimentData }) => {
    // 💡 نکته: این کامپوننت فقط برای تحلیل روزانه معنی دارد
    if (!sentimentData) return null;

    const { total_index, equal_weighted_index } = sentimentData;

    return (
        <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>📈 شاخص‌های کلیدی (کل و هم‌وزن)</h2>
            {/* بخش ۱: شاخص‌ها - در یک ردیف و دو ستون */}
            <div className={`${styles.dashboardGrid} ${styles.twoColumns}`}> 
                <IndexCard
                    icon="📈"
                    title="شاخص کل"
                    value={total_index.value.toLocaleString()}
                    subtitle={total_index.status}
                    statusColor={total_index.status === 'صعودی' ? 'positive' : 'negative'}
                />
                <IndexCard
                    icon="⚖️"
                    title="شاخص هم‌وزن"
                    value={equal_weighted_index.value.toLocaleString()}
                    subtitle={equal_weighted_index.status}
                    statusColor={equal_weighted_index.status === 'صعودی' ? 'positive' : 'negative'}
                />
            </div>
        </div>
    );
};

const MarketSentimentDashboard = ({ sentimentData }) => {
    // 💡 نکته: این کامپوننت فقط برای تحلیل روزانه معنی دارد
    if (!sentimentData) return null;

    const { money_flow, per_capita, market_breadth } = sentimentData;

    // تعیین وضعیت قدرت خریدار
    const perCapitaStatus = per_capita.buy / per_capita.sell;
    let powerColor = 'neutral';
    if (perCapitaStatus > 1.05) powerColor = 'positive'; 
    else if (perCapitaStatus < 0.95) powerColor = 'negative';

    // تعیین وضعیت کلی نمادها
    const breadthColor = market_breadth.positive_symbols > market_breadth.negative_symbols ? 'positive' : 'negative';


    return (
        <div className={styles.sectionContainer} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>☀️ نبض بازار و جریان پول</h2>
            <div className={styles.dashboardGrid}>
                
                {/* جریان پول حقیقی */}
                <ComparisonCard
                    title="جریان پول حقیقی (نقدینگی)"
                    primaryValue={`${money_flow.net_value_billion_toman.toFixed(2)}`}
                    primaryLabel="میلیارد تومان"
                    statusColor={money_flow.net_value_billion_toman > 0 ? 'positive' : (money_flow.net_value_billion_toman < 0 ? 'negative' : 'neutral')}
                    fullText={money_flow.status_text}
                    valueColorApplied={true} // اعمال رنگ به عدد
                />

                {/* قدرت خریدار حقیقی */}
                <ComparisonCard
                    title="قدرت خریدار/فروشنده (حقیقی)"
                    primaryValue={`${per_capita.buy.toFixed(0)}`}
                    primaryLabel="میانگین خرید (م.تومان)"
                    secondaryValue={`${per_capita.sell.toFixed(0)}`}
                    secondaryLabel="میانگین فروش (م.تومان)"
                    statusColor={powerColor}
                    fullText={per_capita.status_text}
                />

                {/* وضعیت کلی نمادها (رنگ مثبت/منفی اصلاح شد) */}
                <ComparisonCard
                    title="وضعیت کلی نمادها"
                    statusColor={breadthColor}
                    renderValue = {
                        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'baseline' }}>
                            <div className={styles.comparisonValueGroup}>
                                <span className={`${styles.comparisonPrimaryValue} ${styles.textPositive}`}>{market_breadth.positive_symbols}</span>
                                <span className={styles.comparisonLabel}>نماد مثبت</span>
                            </div>
                            <div className={styles.comparisonSecondary}>
                                <span className={`${styles.comparisonSecondaryValue} ${styles.textNegative}`}>{market_breadth.negative_symbols}</span>
                                <span className={styles.comparisonLabel}>نماد منفی</span>
                            </div>
                        </div>
                    }
                />

            </div>
        </div>
    );
};

// کامپوننت نمایش صنایع برتر (به صورت جدول ۳ ردیفه)
const SectorFlowTable = ({ sectors }) => {
    if (!sectors || sectors.length === 0) return null;

    // فقط ۳ ردیف اول را نمایش می‌دهیم
    const topSectors = sectors.slice(0, 3);

    return (
        <div className={styles.sectionContainer} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>💰 صنایع برتر (ورود پول)</h2>
            
            <div className={styles.tableResponsive}>
                <table className={`${styles.dataGrid} ${styles.narrowTable}`}> 
                    <thead>
                        {/* ⚠️ فشرده‌سازی تگ‌های tr/th برای کاهش احتمال خطای Hydration (whitespace) */}
                        <tr>
                            <th style={{ width: '50%' }}>صنعت</th><th style={{ width: '25%' }}>وضعیت</th><th style={{ width: '25%' }}>مقدار</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topSectors.map((sector, index) => {
                            const flowClass = sector.flow_status === 'ورود' ? styles.textPositive : styles.textNegative;
                            
                            // فیلتر کردن رشته‌های اضافی از نام صنعت
                            const cleanName = sector.sector_name.includes("',CgrValCot='") 
                                ? sector.sector_name.split("',CgrValCot='")[0] 
                                : sector.sector_name;

                            return (
                                <tr key={index}>
                                    <td>{cleanName}</td>
                                    <td className={flowClass} style={{ fontWeight: 'bold' }}>{sector.flow_status}</td>
                                    <td>{sector.flow_value_text}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// کامپوننت نمایش واچ‌لیست فعال (جدول بدون محدودیت ردیف و ۳ ستونی)
const ActiveWatchlist = ({ symbols, isWeekly }) => { // 🎯 تغییر فیلد نمایش بر اساس isWeekly
    if (!symbols || symbols.length === 0) return null;

    // 🎯 تنظیم عنوان ستون و فیلد داده بر اساس نوع تحلیل
    const headerTitle = isWeekly ? "درصد سود/زیان" : "تغییر روزانه";
    const dataField = isWeekly ? "profit_loss_percentage" : "daily_change_percent";
    const sectionTitle = isWeekly ? "📊 ارزیابی سیگنال‌های هفتگی" : "🔥 واچ‌لیست فعال (روزانه)";

    return (
        <div className={styles.sectionContainer} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
            
            <div className={styles.tableResponsive}>
                <table className={`${styles.dataGrid} ${styles.narrowTable}`}>
                    <thead>
                        {/* ⚠️ فشرده‌سازی تگ‌های tr/th برای کاهش احتمال خطای Hydration (whitespace) */}
                        <tr>
                            <th>نماد</th><th>قیمت ورود</th><th>{headerTitle}</th> {/* 👈 استفاده از عنوان و حذف فضای خالی */}
                        </tr>
                    </thead>
                    <tbody>
                        {symbols.map((symbol) => { 
                            const value = symbol[dataField]; // 👈 استفاده از فیلد داده متغیر
                            // در نظر گرفتن حالت null برای value
                            const changeClass = value !== null && value > 0 ? styles.textPositive : (value !== null && value < 0 ? styles.textNegative : styles.textNeutral);

                            return (
                                <tr key={symbol.symbol_id}>
                                    <td>**{symbol.symbol_name}**</td>
                                    <td>{symbol.entry_price ? symbol.entry_price.toLocaleString() : 'N/A'}</td>
                                    <td className={changeClass} style={{ fontWeight: 'bold' }}>
                                        {value !== null ? `${value.toFixed(2)}%` : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ------------------- کامپوننت اصلی صفحه -------------------
export default function StockReview() {
    const [marketSummary, setMarketSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [symbol, setSymbol] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState('');

    useEffect(() => {
        const loadMarketData = async () => {
            try {
                setError(null);
                setIsLoading(true);
                const summaryData = await fetchMarketSummary();
                setMarketSummary(summaryData);
            } catch (err) {
                setError('خطا در دریافت خلاصه‌ی وضعیت بازار. لطفاً اتصال اینترنت خود را بررسی کرده و صفحه را رفرش کنید.');
                console.error("Error loading market data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadMarketData();
    }, []);

    const handleAnalyze = () => {
        if (!symbol.trim()) return;
        setSelectedSymbol(symbol.trim());
    };
    
    // 🎯 تشخیص نوع تحلیل (روزانه یا هفتگی) برای انتقال به کامپوننت‌های فرعی
    const isDaily = marketSummary && marketSummary.hasOwnProperty('sentiment');
    const isWeekly = marketSummary && marketSummary.hasOwnProperty('indices_data');

    return (
        <>
            <Head>
                <title>تحلیل سهام و بازار - داشبورد بورس</title>
                <meta name="description" content="تحلیل سنتیمنت روزانه بازار و بررسی تکنیکال و بنیادی نمادها" />
            </Head>

            <Navbar />
            <PageHeader
                title="📈 تحلیل بازار و سهام"
                subtitle={`آخرین وضعیت و نبض بازار (تاریخ ${marketSummary?.jdate || 'N/A'}) را مشاهده و نماد مورد نظر خود را تحلیل کنید`}
            />

            <main className={styles.pageContainer}>
                <div className={styles.contentWrapper}>
                    
                    {/* وضعیت بارگذاری و خطا */}
                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className={styles.loadingSpinner}></div>
                            <p style={{ color: '#6b7280', marginTop: '1rem' }}>در حال بارگذاری داده‌های بازار...</p>
                        </div>
                    )}
                    {error && <p className={styles.errorText}>⚠️ {error}</p>}
                    
                    {/* نمایش بخش‌های تفکیک شده داشبورد */}
                    {!isLoading && !error && (
                        <>
                            {/* بخش ۱: شاخص‌ها - فقط در حالت روزانه نمایش داده می‌شوند */}
                            {isDaily && <MarketIndexDashboard sentimentData={marketSummary?.sentiment} />}
                            
                            {/* بخش ۲: سنتیمنت و جریان پول - فقط در حالت روزانه نمایش داده می‌شوند */}
                            {isDaily && <MarketSentimentDashboard sentimentData={marketSummary?.sentiment} />}
                            
                            {/* بخش ۳: صنایع برتر (جدولی) */}
                            <SectorFlowTable sectors={marketSummary?.sector_summary} />
                            
                            {/* بخش ۴: واچ‌لیست فعال (جدولی ساده و کامل) */}
                            <ActiveWatchlist 
                                symbols={marketSummary?.all_symbols} 
                                isWeekly={isWeekly} // 👈 انتقال نوع تحلیل
                            />
                        </>
                    )}
                    
                    {/* بخش تحلیل اختصاصی نماد */}
                    <div className={`${styles.card} ${styles.inputCard}`} style={{ marginTop: '3rem' }}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: '1rem', color: '#1f2937' }}>تحلیل اختصاصی نماد</h3>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="نماد سهام را وارد کنید (مثلاً شستا)"
                            className={styles.textInput}
                            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                        />
                        <button onClick={handleAnalyze} className={styles.analyzeButton}>
                            تحلیل کن
                        </button>
                    </div>

                    {selectedSymbol && (
                        <div style={{ marginTop: '2rem' }}>
                            <StockDetailView symbol={selectedSymbol} days={61} />
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
