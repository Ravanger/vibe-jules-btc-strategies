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

export function getTradingSignals(prices: number[], strategy: string = "golden_cross", allowShorting: boolean = false): Signal[] {
    const signals: Signal[] = [];

    if (strategy === "golden_cross") {
        const ma7 = rollingMean(prices, 7);
        const ma30 = rollingMean(prices, 30);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(ma7[i]) && !isNaN(ma30[i]) && !isNaN(ma7[i-1]) && !isNaN(ma30[i-1])) {
                if (ma7[i-1] <= ma30[i-1] && ma7[i] > ma30[i]) { action = "BUY"; reason = "MA 7 crossed above MA 30"; }
                else if (ma7[i-1] >= ma30[i-1] && ma7[i] < ma30[i]) { action = "SELL"; reason = "MA 7 crossed below MA 30"; }
            }
            signals.push({ date: i, price: prices[i], ma7: ma7[i], ma30: ma30[i], action, reason });
        }
    } else if (strategy === "ema_cross") {
        const e12 = calculateEMA(prices, 12);
        const e26 = calculateEMA(prices, 26);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(e12[i]) && !isNaN(e26[i]) && !isNaN(e12[i-1]) && !isNaN(e26[i-1])) {
                if (e12[i-1] <= e26[i-1] && e12[i] > e26[i]) { action = "BUY"; reason = "EMA 12 crossed above EMA 26"; }
                else if (e12[i-1] >= e26[i-1] && e12[i] < e26[i]) { action = "SELL"; reason = "EMA 12 crossed below EMA 26"; }
            }
            signals.push({ date: i, price: prices[i], ema12: e12[i], ema26: e26[i], action, reason });
        }
    } else if (strategy === "sma_cross") {
        const s50 = rollingMean(prices, 50);
        const s200 = rollingMean(prices, 200);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(s50[i]) && !isNaN(s200[i]) && !isNaN(s50[i-1]) && !isNaN(s200[i-1])) {
                if (s50[i-1] <= s200[i-1] && s50[i] > s200[i]) { action = "BUY"; reason = "SMA 50 crossed above SMA 200"; }
                else if (s50[i-1] >= s200[i-1] && s50[i] < s200[i]) { action = "SELL"; reason = "SMA 50 crossed below SMA 200"; }
            }
            signals.push({ date: i, price: prices[i], sma50: s50[i], sma200: s200[i], action, reason });
        }
    } else if (strategy === "rsi") {
        const rsi = calculateRSI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(rsi[i]) && !isNaN(rsi[i-1])) {
                if (rsi[i-1] <= 30 && rsi[i] > 30) { action = "BUY"; reason = "RSI recovering from oversold (<30)"; }
                else if (rsi[i-1] >= 70 && rsi[i] < 70) { action = "SELL"; reason = "RSI falling from overbought (>70)"; }
            }
            signals.push({ date: i, price: prices[i], rsi: rsi[i], action, reason });
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
                if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) { action = "BUY"; reason = "MACD Bullish crossover"; }
                else if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) { action = "SELL"; reason = "MACD Bearish crossover"; }
            }
            signals.push({ date: i, price: prices[i], macd: macdLine[i], signal: signalLine[i], action, reason });
        }
    } else if (strategy === "stochastic") {
        const { k, d } = calculateStochastic(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(k[i]) && !isNaN(d[i]) && !isNaN(k[i-1]) && !isNaN(d[i-1])) {
                if (k[i-1] <= d[i-1] && k[i] > d[i] && k[i] < 20) { action = "BUY"; reason = "Stoch Bullish crossover in oversold"; }
                else if (k[i-1] >= d[i-1] && k[i] < d[i] && k[i] > 80) { action = "SELL"; reason = "Stoch Bearish crossover in overbought"; }
            }
            signals.push({ date: i, price: prices[i], stochK: k[i], stochD: d[i], action, reason });
        }
    } else if (strategy === "williams_r") {
        const r = calculateWilliamsR(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(r[i]) && !isNaN(r[i-1])) {
                if (r[i-1] <= -80 && r[i] > -80) { action = "BUY"; reason = "Williams %R recovered from oversold"; }
                else if (r[i-1] >= -20 && r[i] < -20) { action = "SELL"; reason = "Williams %R dropped from overbought"; }
            }
            signals.push({ date: i, price: prices[i], williamsR: r[i], action, reason });
        }
    } else if (strategy === "cci") {
        const cci = calculateCCI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(cci[i]) && !isNaN(cci[i-1])) {
                if (cci[i-1] <= -100 && cci[i] > -100) { action = "BUY"; reason = "CCI crossed above -100 (Emerging from oversold)"; }
                else if (cci[i-1] >= 100 && cci[i] < 100) { action = "SELL"; reason = "CCI crossed below 100 (Emerging from overbought)"; }
            }
            signals.push({ date: i, price: prices[i], cci: cci[i], action, reason });
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
                if (prices[i] < lower[i]) { action = "BUY"; reason = "Price below lower Bollinger Band"; }
                else if (prices[i] > upper[i]) { action = "SELL"; reason = "Price above upper Bollinger Band"; }
            }
            signals.push({ date: i, price: prices[i], ma20: ma20[i], upper: upper[i], lower: lower[i], action, reason });
        }
    } else if (strategy === "mean_reversion") {
        const ma20 = rollingMean(prices, 20);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(ma20[i])) {
                if (prices[i] < ma20[i] * 0.95) { action = "BUY"; reason = "Price 5% below 20-day MA"; }
                else if (prices[i] > ma20[i] * 1.05) { action = "SELL"; reason = "Price 5% above 20-day MA"; }
            }
            signals.push({ date: i, price: prices[i], ma20: ma20[i], action, reason });
        }
    } else if (strategy === "short_rsi") {
        const rsi = calculateRSI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            let reason = "";
            if (!isNaN(rsi[i]) && !isNaN(rsi[i-1])) {
                if (rsi[i-1] >= 70 && rsi[i] < 70) { action = "SHORT"; reason = "RSI falling from overbought - Entering Short"; }
                else if (rsi[i-1] <= 30 && rsi[i] > 30) { action = "COVER"; reason = "RSI recovering from oversold - Covering Short"; }
            }
            signals.push({ date: i, price: prices[i], rsi: rsi[i], action, reason });
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
                if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) { action = "SHORT"; reason = "MACD Bearish crossover - Entering Short"; }
                else if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) { action = "COVER"; reason = "MACD Bullish crossover - Covering Short"; }
            }
            signals.push({ date: i, price: prices[i], macd: macdLine[i], signal: signalLine[i], action, reason });
        }
    }
    return signals;
}
