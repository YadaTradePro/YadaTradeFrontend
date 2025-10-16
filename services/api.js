// -*- coding: utf-8 -*-
// Direct backend API calls with caching system
// Removed Next.js proxy - using direct backend URLs for local development
const BASE_URL = 'http://127.0.0.1:5000/api';

// 📝 تغییر کلیدی: متغیر در سطح ماژول برای نگهداری توکن احراز هویت
let authToken = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null;

// ==========================================================
// 📦 Cache Management System
// ==========================================================

// ✅ تعریف کلیدهای کش
const CACHE_KEYS = {
    MARKET_OVERVIEW: 'market_overview',
    WEEKLY_WATCHLIST: 'weekly_watchlist',
    GOLDEN_KEY: 'golden_key',
    POTENTIAL_QUEUES: 'potential_queues',
    APP_PERFORMANCE: 'app_performance',
    ML_PREDICTIONS: 'ml_predictions', // ✅ پیش‌بینی‌های ML
    MARKET_SUMMARY: 'market_summary'  // ✅ خلاصه بازار
};

// ✅ تعریف مدت زمان اعتبار کش
const CACHE_DURATIONS = {
    HOME_DATA: 1 * 60 * 60 * 1000, // 1h
    OTHER_DATA: 2 * 60 * 60 * 1000  // 2h
};

// ✅ نگاشت کلیدها به TTL
const getCacheDurationByKey = (key) => {
    const durations = {
        [CACHE_KEYS.MARKET_OVERVIEW]: CACHE_DURATIONS.HOME_DATA,
        [CACHE_KEYS.MARKET_SUMMARY]: CACHE_DURATIONS.OTHER_DATA,
        [CACHE_KEYS.WEEKLY_WATCHLIST]: CACHE_DURATIONS.OTHER_DATA,
        [CACHE_KEYS.GOLDEN_KEY]: CACHE_DURATIONS.OTHER_DATA,
        [CACHE_KEYS.POTENTIAL_QUEUES]: CACHE_DURATIONS.OTHER_DATA,
        [CACHE_KEYS.APP_PERFORMANCE]: CACHE_DURATIONS.OTHER_DATA,
        [CACHE_KEYS.ML_PREDICTIONS]: CACHE_DURATIONS.OTHER_DATA
    };

    // اگر کلید تعریف نشده بود → پیش‌فرض 2h
    return durations[key] || CACHE_DURATIONS.OTHER_DATA;
};

// ==========================================================
// 🔧 توابع کمکی کش
// ==========================================================
const getCacheKey = (key) => `api_cache_${key}`;
const getTimestampKey = (key) => `api_timestamp_${key}`;

const setCache = (key, data) => {
    if (typeof window !== 'undefined') {
        try {
            const cacheKey = getCacheKey(key);
            const timestampKey = getTimestampKey(key);
            const timestamp = Date.now();

            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(timestampKey, timestamp.toString());

            console.log(`📦 Cached data for ${key} at ${new Date(timestamp).toLocaleString()}`);
        } catch (error) {
            console.warn('⚠️ Failed to cache data:', error);
        }
    }
};

const getCache = (key) => {
    if (typeof window !== 'undefined') {
        try {
            const cacheKey = getCacheKey(key);
            const timestampKey = getTimestampKey(key);

            const cachedData = localStorage.getItem(cacheKey);
            const timestamp = localStorage.getItem(timestampKey);

            if (cachedData && timestamp) {
                return {
                    data: JSON.parse(cachedData),
                    timestamp: parseInt(timestamp, 10),
                    lastUpdate: new Date(parseInt(timestamp, 10))
                };
            }
        } catch (error) {
            console.warn('⚠️ Failed to retrieve cached data:', error);
        }
    }
    return null;
};

// ✅ نسخه اصلاح‌شده isCacheValid
const isCacheValid = (key) => {
    const cached = getCache(key);
    if (!cached) return false;

    const maxAge = getCacheDurationByKey(key);
    const age = Date.now() - cached.timestamp;

    return age < maxAge;
};


const getCachedDataWithFallback = (key, isHomeData = false) => {
    const cached = getCache(key);
    if (!cached) return null;

    const isValid = isCacheValid(key, isHomeData);

    return {
        ...cached,
        isValid,
        isStale: !isValid
    };
};

