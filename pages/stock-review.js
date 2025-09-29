import React, { useState, useEffect, Fragment } from 'react';

// ------------------- بخش سرویس API (ادغام شده در فایل) -------------------
// این بخش جایگزین فایل services/api.js می‌شود

// یک حافظه پنهان (Cache) ساده در حافظه برای نگهداری داده‌ها
const cache = new Map();

// مدت زمان اعتبار کش: ۶ ساعت به میلی‌ثانیه
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

/**
 * تابع پایه برای ارسال درخواست به API.
 * ✅ تغییر: برای رفع خطای 'Failed to fetch'، این تابع با داده‌های نمونه جایگزین شده است.
 * این خطا معمولاً زمانی رخ می‌دهد که فرانت‌اند نمی‌تواند به بک‌اند (مثلاً http://127.0.0.1:5000) متصل شود.
 * برای اتصال به API واقعی، این بخش را کامنت کرده و کد اصلی را که در پایین قرار دارد، فعال کنید.
 */
const makeAPIRequest = async (endpoint, options = {}) => {
    console.log(`[MOCK API] Requesting endpoint: ${endpoint}`);

    // شبیه‌سازی تاخیر شبکه
    await new Promise(resolve => setTimeout(resolve, 500));

    if (endpoint === '/analysis/market-summary') {
        return Promise.resolve({
            "summary": "**تحلیل روزانه بازار بورس تهران - (داده‌های نمونه)**\n\n## نمای کلی بازار\n**شاخص کل:** با تغییر **+1.85%**، امروز روندی صعودی را تجربه کرد.\n**شاخص هم‌وزن:** عملکرد صعودی آن با تغییر **+1.55%** نشان‌دهنده وضعیت سهام کوچک و متوسط بود.\nامروز جریان پول حقیقی در بازار تقریباً خنثی بود.\n\n## تحلیل نمادهای منتخب\n\nامروز نماد جدیدی در لیست‌های انتخابی سیگنال‌دهی نشده است.\n"
        });
    }

    if (endpoint.startsWith('/analysis/full/')) {
        // const symbol = endpoint.split('/').pop();
        return Promise.resolve({
            fundamentalData: {
                "ارزش بازار": 12000000000000,
                "نسبت P/E": 8.5,
                "سود هر سهم (EPS)": 1540,
                "بازده سود تقسیمی": 5.2
            },
            // شما می‌توانید داده‌های نمونه برای سایر بخش‌ها را نیز در اینجا اضافه کنید
            technicalData: null,
            mlPrediction: null,
            sentimentData: null
        });
    }

    // اگر هیچ مسیری مطابقت نداشت، یک خطای نمونه برمی‌گردانیم
    return Promise.reject(new Error(`[MOCK API] Endpoint not found: ${endpoint}`));
    
    /* // --- کد اصلی برای اتصال به API واقعی ---
    // برای استفاده، این بخش را از کامنت خارج کرده و تابع بالا را کامنت کنید.
    const BASE_URL = 'http://127.0.0.1:5000/api'; 
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error connecting to API at ${endpoint}:`, error);
        throw error;
    }
    */
};


/**
 * یک تابع پوششی که قبل از ارسال درخواست، کش را بررسی می‌کند.
 */
const makeCachedAPIRequest = async (endpoint) => {
    const now = Date.now();
    if (cache.has(endpoint)) {
        const { data, timestamp } = cache.get(endpoint);
        if (now - timestamp < CACHE_DURATION_MS) {
            console.log(`[Cache] Returning cached data for: ${endpoint}`);
            return data;
        }
    }
    console.log(`[API] Fetching new data for: ${endpoint}`);
    const newData = await makeAPIRequest(endpoint);
    cache.set(endpoint, { data: newData, timestamp: now });
    return newData;
};

/**
 * دریافت خلاصه وضعیت بازار (با قابلیت کش)
 */
export const fetchMarketSummary = async () => {
    return makeCachedAPIRequest('/analysis/market-summary');
};

/**
 * دریافت تحلیل کامل برای یک نماد خاص (بدون کش)
 */
export const fetchFullAnalysis = async (symbol) => {
    if (!symbol) throw new Error("Symbol is required");
    return makeAPIRequest(`/analysis/full/${symbol}`);
};


// ------------------- کامپوننت Navbar (ادغام شده در فایل) -------------------
// این بخش جایگزین فایل components/Navbar.jsx می‌شود
const Navbar = () => {
    return (
        <nav style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            background: 'white', 
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0',
            zIndex: 1000
        }}>
            <a href="#" style={{ color: '#7b61ff', textDecoration: 'none' }}>خانه</a>
            <a href="#" style={{ color: '#333', textDecoration: 'none' }}>تحلیل سهام</a>
            <a href="#" style={{ color: '#333', textDecoration: 'none' }}>پروفایل</a>
        </nav>
    );
};

