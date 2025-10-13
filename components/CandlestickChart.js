// components/CandlestickChart.js

'use client';

import React, { useEffect, useRef } from 'react';

import * as LightweightCharts from 'lightweight-charts';

// ---------- Helper Functions ----------

/**
 * Formats a number to a string with English digits and optional decimal places.
 * @param {number} n The number to format.
 * @param {number} decimals Number of decimal places.
 * @returns {string} Formatted English number string.
 */
const formatEnglishNumber = (n, decimals = 2) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

/**
 * Formats a large number (like volume) into a compact English string (e.g., 1.23M).
 * @param {number} n The number to format.
 * @returns {string} Compact English number string.
 */
const formatVolume = (n) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('en-US');
};

/**
 * Pads a number with a leading zero if it's less than 10.
 * @param {number} n The number to pad.
 * @returns {string} Padded string.
 */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

/**
 * Lightweight and dependency-free Gregorian to Jalali date conversion.
 * @param {number} gy Gregorian year.
 * @param {number} gm Gregorian month.
 * @param {number} gd Gregorian day.
 * @returns {[number, number, number]} [Jalali Year, Jalali Month, Jalali Day].
 */
function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
}

/**
 * Formats a time input (UTCTimestamp, ISO string, or business day object) into a Jalali date string.
 * Returns date in English digits format: YYYY/MM/DD (e.g., 1404/07/17)
 * @param {object | number | string} time The time input.
 * @returns {string} Formatted Jalali date string in English digits.
 */
const formatToJalaliString = (time) => {
    try {
        let year, month, day;
        if (typeof time === 'number') {
            const d = new Date(time * 1000);
            year = d.getUTCFullYear(); 
            month = d.getUTCMonth() + 1; 
            day = d.getUTCDate();
        } else if (typeof time === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(time)) {
                const parts = time.split('-');
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            } else {
                const d = new Date(time);
                if (isNaN(d.getTime())) return String(time);
                year = d.getUTCFullYear(); 
                month = d.getUTCMonth() + 1; 
                day = d.getUTCDate();
            }
        } else if (time && typeof time === 'object' && time.year !== undefined) {
            year = Number(time.year); 
            month = Number(time.month); 
            day = Number(time.day);
        } else {
            return String(time);
        }
        const [jy, jm, jd] = gregorianToJalali(year, month, day);
        // Return in English digits format: YYYY/MM/DD
        return `${jy}/${pad2(jm)}/${pad2(jd)}`;
    } catch (e) {
        return String(time);
    }
};

/**
 * Computes the Simple Moving Average (SMA) for a given period.
 * @param {Array<object>} candles - The candle data array.
 * @param {number} period - The SMA period (e.g., 21).
 * @returns {Array<object|null>} An array of {time, value} objects or nulls.
 */
const computeSMA = (candles, period = 21) => {
    if (!Array.isArray(candles) || candles.length < period) return [];
    
    let sum = 0;
    // Calculate sum of the first 'period' days
    for (let i = 0; i < period; i++) {
        sum += Number(candles[i].close);
    }
    const smaData = [];
    // Push undefined values for the initial period where SMA is not available
    for (let i = 0; i < period - 1; i++) {
        smaData.push({ time: candles[i].time ?? candles[i].date, value: undefined });
    }
    
    // Start calculating SMA from the 'period'-th day
    smaData.push({ time: candles[period - 1].time ?? candles[period - 1].date, value: sum / period });
    
    for (let i = period; i < candles.length; i++) {
        sum += Number(candles[i].close) - Number(candles[i - period].close);
        smaData.push({ time: candles[i].time ?? candles[i].date, value: sum / period });
    }
    
    return smaData;
};

/**
 * Robustly gets series data from the crosshair move parameter.
 * @param {object} param - The crosshair move parameter from the library.
 * @param {object} series - The target series object.
 * @returns {object|null} The data for the specific series or null.
 */
const getSeriesDataFromParam = (param, series) => {
    if (!param || !series || !param.seriesData) return null;
    if (typeof param.seriesData.get === 'function') {
        return param.seriesData.get(series) || null;
    }
    // Fallback for different API versions
    for (const key in param.seriesData) {
        if (param.seriesData[key]) return param.seriesData[key];
    }
    return null;
};