// Enhanced API request function with caching
const makeAPIRequest = async (endpoint, options = {}, overrideToken = null) => {
    const url = `${BASE_URL}${endpoint}`;

    // ensure we use the freshest token: overrideToken -> storage -> in-memory
    const getLatestTokenFromStorage = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
    };
    const currentToken = overrideToken || getLatestTokenFromStorage() || authToken || null;

    const isAuthEndpoint = endpoint.includes('/auth/');

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (currentToken && !isAuthEndpoint) {
        defaultHeaders['Authorization'] = `Bearer ${currentToken}`;
    }

    const requestOptions = {
        method: 'GET',
        headers: { ...defaultHeaders, ...options.headers },
        ...options,
    };

    try {
        console.log(`🔄 API Request: ${requestOptions.method} ${url}`, {
            headers: requestOptions.headers,
            body: options.body ? JSON.parse(options.body) : undefined
        });

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            let errorText = 'Unknown error';
            try {
                const responseText = await response.text();
                try {
                    const errorData = JSON.parse(responseText);
                    errorText = errorData.message || errorData.detail || errorData.error || responseText;
                } catch {
                    errorText = responseText || `${response.status} ${response.statusText}`;
                }
            } catch {
                errorText = `${response.status} ${response.statusText}`;
            }

            const error = new Error(`HTTP ${response.status}: ${errorText}`);
            error.status = response.status;
            error.statusText = response.statusText;
            throw error;
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            console.log(`✅ API Success (No Content): ${url}`);
            return {};
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.warn(`⚠️ Non-JSON response from ${url}:`, contentType, textResponse);
            return { message: textResponse };
        }

        const data = await response.json();
        console.log(`✅ API Success: ${url}`, {
            endpoint: endpoint,
            responseKeys: Object.keys(data || {}),
            dataStructure: data
        });
        return data;

    } catch (error) {
        console.error(`❌ API Request Failed: ${url}`, {
            error: error.message,
            status: error.status,
            type: error.name
        });

        if (isAuthEndpoint) {
            throw error;
        }

        return {};
    }
};

// توابع کمکی برای پاکسازی و پارس کردن داده‌ها
// بهتر است این توابع را در ابتدای فایل API.js یا بالاتر از fetchMarketOverview تعریف کنید

/**
 * پاکسازی یک رشته قیمت دارای کاما و تبدیل آن از ریال به تومان (تقسیم بر 10).
 * @param {string | number | null} value - مقدار قیمت از بک‌اند (ریال).
 * @returns {number | null} - قیمت به صورت عدد (تومان) یا null.
 */
const cleanAndParse = (value) => {
    if (typeof value === 'string') {
        // حذف کاما (,) و فضای خالی
        const cleaned = value.replace(/,/g, '').replace(/\s/g, ''); 

        // پارس کردن به عدد شناور (float)
        const parsed = parseFloat(cleaned);
        
        // 🚨 تبدیل ریال به تومان (تقسیم بر 10)
        const toToman = parsed / 10; 
        
        // اگر NaN شد، null برگردان (برای جلوگیری از نمایش NaN در فرانت‌اند)
        return isNaN(parsed) ? null : toToman;
    }
    return typeof value === 'number' ? (value / 10) : null; // اگر از ابتدا عدد بود
};

/**
 * پارس کردن رشته درصد تغییرات (مانند "(0.53%) 9,200" یا "0") و استخراج درصد.
 * @param {string | null} value - رشته درصد تغییرات از بک‌اند.
 * @returns {number | null} - مقدار درصد به صورت عدد یا null.
 */
const parseChangePercent = (value) => {
    if (typeof value === 'string') {
        // الگو برای استخراج درصد از فرمت "(X.XX%) Y"
        const match = value.match(/\(([^%]+)%\)/);
        if (match && match[1]) {
            const percentValue = parseFloat(match[1]);
            return isNaN(percentValue) ? null : percentValue;
        }
    }
    // در صورتی که نتوانست درصد را استخراج کند یا مقدار "0" بود.
    return null;
};

// ----------------------------------------------------------------------

// helper to normalize/map an item
const mapItem = (item) => {
    // استفاده از توابع کمکی برای تبدیل رشته‌ها به عدد
    const priceValue = cleanAndParse(item?.price);
    const changeValue = cleanAndParse(item?.change_value);
    const lastUpdateValue = cleanAndParse(item?.last_update);
    const percentValue = parseChangePercent(item?.change_percent);

    return {
        title: item?.title ?? null,
        price: priceValue, // ✅ قیمت به تومان
        change_percent: percentValue, // ✅ پارس شده به عدد یا null
        change_value: changeValue,
        last_update: lastUpdateValue,
        key: item?.key ?? null
    };
};

// ----------------------------------------------------------------------
// ✅ نسخه اصلاح‌شده تابع fetchMarketOverview
// ----------------------------------------------------------------------

