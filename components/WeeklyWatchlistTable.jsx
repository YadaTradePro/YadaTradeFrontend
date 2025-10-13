// فایل: WeeklyWatchlistTable.js

import React from "react";

// ✅ 1. استفاده از پراپ onDetailClick (بدون تغییر)
const WeeklyWatchlistTable = ({ data, loading, error, onDetailClick }) => {
	// توابع کمکی (بدون تغییر)
	const formatPercent = (value) => {
		if (value === null || value === undefined) return "N/A";
		let percentageValue = Number(value);
		if (percentageValue < 1 && percentageValue !== 0) {
			percentageValue = percentageValue * 100;
		}
		// ✅ گرد کردن بهتر برای نمایش دقیق‌تر
		const roundedValue = Math.round(percentageValue); 
		return `${roundedValue.toLocaleString('fa-IR')}٪`;
	};

	const getOutlookColor = (outlook) => {
		switch (outlook) {
			case "Bullish":
			case "Uptrend":
				return { background: "#dcfce7", text: "#166534" }; // Green
			case "Bearish":
			case "Downtrend":
				return { background: "#fee2e2", text: "#991b1b" }; // Red
			case "Sideways":
				return { background: "#fef3c7", text: "#a16207" }; // Yellow
			default:
				return { background: "#f3f4f6", text: "#374151" }; // Gray/Neutral
		}
	};

	// --- بلوک‌های Loading, Error, No Data (بدون تغییر) ---
	// ...
	if (loading) { /* ... */ }
	if (error) { /* ... */ }
	if (!data || !data.length) { /* ... */ }

	// ✅ تنظیمات Padding جدید: 0.6rem (کمتر از 0.75rem قبلی)
	const paddingStyle = { padding: "0.6rem 0.75rem" }; 
	const headerBorderStyle = { borderBottom: "2px solid #e5e7eb" };
	const cellBorderStyle = { borderBottom: "1px solid #e9ecef" }; // ✅ مرز ظریف‌تر

	return (
		<div className="card">
			<h2 className="text-primary" style={{ marginBottom: "1.25rem" }}> {/* ✅ کمی فاصله کمتر */}
				📊 واچ‌لیست هفتگی
			</h2>

			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={headerBorderStyle}>
							{/* ✅ استفاده از استایل Padding جدید */}
							<th style={{ ...paddingStyle, textAlign: "right" }}>نماد</th>
							<th style={{ ...paddingStyle, textAlign: "right", minWidth: "120px" }}>
								نام شرکت
							</th>
							<th style={{ ...paddingStyle, textAlign: "center" }}>
								قیمت ورود
							</th>
							<th style={{ ...paddingStyle, textAlign: "center" }}>
								احتمال موفقیت
							</th>
							<th style={{ ...paddingStyle, textAlign: "center" }}>
								چشم‌انداز
							</th>
							<th style={{ ...paddingStyle, textAlign: "right", minWidth: "200px" }}>
								توضیحات
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item, idx) => {
							const colors = getOutlookColor(item.outlook);
							
							// ✅ تفکیک بصری ردیف‌های زوج و فرد (Striping)
							const rowBackgroundColor = idx % 2 === 0 ? 'transparent' : '#fcfcfc';

							return (
								<tr 
									key={item.signal_unique_id || idx} 
									style={{ 
										...cellBorderStyle,
										cursor: 'pointer',
										transition: 'background-color 0.2s',
										backgroundColor: rowBackgroundColor, // اعمال رنگ پس‌زمینه
									}}
									onClick={() => onDetailClick && onDetailClick(item)} 
									// ✅ افکت hover کمی تیره‌تر از پس‌زمینه زوج باشد
									onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f7'} 
									onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBackgroundColor}
								>
									
									<td style={{ ...paddingStyle, fontWeight: "600" }}>
										<span
											style={{
												color: '#2563eb', 
												textDecoration: 'none',
											}}
										>
											{item.symbol_name || "نامشخص"}
										</span>
									</td>

									<td style={{ ...paddingStyle, minWidth: "120px" }}>
										{item.company_name || "نامشخص"}
									</td>
									
									{/* ✅ تأکید بیشتر بر داده‌های عددی (قیمت) با فونت ضخیم‌تر */}
									<td style={{ ...paddingStyle, textAlign: "center", fontWeight: "600" }}>
										{item.entry_price
											? Number(item.entry_price).toLocaleString("fa-IR")
											: "N/A"}
									</td>
									
									{/* ✅ تأکید بیشتر بر داده‌های عددی (درصد) با فونت ضخیم‌تر */}
									<td style={{ ...paddingStyle, textAlign: "center", fontWeight: "600" }}> 
										{formatPercent(item.probability_percent)}
									</td>
									
									<td style={{ ...paddingStyle, textAlign: "center" }}>
										<span
											style={{
												padding: "0.25rem 0.75rem",
												borderRadius: "9999px",
												backgroundColor: colors.background,
												color: colors.text,
												whiteSpace: 'nowrap',
												fontSize: "0.875rem", // ✅ کمی کوچک‌تر برای خوانایی بهتر برچسب‌ها
												fontWeight: "500",
											}}
										>
											{item.outlook || "Neutral"}
										</span>
									</td>
									
									<td
										style={{
											...paddingStyle,
											fontSize: "0.875rem",
											color: "#6b7280",
											minWidth: "200px", 
											whiteSpace: "normal", 
											lineHeight: "1.4", // ✅ کمی کاهش برای فشرده‌تر شدن متن
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