const CandlestickChart = ({ data = [], legendData = {} }) => {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const candleRef = useRef(null);
    const smaRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const tooltipRef = useRef(null);
    
    // --- Create chart once on mount ---
    useEffect(() => {
        if (!containerRef.current) return;
        
        const chart = LightweightCharts.createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 320,
            layout: {
                background: { type: 'solid', color: '#ffffff' },
                textColor: '#1f2937',
                fontSize: 12,
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: '#f3f4f6' },
            },
            rightPriceScale: { borderColor: '#e6e6e6' },
            timeScale: {
                borderColor: '#e6e6e6',
                timeVisible: false,
                secondsVisible: false,
                ticksVisible: false,
                tickMarkFormatter: (time) => formatToJalaliString(time),
            },
            crosshair: { 
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    labelVisible: false,
                },
                horzLine: {
                    labelVisible: false,
                },
            },
        });
        
        chartRef.current = chart;
        
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10B981', 
            downColor: '#EF4444',
            borderUpColor: '#10B981', 
            borderDownColor: '#EF4444',
            wickUpColor: '#10B981', 
            wickDownColor: '#EF4444',
            priceLineVisible: false,
        });
        candleRef.current = candleSeries;
        
        const smaSeries = chart.addLineSeries({
            color: '#2563EB',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        smaRef.current = smaSeries;
        // --- Enhanced Tooltip Setup ---
        const tooltip = document.createElement('div');
        tooltip.className = 'lwc-tooltip';
        Object.assign(tooltip.style, {
            position: 'absolute', 
            display: 'none', 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,250,250,0.99) 100%)',
            border: '1px solid #d1d5db', 
            borderRadius: '10px', 
            padding: '14px 16px',
            fontSize: '13px', 
            color: '#111827', 
            zIndex: '50', 
            pointerEvents: 'none',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.08)', 
            minWidth: '200px',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            lineHeight: '1.5',
        });
        containerRef.current.appendChild(tooltip);
        tooltipRef.current = tooltip;
        // Custom Jalali Date Label for Crosshair
        const dateLabel = document.createElement('div');
        dateLabel.className = 'custom-jalali-date';
        Object.assign(dateLabel.style, {
            position: 'absolute',
            left: '50%',
            bottom: '-28px',
            transform: 'translateX(-50%)',
            fontSize: '13px',
            color: '#374151',
            fontWeight: '500',
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'none',
            zIndex: '30',
            pointerEvents: 'none',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            whiteSpace: 'nowrap',
        });
        containerRef.current.appendChild(dateLabel);
        // Hide default crosshair time label
        const hideStyle = document.createElement('style');
        hideStyle.textContent = `#candlestick-chart-container .time-scale .label { display: none !important; }`;
        document.head.appendChild(hideStyle);
        // --- Crosshair Subscription for Enhanced Tooltip ---
        const handleCrosshairMove = (param) => {
            const tooltipEl = tooltipRef.current;
            const dateLabelEl = dateLabel;
            if (!param.point || !param.time || !tooltipEl || !candleRef.current || !dateLabelEl) {
                tooltipEl.style.display = 'none';
                dateLabelEl.style.display = 'none';
                return;
            }
            
            const candleData = getSeriesDataFromParam(param, candleRef.current);
            const smaData = getSeriesDataFromParam(param, smaRef.current);
            
            if (!candleData) {
                tooltipEl.style.display = 'none';
                dateLabelEl.style.display = 'none';
                return;
            }
            
            // Format date in English digits (e.g., 1404/07/17)
            const dateStr = formatToJalaliString(param.time);
            
            dateLabelEl.textContent = dateStr;
            dateLabelEl.style.display = 'block';
            
            // Enhanced Tooltip HTML with professional design
            tooltipEl.innerHTML = `
                <div style="font-weight:700; font-size:15px; margin-bottom:12px; color:#111827; border-bottom: 2px solid #e5e7eb; padding-bottom:8px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:16px;">📅</span>
                    <span>${dateStr}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="display:flex; align-items:center; gap:8px; color:#6b7280; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#10B981; display:inline-block; box-shadow:0 2px 4px rgba(16,185,129,0.3);"></span>
                            Open
                        </span> 
                        <strong style="color:#111827; font-size:14px;">${formatEnglishNumber(candleData.open, 0)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="display:flex; align-items:center; gap:8px; color:#6b7280; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#22c55e; display:inline-block; box-shadow:0 2px 4px rgba(34,197,94,0.3);"></span>
                            High
                        </span> 
                        <strong style="color:#111827; font-size:14px;">${formatEnglishNumber(candleData.high, 0)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="display:flex; align-items:center; gap:8px; color:#6b7280; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#ef4444; display:inline-block; box-shadow:0 2px 4px rgba(239,68,68,0.3);"></span>
                            Low
                        </span> 
                        <strong style="color:#111827; font-size:14px;">${formatEnglishNumber(candleData.low, 0)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px solid #e5e7eb;">
                        <span style="display:flex; align-items:center; gap:8px; color:#6b7280; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#f97316; display:inline-block; box-shadow:0 2px 4px rgba(249,115,22,0.3);"></span>
                            Close
                        </span> 
                        <strong style="color:#111827; font-size:14px;">${formatEnglishNumber(candleData.close, 0)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        <span style="display:flex; align-items:center; gap:8px; color:#6b7280; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#8b5cf6; display:inline-block; box-shadow:0 2px 4px rgba(139,92,246,0.3);"></span>
                            Volume
                        </span> 
                        <strong style="color:#8b5cf6; font-size:14px;">${formatVolume(candleData.volume)}</strong>
                    </div>
                    ${smaData && smaData.value ? `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="display:flex; align-items:center; gap:8px; color:#2563EB; font-weight:500;">
                            <span style="width:10px; height:10px; border-radius:50%; background:#2563EB; display:inline-block; box-shadow:0 2px 4px rgba(37,99,235,0.3);"></span>
                            SMA(21)
                        </span> 
                        <strong style="color:#2563EB; font-size:14px;">${formatEnglishNumber(smaData.value, 0)}</strong>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Smart positioning to prevent overflow
            const containerRect = containerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();
            let left = param.point.x + 15;
            if (left + tooltipRect.width > containerRect.width) {
                left = param.point.x - tooltipRect.width - 15;
            }
            let top = param.point.y + 15;
            if (top + tooltipRect.height > containerRect.height) {
                top = param.point.y - tooltipRect.height - 15;
            }
            
            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.display = 'block';
        };
        chart.subscribeCrosshairMove(handleCrosshairMove);
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });
        resizeObserver.observe(containerRef.current);
        resizeObserverRef.current = resizeObserver;
        // --- Cleanup ---
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
            chart.remove();
            chartRef.current = null;
            if (tooltipRef.current) {
                tooltipRef.current.remove();
            }
            dateLabel.remove();
            hideStyle.remove();
        };
    }, []);
    // --- Data Update Effect ---
    useEffect(() => {
        const candleSeries = candleRef.current;
        const smaSeries = smaRef.current;
        if (!candleSeries || !smaSeries || !Array.isArray(data)) return;
        const formattedData = data.map((item) => ({
            time: item.date ?? item.time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume),
        }));
        
        if (formattedData.length > 0) {
            candleSeries.setData(formattedData);
            const smaData = computeSMA(formattedData, 21);
            smaSeries.setData(smaData);
            chartRef.current.timeScale().fitContent();
        }
    }, [data]);
    const changeColor = legendData.changePercent > 0 ? '#10B981' : (legendData.changePercent < 0 ? '#EF4444' : '#6B7280');
    return (
        <div style={{ width: '100%', fontFamily: 'sans-serif', background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {/* Legend */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {legendData.symbolName || '...'}
                </h3>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    {formatEnglishNumber(legendData.lastPrice, 0) || '...'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: changeColor }}>
                    {legendData.changePercent ? `${legendData.changePercent > 0 ? '+' : ''}${formatEnglishNumber(legendData.changePercent, 2)}%` : '...'}
                </div>
            </div>
            {/* Chart Container */}
            <div id="candlestick-chart-container" ref={containerRef} style={{ width: '100%', height: '320px', position: 'relative' }} />
        </div>
    );
};

export default CandlestickChart;