// API functions with caching
export const fetchMarketOverview = async (forceRefresh = false, freshToken = null) => {
    const cacheKey = CACHE_KEYS.MARKET_OVERVIEW;
    const isHomeData = true;

    if (!forceRefresh) {
        const cached = getCachedDataWithFallback(cacheKey, isHomeData);
        if (cached && cached.isValid) {
            console.log(`📦 Using cached market overview data from ${cached.lastUpdate.toLocaleString()}`);
            return {
                ...cached.data,
                _cached: true,
                _lastUpdate: cached.lastUpdate
            };
        }
    }

    try {
        const data = await makeAPIRequest('/market-overview/', {}, freshToken);

        if (data) {
            const tgjuData = data.tgju_data || {};
            const iranIndicesData = data.iran_market_indices || {};
            const globalCommoditiesData = data.global_commodities || {};
            
            // 🚨 مشکل ۱: استخراج زمان آخرین به‌روزرسانی از بک‌اند
            const lastBackendUpdate = data.date || data.iran_market_indices?.Total_Index?.date || new Date().toLocaleDateString('fa-IR');


            // flatten all tgju items (gold_prices.*.prices + currency_prices)
            const allTgjuItems = [
                ...(tgjuData.gold_prices || []).flatMap(section => section.prices || []),
                ...(tgjuData.currency_prices || []),
                ...(tgjuData.coin_prices || [])
            ];

            // flexible finder: tries key first, then exact title, then substring match
            const findTgjuItem = (idOrTitle) => {
                if (!idOrTitle) return null;
                let item = allTgjuItems.find(i => i?.key && i.key === idOrTitle);
                if (item) return mapItem(item);
                item = allTgjuItems.find(i => i?.title && (i.title === idOrTitle || i.title.includes(idOrTitle)));
                if (item) return mapItem(item);
                return null;
            };

            // ✅ بخش اول: طلا
            const goldItems = [
                findTgjuItem('geram18') || findTgjuItem('طلای 18 عیار / 750') || null,
                findTgjuItem('geram24') || findTgjuItem('طلای ۲۴ عیار') || null
            ].filter(Boolean)
            // 🚨 مشکل ۲: افزودن واحد (IRT) به عنوان
            .map(item => ({
                ...item,
                title: `${item.title} (IRT)`
            }));

            // ✅ بخش دوم: سکه
            const coinItems = [
                findTgjuItem('sekeb') || findTgjuItem('بهار آزادی') || null,
                findTgjuItem('nim') || findTgjuItem('نیم') || null,
                findTgjuItem('rob') || findTgjuItem('ربع') || null,
                findTgjuItem('gerami') || findTgjuItem('گرمی') || null,
            ].filter(Boolean)
            // 🚨 مشکل ۲: افزودن واحد (IRT) به عنوان
            .map(item => ({
                ...item,
                title: `${item.title} (IRT)`
            }));

            // ✅ بخش سوم: صندوق‌ها (فیلتر بر اساس کلید پایدار، با فال‌بک بر اساس نام)
            const fundsSection = (tgjuData.gold_prices || []).find(s => s.title === "طلا در بورس");
            const fundsRaw = fundsSection?.prices || [];

            // 🛠️ اصلاح شده: رفع مشکل نام 'صندوق طلای جواهر' و بقیه
            const wantedFundsMap = {
              'gc3': "صندوق طلای مفید (عیار)",
              'gc1': "صندوق طلای لوتوس (طلا)",
              'gc35': "صندوق طلای زرین آگاه (مثقال)",
              'gc55': "صندوق طلای جواهر" 
            };

            const wantedFundKeys = Object.keys(wantedFundsMap);
            const wantedFundNames = Object.values(wantedFundsMap).map(name => name.split(' ')); 

            const funds = fundsRaw
                .filter(item => {
                    if (wantedFundsMap.hasOwnProperty(item.key)) {
                        return true;
                    }
                    return wantedFundNames.some(wantedNameParts => {
                        return wantedNameParts.every(part => item.title.includes(part));
                    });
                })
                .map(item => {
                    const displayName = wantedFundsMap[item.key] || item.title;
                    return {
                        ...mapItem(item),
                        title: `${displayName} (IRT)` // 🚨 مشکل ۲: افزودن واحد (IRT) به عنوان
                    };
                });

            // ✅ بخش چهارم: شاخص‌های بورس
            // 🚨 مشکل ۳: اصلاح نام شاخص‌ها
            const indexTitleMap = {
                Total_Index: 'شاخص کل', 
                Equal_Weighted_Index: 'شاخص کل (هم وزن)', 
                Price_Equal_Weighted_Index: 'شاخص قیمت (هم وزن)', 
                Industry_Index: 'شاخص صنعت'
            };
            const desiredIndexKeys = ['Total_Index', 'Equal_Weighted_Index', 'Price_Equal_Weighted_Index', 'Industry_Index'];
            const indices = desiredIndexKeys.map(k => {
                const src = iranIndicesData[k] || {};
                return {
                    key: k,
                    title: indexTitleMap[k] || k,
                    value: src.value ?? null,
                    change: src.change ?? null,
                    percent: src.percent ?? null,
                    date: src.date ?? null
                };
            }).filter(Boolean);

            // ✅ بخش پنجم: global_commodities شاخص فلزات گرانبها
            // 🚨 مشکل ۳: حذف درصد تغییرات (چون در بک‌اند موجود نیست)
            const global_commodities = {
                // فقط مقدار و عنوان مورد نیاز است. فیلدهای change و percent حذف می‌شوند.
                gold: { title: "طلای جهانی (اونس)", value: globalCommoditiesData.gold ?? null },
                silver: { title: "نقره جهانی (اونس)", value: globalCommoditiesData.silver ?? null },
                platinum: { title: "پلاتین جهانی (اونس)", value: globalCommoditiesData.platinum ?? null },
                copper: { title: "مس جهانی (اونس)", value: globalCommoditiesData.copper ?? null }
            };

            const processedData = {
                gold: goldItems,
                coin: coinItems,
                funds: funds,
                indices: indices,
                global_commodities: global_commodities,
                // 🚨 مشکل ۱: اضافه کردن زمان به‌روزرسانی بک‌اند
                last_backend_update: lastBackendUpdate 
            };

            console.log('✅ Processed Data:', processedData);
            setCache(cacheKey, processedData);

            return {
                ...processedData,
                _cached: false,
                _lastUpdate: new Date()
            };
        }

        console.warn('⚠️ Market overview data is incomplete:', data);
        throw new Error('Incomplete data received');

    } catch (error) {
        console.error('❌ Failed to fetch fresh market overview data. Checking cache...', error);

        const cached = getCachedDataWithFallback(cacheKey);
        if (cached) {
            console.warn('📦 Serving stale cached data.');
            return {
                ...cached.data,
                _cached: true,
                _lastUpdate: new Date(cached.timestamp),
                _isStale: cached.isStale,
                _error: error.message
            };
        }

        return {
            gold: [],
            coin: [],
            funds: [],
            indices: [],
            global_commodities: {},
            _cached: false,
            _error: true,
            _lastUpdate: new Date()
        };
    }
}




