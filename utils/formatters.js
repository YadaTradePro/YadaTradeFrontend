// utils/formatters.js

/**
 * فرمت عدد با حذف اعشار و نمایش با کاما
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Number(value)
  );
};

/**
 * فرمت درصد تغییرات (به صورت صحیح، با علامت + یا -)
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
};

/**
 * نرمال‌سازی مقدار تغییر درصدی از فرمت‌های مختلف
 * مثال: "(0.53%) 9,200" → 0.53
 */
export const normalizeChangePercent = (rawValue) => {
  if (!rawValue) return 0;
  const match = rawValue.toString().match(/\(([-\d.,]+)%\)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return parseFloat(rawValue) || 0;
};

/**
 * رنگ‌بندی تغییرات مثبت/منفی
 */
export const getChangeColor = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '#6b7280'; // خاکستری
  return value >= 0 ? '#10b981' : '#ef4444'; // سبز / قرمز
};
