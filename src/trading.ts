import * as dfd from "danfojs-node";

export interface Signal {
    date: number;
    price: number;
    action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER";
    reason?: string;
    ma7?: number;
    ma30?: number;
    rsi?: number;
    macd?: number;
    signal?: number;
    upper?: number;
    lower?: number;
    ma20?: number;
    ema12?: number;
    ema26?: number;
    sma50?: number;
    sma200?: number;
    stochK?: number;
    stochD?: number;
    williamsR?: number;
    cci?: number;
    sar?: number;
    up?: number;
    lo?: number;
}

/**
 * Custom rolling mean implementation since it's missing in danfojs-node v1.
 */
function rollingMean(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        if (i < window - 1) {
            result.push(NaN);
        } else {
            const slice = values.slice(i - window + 1, i + 1);
            const sum = slice.reduce((a, b) => a + b, 0);
            result.push(sum / window);
        }
    }
    return result;
}

function calculateEMA(values: number[], period: number): number[] {
    const ema: number[] = new Array(values.length).fill(NaN);
    const k = 2 / (period + 1);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < values.length; i++) {
        if (!isNaN(values[i])) {
            if (count < period) {
                sum += values[i];
                count++;
                if (count === period) {
                    ema[i] = sum / period;
                }
            } else {
                ema[i] = values[i] * k + ema[i - 1] * (1 - k);
            }
        }
    }
    return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = new Array(prices.length).fill(NaN);
    if (prices.length <= period) return rsi;
    let gains = 0; let losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff; else losses -= diff;
    }
    let avgGain = gains / period; let avgLoss = losses / period;
    rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        let currentGain = diff >= 0 ? diff : 0;
        let currentLoss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
        const rs = avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
    }
    return rsi;
}

function calculateStochastic(prices: number[], period: number = 14, smoothK: number = 3, smoothD: number = 3): { k: number[], d: number[] } {
    const k: number[] = new Array(prices.length).fill(NaN);
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        const low = Math.min(...slice);
        const high = Math.max(...slice);
        k[i] = ((prices[i] - low) / (high - low)) * 100;
    }
    const smoothKValues = rollingMean(k, smoothK);
    const smoothDValues = rollingMean(smoothKValues, smoothD);
    return { k: smoothKValues, d: smoothDValues };
}

function calculateWilliamsR(prices: number[], period: number = 14): number[] {
    const r: number[] = new Array(prices.length).fill(NaN);
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        const low = Math.min(...slice);
        const high = Math.max(...slice);
        r[i] = ((high - prices[i]) / (high - low)) * -100;
    }
    return r;
}

function calculateCCI(prices: number[], period: number = 20): number[] {
    const cci: number[] = new Array(prices.length).fill(NaN);
    const tp = prices;
    const sma = rollingMean(tp, period);
    for (let i = period - 1; i < prices.length; i++) {
        const slice = tp.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const mad = slice.reduce((acc, val) => acc + Math.abs(val - mean), 0) / period;
        cci[i] = (tp[i] - mean) / (0.015 * mad);
    }
    return cci;
}

function calculateSAR(prices: number[], afStep: number = 0.02, afMax: number = 0.2): number[] {
    const sar: number[] = new Array(prices.length).fill(NaN);
    if (prices.length < 2) return sar;
    let isBull = true;
    let ep = prices[0];
    let af = afStep;
    sar[0] = prices[0];
    for (let i = 1; i < prices.length; i++) {
        sar[i] = sar[i - 1] + af * (ep - sar[i - 1]);
        if (isBull) {
            if (prices[i] > ep) {
                ep = prices[i];
                af = Math.min(af + afStep, afMax);
            }
            if (prices[i] < sar[i]) {
                isBull = false;
                sar[i] = ep;
                ep = prices[i];
                af = afStep;
            }
        } else {
            if (prices[i] < ep) {
                ep = prices[i];
                af = Math.min(af + afStep, afMax);
            }
            if (prices[i] > sar[i]) {
                isBull = true;
                sar[i] = ep;
                ep = prices[i];
                af = afStep;
            }
        }
    }
    return sar;
}

function calculateDonchian(prices: number[], period: number = 20): { up: number[], lo: number[] } {
    const up: number[] = prices.map((_, i) => i < period - 1 ? NaN : Math.max(...prices.slice(i - period + 1, i + 1)));
    const lo: number[] = prices.map((_, i) => i < period - 1 ? NaN : Math.min(...prices.slice(i - period + 1, i + 1)));
    return { up, lo };
}