// ✅ NEW FUNCTION: Fetch ML Predictions (6 hour cache)
export const fetchMLPredictions = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.ML_PREDICTIONS;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached ML predictions data from ${cached.lastUpdate.toLocaleString()}`);
        return cached.data;
    }

    try {
        // فرض می‌کنیم endpoint هیچ پارامتری لازم ندارد
        const data = await makeAPIRequest('/analysis/ml-predictions');
        
        // 🛠️ اصلاح: بررسی می‌کنیم که 'data' خودش یک آرایه باشد
        if (data && Array.isArray(data)) {
            const predictions = data; 
            
            // 🛠️ اصلاح کلیدی: ساخت lookup map بر اساس 'symbol' (نام کوتاه) برای ادغام صحیح
            const predictionMap = predictions.reduce((map, item) => {
                // اولویت با symbol است تا با symbol lookup در GoldenKey و WeeklyWatchlist سازگار باشد
                // اگر symbol نداشت (که نباید اینطور باشد)، از symbol_name استفاده می‌کنیم
                const key = item.symbol || item.symbol_name; 

                // مطمئن می‌شویم که key وجود دارد و prediction_trend هم باید وجود داشته باشد
                if (key && item.predicted_trend) { 
                    map[key] = item.predicted_trend;
                }
                return map;
            }, {});

            const processedData = {
                predictions: predictionMap,
                // چون پاسخ سرور آرایه است، ممکن است last_updated نداشته باشد
                last_updated: data?.last_updated || new Date().toISOString()
            };
            
            setCache(cacheKey, processedData);
            return processedData;
        }
        // در صورتی که داده‌ها null، شیء خالی یا آرایه نامعتبر بود، خطا پرتاب شود
        throw new Error("Invalid ML prediction data received or empty response.");
    } catch (error) {
        console.error('Error fetching ML predictions. Checking cache...', error);
        
        const cached = getCachedDataWithFallback(cacheKey);
        if (cached && cached.isValid) {
             console.log(`📦 Serving valid cached ML predictions data.`);
             return cached.data;
        }
        
        // در صورت خطا، یک دیکشنری خالی برگردان تا ادغام شکست نخورد
        return { predictions: {}, last_updated: null }; 
    }
};



// ✅ MODIFIED: Weekly Watchlist API (6 hour cache)
export const fetchWeeklyWatchlist = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.WEEKLY_WATCHLIST;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached weekly watchlist data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            top_watchlist_stocks: cached.data?.top_watchlist_stocks || [],
            last_updated: cached.data?.last_updated || null,
            _cached: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    try {
        // همزمان فراخوانی Watchlist و ML Predictions
        const [watchlistResponse, mlResponse] = await Promise.allSettled([
            makeAPIRequest('/weekly_watchlist/results'),
            fetchMLPredictions(forceRefresh) 
        ]);

        const watchlistData = watchlistResponse.status === 'fulfilled' ? watchlistResponse.value : null;
        const mlPredictionMap = mlResponse.status === 'fulfilled' ? mlResponse.value?.predictions || {} : {};

        if (!watchlistData) {
            throw new Error("Failed to fetch Weekly Watchlist data.");
        }
        
        let processedWatchlist = watchlistData?.top_watchlist_stocks || [];

        // 📝 منطق ادغام (Merge Logic): جایگزینی 'outlook' با 'predicted_trend' از ML
        processedWatchlist = processedWatchlist.map(stock => {
            const mlOutlook = mlPredictionMap[stock.symbol_name];
            
            if (mlOutlook) {
                return {
                    ...stock,
                    outlook: mlOutlook, // ✅ جایگزینی فیلد 'outlook'
                    _ml_source: true    // برای ردگیری در Console
                };
            }
            return stock; // استفاده از outlook اصلی اگر پیش‌بینی ML در دسترس نبود
        });

        const finalData = {
            top_watchlist_stocks: processedWatchlist,
            last_updated: watchlistData?.last_updated || null,
            _ml_predictions_count: Object.keys(mlPredictionMap).length
        };
        
        console.log('📊 Weekly Watchlist PROCESSED & MERGED Data:', finalData);
        setCache(cacheKey, finalData); // Cache the final merged data

        return {
            top_watchlist_stocks: finalData.top_watchlist_stocks,
            last_updated: finalData.last_updated,
            _cached: false,
            _lastUpdate: new Date()
        };
    } catch (error) {
        console.error('Error fetching and merging weekly watchlist/ML data:', error);
        
        const cached = getCachedDataWithFallback(cacheKey);
        if (cached) {
            console.log(`📦 Using stale cached weekly watchlist data from ${cached.lastUpdate.toLocaleString()}`);
            return {
                top_watchlist_stocks: cached.data?.top_watchlist_stocks || [],
                last_updated: cached.data?.last_updated || null,
                _cached: true,
                _stale: true,
                _lastUpdate: cached.lastUpdate
            };
        }

        return {
            top_watchlist_stocks: [],
            last_updated: null,
            _cached: false,
            _error: true,
            _lastUpdate: new Date()
        };
    }
};




// Golden Key API (6 hour cache)
export const fetchGoldenKey = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.GOLDEN_KEY;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached golden key data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            results: cached.data?.results || [],
            _cached: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    try {
        // همزمان فراخوانی Golden Key و ML Predictions
        const [goldenKeyResponse, mlResponse] = await Promise.allSettled([
            makeAPIRequest('/golden_key/results'),
            // فرض می‌کنیم fetchMLPredictions در دسترس است و پیش‌بینی‌ها را برمی‌گرداند.
            fetchMLPredictions(forceRefresh) 
        ]);

        const goldenKeyData = goldenKeyResponse.status === 'fulfilled' ? goldenKeyResponse.value : null;
        const mlPredictionMap = mlResponse.status === 'fulfilled' ? mlResponse.value?.predictions || {} : {};

        if (!goldenKeyData) {
            throw new Error("Failed to fetch Golden Key data.");
        }
        
        let processedGoldenKey = goldenKeyData?.top_stocks || [];
        
        // 📝 منطق ادغام (Merge Logic): اضافه کردن 'outlook' از ML
        // ✅ توجه: برای ادغام با داده‌های Golden Key که فاقد symbol_name در پاسخ سرور هستند، 
        // از item.symbol (نام کوتاه) برای کلید ML استفاده می‌کنیم.
        processedGoldenKey = processedGoldenKey.map(item => {
            // استفاده از symbol (نام کوتاه) برای یافتن چشم‌انداز
            const mlOutlook = mlPredictionMap[item.symbol] || null; 
            
            // تعیین outlook نهایی: اگر ML داشت، از آن استفاده کن، در غیر این صورت از status اصلی استفاده کن.
            const finalOutlook = mlOutlook || item.status || 'نامشخص';

            return {
                ...item,
                outlook: finalOutlook, // ✅ فیلد جدید: چشم‌انداز (ML یا Rule-Based)
                _ml_source: !!mlOutlook // برای ردگیری در Console
            };
        });


        const finalData = {
            results: processedGoldenKey, // Frontend expects 'results'
            raw_response: goldenKeyData,
            _ml_predictions_count: Object.keys(mlPredictionMap).length
        };

        setCache(cacheKey, finalData);

        return {
            results: finalData.results,
            _cached: false,
            _lastUpdate: new Date()
        };
    } catch (error) {
        console.error('Error fetching and merging golden key/ML data:', error);
        
        const cached = getCachedDataWithFallback(cacheKey);
        if (cached) {
            console.log(`📦 Using stale cached golden key data from ${cached.lastUpdate.toLocaleString()}`);
            return {
                results: cached.data?.results || [],
                _cached: true,
                _stale: true,
                _lastUpdate: cached.lastUpdate
            };
        }
        
        return {
            results: [],
            _cached: false,
            _error: true,
            _lastUpdate: new Date()
        };
    }
};

// Potential Queues API (6 hour cache)
export const fetchPotentialQueues = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.POTENTIAL_QUEUES;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached potential queues data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            top_queues: cached.data?.top_queues || [],
            technical_filters: cached.data?.technical_filters || [],
            last_updated: cached.data?.last_updated || null,
            _cached: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    try {
        const data = await makeAPIRequest('/potential_queues/results');
        console.log('📊 Potential Queues RAW API Response:', data);
        
        if (data) {
            // Keep the original API structure - don't normalize to results
            const processedData = {
                top_queues: data?.top_queues || [],
                technical_filters: data?.technical_filters || [],
                last_updated: data?.last_updated || null,
                raw_response: data
            };
            
            console.log('📊 Potential Queues PROCESSED Data:', processedData);
            setCache(cacheKey, processedData);
            return {
                top_queues: processedData.top_queues,
                technical_filters: processedData.technical_filters,
                last_updated: processedData.last_updated,
                _cached: false,
                _lastUpdate: new Date()
            };
        }
    } catch (error) {
        console.error('Error fetching potential queues:', error);
    }

    const cached = getCachedDataWithFallback(cacheKey);
    if (cached) {
        console.log(`📦 Using stale cached potential queues data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            top_queues: cached.data?.top_queues || [],
            technical_filters: cached.data?.technical_filters || [],
            last_updated: cached.data?.last_updated || null,
            _cached: true,
            _stale: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    return {
        top_queues: [],
        technical_filters: [],
        last_updated: null,
        _cached: false,
        _error: true,
        _lastUpdate: new Date()
    };
};

