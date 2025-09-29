import React from "react";

const WeeklyWatchlistTable = ({ data, loading, error }) => {
  // ✅ تابع اصلاح شده برای حذف ارقام اعشار اضافی
  const formatPercent = (value) => {
    if (value === null || value === undefined) return "N/A";

    // اطمینان از اینکه ورودی عدد است (ممکن است به صورت 0.90 برای 90% باشد)
    let percentageValue = Number(value);

    // اگر عدد بین 0 تا 1 باشد (مثلاً 0.90)، آن را در 100 ضرب می‌کنیم.
    if (percentageValue < 1 && percentageValue !== 0) {
      percentageValue = percentageValue * 100;
    }

    // گرد کردن به نزدیک‌ترین عدد صحیح
    const roundedValue = Math.round(percentageValue);

    return `${roundedValue.toLocaleString('fa-IR')}٪`;
  };

  const getOutlookColor = (outlook) => {
    switch (outlook) {
      // حالت‌های صعودی: سبز
      case "Bullish":
      case "Uptrend":
        return { background: "#dcfce7", text: "#166534" }; // Green

      // حالت‌های نزولی: قرمز
      case "Bearish":
      case "Downtrend":
        return { background: "#fee2e2", text: "#991b1b" }; // Red

      // حالت خنثی/جانبی: زرد
      case "Sideways":
        return { background: "#fef3c7", text: "#a16207" }; // Yellow

      // حالت پیش‌فرض (مثل Neutral یا نامشخص): خاکستری
      default:
        return { background: "#f3f4f6", text: "#374151" }; // Gray/Neutral
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: "1rem" }}>
          📊 واچ‌لیست هفتگی
        </h2>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="loading-spinner"></div>
          <p style={{ color: "#6b7280", marginTop: "1rem" }}>
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: "1rem" }}>
          📊 واچ‌لیست هفتگی
        </h2>
        <p style={{ color: "#ef4444" }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!data || !data.length) {
    return (
      <div className="card">
        <h2 className="text-primary" style={{ marginBottom: "1rem" }}>
          📊 واچ‌لیست هفتگی
        </h2>
        <p style={{ color: "#6b7280" }}>داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-primary" style={{ marginBottom: "1.5rem" }}>
        📊 واچ‌لیست هفتگی
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>نماد</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                نام شرکت
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>
                قیمت ورود
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>
                احتمال موفقیت
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>
                چشم‌انداز
              </th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                توضیحات
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const colors = getOutlookColor(item.outlook);
              return (
                <tr key={item.signal_unique_id || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "600" }}>
                    {item.symbol_name || "نامشخص"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {item.company_name || "نامشخص"}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    {item.entry_price
                      ? Number(item.entry_price).toLocaleString("fa-IR")
                      : "N/A"}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    {formatPercent(item.probability_percent)}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: colors.background,
                        color: colors.text,
                      }}
                    >
                      {item.outlook || "Neutral"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      minWidth: "300px",
                      whiteSpace: "nowrap",
                      //overflow: "hidden",
                      //textOverflow: "ellipsis",
                    }}
                  >
                    {item.reason || "توضیحی ارائه نشده"}
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

export default WeeklyWatchlistTable;