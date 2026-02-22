import * as dfd from "danfojs-node";

export interface Signal {
    date: number;
    price: number;
    action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER";
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

/**
 * Calculates trading signals based on various strategies.
 *
 * @param prices Array of daily prices.
 * @param strategy The strategy to use.
 * @param allowShorting Whether to include SHORT/COVER actions.
 * @returns Array of signals for each day.
 */
export function getTradingSignals(prices: number[], strategy: string = "golden_cross", allowShorting: boolean = false): Signal[] {
    const signals: Signal[] = [];

    if (strategy === "golden_cross") {
        const ma7 = rollingMean(prices, 7);
        const ma30 = rollingMean(prices, 30);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(ma7[i]) && !isNaN(ma30[i]) && !isNaN(ma7[i-1]) && !isNaN(ma30[i-1])) {
                if (ma7[i-1] <= ma30[i-1] && ma7[i] > ma30[i]) {
                    action = "BUY";
                } else if (ma7[i-1] >= ma30[i-1] && ma7[i] < ma30[i]) {
                    action = allowShorting ? "SHORT" : "SELL";
                }
            }
            signals.push({ date: i, price: prices[i], ma7: ma7[i], ma30: ma30[i], action });
        }
    } else if (strategy === "rsi") {
        const rsi = calculateRSI(prices);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(rsi[i]) && !isNaN(rsi[i-1])) {
                if (rsi[i-1] <= 30 && rsi[i] > 30) action = "BUY";
                else if (rsi[i-1] >= 70 && rsi[i] < 70) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], rsi: rsi[i], action });
        }
    } else if (strategy === "macd") {
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        const macdLine = ema12.map((e, idx) => e - ema26[idx]);
        const signalLine = calculateEMA(macdLine, 9);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(macdLine[i]) && !isNaN(signalLine[i]) && !isNaN(macdLine[i-1]) && !isNaN(signalLine[i-1])) {
                if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) action = "BUY";
                else if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], macd: macdLine[i], signal: signalLine[i], action });
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
            if (!isNaN(lower[i]) && !isNaN(upper[i])) {
                if (prices[i-1] >= lower[i-1] && prices[i] < lower[i]) action = "BUY";
                else if (prices[i-1] <= upper[i-1] && prices[i] > upper[i]) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], upper: upper[i], lower: lower[i], action });
        }
    } else if (strategy === "mean_reversion") {
        const ma20 = rollingMean(prices, 20);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(ma20[i]) && !isNaN(ma20[i-1])) {
                const lowerThreshold = ma20[i] * 0.95;
                const upperThreshold = ma20[i] * 1.05;
                if (prices[i-1] >= lowerThreshold && prices[i] < lowerThreshold) action = "BUY";
                else if (prices[i-1] <= upperThreshold && prices[i] > upperThreshold) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], ma20: ma20[i], action });
        }
    } else if (strategy === "ema_cross") {
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(ema12[i]) && !isNaN(ema26[i]) && !isNaN(ema12[i-1]) && !isNaN(ema26[i-1])) {
                if (ema12[i-1] <= ema26[i-1] && ema12[i] > ema26[i]) action = "BUY";
                else if (ema12[i-1] >= ema26[i-1] && ema12[i] < ema26[i]) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], ema12: ema12[i], ema26: ema26[i], action });
        }
    } else if (strategy === "sma_cross") {
        const sma50 = rollingMean(prices, 50);
        const sma200 = rollingMean(prices, 200);
        for (let i = 0; i < prices.length; i++) {
            let action: "BUY" | "SELL" | "HOLD" | "SHORT" | "COVER" = "HOLD";
            if (!isNaN(sma50[i]) && !isNaN(sma200[i]) && !isNaN(sma50[i-1]) && !isNaN(sma200[i-1])) {
                if (sma50[i-1] <= sma200[i-1] && sma50[i] > sma200[i]) action = "BUY";
                else if (sma50[i-1] >= sma200[i-1] && sma50[i] < sma200[i]) action = allowShorting ? "SHORT" : "SELL";
            }
            signals.push({ date: i, price: prices[i], sma50: sma50[i], sma200: sma200[i], action });
        }
    }
    return signals;
}