// App Performance API (6 hour cache)
export const fetchAppPerformance = async (forceRefresh = false, periodType = 'weekly', signalSource = 'overall') => {
    const cacheKey = `${CACHE_KEYS.APP_PERFORMANCE}_${periodType}_${signalSource}`;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached app performance data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            ...cached.data,
            _cached: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    try {
        const [aggregated, signalsDetails] = await Promise.allSettled([
            makeAPIRequest(`/performance/aggregated?period_type=${periodType}&signal_source=${signalSource}`),
            makeAPIRequest('/performance/signals-details')
        ]);

        console.log('📊 Performance Aggregated RAW API Response:', aggregated.value);
        console.log('📊 Performance Signals RAW API Response:', signalsDetails.value);

        const data = {
            overall_performance: aggregated.status === 'fulfilled' ? aggregated.value?.overall_performance || {} : {},
            signals_by_source: aggregated.status === 'fulfilled' ? aggregated.value?.signals_by_source || {} : {},
            last_updated: aggregated.status === 'fulfilled' ? aggregated.value?.last_updated || null : null,
            signals_details: signalsDetails.status === 'fulfilled' ? signalsDetails.value || [] : []
        };

        console.log('📊 Performance PROCESSED Data:', data);
        setCache(cacheKey, data);
        return {
            ...data,
            _cached: false,
            _lastUpdate: new Date()
        };
    } catch (error) {
        console.error('Error fetching app performance:', error);
    }

    const cached = getCachedDataWithFallback(cacheKey);
    if (cached) {
        console.log(`📦 Using stale cached app performance data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            ...cached.data,
            _cached: true,
            _stale: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    return {
        overall_performance: {},
        signals_by_source: {},
        signals_details: [],
        last_updated: null,
        _cached: false,
        _error: true,
        _lastUpdate: new Date()
    };
};



// Stock Analysis APIs (no caching for dynamic queries)

// فرض می‌کنیم makeAPIRequest در scope قابل دسترسی است

// ==========================================================
// A) توابع عمومی (Market-Wide - بدون نیاز به symbol)
// ==========================================================
// 1. GET /analysis/market-summary (با قابلیت کش ۶ ساعته)

export const fetchMarketSummary = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.MARKET_SUMMARY;

    if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCache(cacheKey);
        console.log(`📦 Using cached market summary data from ${cached.lastUpdate.toLocaleString()}`);
        return {
            ...cached.data,
            _cached: true,
            _lastUpdate: cached.lastUpdate
        };
    }

    try {
        const data = await makeAPIRequest('/analysis/market-summary');
        
        // 💡 اصلاح کلیدی: بررسی وجود هر یک از کلیدهای ساختار روزانه یا هفتگی 
        const isDailyAnalysis = data && data.hasOwnProperty('sentiment');
        const isWeeklyAnalysis = data && (data.hasOwnProperty('indices_data') || data.hasOwnProperty('smart_money_flow_text'));
        
        // 🚨 بررسی پاسخ خطای استاندارد از سمت بک‌اند (که شامل کلید 'status' است)
        const isErrorResponse = data && data.hasOwnProperty('status') && data.status !== 'success';

        if (isDailyAnalysis || isWeeklyAnalysis) {
            console.log('📊 Market Summary RAW API Response:', data);
            setCache(cacheKey, data); // کل آبجکت ساختاریافته را کش می‌کنیم
            return {
                ...data,
                _cached: false,
                _lastUpdate: new Date()
            };
        }
        
        // اگر پاسخ یک پیام خطای استاندارد از بک‌اند بود، آن را برمی‌گردانیم تا UI مدیریت کند.
        if (isErrorResponse) {
             console.warn('Backend returned an error or info status:', data.message || data.status);
             return {
                 ...data,
                 _cached: false,
                 _lastUpdate: new Date()
             };
        }
        
        // اگر هیچ ساختار معتبری (روزانه، هفتگی یا خطا) تشخیص داده نشد، خطا صادر می‌شود.
        throw new Error("Invalid or empty market summary data structure received (Missing 'sentiment' or 'indices_data').");

    } catch (error) {
        console.error('❌ Failed to fetch fresh market summary data. Checking for stale cache...', error);

        const cached = getCachedDataWithFallback(cacheKey);
        if (cached) {
            console.warn('📦 Serving stale cached market summary data.');
            return {
                ...cached.data,
                _cached: true,
                _lastUpdate: new Date(cached.timestamp),
                _isStale: cached.isStale,
                _error: error.message
            };
        }
        
        // در صورت خطا، یک آبجکت استاندارد برمی‌گردانیم تا UI خراب نشود
        return {
            sentiment: null, // این فیلد برای اجزای روزانه لازم است
            indices_data: null, // این فیلد برای اجزای هفتگی لازم است
            _cached: false,
            _error: true,
            _lastUpdate: new Date(),
            message: "Failed to load market summary data due to API error."
        };
    }
};


// ==========================================================
// B) توابع خاص نماد (Symbol-Specific - نیاز به symbol)
// ==========================================================


// 8. GET /api/analysis/stock-history/<symbol>
/**
 * واکشی سابقه تاریخی روزانه یک نماد در یک بازه مشخص یا تعداد روزهای اخیر.
 * @param {string} symbol - نام نماد مورد نظر (مثلاً شپلی).
 * @param {object} options - شامل days، start_date، end_date.
 * @returns {Promise<{history: Array<object>}>} - آرایه‌ای از رکوردهای تاریخی.
 */
export const fetchStockHistory = async (symbol, options = {}) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required to fetch stock history.');
        }

        const { days = 21, start_date, end_date } = options;
        const formattedSymbol = encodeURIComponent(symbol.trim().toUpperCase());
        const endpoint = `/analysis/stock-history/${formattedSymbol}`;

        // 📝 منطق اولویت فیلتر:
        // اگر start_date و end_date ارسال شوند، از آن‌ها استفاده کن. 
        // در غیر این صورت، از days استفاده کن.
        
        let queryParams = {};
        if (start_date && end_date) {
            // اولویت ۱: بازه تاریخ
            queryParams = { start_date, end_date };
            console.log(`🔍 Fetching ${symbol} history from ${start_date} to ${end_date}`);
        } else {
            // اولویت ۲: تعداد روزهای اخیر
            queryParams = { days };
            console.log(`🔍 Fetching ${symbol} history for last ${days} days`);
        }
        
        // تابع makeAPIRequest پارامترهای کوئری را در options به عنوان 'params' قبول می‌کند.
        const data = await makeAPIRequest(endpoint, {
            params: queryParams,
            method: 'GET' // متد GET است
        });

        // ساختار پاسخ: { "history": [...] }
        const historyData = data?.history;

        if (!Array.isArray(historyData)) {
             // اگر داده‌ای برای نماد در بازه نبود، ۴۰۴ توسط makeAPIRequest مدیریت می‌شود
             // اما اگر پاسخ 200 بود ولی ساختار body اشتباه بود، اینجا خطا می‌دهیم
             throw new Error("Invalid or empty history data format received.");
        }
        
        return {
            history: historyData,
            _lastUpdate: new Date(),
        };

    } catch (error) {
        console.error(`❌ Error fetching stock history for ${symbol}:`, error);
        // در صورت بروز خطا (مثل ۴۰۱، ۴۰۰، ۴۰۴ که توسط makeAPIRequest پرتاب می‌شوند)
        // یک شیء خالی به همراه پرچم خطا برگردانده می‌شود.
        return {
            history: [],
            _error: error.message || true,
            _lastUpdate: new Date(),
        };
    }
};








// 3. GET /analysis/fundamental_data/{symbol_input}
export const fetchFundamentalData = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required');
        }
        const data = await makeAPIRequest(`/analysis/fundamental_data/${encodeURIComponent(symbol)}/`);
        return data || {};
    } catch (error) {
        console.error(`Error fetching fundamental data for ${symbol}:`, error);
        return {};
    }
};

// 4. GET /analysis/analyze_technical_indicators/{symbol_input} (از کد اولیه)
export const fetchTechnicalIndicators = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required');
        }
        const data = await makeAPIRequest(`/analysis/analyze_technical_indicators/${encodeURIComponent(symbol)}/`);
        return data || {};
    } catch (error) {
        console.error(`Error fetching technical indicators for ${symbol}:`, error);
        return {};
    }
};

// 5. GET /analysis/ml_prediction/{symbol_input} (پیش‌بینی خاص نماد)
export const fetchMLPrediction = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required');
        }
        const data = await makeAPIRequest(`/analysis/ml_prediction/${encodeURIComponent(symbol)}/`);
        return data || {};
    } catch (error) {
        console.error(`Error fetching ML prediction for ${symbol}:`, error);
        return {};
    }
};

// 6. GET /analysis/market_sentiment/{symbol_input} (احساسات بازار برای نماد)
export const fetchSentiment = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required');
        }
        const data = await makeAPIRequest(`/analysis/market_sentiment/${encodeURIComponent(symbol)}/`);
        return data || {};
    } catch (error) {
        console.error(`Error fetching market sentiment for ${symbol}:`, error);
        return {};
    }
};

// 7. GET /analysis/historical-data/{symbol_input}
export const fetchHistoricalData = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required');
        }
        const data = await makeAPIRequest(`/analysis/historical-data/${encodeURIComponent(symbol)}/`); 
        return data || {}; 
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        return {}; 
    }
};


// ==========================================================
// C) تابع یکپارچه‌ساز (Unified Command)
// ==========================================================

/**
 * دریافت کامل داده‌های تحلیل برای یک نماد مشخص به همراه خلاصه‌ی عمومی بازار
 * @param {string} symbol - نماد سهام
 * @returns {Promise<object>} شامل تمام زیربخش‌های تحلیل
 */
export const fetchFullAnalysis = async (symbol) => {
    if (!symbol) {
        throw new Error('Symbol is required for full analysis.');
    }
    
    const formattedSymbol = symbol.trim().toUpperCase();

    // اجرای تمام درخواست‌های API (عمومی و خاص نماد) به صورت موازی (Concurrent)
    const [
        fundamentalData,
        technicalData,
        mlPrediction,
        sentimentData,
        historicalData,
        marketSummary,
        generalMLPredictions
    ] = await Promise.all([
        // Symbol-Specific Calls (5)
        fetchFundamentalData(formattedSymbol),
        fetchTechnicalIndicators(formattedSymbol),
        fetchMLPrediction(formattedSymbol),
        fetchSentiment(formattedSymbol),
        fetchHistoricalData(formattedSymbol),

        // General Market Calls (2)
        fetchMarketSummary(),
        fetchGeneralMLPredictions(),
    ]);

    // داده‌های ترکیبی را در قالب یک شیء ساختاریافته برمی‌گرداند.
    return {
        symbol: formattedSymbol,
        fundamentalData,
        technicalData,
        mlPrediction,
        sentimentData,
        historicalData,
        marketSummary,
        generalMLPredictions,
    };
};

// Settings API (no caching for user settings)
export const fetchSettings = async () => {
    try {
        const data = await makeAPIRequest('/settings');
        return data || {};
    } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
};

export const updateSettings = async (settings) => {
    try {
        if (!settings) {
            throw new Error('Settings data is required');
        }

        const data = await makeAPIRequest('/settings', {
            method: 'POST',
            body: JSON.stringify(settings),
        });

        return data || {};
    } catch (error) {
        console.error('Error updating settings:', error);
        return null;
    }
};









// User Profile API
export const fetchUserProfile = async () => {
    try {
        const data = await makeAPIRequest('/auth/protected');
        return data || {};
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return {};
    }
};

// Token management functions
export const setAuthToken = (token) => {
    if (typeof window !== 'undefined') {
        const rememberMe = localStorage.getItem('auth_remember') === 'true';

        authToken = token;

        if (rememberMe) {
            localStorage.setItem('auth_token', token);
            sessionStorage.removeItem('auth_token');
        } else {
            sessionStorage.setItem('auth_token', token);
            localStorage.removeItem('auth_token');
        }

        console.log('🔑 Auth token updated');
    }
};

export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return authToken;
    }
    return null;
};

export const clearAuthToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_remember');
        authToken = null;
        console.log('🔑 Auth token cleared');
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!getAuthToken();
};

// Logout function
export const logout = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

// Authentication API functions
export const loginUser = async (username, password) => {
    try {
        console.log('🔐 Attempting login for username:', username);
        const data = await makeAPIRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const token = data?.access_token || data?.token || null;
        if (token) {
            setAuthToken(token);
        }

        // return token together with whole response so caller can use token for immediate requests
        return { raw: data, token };
    } catch (error) {
        console.error('❌ Login failed:', error);
        throw error;
    }
};

export const registerUser = async (username, email, password) => {
    try {
        console.log('📝 Attempting registration for username:', username, 'email:', email);
        const data = await makeAPIRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        return { success: true, ...data };
    } catch (error) {
        console.error('❌ Registration failed:', error);
        return { success: false, error: error.message };
    }
};

export const refreshToken = async (token) => {
    try {
        console.log('🔄 Attempting to refresh token');
        const data = await makeAPIRequest('/auth/refresh', {
            method: 'POST'
        }, token);
        if (data && data.access_token) {
            setAuthToken(data.access_token);
        }
        return data;
    } catch (error) {
        console.error('❌ Token refresh failed:', error);
        throw error;
    }
};