// ------------------- کامپوننت RenderMarkdown (ادغام شده در فایل) -------------------
const RenderMarkdown = ({ text }) => {
    if (!text) return null;

    return text.split('\n').map((line, index) => {
        if (line.trim() === '') {
            return <br key={index} />;
        }
        if (line.startsWith('## ')) {
            return <h2 key={index} style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>{line.substring(3)}</h2>;
        }
        const parts = line.split('**');
        const styledLine = parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
        );
        return <p key={index} style={{ marginBottom: '0.75rem', lineHeight: '1.7' }}>{styledLine}</p>;
    });
};


// ------------------- کامپوننت اصلی صفحه (StockReview) -------------------
export default function StockReview() {
    // استیت‌های مربوط به داده‌های عمومی بازار
    const [marketSummary, setMarketSummary] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialError, setInitialError] = useState(null);

    // استیت‌های مربوط به تحلیل نماد خاص
    const [symbol, setSymbol] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setInitialError(null);
                setIsInitialLoading(true);
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
    
    // توابع کمکی
    const formatNumber = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (value > 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
        if (value > 1000000) return `${(value / 1000000).toFixed(2)}M`;
        return new Intl.NumberFormat('fa-IR').format(value);
    };

    const getChangeColor = (value) => {
        if (value === null || value === undefined) return '#6b7280';
        return value >= 0 ? '#10b981' : '#ef4444'; 
    };

    const capitalizeAndFormatKey = (key) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };
    
    const renderDataGrid = (data, title) => {
        if (!data || Object.keys(data).length === 0) return null;
        return (
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="text-primary" style={{ marginBottom: '1.5rem' }}>{title}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} style={{ padding: '1rem', background: '#f8f9ff', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                {capitalizeAndFormatKey(key)}
                            </p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: (typeof value === 'number' ? getChangeColor(value) : '#1f2937') }}>
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
        <div className="theme-purple" style={{ paddingBottom: '70px' }}> {/* Add padding to avoid overlap with Navbar */}
            <div className="page-content">
                <div className="container">
                    
                    {/* بخش خلاصه وضعیت بازار */}
                    <div className="card" style={{ marginBottom: '2.5rem', background: 'linear-gradient(to right, #f3e8ff, #e8edff)', border: '1px solid #dcd1ff', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#5a3d99', marginBottom: '1rem' }}>
                            ☀️ خلاصه وضعیت روزانه بازار
                        </h2>
                        {isInitialLoading && (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div className="loading-spinner"></div>
                                <p style={{ color: '#6b7280', marginTop: '1rem' }}>در حال بارگذاری داده‌های بازار...</p>
                            </div>
                        )}
                        {initialError && (
                            <p style={{ color: '#ef4444', background: '#fff1f1', padding: '1rem', borderRadius: '8px' }}>
                                ⚠️ {initialError}
                            </p>
                        )}
                        {marketSummary && marketSummary.summary && (
                            <div style={{ color: '#4a5568', fontSize: '1.1rem', direction: 'rtl' }}>
                                <RenderMarkdown text={marketSummary.summary} />
                            </div>
                        )}
                    </div>

                    {/* بخش تحلیل نماد خاص */}
                    <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #7b61ff, #9c88ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                            📈 تحلیل اختصاصی نماد
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                            تحلیل بنیادی، تکنیکال، و احساسات بازار برای نماد مورد نظر شما
                        </p>
                    </header>

                    {/* Input Section */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder="نماد سهام را وارد کنید (مثلاً شستا)"
                                style={{ flex: '1', minWidth: '200px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', textAlign: 'right' }}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={isSearching}
                                className="btn btn-primary"
                                style={{ minWidth: '120px', cursor: isSearching ? 'not-allowed' : 'pointer' }}
                            >
                                {isSearching ? 'در حال تحلیل...' : 'تحلیل کن'}
                            </button>
                        </div>
                        {searchError && (
                            <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem', textAlign: 'right' }}>
                                ⚠️ {searchError}
                            </p>
                        )}
                    </div>

                    {/* Loading & Results Section */}
                    {isSearching && (
                        <div className="card">
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div className="loading-spinner"></div>
                                <p style={{ color: '#6b7280', marginTop: '1rem' }}>در حال تحلیل {symbol.toUpperCase()}...</p>
                            </div>
                        </div>
                    )}
                    {analysisResult && (
                      <>
                        {renderDataGrid(fundamentalData, `تحلیل بنیادی - ${symbol.toUpperCase()}`)}
                        {/* سایر بخش‌های نمایش داده‌ها را در اینجا اضافه کنید */}
                      </>
                    )}
                    {!isSearching && symbol && !analysisResult && !searchError && (
                         <div className="card">
                             <div style={{ textAlign: 'center', padding: '2rem' }}>
                                 <p style={{ color: '#6b7280' }}>برای شروع، نماد مورد نظر را وارد کرده و دکمه "تحلیل کن" را بزنید.</p>
                             </div>
                         </div>
                    )}
                </div>
            </div>
            <Navbar />
        </div>
    );
}