export function getTradingSignals(prices: number[], strategy: string = "golden_cross", dates?: number[]): Signal[] {
    const signals: Signal[] = [];

    if (strategy === "golden_cross") {
        const ma7 = rollingMean(prices, 7);
        const ma30 = rollingMean(prices, 30);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(ma7[i]) && !isNaN(ma30[i]) && !isNaN(ma7[i-1]) && !isNaN(ma30[i-1])) {
                if (ma7[i-1] <= ma30[i-1] && ma7[i] > ma30[i]) { action = "BUY"; reason = "Fast MA (7d) crossed above Slow MA (30d); confirming bullish trend."; }
                else if (ma7[i-1] >= ma30[i-1] && ma7[i] < ma30[i]) { action = "SELL"; reason = "Fast MA (7d) crossed below Slow MA (30d); indicating trend reversal."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ma7: ma7[i], ma30: ma30[i], action, reason });
        }
    } else if (strategy === "ema_cross") {
        const e12 = calculateEMA(prices, 12);
        const e26 = calculateEMA(prices, 26);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(e12[i]) && !isNaN(e26[i]) && !isNaN(e12[i-1]) && !isNaN(e26[i-1])) {
                if (e12[i-1] <= e26[i-1] && e12[i] > e26[i]) { action = "BUY"; reason = "EMA 12 crossed above EMA 26; entering on momentum shift."; }
                else if (e12[i-1] >= e26[i-1] && e12[i] < e26[i]) { action = "SELL"; reason = "EMA 12 crossed below EMA 26; exiting as momentum fades."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ema12: e12[i], ema26: e26[i], action, reason });
        }
    } else if (strategy === "sma_cross") {
        const s50 = rollingMean(prices, 50);
        const s200 = rollingMean(prices, 200);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(s50[i]) && !isNaN(s200[i]) && !isNaN(s50[i-1]) && !isNaN(s200[i-1])) {
                if (s50[i-1] <= s200[i-1] && s50[i] > s200[i]) { action = "BUY"; reason = "SMA 50 crossed above SMA 200; major 'Golden Cross' detected."; }
                else if (s50[i-1] >= s200[i-1] && s50[i] < s200[i]) { action = "SELL"; reason = "SMA 50 crossed below SMA 200; major 'Death Cross' detected."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], sma50: s50[i], sma200: s200[i], action, reason });
        }
    } else if (strategy === "rsi") {
        const rsi = calculateRSI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(rsi[i]) && !isNaN(rsi[i-1])) {
                if (rsi[i-1] <= 30 && rsi[i] > 30) { action = "BUY"; reason = "RSI recovered from oversold (<30); buying the dip."; }
                else if (rsi[i-1] >= 70 && rsi[i] < 70) { action = "SELL"; reason = "RSI dropped from overbought (>70); profit taking."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], rsi: rsi[i], action, reason });
        }
    } else if (strategy === "macd") {
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        const macdLine = ema12.map((e, idx) => e - ema26[idx]);
        const signalLine = calculateEMA(macdLine, 9);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(macdLine[i]) && !isNaN(signalLine[i]) && !isNaN(macdLine[i-1]) && !isNaN(signalLine[i-1])) {
                if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) { action = "BUY"; reason = "MACD bullish crossover above signal line."; }
                else if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) { action = "SELL"; reason = "MACD bearish crossover below signal line."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], macd: macdLine[i], signal: signalLine[i], action, reason });
        }
    } else if (strategy === "stochastic") {
        const { k, d } = calculateStochastic(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(k[i]) && !isNaN(d[i]) && !isNaN(k[i-1]) && !isNaN(d[i-1])) {
                if (k[i-1] <= d[i-1] && k[i] > d[i] && k[i] < 20) { action = "BUY"; reason = "Stochastic Bullish crossover in oversold region."; }
                else if (k[i-1] >= d[i-1] && k[i] < d[i] && k[i] > 80) { action = "SELL"; reason = "Stochastic Bearish crossover in overbought region."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], stochK: k[i], stochD: d[i], action, reason });
        }
    } else if (strategy === "williams_r") {
        const r = calculateWilliamsR(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(r[i]) && !isNaN(r[i-1])) {
                if (r[i-1] <= -80 && r[i] > -80) { action = "BUY"; reason = "Williams %R recovered from extreme oversold."; }
                else if (r[i-1] >= -20 && r[i] < -20) { action = "SELL"; reason = "Williams %R dropped from extreme overbought."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], williamsR: r[i], action, reason });
        }
    } else if (strategy === "cci") {
        const cci = calculateCCI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(cci[i]) && !isNaN(cci[i-1])) {
                if (cci[i-1] <= -100 && cci[i] > -100) { action = "BUY"; reason = "CCI recovered from oversold territory."; }
                else if (cci[i-1] >= 100 && cci[i] < 100) { action = "SELL"; reason = "CCI dropped from overbought territory."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], cci: cci[i], action, reason });
        }
    } else if (strategy === "bollinger") {
        const ma20 = rollingMean(prices, 20);
        const stdDevs = prices.map((p, i) => {
            if (i < 19) return NaN;
            const slice = prices.slice(i - 19, i + 1);
            const mean = ma20[i];
            return Math.sqrt(slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 20);
        });
        const upper = ma20.map((m, i) => m + 2 * stdDevs[i]);
        const lower = ma20.map((m, i) => m - 2 * stdDevs[i]);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(lower[i]) && !isNaN(upper[i])) {
                if (prices[i] < lower[i]) { action = "BUY"; reason = "Price broke below Lower Bollinger Band; expecting bounce."; }
                else if (prices[i] > upper[i]) { action = "SELL"; reason = "Price broke above Upper Bollinger Band; expecting reversal."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ma20: ma20[i], upper: upper[i], lower: lower[i], action, reason });
        }
    } else if (strategy === "mean_reversion") {
        const ma20 = rollingMean(prices, 20);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(ma20[i])) {
                if (prices[i] < ma20[i] * 0.95) { action = "BUY"; reason = "Price is 5% below 20-day mean; buying for reversion."; }
                else if (prices[i] > ma20[i] * 1.05) { action = "SELL"; reason = "Price is 5% above 20-day mean; selling for reversion."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ma20: ma20[i], action, reason });
        }
    } else if (strategy === "short_rsi") {
        const rsi = calculateRSI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(rsi[i]) && !isNaN(rsi[i-1])) {
                if (rsi[i-1] >= 70 && rsi[i] < 70) { action = "SHORT"; reason = "RSI dropped from overbought (>70); entering short position."; }
                else if (rsi[i-1] <= 30 && rsi[i] > 30) { action = "COVER"; reason = "RSI recovered from oversold (<30); covering short position."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], rsi: rsi[i], action, reason });
        }
    } else if (strategy === "short_macd") {
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        const macdLine = ema12.map((e, idx) => e - ema26[idx]);
        const signalLine = calculateEMA(macdLine, 9);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(macdLine[i]) && !isNaN(signalLine[i]) && !isNaN(macdLine[i-1]) && !isNaN(signalLine[i-1])) {
                if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) { action = "SHORT"; reason = "MACD bearish crossover; entering short as trend weakens."; }
                else if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) { action = "COVER"; reason = "MACD bullish crossover; covering short as trend strengthens."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], macd: macdLine[i], signal: signalLine[i], action, reason });
        }
    } else if (strategy === "psar") {
        const sar = calculateSAR(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(sar[i]) && !isNaN(sar[i-1])) {
                if (prices[i-1] <= sar[i-1] && prices[i] > sar[i]) { action = "BUY"; reason = "Price crossed above Parabolic SAR; trend is now bullish."; }
                else if (prices[i-1] >= sar[i-1] && prices[i] < sar[i]) { action = "SELL"; reason = "Price crossed below Parabolic SAR; trend is now bearish."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], sar: sar[i], action, reason });
        }
    } else if (strategy === "donchian") {
        const { up, lo } = calculateDonchian(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(up[i]) && !isNaN(lo[i])) {
                if (prices[i] >= up[i-1]) { action = "BUY"; reason = "Price broke above 20-day high; entering on momentum."; }
                else if (prices[i] <= lo[i-1]) { action = "SELL"; reason = "Price broke below 20-day low; exiting breakout."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], up: up[i], lo: lo[i], action, reason });
        }
    } else if (strategy === "short_bollinger") {
        const ma20 = rollingMean(prices, 20);
        const stdDevs = prices.map((p, i) => {
            if (i < 19) return NaN;
            const slice = prices.slice(i - 19, i + 1);
            const mean = ma20[i];
            return Math.sqrt(slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 20);
        });
        const upper = ma20.map((m, i) => m + 2 * stdDevs[i]);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(upper[i])) {
                if (prices[i] > upper[i]) { action = "SHORT"; reason = "Price hit Upper Bollinger Band; shorting for reversal."; }
                else if (prices[i] < ma20[i]) { action = "COVER"; reason = "Price returned to mean (MA 20); covering short position."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ma20: ma20[i], upper: upper[i], action, reason });
        }
    } else if (strategy === "short_mean_reversion") {
        const ma20 = rollingMean(prices, 20);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(ma20[i])) {
                if (prices[i] > ma20[i] * 1.10) { action = "SHORT"; reason = "Price is 10% above 20-day mean; shorting for reversion."; }
                else if (prices[i] < ma20[i]) { action = "COVER"; reason = "Price returned to mean; covering short."; }
            }
            signals.push({ date: dates ? dates[i] : i, price: prices[i], ma20: ma20[i], action, reason });
        }
    }
    return signals;
}
